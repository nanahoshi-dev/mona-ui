import { readFileSync, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { extname, join, resolve } from "node:path";
import type { AddressInfo } from "node:net";
import { chromium, expect, type Locator } from "playwright/test";

const dist = resolve("dist/mona-ui-tester/browser");
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
    // Apply the built CSS before Angular measures columns, even when external font imports are blocked.
    response.end(
        extname(file) === ".html"
            ? readFileSync(file, "utf8").replaceAll('media="print"', 'media="all"')
            : readFileSync(file)
    );
});

async function box(locator: Locator) {
    const result = await locator.boundingBox();
    if (result == null) {
        throw new Error(`No rendered box for ${locator}`);
    }
    return result;
}

async function main(): Promise<void> {
    if (!existsSync(join(dist, "index.html"))) {
        throw new Error("Build the tester with npm run build:tester before running grid browser checks.");
    }
    await new Promise<void>(resolvePromise => server.listen(0, "127.0.0.1", resolvePromise));
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
        const errors: string[] = [];
        await page.route("https://**", route => route.abort());
        page.on("pageerror", error => errors.push(error.message));
        await page.goto(`http://127.0.0.1:${(server.address() as AddressInfo).port}/browser-test/grid-geometry`, {
            waitUntil: "networkidle"
        });
        const remote = page.locator("#server-binding");
        await expect(remote.locator("mona-grid")).not.toHaveAttribute("aria-busy", "true");
        await expect(remote.locator("tbody tr[monaGridRow]")).toHaveCount(10);
        await expect(remote.locator("tbody tr[monaGridRow]").first()).toHaveAttribute("aria-rowindex", "42");
        await expect(remote.locator("[data-request-count]")).toHaveText("Requests: 1");
        await remote.getByRole("button", { name: "Next page", exact: true }).click();
        await expect(remote.locator("[data-grid-loading]")).toBeVisible();
        await expect(remote.locator("mona-grid")).not.toHaveAttribute("aria-busy", "true");
        await expect(remote.locator("[data-request-count]")).toHaveText("Requests: 2");
        await expect(remote.locator("tbody tr[monaGridRow]").first()).toContainText("User 051");
        await remote.locator("mona-pager").getByRole("combobox").click();
        await page.getByRole("option", { name: "20", exact: true }).click();
        await expect(remote.locator("mona-grid")).not.toHaveAttribute("aria-busy", "true");
        await expect(remote.locator("[data-request-count]")).toHaveText("Requests: 3");
        await expect(remote.locator("tbody tr[monaGridRow]")).toHaveCount(20);
        await expect(remote.locator("tbody tr[monaGridRow]").first()).toHaveAttribute("aria-rowindex", "2");
        await remote.locator("th [title='User']").click();
        await expect(remote.locator("[data-request-count]")).toHaveText("Requests: 4");
        await expect(remote.locator("mona-grid")).not.toHaveAttribute("aria-busy", "true");
        await remote.locator("mona-grid-filter-row-cell input").last().fill("User 13");
        await expect(remote.locator("[data-request-count]")).toHaveText("Requests: 5");
        await expect(remote.locator("mona-grid")).not.toHaveAttribute("aria-busy", "true");
        await expect(remote.locator("tbody tr[monaGridRow]")).toHaveCount(8);

        for (const direction of ["ltr", "rtl"]) {
            const grid = page.locator(`#natural-${direction} mona-grid`);
            const rows = grid.locator("tbody tr[monaGridRow]");
            const short = await box(rows.nth(0));
            const tall = await box(rows.nth(1));
            expect(tall.height).toBeGreaterThan(short.height);
            const avatar = await box(rows.nth(1).locator("mona-avatar"));
            expect(avatar.height).toBe(48);
            expect(avatar.y).toBeGreaterThanOrEqual(tall.y);
            expect(avatar.y + avatar.height).toBeLessThanOrEqual(tall.y + tall.height);
            for (const cell of await rows.nth(1).locator("td").all()) {
                expect(Math.abs((await box(cell)).height - tall.height)).toBeLessThan(1);
            }
            for (const control of [
                "mona-check-box span[aria-hidden]",
                "mona-grid-toggle",
                "mona-grid-row-reorder-handle button",
                "mona-grid-command-cell button"
            ]) {
                const rect = await box(rows.nth(1).locator(control));
                expect(Math.abs(rect.y + rect.height / 2 - tall.y - tall.height / 2)).toBeLessThan(2);
            }
            await rows
                .nth(1)
                .locator("mona-grid-cell")
                .filter({ has: page.locator("[data-tall-user]") })
                .dblclick();
            const editor = rows.nth(1).locator("[data-tall-editor] input");
            await expect(editor).toBeVisible();
            expect((await box(rows.nth(1))).height).toBeGreaterThan(short.height);
            await editor.press("Enter");
            await expect(editor).toHaveCount(0);
            await rows.nth(1).locator("mona-check-box span[aria-hidden]").click();
            await expect(rows.nth(1).getByRole("checkbox")).toBeChecked();
            await expect(rows.nth(1)).toHaveAttribute("aria-selected", "true");
            await rows
                .nth(1)
                .locator("td")
                .filter({ has: page.locator("mona-grid-toggle") })
                .focus();
            await page.keyboard.press("Enter");
            await expect(grid.locator("tr[monaGridDetailRow]")).toBeVisible();
            await page.keyboard.press("Enter");
            await expect(grid.locator("tr[monaGridDetailRow]")).toHaveCount(0);
            await grid.getByRole("button", { name: "Add user", exact: true }).click();
            await expect(grid.locator("[data-grid-add-row] [data-tall-editor]")).toBeVisible();
            await grid.getByRole("button", { name: "Cancel row edit", exact: true }).click();
            await expect(grid.locator("[data-grid-add-row]")).toHaveCount(0);
        }

        for (const [id, height] of [
            ["virtual-explicit", 48],
            ["virtual-default", 36],
            ["virtual-grouped", 48]
        ] as const) {
            const grid = page.locator(`#${id} mona-grid`);
            await grid.scrollIntoViewIfNeeded();
            const rows = grid.locator("cdk-virtual-scroll-viewport tbody > tr");
            await expect(rows.first()).toBeVisible();
            for (const row of await rows.all()) {
                expect(Math.abs((await box(row)).height - height)).toBeLessThan(1);
            }
            await grid.locator("cdk-virtual-scroll-viewport").evaluate(element => {
                element.scrollTop = element.scrollHeight;
            });
            if (id === "virtual-grouped") {
                await expect(rows.last().locator("td[monaGridFooterTableCell]").first()).toBeVisible();
            } else {
                await expect(rows.last()).toContainText("User 100");
            }
            for (const row of await rows.all()) {
                expect(Math.abs((await box(row)).height - height)).toBeLessThan(1);
            }
        }

        const dragRow = page.locator("#natural-ltr tbody tr[monaGridRow]").nth(1);
        await dragRow.scrollIntoViewIfNeeded();
        const original = await box(dragRow);
        const handle = await box(dragRow.locator("mona-grid-row-reorder-handle button"));
        await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
        await page.mouse.down();
        await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2 + 10, { steps: 4 });
        const placeholder = page.locator("#natural-ltr .cdk-drag-placeholder");
        await expect(placeholder).toBeVisible();
        expect(Math.abs((await box(placeholder)).height - original.height)).toBeLessThan(1);
        await page.mouse.up();

        const require = createRequire(import.meta.url);
        await page.addScriptTag({ content: readFileSync(require.resolve("axe-core/axe.min.js"), "utf8") });
        const violations = await page.evaluate(async () => {
            const axe = (window as Window & { axe: typeof import("axe-core") }).axe;
            return (
                await axe.run("main", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })
            ).violations.map(v => ({
                id: v.id,
                nodes: v.nodes
                    .slice(0, 2)
                    .map(node => ({ target: node.target, summary: node.failureSummary, html: node.html }))
            }));
        });
        expect(violations).toEqual([]);
        expect(errors).toEqual([]);
        console.log(
            "Grid browser checks passed: server interactions, natural sizing, RTL/locked cells, editing, fixed virtual geometry, drag placeholder, and accessibility."
        );
    } finally {
        await browser.close();
        server.close();
        server.closeAllConnections();
    }
}

main().catch(error => {
    console.error(error);
    server.close();
    process.exitCode = 1;
});
