import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, resolve } from "node:path";
import { chromium, type Browser, type Locator } from "playwright";

const DIST_DIR = resolve(process.cwd(), "dist/mona-ui-tester/browser");
const noBuild = process.argv.includes("--no-build");

const MIME_TYPES: Record<string, string> = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf"
};

function ensureBuilt(): void {
    if (!noBuild) {
        console.log("Building tester app (npm run build:tester)...");
        execSync("npm run build:tester", { stdio: "inherit" });
    } else {
        if (!existsSync(join(DIST_DIR, "index.html"))) {
            throw new Error(
                `dist/mona-ui-tester/browser/index.html not found. Run "npm run build:tester" before testing with --no-build.`
            );
        }
    }
}

async function startStaticServer(): Promise<{ server: Server; port: number }> {
    ensureBuilt();
    return new Promise((resolvePromise, rejectPromise) => {
        const server = createServer((req, res) => {
            const urlPath = (req.url || "/").split("?")[0];
            let filePath = join(DIST_DIR, urlPath);
            if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
                filePath = join(DIST_DIR, "index.html");
            }
            const ext = extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || "application/octet-stream";
            try {
                const content = readFileSync(filePath);
                res.writeHead(200, { "Content-Type": contentType });
                res.end(content);
            } catch {
                res.writeHead(404);
                res.end("Not Found");
            }
        });

        server.listen(0, "127.0.0.1", () => {
            const addr = server.address() as AddressInfo;
            resolvePromise({ server, port: addr.port });
        });

        server.on("error", rejectPromise);
    });
}

interface ScenarioConfig {
    name: string;
    sectionId: string;
    semanticDir: "ltr" | "rtl";
    cssDir: "ltr" | "rtl";
    suffix: "ltr" | "rtl" | "split-ltr" | "split-rtl";
    sliderId: string;
    rangeSliderId: string;
    sidebarStartId: string;
    sidebarEndId: string;
    dockedLayoutId: string;
    dockedSidebarStartId: string;
    dockedSidebarEndId: string;
    dockedInsetId: string;
    scrollViewId: string;
}

const SCENARIOS: ScenarioConfig[] = [
    {
        name: "1. Ordinary LTR (dir=ltr)",
        sectionId: "fixture-ltr",
        semanticDir: "ltr",
        cssDir: "ltr",
        suffix: "ltr",
        sliderId: "slider-ltr",
        rangeSliderId: "range-slider-ltr",
        sidebarStartId: "sidebar-start-ltr",
        sidebarEndId: "sidebar-end-ltr",
        dockedLayoutId: "docked-layout-ltr",
        dockedSidebarStartId: "docked-sidebar-start-ltr",
        dockedSidebarEndId: "docked-sidebar-end-ltr",
        dockedInsetId: "docked-inset-ltr",
        scrollViewId: "scroll-view-ltr"
    },
    {
        name: "2. Ordinary RTL (dir=rtl)",
        sectionId: "fixture-rtl",
        semanticDir: "rtl",
        cssDir: "rtl",
        suffix: "rtl",
        sliderId: "slider-rtl",
        rangeSliderId: "range-slider-rtl",
        sidebarStartId: "sidebar-start-rtl",
        sidebarEndId: "sidebar-end-rtl",
        dockedLayoutId: "docked-layout-rtl",
        dockedSidebarStartId: "docked-sidebar-start-rtl",
        dockedSidebarEndId: "docked-sidebar-end-rtl",
        dockedInsetId: "docked-inset-rtl",
        scrollViewId: "scroll-view-rtl"
    },
    {
        name: "3. Split: Semantic LTR + CSS direction: rtl",
        sectionId: "fixture-split-ltr-css-rtl",
        semanticDir: "ltr",
        cssDir: "rtl",
        suffix: "split-ltr",
        sliderId: "slider-split-ltr",
        rangeSliderId: "range-slider-split-ltr",
        sidebarStartId: "sidebar-start-split-ltr",
        sidebarEndId: "sidebar-end-split-ltr",
        dockedLayoutId: "docked-layout-split-ltr",
        dockedSidebarStartId: "docked-sidebar-start-split-ltr",
        dockedSidebarEndId: "docked-sidebar-end-split-ltr",
        dockedInsetId: "docked-inset-split-ltr",
        scrollViewId: "scroll-view-split-ltr"
    },
    {
        name: "4. Split: Semantic RTL + CSS direction: ltr",
        sectionId: "fixture-split-rtl-css-ltr",
        semanticDir: "rtl",
        cssDir: "ltr",
        suffix: "split-rtl",
        sliderId: "slider-split-rtl",
        rangeSliderId: "range-slider-split-rtl",
        sidebarStartId: "sidebar-start-split-rtl",
        sidebarEndId: "sidebar-end-split-rtl",
        dockedLayoutId: "docked-layout-split-rtl",
        dockedSidebarStartId: "docked-sidebar-start-split-rtl",
        dockedSidebarEndId: "docked-sidebar-end-split-rtl",
        dockedInsetId: "docked-inset-split-rtl",
        scrollViewId: "scroll-view-split-rtl"
    }
];

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

async function getKeyframeTransforms(locator: Locator): Promise<{ startTransform: string; endTransform: string }> {
    return await locator.evaluate(el => {
        const anims = el.getAnimations();
        for (const anim of anims) {
            const effect = anim.effect;
            if (effect instanceof KeyframeEffect) {
                const keyframes = effect.getKeyframes();
                if (keyframes.length >= 2) {
                    const first = keyframes[0];
                    const last = keyframes[keyframes.length - 1];
                    return {
                        startTransform: String(first.transform || ""),
                        endTransform: String(last.transform || "")
                    };
                }
            }
        }
        return { startTransform: "", endTransform: "" };
    });
}

function parseTranslateXSign(transformStr: string): "positive" | "negative" | "zero" {
    if (!transformStr || transformStr === "none") {
        return "zero";
    }
    const translateMatch = transformStr.match(/(?:translate|translateX|translate3d)\(\s*(-?[\d.]+)(%|px)?/i);
    if (translateMatch) {
        const val = parseFloat(translateMatch[1]);
        if (Math.abs(val) < 0.0001) {
            return "zero";
        }
        return val > 0 ? "positive" : "negative";
    }
    const matrix3dMatch = transformStr.match(/^matrix3d\((.+)\)$/i);
    if (matrix3dMatch) {
        const parts = matrix3dMatch[1].split(",").map(s => parseFloat(s.trim()));
        if (parts.length === 16 && !isNaN(parts[12])) {
            const tx = parts[12];
            if (Math.abs(tx) < 0.0001) {
                return "zero";
            }
            return tx > 0 ? "positive" : "negative";
        }
    }
    const matrixMatch = transformStr.match(/^matrix\((.+)\)$/i);
    if (matrixMatch) {
        const parts = matrixMatch[1].split(",").map(s => parseFloat(s.trim()));
        if (parts.length === 6 && !isNaN(parts[4])) {
            const tx = parts[4];
            if (Math.abs(tx) < 0.0001) {
                return "zero";
            }
            return tx > 0 ? "positive" : "negative";
        }
    }
    throw new Error(`Unable to confidently parse translateX sign from transform: "${transformStr}"`);
}

async function runTests(): Promise<void> {
    console.log("Starting static server for browser geometry tests...");
    const { server, port } = await startStaticServer();
    console.log(`Server listening on http://127.0.0.1:${port}`);

    let browser: Browser | null = null;

    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        const page = await context.newPage();

        const url = `http://127.0.0.1:${port}/browser-test/direction-geometry`;
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: "networkidle" });

        // Wait for fixture sections to be present
        await page.waitForSelector("#fixture-ltr");
        await page.waitForSelector("#fixture-rtl");
        await page.waitForSelector("#fixture-split-ltr-css-rtl");
        await page.waitForSelector("#fixture-split-rtl-css-ltr");
        await page.waitForSelector("#fixture-scroll-view-reduced-motion");

        console.log("\n==================================================");
        console.log("  Running Real Browser Direction Geometry Gate");
        console.log("==================================================\n");

        for (const scenario of SCENARIOS) {
            console.log(`--> Testing Scenario: ${scenario.name}`);
            const section = page.locator(`section#${scenario.sectionId}`);
            await section.scrollIntoViewIfNeeded();

            // 1. Confirm :dir() pseudo-class in browser layout engine
            const matchesDir = await page.evaluate(
                ({ id, dir }) => {
                    const el = document.getElementById(id);
                    return el?.matches(`:dir(${dir})`) ?? false;
                },
                { id: scenario.sectionId, dir: scenario.semanticDir }
            );
            assert(matchesDir, `[${scenario.name}] Section matches :dir(${scenario.semanticDir})`);
            console.log(`    [PASS] :dir(${scenario.semanticDir}) confirmed`);

            // 2. Slider Geometry (values 0, 20, 50, 80, 100, handles, labels, pointer click, keyboard)
            {
                const slider = section.locator(`[data-testid="${scenario.sliderId}"]`);
                const sliderBox = await slider.boundingBox();
                assert(sliderBox !== null && sliderBox.width >= 350, `Slider container has rendered width (got ${sliderBox?.width})`);

                const handle = slider.locator('[role="slider"]');
                const isRtl = scenario.semanticDir === "rtl";

                // Test representative values: 0, 20, 50, 80, 100
                for (const testVal of [0, 20, 50, 80, 100]) {
                    await page.click(`[data-testid="set-slider-${scenario.suffix}-${testVal}"]`);
                    await page.waitForTimeout(300);

                    const hBox = await handle.boundingBox();
                    assert(hBox !== null, `Slider handle box at value ${testVal}`);
                    const hCenter = hBox.x + hBox.width / 2;

                    const expectedRatio = isRtl ? 1 - testVal / 100 : testVal / 100;
                    const expectedX = sliderBox.x + expectedRatio * sliderBox.width;
                    const diff = Math.abs(hCenter - expectedX);
                    assert(
                        diff <= 16,
                        `[${scenario.name}] Slider handle center X (${hCenter.toFixed(1)}) at value ${testVal} matches expected (${expectedX.toFixed(1)}), diff: ${diff.toFixed(1)}px`
                    );

                    // Selected fill bar
                    const selection = slider.locator("div.bg-primary");
                    const selBox = await selection.boundingBox();
                    assert(selBox !== null, "Slider selection box available");

                    if (!isRtl) {
                        assert(
                            Math.abs(selBox.x - sliderBox.x) <= 8,
                            `[${scenario.name}] LTR Slider selection starts near left edge`
                        );
                        assert(
                            Math.abs(selBox.x + selBox.width - hCenter) <= 8,
                            `[${scenario.name}] LTR Slider selection ends at handle center`
                        );
                    } else {
                        assert(
                            Math.abs(selBox.x - hCenter) <= 8,
                            `[${scenario.name}] RTL Slider selection starts at handle center`
                        );
                        assert(
                            Math.abs(selBox.x + selBox.width - (sliderBox.x + sliderBox.width)) <= 8,
                            `[${scenario.name}] RTL Slider selection ends near right edge`
                        );
                    }
                }

                // Ticks and labels geometry
                const ticks = slider.locator("span[monaSliderTick]");
                const tickCount = await ticks.count();
                assert(tickCount >= 5, `Slider has at least 5 ticks rendered (found ${tickCount})`);
                const firstTickBox = await ticks.first().boundingBox();
                const lastTickBox = await ticks.last().boundingBox();
                assert(firstTickBox !== null && lastTickBox !== null, "Tick boxes available");

                const labels = slider.locator("div[data-label-position] > span");
                const labelCount = await labels.count();
                assert(labelCount >= 2, `Slider has tick labels rendered (found ${labelCount})`);
                const firstLabelBox = await labels.first().boundingBox();
                const lastLabelBox = await labels.last().boundingBox();
                assert(firstLabelBox !== null && lastLabelBox !== null, "Label boxes available");

                if (!isRtl) {
                    assert(
                        firstTickBox.x < lastTickBox.x,
                        `[${scenario.name}] LTR Slider tick 0 is left of tick 100`
                    );
                    assert(
                        firstLabelBox.x < lastLabelBox.x,
                        `[${scenario.name}] LTR Slider label 0 is left of label 100`
                    );
                } else {
                    assert(
                        firstTickBox.x > lastTickBox.x,
                        `[${scenario.name}] RTL Slider tick 0 is right of tick 100`
                    );
                    assert(
                        firstLabelBox.x > lastLabelBox.x,
                        `[${scenario.name}] RTL Slider label 0 is right of label 100`
                    );
                }

                // Label-to-tick alignment for first, middle, and last
                const firstTickCenter = firstTickBox.x + firstTickBox.width / 2;
                const firstLabelCenter = firstLabelBox.x + firstLabelBox.width / 2;
                assert(
                    Math.abs(firstLabelCenter - firstTickCenter) <= 12,
                    `[${scenario.name}] First label center aligns with first tick center`
                );

                const midTickIdx = Math.floor(tickCount / 2);
                const midLabelIdx = Math.floor(labelCount / 2);
                const midTickBox = await ticks.nth(midTickIdx).boundingBox();
                const midLabelBox = await labels.nth(midLabelIdx).boundingBox();
                assert(midTickBox !== null && midLabelBox !== null, "Middle tick and label boxes available");
                const midTickCenter = midTickBox.x + midTickBox.width / 2;
                const midLabelCenter = midLabelBox.x + midLabelBox.width / 2;
                assert(
                    Math.abs(midLabelCenter - midTickCenter) <= 12,
                    `[${scenario.name}] Middle label center aligns with middle tick center`
                );

                const lastTickCenter = lastTickBox.x + lastTickBox.width / 2;
                const lastLabelCenter = lastLabelBox.x + lastLabelBox.width / 2;
                assert(
                    Math.abs(lastLabelCenter - lastTickCenter) <= 12,
                    `[${scenario.name}] Last label center aligns with last tick center`
                );

                // Pointer click mapping at ~20%, ~50%, and ~80% physical track positions
                const click20X = sliderBox.x + 0.2 * sliderBox.width;
                const click50X = sliderBox.x + 0.5 * sliderBox.width;
                const click80X = sliderBox.x + 0.8 * sliderBox.width;
                const clickY = sliderBox.y + sliderBox.height / 2;

                await page.mouse.click(click20X, clickY);
                await page.waitForTimeout(50);
                const valAfter20Click = Number(await handle.getAttribute("aria-valuenow"));
                if (!isRtl) {
                    assert(
                        Math.abs(valAfter20Click - 20) <= 6,
                        `[${scenario.name}] LTR click near 20% maps to ~20 (got ${valAfter20Click})`
                    );
                } else {
                    assert(
                        Math.abs(valAfter20Click - 80) <= 6,
                        `[${scenario.name}] RTL click near 20% from left maps to ~80 (got ${valAfter20Click})`
                    );
                }

                await page.mouse.click(click50X, clickY);
                await page.waitForTimeout(50);
                const valAfter50Click = Number(await handle.getAttribute("aria-valuenow"));
                assert(
                    Math.abs(valAfter50Click - 50) <= 6,
                    `[${scenario.name}] Click near 50% maps to ~50 (got ${valAfter50Click})`
                );

                await page.mouse.click(click80X, clickY);
                await page.waitForTimeout(50);
                const valAfter80Click = Number(await handle.getAttribute("aria-valuenow"));
                if (!isRtl) {
                    assert(
                        Math.abs(valAfter80Click - 80) <= 6,
                        `[${scenario.name}] LTR click near 80% maps to ~80 (got ${valAfter80Click})`
                    );
                } else {
                    assert(
                        Math.abs(valAfter80Click - 20) <= 6,
                        `[${scenario.name}] RTL click near 80% from left maps to ~20 (got ${valAfter80Click})`
                    );
                }

                // Keyboard arrow navigation and physical handle movement
                await page.click(`[data-testid="set-slider-${scenario.suffix}-50"]`);
                await page.waitForTimeout(250);
                await handle.focus();

                const hBoxBeforeKey = await handle.boundingBox();
                assert(hBoxBeforeKey !== null, "Handle box before keyboard action");
                const hCenterBefore = hBoxBeforeKey.x + hBoxBeforeKey.width / 2;

                if (!isRtl) {
                    await page.keyboard.press("ArrowRight");
                    await page.waitForTimeout(250);
                    const vUp = Number(await handle.getAttribute("aria-valuenow"));
                    const hBoxUp = (await handle.boundingBox())!;
                    const hCenterUp = hBoxUp.x + hBoxUp.width / 2;
                    assert(vUp > 50, `[${scenario.name}] LTR ArrowRight increases value (got ${vUp})`);
                    assert(hCenterUp > hCenterBefore, `[${scenario.name}] LTR ArrowRight physically moves handle to the right`);

                    await page.keyboard.press("ArrowLeft");
                    await page.waitForTimeout(250);
                    const vDown = Number(await handle.getAttribute("aria-valuenow"));
                    const hBoxDown = (await handle.boundingBox())!;
                    const hCenterDown = hBoxDown.x + hBoxDown.width / 2;
                    assert(vDown <= 50, `[${scenario.name}] LTR ArrowLeft decreases value (got ${vDown})`);
                    assert(hCenterDown < hCenterUp, `[${scenario.name}] LTR ArrowLeft physically moves handle to the left`);
                } else {
                    await page.keyboard.press("ArrowLeft");
                    await page.waitForTimeout(250);
                    const vUp = Number(await handle.getAttribute("aria-valuenow"));
                    const hBoxUp = (await handle.boundingBox())!;
                    const hCenterUp = hBoxUp.x + hBoxUp.width / 2;
                    assert(vUp > 50, `[${scenario.name}] RTL ArrowLeft increases value (got ${vUp})`);
                    assert(hCenterUp < hCenterBefore, `[${scenario.name}] RTL ArrowLeft physically moves handle to the left`);

                    await page.keyboard.press("ArrowRight");
                    await page.waitForTimeout(250);
                    const vDown = Number(await handle.getAttribute("aria-valuenow"));
                    const hBoxDown = (await handle.boundingBox())!;
                    const hCenterDown = hBoxDown.x + hBoxDown.width / 2;
                    assert(vDown <= 50, `[${scenario.name}] RTL ArrowRight decreases value (got ${vDown})`);
                    assert(hCenterDown > hCenterUp, `[${scenario.name}] RTL ArrowRight physically moves handle to the right`);
                }

                console.log(`    [PASS] Slider geometry, values (0-100), ticks/labels, pointer & keyboard verified`);
            }

            // 3. RangeSlider Geometry & Selected Band Measurement
            {
                const rangeSlider = section.locator(`[data-testid="${scenario.rangeSliderId}"]`);
                const rangeBox = await rangeSlider.boundingBox();
                assert(rangeBox !== null && rangeBox.width >= 350, "RangeSlider container rendered");

                const handles = rangeSlider.locator('[role="slider"]');
                assert((await handles.count()) === 2, "RangeSlider has 2 handles");
                const h0 = handles.nth(0);
                const h1 = handles.nth(1);
                const isRtl = scenario.semanticDir === "rtl";

                const selection = rangeSlider.locator("div.bg-primary");

                // Test representative intervals: [20, 80], [0, 100], [40, 60]
                const intervals = [
                    { testid: `set-range-${scenario.suffix}-20-80`, min: 20, max: 80 },
                    { testid: `set-range-${scenario.suffix}-0-100`, min: 0, max: 100 },
                    { testid: `set-range-${scenario.suffix}-40-60`, min: 40, max: 60 }
                ];

                for (const interval of intervals) {
                    await page.click(`[data-testid="${interval.testid}"]`);
                    await page.waitForTimeout(300);

                    const h0Box = await h0.boundingBox();
                    const h1Box = await h1.boundingBox();
                    const selBox = await selection.boundingBox();
                    assert(h0Box !== null && h1Box !== null && selBox !== null, `RangeSlider boxes available for [${interval.min}, ${interval.max}]`);

                    const h0Center = h0Box.x + h0Box.width / 2;
                    const h1Center = h1Box.x + h1Box.width / 2;

                    // Absolute handle positions relative to range box
                    const expectedH0 = !isRtl
                        ? rangeBox.x + (interval.min / 100) * rangeBox.width
                        : rangeBox.x + (1 - interval.min / 100) * rangeBox.width;
                    const expectedH1 = !isRtl
                        ? rangeBox.x + (interval.max / 100) * rangeBox.width
                        : rangeBox.x + (1 - interval.max / 100) * rangeBox.width;

                    assert(
                        Math.abs(h0Center - expectedH0) <= 15,
                        `[${scenario.name}] Handle 0 physical center (${h0Center.toFixed(1)}) aligns with expected ${interval.min}% position (${expectedH0.toFixed(1)})`
                    );
                    assert(
                        Math.abs(h1Center - expectedH1) <= 15,
                        `[${scenario.name}] Handle 1 physical center (${h1Center.toFixed(1)}) aligns with expected ${interval.max}% position (${expectedH1.toFixed(1)})`
                    );

                    if (!isRtl) {
                        assert(h0Center <= h1Center, `[${scenario.name}] LTR h0 is left of h1`);
                        assert(
                            Math.abs(selBox.x - h0Center) <= 14,
                            `[${scenario.name}] LTR Selection band left edge (${selBox.x.toFixed(1)}) aligns with h0 center (${h0Center.toFixed(1)})`
                        );
                        assert(
                            Math.abs(selBox.x + selBox.width - h1Center) <= 14,
                            `[${scenario.name}] LTR Selection band right edge (${(selBox.x + selBox.width).toFixed(1)}) aligns with h1 center (${h1Center.toFixed(1)})`
                        );
                    } else {
                        assert(h0Center >= h1Center, `[${scenario.name}] RTL h0 is right of h1`);
                        assert(
                            Math.abs(selBox.x - h1Center) <= 14,
                            `[${scenario.name}] RTL Selection band left edge (${selBox.x.toFixed(1)}) aligns with h1 center (${h1Center.toFixed(1)})`
                        );
                        assert(
                            Math.abs(selBox.x + selBox.width - h0Center) <= 14,
                            `[${scenario.name}] RTL Selection band right edge (${(selBox.x + selBox.width).toFixed(1)}) aligns with h0 center (${h0Center.toFixed(1)})`
                        );
                    }

                    // Band never extends outside the handles interval
                    const leftBound = Math.min(h0Center, h1Center) - 10;
                    const rightBound = Math.max(h0Center, h1Center) + 10;
                    assert(
                        selBox.x >= leftBound && selBox.x + selBox.width <= rightBound,
                        `[${scenario.name}] Selection band never extends outside handle interval`
                    );
                }

                // Single-handle keyboard interaction on [40, 60]
                await page.click(`[data-testid="set-range-${scenario.suffix}-40-60"]`);
                await page.waitForTimeout(300);

                await h0.focus();
                const h0BoxBefore = (await h0.boundingBox())!;
                const h1BoxBefore = (await h1.boundingBox())!;
                const selBoxBefore = (await selection.boundingBox())!;
                const h0CenterBefore = h0BoxBefore.x + h0BoxBefore.width / 2;
                const h1CenterBefore = h1BoxBefore.x + h1BoxBefore.width / 2;

                if (!isRtl) {
                    await page.keyboard.press("ArrowRight");
                    await page.waitForTimeout(250);
                    const h0BoxAfter = (await h0.boundingBox())!;
                    const h1BoxAfter = (await h1.boundingBox())!;
                    const selBoxAfter = (await selection.boundingBox())!;
                    const h0CenterAfter = h0BoxAfter.x + h0BoxAfter.width / 2;
                    const h1CenterAfter = h1BoxAfter.x + h1BoxAfter.width / 2;

                    assert(h0CenterAfter > h0CenterBefore, `[${scenario.name}] LTR h0 moves right on ArrowRight`);
                    assert(Math.abs(h1CenterAfter - h1CenterBefore) <= 2, `[${scenario.name}] LTR h1 remains fixed when h0 moves`);
                    assert(selBoxAfter.x > selBoxBefore.x, `[${scenario.name}] LTR selection band left edge moves right with h0`);
                    assert(
                        Math.abs(selBoxAfter.x + selBoxAfter.width - (selBoxBefore.x + selBoxBefore.width)) <= 2,
                        `[${scenario.name}] LTR selection band right edge remains fixed when h0 moves`
                    );

                    await page.keyboard.press("ArrowLeft");
                    await page.waitForTimeout(250);
                } else {
                    await page.keyboard.press("ArrowLeft");
                    await page.waitForTimeout(250);
                    const h0BoxAfter = (await h0.boundingBox())!;
                    const h1BoxAfter = (await h1.boundingBox())!;
                    const selBoxAfter = (await selection.boundingBox())!;
                    const h0CenterAfter = h0BoxAfter.x + h0BoxAfter.width / 2;
                    const h1CenterAfter = h1BoxAfter.x + h1BoxAfter.width / 2;

                    assert(h0CenterAfter < h0CenterBefore, `[${scenario.name}] RTL h0 moves left on ArrowLeft`);
                    assert(Math.abs(h1CenterAfter - h1CenterBefore) <= 2, `[${scenario.name}] RTL h1 remains fixed when h0 moves`);
                    assert(
                        selBoxAfter.x + selBoxAfter.width < selBoxBefore.x + selBoxBefore.width,
                        `[${scenario.name}] RTL selection band right edge moves left with h0`
                    );
                    assert(
                        Math.abs(selBoxAfter.x - selBoxBefore.x) <= 2,
                        `[${scenario.name}] RTL selection band left edge remains fixed when h0 moves`
                    );

                    await page.keyboard.press("ArrowRight");
                    await page.waitForTimeout(250);
                }

                // Focus h1 and move
                await h1.focus();
                const h1BoxBeforeH1 = (await h1.boundingBox())!;
                const h0BoxBeforeH1 = (await h0.boundingBox())!;
                const selBoxBeforeH1 = (await selection.boundingBox())!;
                const h1CenterBeforeH1 = h1BoxBeforeH1.x + h1BoxBeforeH1.width / 2;
                const h0CenterBeforeH1 = h0BoxBeforeH1.x + h0BoxBeforeH1.width / 2;

                if (!isRtl) {
                    await page.keyboard.press("ArrowLeft");
                    await page.waitForTimeout(250);
                    const h1BoxAfter = (await h1.boundingBox())!;
                    const h0BoxAfter = (await h0.boundingBox())!;
                    const selBoxAfter = (await selection.boundingBox())!;
                    const h1CenterAfter = h1BoxAfter.x + h1BoxAfter.width / 2;
                    const h0CenterAfter = h0BoxAfter.x + h0BoxAfter.width / 2;

                    assert(h1CenterAfter < h1CenterBeforeH1, `[${scenario.name}] LTR h1 moves left on ArrowLeft`);
                    assert(Math.abs(h0CenterAfter - h0CenterBeforeH1) <= 2, `[${scenario.name}] LTR h0 remains fixed when h1 moves`);
                    assert(
                        selBoxAfter.x + selBoxAfter.width < selBoxBeforeH1.x + selBoxBeforeH1.width,
                        `[${scenario.name}] LTR selection right edge moves left with h1`
                    );
                    assert(
                        Math.abs(selBoxAfter.x - selBoxBeforeH1.x) <= 2,
                        `[${scenario.name}] LTR selection left edge remains fixed when h1 moves`
                    );

                    await page.keyboard.press("ArrowRight");
                    await page.waitForTimeout(250);
                } else {
                    await page.keyboard.press("ArrowRight");
                    await page.waitForTimeout(250);
                    const h1BoxAfter = (await h1.boundingBox())!;
                    const h0BoxAfter = (await h0.boundingBox())!;
                    const selBoxAfter = (await selection.boundingBox())!;
                    const h1CenterAfter = h1BoxAfter.x + h1BoxAfter.width / 2;
                    const h0CenterAfter = h0BoxAfter.x + h0BoxAfter.width / 2;

                    assert(h1CenterAfter > h1CenterBeforeH1, `[${scenario.name}] RTL h1 moves right on ArrowRight`);
                    assert(Math.abs(h0CenterAfter - h0CenterBeforeH1) <= 2, `[${scenario.name}] RTL h0 remains fixed when h1 moves`);
                    assert(
                        selBoxAfter.x > selBoxBeforeH1.x,
                        `[${scenario.name}] RTL selection left edge moves right with h1`
                    );
                    assert(
                        Math.abs(selBoxAfter.x + selBoxAfter.width - (selBoxBeforeH1.x + selBoxBeforeH1.width)) <= 2,
                        `[${scenario.name}] RTL selection right edge remains fixed when h1 moves`
                    );

                    await page.keyboard.press("ArrowLeft");
                    await page.waitForTimeout(250);
                }

                // Ticks and labels
                const rTicks = rangeSlider.locator("span[monaSliderTick]");
                const rLabels = rangeSlider.locator("div[data-label-position] > span");
                const rFirstTick = await rTicks.first().boundingBox();
                const rLastTick = await rTicks.last().boundingBox();
                const rFirstLabel = await rLabels.first().boundingBox();
                const rLastLabel = await rLabels.last().boundingBox();

                assert(rFirstTick !== null && rLastTick !== null, "RangeSlider tick boxes available");
                assert(rFirstLabel !== null && rLastLabel !== null, "RangeSlider label boxes available");

                if (!isRtl) {
                    assert(rFirstTick.x < rLastTick.x, `[${scenario.name}] LTR RangeSlider tick 0 is left of tick 100`);
                    assert(rFirstLabel.x < rLastLabel.x, `[${scenario.name}] LTR RangeSlider label 0 is left of label 100`);
                } else {
                    assert(rFirstTick.x > rLastTick.x, `[${scenario.name}] RTL RangeSlider tick 0 is right of tick 100`);
                    assert(rFirstLabel.x > rLastLabel.x, `[${scenario.name}] RTL RangeSlider label 0 is right of label 100`);
                }

                // Label-to-tick alignment for first, middle, and last
                const rTickCount = await rTicks.count();
                const rLabelCount = await rLabels.count();
                const rMidTick = await rTicks.nth(Math.floor(rTickCount / 2)).boundingBox();
                const rMidLabel = await rLabels.nth(Math.floor(rLabelCount / 2)).boundingBox();
                assert(rMidTick !== null && rMidLabel !== null, "RangeSlider mid tick/label boxes");

                const rFirstTickCenter = rFirstTick.x + rFirstTick.width / 2;
                const rFirstLabelCenter = rFirstLabel.x + rFirstLabel.width / 2;
                const rMidTickCenter = rMidTick.x + rMidTick.width / 2;
                const rMidLabelCenter = rMidLabel.x + rMidLabel.width / 2;
                const rLastTickCenter = rLastTick.x + rLastTick.width / 2;
                const rLastLabelCenter = rLastLabel.x + rLastLabel.width / 2;

                assert(
                    Math.abs(rFirstLabelCenter - rFirstTickCenter) <= 12,
                    `[${scenario.name}] RangeSlider first label center aligns with first tick center`
                );
                assert(
                    Math.abs(rMidLabelCenter - rMidTickCenter) <= 12,
                    `[${scenario.name}] RangeSlider mid label center aligns with mid tick center`
                );
                assert(
                    Math.abs(rLastLabelCenter - rLastTickCenter) <= 12,
                    `[${scenario.name}] RangeSlider last label center aligns with last tick center`
                );

                console.log(`    [PASS] RangeSlider handles, selection band measurement & ticks/labels verified`);
            }

            // 4. Sidebar Docked Layout (mobileBreakpoint=0)
            {
                const dockedLayout = section.locator(`[data-testid="${scenario.dockedLayoutId}"]`);
                const layoutBox = await dockedLayout.boundingBox();
                assert(layoutBox !== null, "Docked layout bounding box available");

                const startSidebar = section.locator(`[data-testid="${scenario.dockedSidebarStartId}"]`);
                const endSidebar = section.locator(`[data-testid="${scenario.dockedSidebarEndId}"]`);
                const inset = section.locator(`[data-testid="${scenario.dockedInsetId}"]`);
                const rail = startSidebar.locator(`[data-testid="docked-rail-start-${scenario.suffix}"]`);
                const isRtl = scenario.semanticDir === "rtl";

                const startBox = await startSidebar.boundingBox();
                const endBox = await endSidebar.boundingBox();
                const insetBox = await inset.boundingBox();
                const railBox = await rail.boundingBox();
                assert(startBox !== null && endBox !== null && insetBox !== null && railBox !== null, "Docked sidebar boxes available");

                // Start sidebar placement & interior border:
                // LTR (and split LTR + CSS RTL): start is physically LEFT, interior border is border-r, rail on right-0
                // RTL (and split RTL + CSS LTR): start is physically RIGHT, interior border is border-l, rail on left-0
                const startBorders = await startSidebar.evaluate(el => {
                    const cs = window.getComputedStyle(el);
                    return {
                        left: parseFloat(cs.borderLeftWidth) || 0,
                        right: parseFloat(cs.borderRightWidth) || 0
                    };
                });
                const endBorders = await endSidebar.evaluate(el => {
                    const cs = window.getComputedStyle(el);
                    return {
                        left: parseFloat(cs.borderLeftWidth) || 0,
                        right: parseFloat(cs.borderRightWidth) || 0
                    };
                });

                if (!isRtl) {
                    assert(
                        Math.abs(startBox.x - layoutBox.x) <= 4,
                        `[${scenario.name}] Docked start sidebar at physical left edge`
                    );
                    assert(
                        Math.abs(endBox.x + endBox.width - (layoutBox.x + layoutBox.width)) <= 4,
                        `[${scenario.name}] Docked end sidebar at physical right edge`
                    );
                    assert(
                        insetBox.x >= startBox.x + startBox.width - 2 && insetBox.x + insetBox.width <= endBox.x + 2,
                        `[${scenario.name}] Docked inset is positioned between start and end sidebars`
                    );
                    // Interior border classes and rendered computed border widths
                    const startClasses = (await startSidebar.getAttribute("class")) || "";
                    const endClasses = (await endSidebar.getAttribute("class")) || "";
                    assert(startClasses.includes("border-r"), `[${scenario.name}] Start sidebar has interior border-r`);
                    assert(endClasses.includes("border-l"), `[${scenario.name}] End sidebar has interior border-l`);
                    assert(
                        startBorders.right >= 1 && startBorders.left === 0,
                        `[${scenario.name}] Start sidebar rendered interior border is right (got R=${startBorders.right}, L=${startBorders.left})`
                    );
                    assert(
                        endBorders.left >= 1 && endBorders.right === 0,
                        `[${scenario.name}] End sidebar rendered interior border is left (got R=${endBorders.right}, L=${endBorders.left})`
                    );
                    // Rail on inner edge
                    assert(
                        railBox.x + railBox.width >= startBox.x + startBox.width - 8,
                        `[${scenario.name}] Rail is on start sidebar's inner edge (right-0)`
                    );
                } else {
                    assert(
                        Math.abs(startBox.x + startBox.width - (layoutBox.x + layoutBox.width)) <= 4,
                        `[${scenario.name}] Docked start sidebar at physical right edge`
                    );
                    assert(
                        Math.abs(endBox.x - layoutBox.x) <= 4,
                        `[${scenario.name}] Docked end sidebar at physical left edge`
                    );
                    assert(
                        insetBox.x >= endBox.x + endBox.width - 2 && insetBox.x + insetBox.width <= startBox.x + 2,
                        `[${scenario.name}] Docked inset is positioned between end and start sidebars`
                    );
                    // Interior border classes and rendered computed border widths
                    const startClasses = (await startSidebar.getAttribute("class")) || "";
                    const endClasses = (await endSidebar.getAttribute("class")) || "";
                    assert(startClasses.includes("border-l"), `[${scenario.name}] Start sidebar has interior border-l`);
                    assert(endClasses.includes("border-r"), `[${scenario.name}] End sidebar has interior border-r`);
                    assert(
                        startBorders.left >= 1 && startBorders.right === 0,
                        `[${scenario.name}] Start sidebar rendered interior border is left (got R=${startBorders.left}, L=${startBorders.right})`
                    );
                    assert(
                        endBorders.right >= 1 && endBorders.left === 0,
                        `[${scenario.name}] End sidebar rendered interior border is right (got R=${endBorders.right}, L=${endBorders.left})`
                    );
                    // Rail on inner edge
                    assert(
                        railBox.x <= startBox.x + 8,
                        `[${scenario.name}] Rail is on start sidebar's inner edge (left-0)`
                    );
                }

                // Collapse start sidebar to icon rail (collapsible="icon", iconWidth=40)
                await page.click(`[data-testid="toggle-docked-start-${scenario.suffix}"]`);
                await page.waitForTimeout(350);
                const startIconBox = await startSidebar.boundingBox();
                assert(startIconBox !== null, "Start icon box available");
                assert(Math.abs(startIconBox.width - 40) <= 5, `Start sidebar collapsed to icon width (~40px, got ${startIconBox.width})`);
                if (!isRtl) {
                    assert(Math.abs(startIconBox.x - layoutBox.x) <= 4, `Start sidebar remains at physical left after icon collapse`);
                } else {
                    assert(Math.abs(startIconBox.x + startIconBox.width - (layoutBox.x + layoutBox.width)) <= 4, `Start sidebar remains at physical right after icon collapse`);
                }
                // Re-expand start
                await page.click(`[data-testid="toggle-docked-start-${scenario.suffix}"]`);
                await page.waitForTimeout(350);

                // Collapse end sidebar to offcanvas
                await page.click(`[data-testid="toggle-docked-end-${scenario.suffix}"]`);
                await page.waitForTimeout(350);
                const endClosedBox = await endSidebar.boundingBox();
                assert(endClosedBox !== null && endClosedBox.width <= 2, "End sidebar collapsed offcanvas to 0 width");
                // Re-expand end
                await page.click(`[data-testid="toggle-docked-end-${scenario.suffix}"]`);
                await page.waitForTimeout(350);

                console.log(`    [PASS] Docked Sidebar start/end edges, interior borders, rail & collapse verified`);
            }

            // 5. Sidebar Drawer Physical Edge Placement (compact presentation)
            {
                const layout = section.locator("mona-sidebar-layout").first();
                const layoutBox = await layout.boundingBox();
                assert(layoutBox !== null, "Sidebar layout box available");

                const startSidebar = section.locator(`[data-testid="${scenario.sidebarStartId}"]`);
                const endSidebar = section.locator(`[data-testid="${scenario.sidebarEndId}"]`);
                const isRtl = scenario.semanticDir === "rtl";

                // 1. Open start drawer
                await page.click(`[data-testid="open-${scenario.sidebarStartId}"]`);
                await page.waitForTimeout(350);

                const startOpenBox = await startSidebar.boundingBox();
                assert(startOpenBox !== null, "Sidebar start drawer box available");

                if (!isRtl) {
                    assert(
                        Math.abs(startOpenBox.x - layoutBox.x) <= 4,
                        `[${scenario.name}] Sidebar start drawer docked to physical left edge (diff: ${(startOpenBox.x - layoutBox.x).toFixed(1)}px)`
                    );
                } else {
                    const diff = Math.abs(startOpenBox.x + startOpenBox.width - (layoutBox.x + layoutBox.width));
                    assert(
                        diff <= 4,
                        `[${scenario.name}] Sidebar start drawer docked to physical right edge (diff: ${diff.toFixed(1)}px)`
                    );
                }

                // 2. Close start drawer
                await page.click(`[data-testid="close-${scenario.sidebarStartId}"]`);
                await page.waitForTimeout(350);

                const startClosedBox = await startSidebar.boundingBox();
                assert(startClosedBox !== null, "Closed start sidebar box available");
                if (!isRtl) {
                    assert(
                        startClosedBox.x + startClosedBox.width <= layoutBox.x + 4,
                        `[${scenario.name}] Closed start drawer translates offscreen to the left`
                    );
                } else {
                    assert(
                        startClosedBox.x >= layoutBox.x + layoutBox.width - 4,
                        `[${scenario.name}] Closed start drawer translates offscreen to the right`
                    );
                }

                // 3. Open end drawer
                await page.click(`[data-testid="open-${scenario.sidebarEndId}"]`);
                await page.waitForTimeout(350);

                const endOpenBox = await endSidebar.boundingBox();
                assert(endOpenBox !== null, "Sidebar end drawer box available");

                if (!isRtl) {
                    const diff = Math.abs(endOpenBox.x + endOpenBox.width - (layoutBox.x + layoutBox.width));
                    assert(
                        diff <= 4,
                        `[${scenario.name}] Sidebar end drawer docked to physical right edge (diff: ${diff.toFixed(1)}px)`
                    );
                } else {
                    assert(
                        Math.abs(endOpenBox.x - layoutBox.x) <= 4,
                        `[${scenario.name}] Sidebar end drawer docked to physical left edge (diff: ${(endOpenBox.x - layoutBox.x).toFixed(1)}px)`
                    );
                }

                // 4. Close end drawer
                await page.click(`[data-testid="close-${scenario.sidebarEndId}"]`);
                await page.waitForTimeout(350);

                const endClosedBox = await endSidebar.boundingBox();
                assert(endClosedBox !== null, "Closed end sidebar box available");
                if (!isRtl) {
                    assert(
                        endClosedBox.x >= layoutBox.x + layoutBox.width - 4,
                        `[${scenario.name}] Closed end drawer translates offscreen to the right`
                    );
                } else {
                    assert(
                        endClosedBox.x + endClosedBox.width <= layoutBox.x + 4,
                        `[${scenario.name}] Closed end drawer translates offscreen to the left`
                    );
                }

                console.log(`    [PASS] Sidebar start & end drawer physical edge anchoring verified`);
            }

            // 6. ScrollView Navigation Controls & Genuinely Overflowing Pager
            {
                const scrollView = section.locator(`[data-testid="${scenario.scrollViewId}"]`);
                const scrollBox = await scrollView.boundingBox();
                assert(scrollBox !== null, "ScrollView box available");

                const prevBtn = scrollView.locator('button[data-navigate-prev="true"]');
                const nextBtn = scrollView.locator('button[data-navigate-next="true"]');
                const prevBox = await prevBtn.boundingBox();
                const nextBox = await nextBtn.boundingBox();
                assert(prevBox !== null && nextBox !== null, "ScrollView arrow boxes available");

                const isRtl = scenario.semanticDir === "rtl";

                // In LTR: prev arrow is on the left, next arrow is on the right
                // In RTL: prev arrow is on the right, next arrow is on the left
                if (!isRtl) {
                    assert(
                        prevBox.x < nextBox.x,
                        `[${scenario.name}] LTR ScrollView Prev arrow (X=${prevBox.x.toFixed(1)}) is left of Next arrow (X=${nextBox.x.toFixed(1)})`
                    );
                    assert(
                        Math.abs(prevBox.x - scrollBox.x) <= 16,
                        `[${scenario.name}] LTR Prev arrow pinned to physical left edge`
                    );
                    assert(
                        Math.abs(nextBox.x + nextBox.width - (scrollBox.x + scrollBox.width)) <= 16,
                        `[${scenario.name}] LTR Next arrow pinned to physical right edge`
                    );
                } else {
                    assert(
                        prevBox.x > nextBox.x,
                        `[${scenario.name}] RTL ScrollView Prev arrow (X=${prevBox.x.toFixed(1)}) is right of Next arrow (X=${nextBox.x.toFixed(1)})`
                    );
                    assert(
                        Math.abs(prevBox.x + prevBox.width - (scrollBox.x + scrollBox.width)) <= 16,
                        `[${scenario.name}] RTL Prev arrow pinned to physical right edge`
                    );
                    assert(
                        Math.abs(nextBox.x - scrollBox.x) <= 16,
                        `[${scenario.name}] RTL Next arrow pinned to physical left edge`
                    );
                }

                // Chevron icon rotation / transform
                const prevIcon = prevBtn.locator("svg");
                const nextIcon = nextBtn.locator("svg");
                assert((await prevIcon.count()) === 1 && (await nextIcon.count()) === 1, "Arrow icons exist");

                const pagerPrevArrow = scrollView.locator('button[aria-label="Scroll pager previous"]');
                const pagerNextArrow = scrollView.locator('button[aria-label="Scroll pager next"]');
                assert(
                    (await pagerPrevArrow.count()) === 1 && (await pagerNextArrow.count()) === 1,
                    `[${scenario.name}] Pager navigation arrows are rendered when overflowing`
                );

                const pagerPrevSvg = pagerPrevArrow.locator("svg");
                const pagerNextSvg = pagerNextArrow.locator("svg");

                // Chevron icon rotation / transform (evaluating authentic Tailwind rotate / transform utility)
                // Regression note: The tester must not define the utility behavior being verified; the rendered transform must come from the same CSS pipeline consumers rely on.
                const isSvgRotated180 = async (locator: Locator): Promise<{ rotated: boolean; desc: string }> => {
                    return await locator.evaluate(el => {
                        const style = window.getComputedStyle(el);
                        const isRotated = style.rotate === "180deg" || style.transform.startsWith("matrix(-1");
                        return {
                            rotated: isRotated,
                            desc: `rotate='${style.rotate}', transform='${style.transform}'`
                        };
                    });
                };

                const prevRotated = await isSvgRotated180(prevIcon);
                const nextRotated = await isSvgRotated180(nextIcon);
                const pagerPrevRotated = await isSvgRotated180(pagerPrevSvg);
                const pagerNextRotated = await isSvgRotated180(pagerNextSvg);

                if (!isRtl) {
                    assert(!prevRotated.rotated, `[${scenario.name}] LTR carousel prev chevron must not be rotated 180deg (${prevRotated.desc})`);
                    assert(!nextRotated.rotated, `[${scenario.name}] LTR carousel next chevron must not be rotated 180deg (${nextRotated.desc})`);
                    assert(!pagerPrevRotated.rotated, `[${scenario.name}] LTR pager prev chevron must not be rotated 180deg (${pagerPrevRotated.desc})`);
                    assert(!pagerNextRotated.rotated, `[${scenario.name}] LTR pager next chevron must not be rotated 180deg (${pagerNextRotated.desc})`);
                } else {
                    assert(prevRotated.rotated, `[${scenario.name}] RTL carousel prev chevron must be rotated 180deg (${prevRotated.desc})`);
                    assert(nextRotated.rotated, `[${scenario.name}] RTL carousel next chevron must be rotated 180deg (${nextRotated.desc})`);
                    assert(pagerPrevRotated.rotated, `[${scenario.name}] RTL pager prev chevron must be rotated 180deg (${pagerPrevRotated.desc})`);
                    assert(pagerNextRotated.rotated, `[${scenario.name}] RTL pager next chevron must be rotated 180deg (${pagerNextRotated.desc})`);
                }

                // Pager list and overflowing verification
                const pagerList = scrollView.locator("ul").nth(1);
                const pagerMetrics = await pagerList.evaluate(el => ({
                    scrollWidth: el.scrollWidth,
                    clientWidth: el.clientWidth,
                    scrollLeft: el.scrollLeft
                }));
                assert(
                    pagerMetrics.scrollWidth > pagerMetrics.clientWidth,
                    `[${scenario.name}] Pager genuinely overflows: scrollWidth (${pagerMetrics.scrollWidth}) > clientWidth (${pagerMetrics.clientWidth})`
                );

                // Pager arrow physical sides relative to pager list
                const pagerPrevBox = await pagerPrevArrow.boundingBox();
                const pagerNextBox = await pagerNextArrow.boundingBox();
                const pagerListBox = await pagerList.boundingBox();
                assert(pagerPrevBox !== null && pagerNextBox !== null && pagerListBox !== null, "Pager arrow and list boxes available");

                if (!isRtl) {
                    assert(
                        pagerPrevBox.x < pagerNextBox.x,
                        `[${scenario.name}] LTR pager prev arrow is left of pager next arrow`
                    );
                    assert(
                        pagerPrevBox.x <= pagerListBox.x + 2,
                        `[${scenario.name}] LTR pager prev arrow is on left side of pager list`
                    );
                    assert(
                        pagerNextBox.x + pagerNextBox.width >= pagerListBox.x + pagerListBox.width - 2,
                        `[${scenario.name}] LTR pager next arrow is on right side of pager list`
                    );
                } else {
                    assert(
                        pagerPrevBox.x > pagerNextBox.x,
                        `[${scenario.name}] RTL pager prev arrow is right of pager next arrow`
                    );
                    assert(
                        pagerPrevBox.x + pagerPrevBox.width >= pagerListBox.x + pagerListBox.width - 2,
                        `[${scenario.name}] RTL pager prev arrow is on right side of pager list`
                    );
                    assert(
                        pagerNextBox.x <= pagerListBox.x + 2,
                        `[${scenario.name}] RTL pager next arrow is on left side of pager list`
                    );
                }

                // Pager items ordering
                const p0 = scrollView.locator('li[data-page-index="0"]');
                const p19 = scrollView.locator('li[data-page-index="19"]');
                const p0Box = await p0.boundingBox();
                const p19Box = await p19.boundingBox();
                assert(p0Box !== null && p19Box !== null, "Pager item bounding boxes available");

                if (!isRtl) {
                    assert(p0Box.x < p19Box.x, `[${scenario.name}] LTR Pager item 0 is left of item 19`);
                } else {
                    assert(p0Box.x > p19Box.x, `[${scenario.name}] RTL Pager item 0 is right of item 19`);
                }

                // Pager scroll interaction: click pager Next arrow
                const initialP0X = p0Box.x;
                await pagerNextArrow.click();
                await page.waitForTimeout(250);
                const p0AfterNext = await p0.boundingBox();
                assert(p0AfterNext !== null, "p0 box after next scroll");
                if (!isRtl) {
                    assert(p0AfterNext.x < initialP0X, `[${scenario.name}] LTR clicking pager next moves content to the left`);
                } else {
                    assert(p0AfterNext.x > initialP0X, `[${scenario.name}] RTL clicking pager next moves content to the right`);
                }

                // Click pager Prev arrow
                await pagerPrevArrow.click();
                await page.waitForTimeout(250);
                const p0AfterPrev = await p0.boundingBox();
                assert(p0AfterPrev !== null, "p0 box after prev scroll");
                if (!isRtl) {
                    assert(p0AfterPrev.x > p0AfterNext.x, `[${scenario.name}] LTR clicking pager prev scrolls back right`);
                } else {
                    assert(p0AfterPrev.x < p0AfterNext.x, `[${scenario.name}] RTL clicking pager prev scrolls back left`);
                }

                // Instrument pagerList.scrollBy and scrollTo to record all scroll calls deterministically
                await pagerList.evaluate(el => {
                    const list = el as HTMLElement & {
                        __scrollByCalls?: Array<{ left: number; behavior?: string; type?: string }>;
                        __scrollCalls?: Array<{ left: number; behavior?: string; type?: string }>;
                    };
                    list.__scrollByCalls = [];
                    list.__scrollCalls = [];
                    const originalScrollBy = list.scrollBy.bind(list);
                    const originalScrollTo = list.scrollTo?.bind(list);

                    list.scrollBy = function (options?: ScrollToOptions | number, y?: number) {
                        const call =
                            typeof options === "object"
                                ? { left: options?.left ?? 0, behavior: options?.behavior, type: "scrollBy" }
                                : { left: options ?? 0, type: "scrollBy" };
                        list.__scrollByCalls!.push(call);
                        list.__scrollCalls!.push(call);
                        return typeof options === "object"
                            ? originalScrollBy(options)
                            : originalScrollBy(options as number, y as number);
                    };

                    if (originalScrollTo) {
                        list.scrollTo = function (options?: ScrollToOptions | number, y?: number) {
                            const call =
                                typeof options === "object"
                                    ? { left: options?.left ?? 0, behavior: options?.behavior, type: "scrollTo" }
                                    : { left: options ?? 0, type: "scrollTo" };
                            list.__scrollByCalls!.push(call);
                            list.__scrollCalls!.push(call);
                            return typeof options === "object"
                                ? originalScrollTo(options)
                                : originalScrollTo(options as number, y as number);
                        };
                    }
                });

                // Genuine mouse hold gesture on pager Next arrow
                const p0BeforeContinuous = (await p0.boundingBox())!.x;
                await pagerNextArrow.hover();
                await page.mouse.down();
                await page.waitForTimeout(350); // holds down for ~5 interval ticks (60ms interval)
                await page.mouse.up();
                await page.waitForTimeout(50); // allow release event loop tick

                const p0AfterContinuous = (await p0.boundingBox())!.x;
                if (!isRtl) {
                    assert(p0AfterContinuous < p0BeforeContinuous, `[${scenario.name}] LTR continuous scroll moved content further left`);
                } else {
                    assert(p0AfterContinuous > p0BeforeContinuous, `[${scenario.name}] RTL continuous scroll moved content further right`);
                }

                const callsDuringHold = await pagerList.evaluate(el => ((el as any).__scrollByCalls || []).length);
                assert(
                    callsDuringHold >= 2,
                    `[${scenario.name}] Genuine mouse hold on pager arrow produced multiple scrollBy calls (got ${callsDuringHold})`
                );

                // Verify physical delta direction and smooth behavior during continuous scroll
                const holdCalls = await pagerList.evaluate(el => (el as any).__scrollByCalls || []);
                const expectedDeltaSign = !isRtl ? 1 : -1;
                for (const call of holdCalls) {
                    assert(
                        Math.sign(call.left) === expectedDeltaSign,
                        `[${scenario.name}] Pager scrollBy delta (${call.left}) matches expected physical direction (${expectedDeltaSign > 0 ? "positive" : "negative"})`
                    );
                    assert(
                        call.behavior === "smooth",
                        `[${scenario.name}] Pager scrollBy under no-preference requests behavior='smooth' (got '${call.behavior}')`
                    );
                }

                // Wait longer than the single-scroll timer (60ms)
                await page.waitForTimeout(250);
                const callsAfterWait = await pagerList.evaluate(el => ((el as any).__scrollByCalls || []).length);
                assert(
                    callsAfterWait === callsDuringHold,
                    `[${scenario.name}] Continuous scroll stopped upon mouseup: no trailing single scrollBy call after release (hold: ${callsDuringHold}, after wait: ${callsAfterWait})`
                );

                // Now test normal short click: must produce exactly one additional scrollBy call
                await pagerNextArrow.click();
                await page.waitForTimeout(200); // allow 60ms single timer to fire
                const callsAfterClick = await pagerList.evaluate(el => ((el as any).__scrollByCalls || []).length);
                assert(
                    callsAfterClick === callsAfterWait + 1,
                    `[${scenario.name}] Short click on pager arrow performed exactly one additional scrollBy call (expected ${callsAfterWait + 1}, got ${callsAfterClick})`
                );

                // Test non-primary right-button hold: must not trigger pager scrolling
                const callsBeforeRight = await pagerList.evaluate(el => ((el as any).__scrollByCalls || []).length);
                await pagerNextArrow.hover();
                await page.mouse.down({ button: "right" });
                await page.waitForTimeout(180);
                await page.mouse.up({ button: "right" });
                await page.waitForTimeout(100);
                const callsAfterRight = await pagerList.evaluate(el => ((el as any).__scrollByCalls || []).length);
                assert(
                    callsAfterRight === callsBeforeRight,
                    `[${scenario.name}] Secondary right-click hold does not trigger pager scrolling (before: ${callsBeforeRight}, after: ${callsAfterRight})`
                );

                // Establish known pager scroll position at page 0 before rapid activation tests
                const dot0 = scrollView.locator('li[data-page-index="0"] button');
                await dot0.click();
                await page.waitForTimeout(500); // allow active page centering to settle
                await pagerList.evaluate(el => {
                    (el as any).__scrollByCalls = [];
                    (el as any).__scrollCalls = [];
                });

                // Test rapid consecutive short clicks: must produce exactly two scroll calls and cumulative physical displacement
                const callsBeforeRapid = await pagerList.evaluate(el => ((el as any).__scrollByCalls || []).length);
                const p0BeforeRapid = (await p0.boundingBox())!.x;
                await pagerNextArrow.click();
                await pagerNextArrow.click();
                const callsAfterRapid = await pagerList.evaluate(el => ((el as any).__scrollByCalls || []).length);
                assert(
                    callsAfterRapid === callsBeforeRapid + 2,
                    `[${scenario.name}] Two rapid consecutive short clicks performed exactly two scroll calls (expected ${callsBeforeRapid + 2}, got ${callsAfterRapid})`
                );
                await page.waitForTimeout(500); // allow cumulative smooth scroll to settle
                const p0AfterRapid = (await p0.boundingBox())!.x;
                const displacementRapid = !isRtl ? p0BeforeRapid - p0AfterRapid : p0AfterRapid - p0BeforeRapid;
                assert(
                    displacementRapid >= 180 && displacementRapid <= 220,
                    `[${scenario.name}] Two rapid consecutive short clicks produced cumulative physical displacement (expected ~200px, got ${displacementRapid.toFixed(1)}px)`
                );

                // Test rapid keyboard activations: two Enter presses perform exactly two steps and cumulative physical displacement
                const p0BeforeKeyboard = (await p0.boundingBox())!.x;
                await pagerNextArrow.focus();
                await page.keyboard.press("Enter");
                await page.keyboard.press("Enter");
                const callsAfterKeyboard = await pagerList.evaluate(el => ((el as any).__scrollByCalls || []).length);
                assert(
                    callsAfterKeyboard === callsAfterRapid + 2,
                    `[${scenario.name}] Two rapid keyboard activations performed exactly two scroll calls (expected ${callsAfterRapid + 2}, got ${callsAfterKeyboard})`
                );
                await page.waitForTimeout(500); // allow cumulative smooth scroll to settle
                const p0AfterKeyboard = (await p0.boundingBox())!.x;
                const displacementKeyboard = !isRtl ? p0BeforeKeyboard - p0AfterKeyboard : p0AfterKeyboard - p0BeforeKeyboard;
                assert(
                    displacementKeyboard >= 180 && displacementKeyboard <= 220,
                    `[${scenario.name}] Two rapid keyboard activations produced cumulative physical displacement (expected ~200px, got ${displacementKeyboard.toFixed(1)}px)`
                );

                // Test rapid alternating Next then Previous clicks: must return to starting position
                const p0BeforeAlternating = (await p0.boundingBox())!.x;
                const callsBeforeAlternating = await pagerList.evaluate(el => ((el as any).__scrollByCalls || []).length);
                await pagerNextArrow.click();
                await pagerPrevArrow.click();
                const callsAfterAlternating = await pagerList.evaluate(el => ((el as any).__scrollByCalls || []).length);
                assert(
                    callsAfterAlternating === callsBeforeAlternating + 2,
                    `[${scenario.name}] Rapid alternating Next then Previous performed exactly two scroll calls (expected ${callsBeforeAlternating + 2}, got ${callsAfterAlternating})`
                );
                await page.waitForTimeout(500); // allow alternating smooth scroll to settle
                const p0AfterAlternating = (await p0.boundingBox())!.x;
                const netDeltaAlternating = Math.abs(p0AfterAlternating - p0BeforeAlternating);
                assert(
                    netDeltaAlternating <= 5,
                    `[${scenario.name}] Rapid alternating Next then Previous returned to starting position (net delta: ${netDeltaAlternating.toFixed(1)}px)`
                );

                // Distant item centering
                const item15Btn = scrollView.locator('li[data-page-index="15"] button');
                await item15Btn.click();
                await page.waitForTimeout(500);

                const activePage = scrollView.locator('button[data-active-page="true"]');
                assert((await activePage.count()) === 1, "Active page updated to 15");
                const activeBox = await activePage.boundingBox();
                const listContainer = pagerList.locator("xpath=..");
                const containerBox = await listContainer.boundingBox();
                assert(activeBox !== null && containerBox !== null, "Active item & container boxes available");
                assert(
                    activeBox.x >= containerBox.x - 2 && activeBox.x + activeBox.width <= containerBox.x + containerBox.width + 2,
                    `[${scenario.name}] Active page 15 is visibly within pager container viewport`
                );
                const activeCenter = activeBox.x + activeBox.width / 2;
                const containerCenter = containerBox.x + containerBox.width / 2;
                assert(
                    Math.abs(activeCenter - containerCenter) <= 24,
                    `[${scenario.name}] Active page 15 center (${activeCenter.toFixed(1)}) is centered within pager container (${containerCenter.toFixed(1)})`
                );

                // Main carousel forward/backward slide navigation with in-flight enter/leave animation verification
                await page.waitForTimeout(400); // ensure previous animations fully settled
                const activeSlideInitial = scrollView.locator('li[role="group"]');
                const initialSlideText = (await activeSlideInitial.first().textContent())?.trim();

                // Expected animation classes and @keyframes for logical Next:
                // LTR: enter from right (slide-in-from-right / slideInFromRight), leave to left (slide-out-to-left / slideOutToLeft)
                // RTL: enter from left (slide-in-from-left / slideInFromLeft), leave to right (slide-out-to-right / slideOutToRight)
                const nextEnterClass = !isRtl ? "slide-in-from-right" : "slide-in-from-left";
                const nextLeaveClass = !isRtl ? "slide-out-to-left" : "slide-out-to-right";
                const nextEnterAnimName = !isRtl ? "slideInFromRight" : "slideInFromLeft";
                const nextLeaveAnimName = !isRtl ? "slideOutToLeft" : "slideOutToRight";

                await nextBtn.click();

                const nextEntering = scrollView.locator(`li[role="group"].${nextEnterClass}`);
                const nextLeaving = scrollView.locator(`li[role="group"].${nextLeaveClass}`);

                await nextEntering.waitFor({ state: "attached", timeout: 2000 });
                await nextLeaving.waitFor({ state: "attached", timeout: 2000 });

                const nextEnterAnim = await nextEntering.evaluate(el => window.getComputedStyle(el).animationName);
                const nextLeaveAnim = await nextLeaving.evaluate(el => window.getComputedStyle(el).animationName);

                assert(
                    nextEnterAnim.endsWith(nextEnterAnimName),
                    `[${scenario.name}] In-flight Next entering slide has animationName ending with '${nextEnterAnimName}' (got '${nextEnterAnim}')`
                );
                assert(
                    nextLeaveAnim.endsWith(nextLeaveAnimName),
                    `[${scenario.name}] In-flight Next leaving slide has animationName ending with '${nextLeaveAnimName}' (got '${nextLeaveAnim}')`
                );

                // Inspect Web Animations API keyframes to verify physical displacement direction
                const nextEnterKf = await getKeyframeTransforms(nextEntering);
                const nextLeaveKf = await getKeyframeTransforms(nextLeaving);
                const expectedNextEnterStartSign = !isRtl ? "positive" : "negative";
                const expectedNextLeaveEndSign = !isRtl ? "negative" : "positive";

                assert(
                    parseTranslateXSign(nextEnterKf.startTransform) === expectedNextEnterStartSign,
                    `[${scenario.name}] Next entering slide keyframe start transform must be ${expectedNextEnterStartSign} (got '${nextEnterKf.startTransform}')`
                );
                assert(
                    parseTranslateXSign(nextEnterKf.endTransform) === "zero",
                    `[${scenario.name}] Next entering slide keyframe end transform must be zero (got '${nextEnterKf.endTransform}')`
                );
                assert(
                    parseTranslateXSign(nextLeaveKf.startTransform) === "zero",
                    `[${scenario.name}] Next leaving slide keyframe start transform must be zero (got '${nextLeaveKf.startTransform}')`
                );
                assert(
                    parseTranslateXSign(nextLeaveKf.endTransform) === expectedNextLeaveEndSign,
                    `[${scenario.name}] Next leaving slide keyframe end transform must be ${expectedNextLeaveEndSign} (got '${nextLeaveKf.endTransform}')`
                );

                // Await completion of the 500ms animation and subsequent DOM detachment
                await nextLeaving.waitFor({ state: "detached", timeout: 2000 });

                const activeSlideNext = scrollView.locator('li[role="group"]');
                const nextSlideText = (await activeSlideNext.first().textContent())?.trim();
                assert(
                    nextSlideText !== initialSlideText,
                    `[${scenario.name}] Clicking Next advances slide (from '${initialSlideText}' to '${nextSlideText}')`
                );

                // Expected animation classes and @keyframes for logical Previous:
                // LTR: enter from left (slide-in-from-left / slideInFromLeft), leave to right (slide-out-to-right / slideOutToRight)
                // RTL: enter from right (slide-in-from-right / slideInFromRight), leave to left (slide-out-to-left / slideOutToLeft)
                const prevEnterClass = !isRtl ? "slide-in-from-left" : "slide-in-from-right";
                const prevLeaveClass = !isRtl ? "slide-out-to-right" : "slide-out-to-left";
                const prevEnterAnimName = !isRtl ? "slideInFromLeft" : "slideInFromRight";
                const prevLeaveAnimName = !isRtl ? "slideOutToRight" : "slideOutToLeft";

                await prevBtn.click();

                const prevEntering = scrollView.locator(`li[role="group"].${prevEnterClass}`);
                const prevLeaving = scrollView.locator(`li[role="group"].${prevLeaveClass}`);

                await prevEntering.waitFor({ state: "attached", timeout: 2000 });
                await prevLeaving.waitFor({ state: "attached", timeout: 2000 });

                const prevEnterAnim = await prevEntering.evaluate(el => window.getComputedStyle(el).animationName);
                const prevLeaveAnim = await prevLeaving.evaluate(el => window.getComputedStyle(el).animationName);

                assert(
                    prevEnterAnim.endsWith(prevEnterAnimName),
                    `[${scenario.name}] In-flight Prev entering slide has animationName ending with '${prevEnterAnimName}' (got '${prevEnterAnim}')`
                );
                assert(
                    prevLeaveAnim.endsWith(prevLeaveAnimName),
                    `[${scenario.name}] In-flight Prev leaving slide has animationName ending with '${prevLeaveAnimName}' (got '${prevLeaveAnim}')`
                );

                // Inspect Web Animations API keyframes to verify physical displacement direction
                const prevEnterKf = await getKeyframeTransforms(prevEntering);
                const prevLeaveKf = await getKeyframeTransforms(prevLeaving);
                const expectedPrevEnterStartSign = !isRtl ? "negative" : "positive";
                const expectedPrevLeaveEndSign = !isRtl ? "positive" : "negative";

                assert(
                    parseTranslateXSign(prevEnterKf.startTransform) === expectedPrevEnterStartSign,
                    `[${scenario.name}] Prev entering slide keyframe start transform must be ${expectedPrevEnterStartSign} (got '${prevEnterKf.startTransform}')`
                );
                assert(
                    parseTranslateXSign(prevEnterKf.endTransform) === "zero",
                    `[${scenario.name}] Prev entering slide keyframe end transform must be zero (got '${prevEnterKf.endTransform}')`
                );
                assert(
                    parseTranslateXSign(prevLeaveKf.startTransform) === "zero",
                    `[${scenario.name}] Prev leaving slide keyframe start transform must be zero (got '${prevLeaveKf.startTransform}')`
                );
                assert(
                    parseTranslateXSign(prevLeaveKf.endTransform) === expectedPrevLeaveEndSign,
                    `[${scenario.name}] Prev leaving slide keyframe end transform must be ${expectedPrevLeaveEndSign} (got '${prevLeaveKf.endTransform}')`
                );

                // Await completion of the 500ms animation and subsequent DOM detachment
                await prevLeaving.waitFor({ state: "detached", timeout: 2000 });

                const activeSlideBack = scrollView.locator('li[role="group"]');
                const backSlideText = (await activeSlideBack.first().textContent())?.trim();
                assert(
                    backSlideText === initialSlideText,
                    `[${scenario.name}] Clicking Prev returns to initial slide ('${backSlideText}' vs '${initialSlideText}')`
                );

                console.log(`    [PASS] ScrollView navigation arrows, overflowing pager, continuous scroll, keyframe direction & slide transitions verified\n`);
            }
        }

        // 7. Dynamic dir mutation verification
        console.log("--> Testing Dynamic dir mutation (#fixture-dynamic-dir)");
        const dynamicSection = page.locator("section#fixture-dynamic-dir");
        await dynamicSection.scrollIntoViewIfNeeded();

        const dynLayout = dynamicSection.locator('[data-testid="docked-layout-dynamic"]');
        const dynLayoutBox = await dynLayout.boundingBox();
        assert(dynLayoutBox !== null, "Dynamic layout box available");

        const dynStart = dynamicSection.locator('[data-testid="docked-sidebar-start-dynamic"]');
        const dynEnd = dynamicSection.locator('[data-testid="docked-sidebar-end-dynamic"]');

        // Initial: LTR
        let dStartBox = await dynStart.boundingBox();
        let dEndBox = await dynEnd.boundingBox();
        assert(dStartBox !== null && dEndBox !== null, "Dynamic start/end boxes");
        assert(Math.abs(dStartBox.x - dynLayoutBox.x) <= 4, "Initial dynamic LTR: start sidebar is on physical LEFT");
        assert(Math.abs(dEndBox.x + dEndBox.width - (dynLayoutBox.x + dynLayoutBox.width)) <= 4, "Initial dynamic LTR: end sidebar is on physical RIGHT");

        // Mutate dir to RTL
        await page.click('[data-testid="set-dynamic-rtl"]');
        await page.waitForTimeout(300);

        let dynCurrentLayoutBox = await dynLayout.boundingBox();
        dStartBox = await dynStart.boundingBox();
        dEndBox = await dynEnd.boundingBox();
        assert(dynCurrentLayoutBox !== null && dStartBox !== null && dEndBox !== null, "Dynamic boxes after RTL mutation");
        assert(Math.abs(dStartBox.x + dStartBox.width - (dynCurrentLayoutBox.x + dynCurrentLayoutBox.width)) <= 4, "After dynamic RTL mutation: start sidebar moved to physical RIGHT");
        assert(Math.abs(dEndBox.x - dynCurrentLayoutBox.x) <= 4, "After dynamic RTL mutation: end sidebar moved to physical LEFT");

        // Mutate dir back to LTR
        await page.click('[data-testid="set-dynamic-ltr"]');
        await page.waitForTimeout(300);

        dynCurrentLayoutBox = await dynLayout.boundingBox();
        dStartBox = await dynStart.boundingBox();
        dEndBox = await dynEnd.boundingBox();
        assert(dynCurrentLayoutBox !== null && dStartBox !== null && dEndBox !== null, "Dynamic boxes after LTR return");
        assert(Math.abs(dStartBox.x - dynCurrentLayoutBox.x) <= 4, "After returning to LTR: start sidebar returned to physical LEFT");
        assert(Math.abs(dEndBox.x + dEndBox.width - (dynCurrentLayoutBox.x + dynCurrentLayoutBox.width)) <= 4, "After returning to LTR: end sidebar returned to physical RIGHT");

        console.log("    [PASS] Dynamic dir mutation reactive layout updates verified\n");

        // 8. Dynamic CSS-only Ancestor Class Toggle (#fixture-dynamic-css)
        console.log("--> Testing Dynamic CSS-only Ancestor Class Toggle (#fixture-dynamic-css)");
        const dynamicCssSection = page.locator("section#fixture-dynamic-css");
        await dynamicCssSection.scrollIntoViewIfNeeded();

        const cssLayout = dynamicCssSection.locator('[data-testid="docked-layout-dynamic-css"]');
        const cssLayoutBox = await cssLayout.boundingBox();
        assert(cssLayoutBox !== null, "CSS Dynamic layout box available");

        const cssStart = dynamicCssSection.locator('[data-testid="docked-sidebar-start-dynamic-css"]');
        const cssEnd = dynamicCssSection.locator('[data-testid="docked-sidebar-end-dynamic-css"]');

        // Initial: LTR CSS, start on physical left
        let cssStartBox = await cssStart.boundingBox();
        let cssEndBox = await cssEnd.boundingBox();
        assert(cssStartBox !== null && cssEndBox !== null, "CSS Dynamic start/end boxes");
        assert(Math.abs(cssStartBox.x - cssLayoutBox.x) <= 4, "Initial dynamic CSS LTR: start sidebar on physical LEFT");
        assert(Math.abs(cssEndBox.x + cssEndBox.width - (cssLayoutBox.x + cssLayoutBox.width)) <= 4, "Initial dynamic CSS LTR: end sidebar on physical RIGHT");
        const initialCssClasses = (await cssLayout.getAttribute("class")) || "";
        assert(!initialCssClasses.includes("flex-row-reverse"), "Initial dynamic CSS LTR: layout does not have flex-row-reverse");

        // Toggle ancestor class to .direction-rtl
        await page.click('[data-testid="set-css-rtl"]');
        await page.waitForTimeout(300);

        let cssCurrentLayoutBox = await cssLayout.boundingBox();
        cssStartBox = await cssStart.boundingBox();
        cssEndBox = await cssEnd.boundingBox();
        assert(cssCurrentLayoutBox !== null && cssStartBox !== null && cssEndBox !== null, "Boxes after CSS RTL class toggle");
        const rtlCssClasses = (await cssLayout.getAttribute("class")) || "";
        assert(rtlCssClasses.includes("flex-row-reverse"), "After CSS RTL class toggle: layout compensated with flex-row-reverse");
        // Start sidebar remains physically anchored on the LEFT edge because semantic direction is LTR
        assert(Math.abs(cssStartBox.x - cssCurrentLayoutBox.x) <= 4, "After CSS RTL class toggle: start sidebar remains on physical LEFT");
        assert(Math.abs(cssEndBox.x + cssEndBox.width - (cssCurrentLayoutBox.x + cssCurrentLayoutBox.width)) <= 4, "After CSS RTL class toggle: end sidebar remains on physical RIGHT");

        // Toggle ancestor class back to LTR
        await page.click('[data-testid="set-css-ltr"]');
        await page.waitForTimeout(300);

        cssCurrentLayoutBox = await cssLayout.boundingBox();
        cssStartBox = await cssStart.boundingBox();
        cssEndBox = await cssEnd.boundingBox();
        assert(cssCurrentLayoutBox !== null && cssStartBox !== null && cssEndBox !== null, "Boxes after CSS LTR class return");
        const backCssClasses = (await cssLayout.getAttribute("class")) || "";
        assert(!backCssClasses.includes("flex-row-reverse"), "After returning to CSS LTR: layout returned to flex-row");
        assert(Math.abs(cssStartBox.x - cssCurrentLayoutBox.x) <= 4, "After returning to CSS LTR: start sidebar remains on physical LEFT");
        console.log("    [PASS] Dynamic CSS ancestor class toggle reactive compensation verified\n");

        // 9. Dynamic Viewport Responsive Media Query Direction (#fixture-responsive-css)
        console.log("--> Testing Dynamic Viewport Responsive CSS (#fixture-responsive-css)");
        const responsiveSection = page.locator("section#fixture-responsive-css");
        await responsiveSection.scrollIntoViewIfNeeded();

        const respLayout = responsiveSection.locator('[data-testid="docked-layout-responsive"]');
        const respLayoutBox = await respLayout.boundingBox();
        assert(respLayoutBox !== null, "Responsive layout box available");

        const respStart = responsiveSection.locator('[data-testid="docked-sidebar-start-responsive"]');
        const respEnd = responsiveSection.locator('[data-testid="docked-sidebar-end-responsive"]');

        // Initial wide viewport (1280px > 900px): LTR
        let rStartBox = await respStart.boundingBox();
        let rEndBox = await respEnd.boundingBox();
        assert(rStartBox !== null && rEndBox !== null, "Responsive start/end boxes");
        assert(Math.abs(rStartBox.x - respLayoutBox.x) <= 4, "Wide viewport: start sidebar on physical LEFT");
        assert(Math.abs(rEndBox.x + rEndBox.width - (respLayoutBox.x + respLayoutBox.width)) <= 4, "Wide viewport: end sidebar on physical RIGHT");
        const wideClasses = (await respLayout.getAttribute("class")) || "";
        assert(!wideClasses.includes("flex-row-reverse"), "Wide viewport: layout does not have flex-row-reverse");

        // Resize viewport to 800px (triggers @media (max-width: 900px) { direction: rtl })
        await page.setViewportSize({ width: 800, height: 800 });
        await page.waitForTimeout(300);

        let currentRespLayoutBox = await respLayout.boundingBox();
        rStartBox = await respStart.boundingBox();
        rEndBox = await respEnd.boundingBox();
        assert(currentRespLayoutBox !== null && rStartBox !== null && rEndBox !== null, "Boxes after narrow resize");
        const narrowClasses = (await respLayout.getAttribute("class")) || "";
        assert(narrowClasses.includes("flex-row-reverse"), "Narrow viewport (<900px): layout compensated with flex-row-reverse");
        assert(Math.abs(rStartBox.x - currentRespLayoutBox.x) <= 4, "Narrow viewport: start sidebar remains on physical LEFT");
        assert(Math.abs(rEndBox.x + rEndBox.width - (currentRespLayoutBox.x + currentRespLayoutBox.width)) <= 4, "Narrow viewport: end sidebar remains on physical RIGHT");

        // Restore viewport to 1280px
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.waitForTimeout(300);

        currentRespLayoutBox = await respLayout.boundingBox();
        rStartBox = await respStart.boundingBox();
        rEndBox = await respEnd.boundingBox();
        assert(currentRespLayoutBox !== null && rStartBox !== null && rEndBox !== null, "Boxes after wide restore");
        const restoredClasses = (await respLayout.getAttribute("class")) || "";
        assert(!restoredClasses.includes("flex-row-reverse"), "Restored wide viewport: layout returned to flex-row");
        assert(Math.abs(rStartBox.x - currentRespLayoutBox.x) <= 4, "Restored wide viewport: start sidebar on physical LEFT");
        console.log("    [PASS] Dynamic viewport responsive media query direction verified\n");

        // 10. Dynamic CSS-only Shadow DOM Ancestor Direction (#fixture-shadow-dom)
        console.log("--> Testing Dynamic CSS-Only Shadow DOM Ancestor Direction (#fixture-shadow-dom)");
        const shadowSection = page.locator("section#fixture-shadow-dom");
        await shadowSection.scrollIntoViewIfNeeded();

        const shadowLayout = shadowSection.locator('[data-testid="docked-layout-shadow"]');
        const shadowLayoutBox = await shadowLayout.boundingBox();
        assert(shadowLayoutBox !== null, "Shadow layout box available");

        const shadowStart = shadowSection.locator('[data-testid="docked-sidebar-start-shadow"]');
        const shadowEnd = shadowSection.locator('[data-testid="docked-sidebar-end-shadow"]');

        // Initial: Shadow LTR
        let sStartBox = await shadowStart.boundingBox();
        let sEndBox = await shadowEnd.boundingBox();
        assert(sStartBox !== null && sEndBox !== null, "Shadow start/end boxes");
        assert(Math.abs(sStartBox.x - shadowLayoutBox.x) <= 4, "Initial shadow LTR: start sidebar on physical LEFT");
        assert(Math.abs(sEndBox.x + sEndBox.width - (shadowLayoutBox.x + shadowLayoutBox.width)) <= 4, "Initial shadow LTR: end sidebar on physical RIGHT");
        const initialShadowClasses = (await shadowLayout.getAttribute("class")) || "";
        assert(!initialShadowClasses.includes("flex-row-reverse"), "Initial shadow LTR: layout does not have flex-row-reverse");

        // Mutate shadow ancestor direction to RTL
        await page.click('[data-testid="set-shadow-rtl"]');
        await page.waitForTimeout(300);

        let currentShadowLayoutBox = await shadowLayout.boundingBox();
        sStartBox = await shadowStart.boundingBox();
        sEndBox = await shadowEnd.boundingBox();
        assert(currentShadowLayoutBox !== null && sStartBox !== null && sEndBox !== null, "Boxes after shadow RTL mutation");
        const rtlShadowClasses = (await shadowLayout.getAttribute("class")) || "";
        assert(rtlShadowClasses.includes("flex-row-reverse"), "After shadow RTL mutation: shadow layout compensated with flex-row-reverse");
        assert(Math.abs(sStartBox.x - currentShadowLayoutBox.x) <= 4, "After shadow RTL mutation: start sidebar inside ShadowRoot remains on physical LEFT");
        assert(Math.abs(sEndBox.x + sEndBox.width - (currentShadowLayoutBox.x + currentShadowLayoutBox.width)) <= 4, "After shadow RTL mutation: end sidebar inside ShadowRoot remains on physical RIGHT");

        // Mutate shadow ancestor direction back to LTR
        await page.click('[data-testid="set-shadow-ltr"]');
        await page.waitForTimeout(300);

        currentShadowLayoutBox = await shadowLayout.boundingBox();
        sStartBox = await shadowStart.boundingBox();
        sEndBox = await shadowEnd.boundingBox();
        assert(currentShadowLayoutBox !== null && sStartBox !== null && sEndBox !== null, "Boxes after shadow LTR return");
        const backShadowClasses = (await shadowLayout.getAttribute("class")) || "";
        assert(!backShadowClasses.includes("flex-row-reverse"), "After returning to shadow LTR: shadow layout returned to flex-row");
        assert(Math.abs(sStartBox.x - currentShadowLayoutBox.x) <= 4, "After returning to shadow LTR: start sidebar remains on physical LEFT");
        console.log("    [PASS] Dynamic CSS-only Shadow DOM ancestor direction verified\n");

        // 11. ScrollView Animation Duration & prefers-reduced-motion Verification (#fixture-scroll-view-reduced-motion)
        console.log("--> Testing ScrollView Animation Duration & prefers-reduced-motion (#fixture-scroll-view-reduced-motion)");
        const reducedSection = page.locator("section#fixture-scroll-view-reduced-motion");
        await reducedSection.scrollIntoViewIfNeeded();

        const stdScrollView = reducedSection.locator('[data-testid="scroll-view-anim-standard"]');
        const customScrollView = reducedSection.locator('[data-testid="scroll-view-anim-custom"]');
        const disabledScrollView = reducedSection.locator('[data-testid="scroll-view-anim-disabled"]');
        const stdNextBtn = stdScrollView.locator('button[data-navigate-next="true"]');
        const customNextBtn = customScrollView.locator('button[data-navigate-next="true"]');
        const disabledNextBtn = disabledScrollView.locator('button[data-navigate-next="true"]');

        // Instrument stdScrollView pager scrollBy and scrollTo, and Element.prototype.scrollIntoView
        const stdPagerList = stdScrollView.locator("ul").nth(1);
        await stdPagerList.evaluate(el => {
            const list = el as HTMLElement & {
                __scrollByCalls?: Array<{ left: number; behavior?: string; type?: string }>;
                __scrollCalls?: Array<{ left: number; behavior?: string; type?: string }>;
            };
            list.__scrollByCalls = [];
            list.__scrollCalls = [];
            const originalScrollBy = list.scrollBy.bind(list);
            const originalScrollTo = list.scrollTo?.bind(list);

            list.scrollBy = function (options?: ScrollToOptions | number, y?: number) {
                const call =
                    typeof options === "object"
                        ? { left: options?.left ?? 0, behavior: options?.behavior, type: "scrollBy" }
                        : { left: options ?? 0, type: "scrollBy" };
                list.__scrollByCalls!.push(call);
                list.__scrollCalls!.push(call);
                return typeof options === "object"
                    ? originalScrollBy(options)
                    : originalScrollBy(options as number, y as number);
            };

            if (originalScrollTo) {
                list.scrollTo = function (options?: ScrollToOptions | number, y?: number) {
                    const call =
                        typeof options === "object"
                            ? { left: options?.left ?? 0, behavior: options?.behavior, type: "scrollTo" }
                            : { left: options ?? 0, type: "scrollTo" };
                    list.__scrollByCalls!.push(call);
                    list.__scrollCalls!.push(call);
                    return typeof options === "object"
                        ? originalScrollTo(options)
                        : originalScrollTo(options as number, y as number);
                };
            }
        });
        await page.evaluate(() => {
            (window as any).__scrollIntoViewCalls = [];
            const originalScrollIntoView = Element.prototype.scrollIntoView;
            Element.prototype.scrollIntoView = function (options?: boolean | ScrollIntoViewOptions) {
                if (typeof options === "object") {
                    (window as any).__scrollIntoViewCalls.push({
                        tag: this.tagName,
                        behavior: options.behavior
                    });
                }
                return originalScrollIntoView.call(this, options);
            };
        });

        const stdPagerNext = stdScrollView.locator('button[aria-label="Scroll pager next"]');

        // Helper to capture animationstart events and their computed animationDuration
        const captureAnimationDuration = async (
            trigger: () => Promise<void>,
            scrollViewLocator: Locator
        ): Promise<{ animationName: string; animationDuration: string; durationMs: number }> => {
            await scrollViewLocator.evaluate(host => {
                (host as any).__lastAnimData = undefined;
                host.addEventListener(
                    "animationstart",
                    e => {
                        const target = e.target as HTMLElement;
                        (host as any).__lastAnimData = {
                            name: (e as AnimationEvent).animationName,
                            duration: window.getComputedStyle(target).animationDuration
                        };
                    },
                    { once: true, capture: true }
                );
            });

            await trigger();
            await page.waitForTimeout(100);

            return await scrollViewLocator.evaluate(host => {
                const data = (host as any).__lastAnimData;
                if (!data) {
                    return { animationName: "", animationDuration: "", durationMs: -1 };
                }
                const durStr = String(data.duration);
                let ms = 0;
                if (durStr.endsWith("ms")) {
                    ms = parseFloat(durStr);
                } else if (durStr.endsWith("s")) {
                    ms = parseFloat(durStr) * 1000;
                }
                return { animationName: String(data.name), animationDuration: durStr, durationMs: ms };
            });
        };

        // Test 1: no-preference:
        // - animate=true -> ~500ms
        // - animate=false -> 0ms
        // - pager scrollBy -> behavior="smooth"
        // - scrollIntoView -> behavior="smooth"
        await page.emulateMedia({ reducedMotion: "no-preference" });
        const stdControl = await captureAnimationDuration(async () => {
            await stdNextBtn.click();
        }, stdScrollView);
        assert(
            Math.abs(stdControl.durationMs - 500) <= 20,
            `[Control: no-preference] Standard ScrollView computed animationDuration is ~500ms (got ${stdControl.animationDuration}, ${stdControl.durationMs}ms)`
        );
        await page.waitForTimeout(600); // allow slide animation to complete

        // Disabled fixture under no-preference remains 0ms
        await disabledNextBtn.click();
        await page.waitForTimeout(100);
        const disabledDurationNoPref = await disabledScrollView.evaluate(host => {
            const slide = host.querySelector("li[role='group']") as HTMLElement;
            const dur = window.getComputedStyle(slide).animationDuration;
            return dur.endsWith("ms") ? parseFloat(dur) : parseFloat(dur) * 1000;
        });
        assert(
            disabledDurationNoPref === 0,
            `[Control: no-preference] Disabled ScrollView (animate=false) animationDuration is 0ms (got ${disabledDurationNoPref}ms)`
        );

        // Test scrollBy and scrollIntoView behavior under no-preference
        await stdPagerNext.click();
        await page.waitForTimeout(150);
        const noPrefScrollBy = await stdPagerList.evaluate(el => (el as any).__scrollByCalls || []);
        assert(
            noPrefScrollBy.length > 0 && noPrefScrollBy[noPrefScrollBy.length - 1].behavior === "smooth",
            `[Control: no-preference] Pager scrollBy requests behavior='smooth' (got '${noPrefScrollBy[noPrefScrollBy.length - 1]?.behavior}')`
        );

        const dot5 = stdScrollView.locator('li[data-page-index="5"] button');
        await dot5.click();
        await page.waitForTimeout(200);
        const noPrefIntoView = await page.evaluate(() => (window as any).__scrollIntoViewCalls || []);
        assert(
            noPrefIntoView.length > 0 && noPrefIntoView[noPrefIntoView.length - 1].behavior === "smooth",
            `[Control: no-preference] scrollIntoView requests behavior='smooth' (got '${noPrefIntoView[noPrefIntoView.length - 1]?.behavior}')`
        );

        // Test 2: reduce:
        // - animate=true -> ~1ms
        // - animate=1200 -> ~1ms
        // - animate=false -> 0ms (capped at min(0ms, 1ms))
        // - pager scrollBy -> behavior="auto"
        // - scrollIntoView -> behavior="auto"
        await page.emulateMedia({ reducedMotion: "reduce" });
        const stdReduced = await captureAnimationDuration(async () => {
            await stdNextBtn.click();
        }, stdScrollView);
        assert(
            stdReduced.durationMs <= 5,
            `[Reduced Motion] Standard ScrollView (animate=true) computed animationDuration is overridden to ~1ms (got ${stdReduced.animationDuration}, ${stdReduced.durationMs}ms)`
        );
        await page.waitForTimeout(100);

        const customReduced = await captureAnimationDuration(async () => {
            await customNextBtn.click();
        }, customScrollView);
        assert(
            customReduced.durationMs <= 5,
            `[Reduced Motion] Custom ScrollView (animate=1200) computed animationDuration is overridden to ~1ms (got ${customReduced.animationDuration}, ${customReduced.durationMs}ms)`
        );
        await page.waitForTimeout(100);

        // Disabled fixture under reduced-motion remains 0ms (never increased to 1ms)
        await disabledNextBtn.click();
        await page.waitForTimeout(100);
        const disabledDurationReduce = await disabledScrollView.evaluate(host => {
            const slide = host.querySelector("li[role='group']") as HTMLElement;
            const dur = window.getComputedStyle(slide).animationDuration;
            return dur.endsWith("ms") ? parseFloat(dur) : parseFloat(dur) * 1000;
        });
        assert(
            disabledDurationReduce === 0,
            `[Reduced Motion] Disabled ScrollView (animate=false) remains 0ms under reduced-motion (got ${disabledDurationReduce}ms)`
        );

        await stdPagerList.evaluate(el => {
            (el as any).__scrollByCalls = [];
            (el as any).__scrollCalls = [];
        });
        await page.evaluate(() => { (window as any).__scrollIntoViewCalls = []; });

        await stdPagerNext.click();
        await page.waitForTimeout(150);
        const reduceScrollBy = await stdPagerList.evaluate(el => (el as any).__scrollByCalls || []);
        assert(
            reduceScrollBy.length > 0 && reduceScrollBy[reduceScrollBy.length - 1].behavior === "auto",
            `[Reduced Motion] Pager scrollBy requests behavior='auto' (got '${reduceScrollBy[reduceScrollBy.length - 1]?.behavior}')`
        );

        const dot12 = stdScrollView.locator('li[data-page-index="12"] button');
        await dot12.click();
        await page.waitForTimeout(200);
        const reduceIntoView = await page.evaluate(() => (window as any).__scrollIntoViewCalls || []);
        assert(
            reduceIntoView.length > 0 && reduceIntoView[reduceIntoView.length - 1].behavior === "auto",
            `[Reduced Motion] scrollIntoView requests behavior='auto' (got '${reduceIntoView[reduceIntoView.length - 1]?.behavior}')`
        );

        // Test 3: Restore no-preference on custom fixture -> ~1200ms control
        await page.emulateMedia({ reducedMotion: "no-preference" });
        const customControl = await captureAnimationDuration(async () => {
            await customNextBtn.click();
        }, customScrollView);
        assert(
            Math.abs(customControl.durationMs - 1200) <= 50,
            `[Control: no-preference] Custom ScrollView (animate=1200) computed animationDuration is ~1200ms outside reduced motion (got ${customControl.animationDuration}, ${customControl.durationMs}ms)`
        );
        await page.waitForTimeout(1300);

        console.log("    [PASS] ScrollView prefers-reduced-motion override, animationDuration contract & programmatic scrollBehavior verified\n");

        console.log("==================================================");
        console.log("  ALL BROWSER DIRECTION GEOMETRY TESTS PASSED!");
        console.log("==================================================\n");
    } finally {
        if (browser) {
            await browser.close();
        }
        server.close();
    }
}

runTests().catch(err => {
    console.error("Browser direction geometry test FAILED:", err);
    process.exit(1);
});
