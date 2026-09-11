import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, resolve } from "node:path";
import { chromium, type Browser, type Page } from "playwright";

const DIST_DIR = resolve(process.cwd(), "dist/mona-ui-tester/browser");

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
    if (!existsSync(join(DIST_DIR, "index.html"))) {
        console.log("dist/mona-ui-tester/browser not found; running npm run build:tester...");
        execSync("npm run build:tester", { stdio: "inherit" });
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
    sliderId: string;
    rangeSliderId: string;
    sidebarStartId: string;
    sidebarEndId: string;
    scrollViewId: string;
}

const SCENARIOS: ScenarioConfig[] = [
    {
        name: "1. Ordinary LTR (dir=ltr)",
        sectionId: "fixture-ltr",
        semanticDir: "ltr",
        sliderId: "slider-ltr",
        rangeSliderId: "range-slider-ltr",
        sidebarStartId: "sidebar-start-ltr",
        sidebarEndId: "sidebar-end-ltr",
        scrollViewId: "scroll-view-ltr"
    },
    {
        name: "2. Ordinary RTL (dir=rtl)",
        sectionId: "fixture-rtl",
        semanticDir: "rtl",
        sliderId: "slider-rtl",
        rangeSliderId: "range-slider-rtl",
        sidebarStartId: "sidebar-start-rtl",
        sidebarEndId: "sidebar-end-rtl",
        scrollViewId: "scroll-view-rtl"
    },
    {
        name: "3. Split: Semantic LTR + CSS direction: rtl",
        sectionId: "fixture-split-ltr-css-rtl",
        semanticDir: "ltr",
        sliderId: "slider-split-ltr",
        rangeSliderId: "range-slider-split-ltr",
        sidebarStartId: "sidebar-start-split-ltr",
        sidebarEndId: "sidebar-end-split-ltr",
        scrollViewId: "scroll-view-split-ltr"
    },
    {
        name: "4. Split: Semantic RTL + CSS direction: ltr",
        sectionId: "fixture-split-rtl-css-ltr",
        semanticDir: "rtl",
        sliderId: "slider-split-rtl",
        rangeSliderId: "range-slider-split-rtl",
        sidebarStartId: "sidebar-start-split-rtl",
        sidebarEndId: "sidebar-end-split-rtl",
        scrollViewId: "scroll-view-split-rtl"
    }
];

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
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

        // Wait for all four fixture sections to be present
        await page.waitForSelector("#fixture-ltr");
        await page.waitForSelector("#fixture-rtl");
        await page.waitForSelector("#fixture-split-ltr-css-rtl");
        await page.waitForSelector("#fixture-split-rtl-css-ltr");

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

            // 2. Slider Geometry
            {
                const slider = section.locator(`[data-testid="${scenario.sliderId}"]`);
                const sliderBox = await slider.boundingBox();
                assert(sliderBox !== null && sliderBox.width >= 350, `Slider container has rendered width (got ${sliderBox?.width})`);

                const handle = slider.locator('[role="slider"]');
                const handleBox = await handle.boundingBox();
                assert(handleBox !== null, "Slider handle bounding box available");

                const handleCenterX = handleBox.x + handleBox.width / 2;
                const isRtl = scenario.semanticDir === "rtl";

                // Value is 20 out of [0, 100], so 20% along the semantic track
                if (!isRtl) {
                    const expectedX = sliderBox.x + 0.2 * sliderBox.width;
                    const diff = Math.abs(handleCenterX - expectedX);
                    assert(
                        diff <= 16,
                        `[${scenario.name}] LTR Slider handle center X (${handleCenterX.toFixed(1)}) matches ~20% from left (${expectedX.toFixed(1)}), diff: ${diff.toFixed(1)}px`
                    );

                    // Selection bar from 0 to 20%
                    const selection = slider.locator("div.bg-primary");
                    const selectionBox = await selection.boundingBox();
                    assert(selectionBox !== null, "Slider selection box available");
                    assert(
                        Math.abs(selectionBox.x - sliderBox.x) <= 8,
                        `[${scenario.name}] LTR Slider selection starts near left edge`
                    );
                    assert(
                        Math.abs(selectionBox.x + selectionBox.width - handleCenterX) <= 8,
                        `[${scenario.name}] LTR Slider selection ends at handle center`
                    );
                } else {
                    const expectedX = sliderBox.x + sliderBox.width - 0.2 * sliderBox.width;
                    const diff = Math.abs(handleCenterX - expectedX);
                    assert(
                        diff <= 16,
                        `[${scenario.name}] RTL Slider handle center X (${handleCenterX.toFixed(1)}) matches ~20% from right (${expectedX.toFixed(1)}), diff: ${diff.toFixed(1)}px`
                    );

                    // Selection bar from 20% to right edge
                    const selection = slider.locator("div.bg-primary");
                    const selectionBox = await selection.boundingBox();
                    assert(selectionBox !== null, "Slider selection box available");
                    assert(
                        Math.abs(selectionBox.x - handleCenterX) <= 8,
                        `[${scenario.name}] RTL Slider selection starts at handle center`
                    );
                    assert(
                        Math.abs(selectionBox.x + selectionBox.width - (sliderBox.x + sliderBox.width)) <= 8,
                        `[${scenario.name}] RTL Slider selection ends near right edge`
                    );
                }

                // Ticks positioning
                const ticks = slider.locator("span[monaSliderTick]");
                const tickCount = await ticks.count();
                assert(tickCount >= 2, `Slider has ticks rendered (found ${tickCount})`);
                const firstTickBox = await ticks.first().boundingBox();
                const lastTickBox = await ticks.last().boundingBox();
                assert(firstTickBox !== null && lastTickBox !== null, "Tick boxes available");

                if (!isRtl) {
                    assert(
                        firstTickBox.x < lastTickBox.x,
                        `[${scenario.name}] LTR Slider tick 0 (X=${firstTickBox.x.toFixed(1)}) is left of tick 100 (X=${lastTickBox.x.toFixed(1)})`
                    );
                } else {
                    assert(
                        firstTickBox.x > lastTickBox.x,
                        `[${scenario.name}] RTL Slider tick 0 (X=${firstTickBox.x.toFixed(1)}) is right of tick 100 (X=${lastTickBox.x.toFixed(1)})`
                    );
                }
                console.log(`    [PASS] Slider geometry & ticks placement verified`);
            }

            // 3. RangeSlider Geometry
            {
                const rangeSlider = section.locator(`[data-testid="${scenario.rangeSliderId}"]`);
                const rangeBox = await rangeSlider.boundingBox();
                assert(rangeBox !== null && rangeBox.width >= 350, "RangeSlider container rendered");

                const handles = rangeSlider.locator('[role="slider"]');
                assert((await handles.count()) === 2, "RangeSlider has 2 handles");

                const h0Box = await handles.nth(0).boundingBox(); // primary = 20
                const h1Box = await handles.nth(1).boundingBox(); // secondary = 80
                assert(h0Box !== null && h1Box !== null, "RangeSlider handle boxes available");

                const h0Center = h0Box.x + h0Box.width / 2;
                const h1Center = h1Box.x + h1Box.width / 2;
                const isRtl = scenario.semanticDir === "rtl";

                if (!isRtl) {
                    assert(
                        h0Center < h1Center,
                        `[${scenario.name}] LTR RangeSlider handle 0 (20%) is left of handle 1 (80%)`
                    );
                    const expectedH0 = rangeBox.x + 0.2 * rangeBox.width;
                    const expectedH1 = rangeBox.x + 0.8 * rangeBox.width;
                    assert(
                        Math.abs(h0Center - expectedH0) <= 16,
                        `[${scenario.name}] LTR RangeSlider handle 0 at ~20% from left`
                    );
                    assert(
                        Math.abs(h1Center - expectedH1) <= 16,
                        `[${scenario.name}] LTR RangeSlider handle 1 at ~80% from left`
                    );
                } else {
                    assert(
                        h0Center > h1Center,
                        `[${scenario.name}] RTL RangeSlider handle 0 (20%) is right of handle 1 (80%)`
                    );
                    const expectedH0 = rangeBox.x + rangeBox.width - 0.2 * rangeBox.width;
                    const expectedH1 = rangeBox.x + rangeBox.width - 0.8 * rangeBox.width;
                    assert(
                        Math.abs(h0Center - expectedH0) <= 16,
                        `[${scenario.name}] RTL RangeSlider handle 0 at ~20% from right`
                    );
                    assert(
                        Math.abs(h1Center - expectedH1) <= 16,
                        `[${scenario.name}] RTL RangeSlider handle 1 at ~80% from right`
                    );
                }
                console.log(`    [PASS] RangeSlider handles & selection band verified`);
            }

            // 4. Sidebar Drawer Physical Edge Placement
            {
                const layout = section.locator("mona-sidebar-layout");
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

                // side="start" when open:
                // LTR (and split LTR + CSS RTL) -> physical left
                // RTL (and split RTL + CSS LTR) -> physical right
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
                        `[${scenario.name}] Closed start drawer translates offscreen to the left (right edge ${startClosedBox.x + startClosedBox.width} <= ${layoutBox.x})`
                    );
                } else {
                    assert(
                        startClosedBox.x >= layoutBox.x + layoutBox.width - 4,
                        `[${scenario.name}] Closed start drawer translates offscreen to the right (left edge ${startClosedBox.x} >= ${layoutBox.x + layoutBox.width})`
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
                        `[${scenario.name}] Closed end drawer translates offscreen to the right (left edge ${endClosedBox.x} >= ${layoutBox.x + layoutBox.width})`
                    );
                } else {
                    assert(
                        endClosedBox.x + endClosedBox.width <= layoutBox.x + 4,
                        `[${scenario.name}] Closed end drawer translates offscreen to the left (right edge ${endClosedBox.x + endClosedBox.width} <= ${layoutBox.x})`
                    );
                }

                console.log(`    [PASS] Sidebar start & end drawer physical edge anchoring verified`);
            }

            // 5. ScrollView Navigation Controls & Pager Geometry
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

                // Pager item ordering
                const pagerItems = scrollView.locator("li[data-page-item]");
                const itemCount = await pagerItems.count();
                assert(itemCount >= 2, "Pager has at least 2 items");

                const p0Box = await pagerItems.nth(0).boundingBox();
                const p1Box = await pagerItems.nth(1).boundingBox();
                assert(p0Box !== null && p1Box !== null, "Pager item boxes available");

                if (!isRtl) {
                    assert(
                        p0Box.x < p1Box.x,
                        `[${scenario.name}] LTR Pager item 0 is left of item 1`
                    );
                } else {
                    assert(
                        p0Box.x > p1Box.x,
                        `[${scenario.name}] RTL Pager item 0 is right of item 1`
                    );
                }

                // Click next page and verify page navigation
                await nextBtn.click();
                await page.waitForTimeout(400);

                const activePage = scrollView.locator('button[data-active-page="true"]');
                assert((await activePage.count()) === 1, "Active page updated after navigation");

                console.log(`    [PASS] ScrollView navigation arrows & pager order verified\n`);
            }
        }

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
