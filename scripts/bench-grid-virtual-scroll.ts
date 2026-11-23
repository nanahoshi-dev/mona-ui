/**
 * Measures a virtual grid of 50,000 rows against a plain CDK virtual list, on the tester's
 * `/browser-test/grid-virtual-performance` page. Build the tester first (`npm run build:tester`), or pass
 * `--dist <folder>` for another build.
 *
 * Each scroll step sets `scrollTop`, then waits one animation frame and one macrotask; a data change clicks the
 * page's apply button and waits the same way. Times are medians, and `cpu` is the main thread's busy time per step
 * from the DevTools Performance metrics. `--profile <folder>` also saves CPU profiles of the grid and prints the
 * functions with the most self time.
 *
 *     npx tsx scripts/bench-grid-virtual-scroll.ts [--dist <folder>] [--profile <folder>] [--json <file>]
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, resolve } from "node:path";
import { chromium, type CDPSession, type Page } from "playwright/test";

type Mode = "cdk" | "grid";

interface ProfileNode {
    readonly callFrame: {
        readonly columnNumber: number;
        readonly functionName: string;
        readonly lineNumber: number;
        readonly url: string;
    };
    readonly hitCount?: number;
    readonly id: number;
}

interface Profile {
    readonly endTime: number;
    readonly nodes: readonly ProfileNode[];
    readonly samples?: readonly number[];
    readonly startTime: number;
}

interface Timing {
    readonly cpu: number;
    readonly median: number;
    readonly p95: number;
}

const args = process.argv.slice(2);
const option = (name: string): string | null => {
    const index = args.indexOf(name);
    return index === -1 ? null : (args[index + 1] ?? null);
};
const dist = resolve(option("--dist") ?? "dist/mona-ui-tester/browser");
const profileFolder = option("--profile");
const jsonFile = option("--json");
const SCROLL_STEPS = [280, 1_200, 9_000];
const STEPS_PER_SIZE = 40;
const REPLACE_RUNS = 10;
const APPEND_BATCHES = 50;

const mime = new Map([
    [".html", "text/html"],
    [".js", "application/javascript"],
    [".css", "text/css"],
    [".json", "application/json"],
    [".svg", "image/svg+xml"],
    [".woff2", "font/woff2"]
]);
const server = createServer((request, response) => {
    const path = join(dist, (request.url ?? "/").split("?")[0]);
    const file = existsSync(path) && !statSync(path).isDirectory() ? path : join(dist, "index.html");
    response.writeHead(200, { "Content-Type": mime.get(extname(file)) ?? "application/octet-stream" });
    response.end(
        extname(file) === ".html"
            ? readFileSync(file, "utf8").replaceAll('media="print"', 'media="all"')
            : readFileSync(file)
    );
});

function percentile(values: readonly number[], fraction: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
}

function round(value: number): number {
    return Math.round(value * 10) / 10;
}

async function taskSeconds(cdp: CDPSession): Promise<number> {
    const { metrics } = await cdp.send("Performance.getMetrics");
    return metrics.find(metric => metric.name === "TaskDuration")?.value ?? 0;
}

async function waitFrames(page: Page, frames: number): Promise<void> {
    for (let frame = 0; frame < frames; frame++) {
        await page.evaluate(() => new Promise(done => requestAnimationFrame(() => setTimeout(done, 0))));
    }
}

/** Times `count` runs of `act`, each waiting one frame and one macrotask after its action. */
async function timeSteps(
    page: Page,
    cdp: CDPSession,
    count: number,
    act: (page: Page) => Promise<number>
): Promise<Timing> {
    const times: number[] = [];
    const before = await taskSeconds(cdp);
    for (let run = 0; run < count; run++) {
        times.push(await act(page));
    }
    await page.waitForTimeout(300);
    const cpu = ((await taskSeconds(cdp)) - before) * 1000;
    return { cpu: round(cpu / count), median: round(percentile(times, 0.5)), p95: round(percentile(times, 0.95)) };
}

function viewportSelector(mode: Mode): string {
    return mode === "grid" ? "mona-grid cdk-virtual-scroll-viewport" : "[data-bench-viewport]";
}

function rowSelector(mode: Mode): string {
    return mode === "grid"
        ? "tbody tr[monaGridRow]"
        : "[data-bench-viewport] .cdk-virtual-scroll-content-wrapper > div";
}

async function scrollStep(page: Page, mode: Mode, step: number): Promise<number> {
    return page.evaluate(
        ({ selector, step }) => {
            const viewport = document.querySelector<HTMLElement>(selector);
            if (viewport == null) {
                throw new Error(`No viewport ${selector}`);
            }
            const start = performance.now();
            viewport.scrollTop += step;
            return new Promise<number>(done =>
                requestAnimationFrame(() => setTimeout(() => done(performance.now() - start), 0))
            );
        },
        { selector: viewportSelector(mode), step }
    );
}

async function click(page: Page, name: string): Promise<void> {
    await page.evaluate(bench => document.querySelector<HTMLElement>(`[data-bench='${bench}']`)?.click(), name);
}

async function applyStep(page: Page): Promise<number> {
    return page.evaluate(() => {
        const button = document.querySelector<HTMLElement>("[data-bench='apply']");
        if (button == null) {
            throw new Error("No apply button");
        }
        const start = performance.now();
        button.click();
        return new Promise<number>(done =>
            requestAnimationFrame(() => setTimeout(() => done(performance.now() - start), 0))
        );
    });
}

async function rowCount(page: Page, mode: Mode): Promise<number> {
    return page.locator(rowSelector(mode)).count();
}

async function startProfile(cdp: CDPSession): Promise<void> {
    await cdp.send("Profiler.enable");
    await cdp.send("Profiler.setSamplingInterval", { interval: 100 });
    await cdp.send("Profiler.start");
}

async function stopProfile(cdp: CDPSession, name: string): Promise<void> {
    const { profile } = (await cdp.send("Profiler.stop")) as unknown as { profile: Profile };
    if (profileFolder == null) {
        return;
    }
    mkdirSync(profileFolder, { recursive: true });
    writeFileSync(join(profileFolder, `${name}.cpuprofile`), JSON.stringify(profile));
    const sampleCount = profile.samples?.length ?? 0;
    const interval = sampleCount === 0 ? 0 : (profile.endTime - profile.startTime) / sampleCount / 1000;
    const selfTime = new Map<string, number>();
    for (const node of profile.nodes) {
        const frame = node.callFrame;
        const file = frame.url.split("/").pop() ?? "";
        const key = `${frame.functionName || "(anonymous)"} ${file}:${frame.lineNumber + 1}:${frame.columnNumber + 1}`;
        selfTime.set(key, (selfTime.get(key) ?? 0) + (node.hitCount ?? 0) * interval);
    }
    const total = [...selfTime.values()].reduce((sum, value) => sum + value, 0);
    console.log(`\nTop self time, ${name} (${round(total)} ms sampled):`);
    for (const [key, time] of [...selfTime.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)) {
        console.log(`  ${String(round(time)).padStart(8)} ms  ${key}`);
    }
}

async function measure(page: Page, mode: Mode): Promise<Record<string, unknown>> {
    const port = (server.address() as AddressInfo).port;
    await page.goto(`http://127.0.0.1:${port}/browser-test/grid-virtual-performance?mode=${mode}`, {
        waitUntil: "networkidle"
    });
    await page.locator("[data-bench-count]").filter({ hasText: "50000" }).waitFor();
    await page.locator(rowSelector(mode)).first().waitFor();
    await waitFrames(page, 10);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Performance.enable");
    const viewportHeight = await page.locator(viewportSelector(mode)).evaluate(element => element.clientHeight);
    const result: Record<string, unknown> = { mode, viewportHeight, rowsAtRest: await rowCount(page, mode) };

    for (const step of SCROLL_STEPS) {
        await page.locator(viewportSelector(mode)).evaluate(element => (element.scrollTop = 0));
        await waitFrames(page, 5);
        // Warm the step's code paths before timing them.
        for (let warm = 0; warm < 5; warm++) {
            await scrollStep(page, mode, step);
        }
        await page.locator(viewportSelector(mode)).evaluate(element => (element.scrollTop = 0));
        await waitFrames(page, 5);
        const profiled = mode === "grid" && profileFolder != null;
        if (profiled) {
            await startProfile(cdp);
        }
        let maxRows = 0;
        result[`scroll${step}`] = await timeSteps(page, cdp, STEPS_PER_SIZE, async current => {
            const time = await scrollStep(current, mode, step);
            maxRows = Math.max(maxRows, await rowCount(current, mode));
            return time;
        });
        result[`rowsScrolling${step}`] = maxRows;
        if (profiled) {
            await stopProfile(cdp, `grid-scroll-${step}`);
        }
    }

    await page.locator(viewportSelector(mode)).evaluate(element => (element.scrollTop = 0));
    await waitFrames(page, 5);
    if (mode === "grid" && profileFolder != null) {
        await startProfile(cdp);
    }
    const replaceTimes: number[] = [];
    let replaceCpu = 0;
    for (let run = 0; run < REPLACE_RUNS; run++) {
        await click(page, "prepare-replace");
        await waitFrames(page, 2);
        const before = await taskSeconds(cdp);
        replaceTimes.push(await applyStep(page));
        await page.waitForTimeout(200);
        replaceCpu += (await taskSeconds(cdp)) - before;
    }
    if (mode === "grid" && profileFolder != null) {
        await stopProfile(cdp, "grid-replace-50000");
    }
    result["replace50000"] = {
        cpu: round((replaceCpu * 1000) / REPLACE_RUNS),
        median: round(percentile(replaceTimes, 0.5)),
        p95: round(percentile(replaceTimes, 0.95))
    };

    await click(page, "prepare-clear");
    await applyStep(page);
    await waitFrames(page, 5);
    const appendTimes: number[] = [];
    const appendCpu: number[] = [];
    for (let batch = 0; batch < APPEND_BATCHES; batch++) {
        const profiled = mode === "grid" && profileFolder != null && batch >= APPEND_BATCHES - 5;
        await click(page, "prepare-append");
        await waitFrames(page, 2);
        if (profiled && batch === APPEND_BATCHES - 5) {
            await startProfile(cdp);
        }
        const before = await taskSeconds(cdp);
        appendTimes.push(await applyStep(page));
        await page.waitForTimeout(150);
        appendCpu.push(((await taskSeconds(cdp)) - before) * 1000);
    }
    if (mode === "grid" && profileFolder != null) {
        await stopProfile(cdp, "grid-append-at-50000");
    }
    const firstFive = appendTimes.slice(0, 5);
    const lastFive = appendTimes.slice(-5);
    result["appendAt1000to5000"] = {
        cpu: round(percentile(appendCpu.slice(0, 5), 0.5)),
        median: round(percentile(firstFive, 0.5))
    };
    result["appendAt46000to50000"] = {
        cpu: round(percentile(appendCpu.slice(-5), 0.5)),
        median: round(percentile(lastFive, 0.5))
    };
    await cdp.detach();
    return result;
}

async function main(): Promise<void> {
    if (!existsSync(join(dist, "index.html"))) {
        throw new Error(`No tester build in ${dist}. Run npm run build:tester, or pass --dist.`);
    }
    await new Promise<void>(done => server.listen(0, "127.0.0.1", done));
    const browser = await chromium.launch({ headless: true });
    try {
        const results: Record<string, unknown>[] = [];
        for (const mode of ["grid", "cdk"] as const) {
            const page = await browser.newPage({ viewport: { width: 1280, height: 1300 } });
            await page.route("https://**", route => route.abort());
            page.on("pageerror", error => console.error(`Page error (${mode}): ${error.message}`));
            results.push(await measure(page, mode));
            await page.close();
        }
        console.log(JSON.stringify(results, null, 2));
        if (jsonFile != null) {
            writeFileSync(jsonFile, JSON.stringify(results, null, 2));
        }
    } finally {
        await browser.close();
        server.close();
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
