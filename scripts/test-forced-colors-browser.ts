/**
 * Keyboard focus has to stay visible in forced colors, where box-shadow rings don't paint. This tabs through the
 * tester's demos with forced colors on and fails on any control that takes focus and shows no outline. It also selects
 * what puts text on the highlight color, and fails if the browser would paint over that with its backplate.
 *
 * Usage: tsx scripts/test-forced-colors-browser.ts [--no-build] [--screenshots=<dir>] [route...]
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, resolve } from "node:path";
import { chromium, type Page } from "playwright";

const DIST_DIR = resolve(process.cwd(), "dist/mona-ui-tester/browser");
const flags = process.argv.slice(2).filter(argument => argument.startsWith("--"));
const noBuild = flags.includes("--no-build");
const screenshotDir = flags.find(flag => flag.startsWith("--screenshots="))?.split("=")[1];
const requestedRoutes = process.argv.slice(2).filter(argument => !argument.startsWith("--"));

const ROUTES = [
    "auto-complete",
    "breadcrumb",
    "button",
    "button-group",
    "calendar",
    "chart",
    "checkbox",
    "chip",
    "collapsible",
    "color-gradient",
    "color-palette",
    "color-picker",
    "combo-box",
    "command",
    "date-picker",
    "datetime-picker",
    "decimal-textbox",
    "dropdown-button",
    "dropdown-list",
    "editor",
    "expansion-panel",
    "fieldset",
    "grid",
    "input",
    "list-box",
    "list-view",
    "menubar",
    "multi-select",
    "numeric-textbox",
    "otp-input",
    "pager",
    "radio-button",
    "rating",
    "range-slider",
    "scroll-view",
    "segmented",
    "sidebar",
    "slider",
    "split-button",
    "splitter",
    "stepper",
    "switch",
    "tabs",
    "textarea",
    "textbox",
    "time-picker",
    "tree-view"
];
const MAX_TABS_PER_ROUTE = 60;
/** What to click to get text on the highlight color, by route. */
const HIGHLIGHTED_TEXT: Readonly<Record<string, string>> = {
    calendar: "mona-calendar [role=gridcell]:has-text('12')"
};

const MIME_TYPES: Record<string, string> = {
    ".css": "text/css",
    ".html": "text/html",
    ".js": "application/javascript",
    ".json": "application/json",
    ".mjs": "application/javascript",
    ".svg": "image/svg+xml",
    ".woff": "font/woff",
    ".woff2": "font/woff2"
};

async function startStaticServer(): Promise<{ port: number; server: Server }> {
    if (!noBuild) {
        execSync("npm run build:tester", { stdio: "inherit" });
    } else if (!existsSync(join(DIST_DIR, "index.html"))) {
        throw new Error('dist/mona-ui-tester/browser/index.html not found. Run "npm run build:tester" first.');
    }
    return new Promise((resolvePromise, rejectPromise) => {
        const server = createServer((request, response) => {
            let filePath = join(DIST_DIR, (request.url ?? "/").split("?")[0]);
            if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
                filePath = join(DIST_DIR, "index.html");
            }
            response.writeHead(200, {
                "Content-Type": MIME_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream"
            });
            response.end(readFileSync(filePath));
        });
        server.listen(0, "127.0.0.1", () => {
            resolvePromise({ port: (server.address() as AddressInfo).port, server });
        });
        server.on("error", rejectPromise);
    });
}

interface FocusReport {
    readonly description: string;
    readonly inDemo: boolean;
    readonly shown: boolean;
}

/**
 * Reads what's focused now. A hidden native input shows its focus on a sibling, and a control's inner input on its
 * wrapper, so an outline on either of those counts. It's a string because tsx rewrites named functions in a way that
 * doesn't survive being sent to the page.
 */
const READ_FOCUS = `(() => {
    const active = document.activeElement;
    if (!active || active === document.body) {
        return null;
    }
    const hasOutline = element => {
        // A visually hidden native input can have an outline that nobody sees.
        if (!element || element.getBoundingClientRect().width <= 2 || element.getBoundingClientRect().height <= 2) {
            return false;
        }
        const style = getComputedStyle(element);
        return style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
    };
    const parent = active.parentElement;
    const related = [active, parent, parent ? parent.parentElement : null, active.nextElementSibling, active.previousElementSibling];
    const name = (active.getAttribute("aria-label") || active.textContent || "").trim().slice(0, 30);
    const role = active.getAttribute("role") ? " role=" + active.getAttribute("role") : "";
    const classes = String(active.getAttribute("class") || "").trim().split(" ").slice(0, 3).join(".");
    return {
        description: "<" + active.tagName.toLowerCase() + role + '> "' + name + '" .' + classes,
        // An empty tab panel has no size to show anything on.
        inDemo: active.closest("app-demo-container") !== null && active.getBoundingClientRect().height > 0,
        shown: related.some(hasOutline)
    };
})()`;

/**
 * Chromium paints a Canvas backplate behind text unless `forced-color-adjust` is `none`, which leaves HighlightText
 * white on white. Computed colors look right either way, so this looks for the combination instead.
 */
const FIND_TEXT_ON_BACKPLATE = `(() => {
    const probe = document.createElement("span");
    probe.style.cssText = "color: HighlightText; forced-color-adjust: none";
    document.body.appendChild(probe);
    const highlightText = getComputedStyle(probe).color;
    probe.remove();
    return [...document.querySelectorAll("app-demo-container *")]
        .filter(element => [...element.childNodes].some(node => node.nodeType === 3 && node.textContent.trim() !== ""))
        .filter(element => {
            const style = getComputedStyle(element);
            return style.color === highlightText && style.forcedColorAdjust !== "none";
        })
        .map(element => '"' + element.textContent.trim().slice(0, 30) + '" in <' + element.parentElement.tagName.toLowerCase() + ">");
})()`;

function readFocus(page: Page): Promise<FocusReport | null> {
    return page.evaluate(READ_FOCUS) as Promise<FocusReport | null>;
}

async function main(): Promise<void> {
    const { port, server } = await startStaticServer();
    const browser = await chromium.launch();
    const failures: string[] = [];
    const textFailures: string[] = [];
    let checked = 0;
    try {
        if (screenshotDir) {
            mkdirSync(screenshotDir, { recursive: true });
        }
        const context = await browser.newContext({ forcedColors: "active", viewport: { height: 900, width: 1400 } });
        for (const route of requestedRoutes.length > 0 ? requestedRoutes : ROUTES) {
            const page = await context.newPage();
            await page.goto(`http://127.0.0.1:${port}/components/${route}`, { waitUntil: "load" });
            await page.waitForTimeout(600);
            if (screenshotDir) {
                await page.screenshot({ path: join(screenshotDir, `${route}.png`) });
            }
            // Start at the first demo, past the tester's own header and navigation.
            await page.evaluate(`(() => {
                const demo = document.querySelector("app-demo-container");
                if (demo) {
                    demo.setAttribute("tabindex", "-1");
                    demo.focus();
                    demo.removeAttribute("tabindex");
                }
            })()`);
            const seen = new Set<string>();
            for (let index = 0; index < MAX_TABS_PER_ROUTE; index++) {
                await page.keyboard.press("Tab");
                const focus = await readFocus(page);
                if (focus?.inDemo) {
                    checked++;
                    if (!focus.shown && !seen.has(focus.description)) {
                        seen.add(focus.description);
                        failures.push(`${route}: ${focus.description}`);
                    }
                }
            }
            const highlighted = HIGHLIGHTED_TEXT[route];
            if (highlighted) {
                await page.locator(highlighted).first().click();
                await page.waitForTimeout(300);
                const unreadable = (await page.evaluate(FIND_TEXT_ON_BACKPLATE)) as string[];
                textFailures.push(...unreadable.map(found => `${route}: ${found}`));
            }
            await page.close();
        }
    } finally {
        await browser.close();
        server.close();
    }

    console.log(`Checked ${checked} focus stops.`);
    if (failures.length > 0) {
        console.error(`No visible focus in forced colors:\n${failures.map(failure => `  ${failure}`).join("\n")}`);
    }
    if (textFailures.length > 0) {
        console.error(
            `Highlighted text behind a backplate:\n${textFailures.map(failure => `  ${failure}`).join("\n")}`
        );
    }
    if (failures.length > 0 || textFailures.length > 0) {
        process.exit(1);
    }
    console.log("ALL FORCED COLORS FOCUS TESTS PASSED!");
}

void main();
