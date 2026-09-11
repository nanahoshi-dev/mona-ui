import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, resolve } from "node:path";
import { chromium, type Browser } from "playwright";

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

                // Label-to-tick alignment for first and last
                const firstTickCenter = firstTickBox.x + firstTickBox.width / 2;
                const firstLabelCenter = firstLabelBox.x + firstLabelBox.width / 2;
                assert(
                    Math.abs(firstLabelCenter - firstTickCenter) <= 12,
                    `[${scenario.name}] First label center aligns with first tick center`
                );

                // Pointer click mapping at ~20% and ~80% physical track positions
                const click20X = sliderBox.x + 0.2 * sliderBox.width;
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

                // Keyboard arrow navigation
                await page.click(`[data-testid="set-slider-${scenario.suffix}-50"]`);
                await page.waitForTimeout(50);
                await handle.focus();

                if (!isRtl) {
                    await page.keyboard.press("ArrowRight");
                    await page.waitForTimeout(50);
                    const vUp = Number(await handle.getAttribute("aria-valuenow"));
                    assert(vUp > 50, `[${scenario.name}] LTR ArrowRight increases value (got ${vUp})`);

                    await page.keyboard.press("ArrowLeft");
                    await page.waitForTimeout(50);
                    const vDown = Number(await handle.getAttribute("aria-valuenow"));
                    assert(vDown <= 50, `[${scenario.name}] LTR ArrowLeft decreases value (got ${vDown})`);
                } else {
                    await page.keyboard.press("ArrowLeft");
                    await page.waitForTimeout(50);
                    const vUp = Number(await handle.getAttribute("aria-valuenow"));
                    assert(vUp > 50, `[${scenario.name}] RTL ArrowLeft increases value (got ${vUp})`);

                    await page.keyboard.press("ArrowRight");
                    await page.waitForTimeout(50);
                    const vDown = Number(await handle.getAttribute("aria-valuenow"));
                    assert(vDown <= 50, `[${scenario.name}] RTL ArrowRight decreases value (got ${vDown})`);
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
                    // Interior borders
                    const startClasses = (await startSidebar.getAttribute("class")) || "";
                    const endClasses = (await endSidebar.getAttribute("class")) || "";
                    assert(startClasses.includes("border-r"), `[${scenario.name}] Start sidebar has interior border-r`);
                    assert(endClasses.includes("border-l"), `[${scenario.name}] End sidebar has interior border-l`);
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
                    // Interior borders
                    const startClasses = (await startSidebar.getAttribute("class")) || "";
                    const endClasses = (await endSidebar.getAttribute("class")) || "";
                    assert(startClasses.includes("border-l"), `[${scenario.name}] Start sidebar has interior border-l`);
                    assert(endClasses.includes("border-r"), `[${scenario.name}] End sidebar has interior border-r`);
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

                // Chevron icon rotation
                const prevIcon = prevBtn.locator("svg");
                const nextIcon = nextBtn.locator("svg");
                assert((await prevIcon.count()) === 1 && (await nextIcon.count()) === 1, "Arrow icons exist");

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

                // Pager arrow controls rendered
                const pagerPrevArrow = scrollView.locator('button[aria-label="Scroll pager previous"]');
                const pagerNextArrow = scrollView.locator('button[aria-label="Scroll pager next"]');
                assert(
                    (await pagerPrevArrow.count()) === 1 && (await pagerNextArrow.count()) === 1,
                    `[${scenario.name}] Pager navigation arrows are rendered when overflowing`
                );

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

                // Continuous mousedown scroll on pager Next arrow
                const p0BeforeContinuous = (await p0.boundingBox())!.x;
                await pagerNextArrow.dispatchEvent("mousedown");
                await page.waitForTimeout(350);
                await page.mouse.up();
                await page.waitForTimeout(100);
                const p0AfterContinuous = (await p0.boundingBox())!.x;
                if (!isRtl) {
                    assert(p0AfterContinuous < p0BeforeContinuous, `[${scenario.name}] LTR continuous scroll moved content further left`);
                } else {
                    assert(p0AfterContinuous > p0BeforeContinuous, `[${scenario.name}] RTL continuous scroll moved content further right`);
                }

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

                console.log(`    [PASS] ScrollView navigation arrows, overflowing pager & continuous scroll verified\n`);
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
