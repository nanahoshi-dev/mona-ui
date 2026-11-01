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
        page.on("console", message => {
            if (message.type() === "error" && /^(ERROR\b|RuntimeError\b)|NG0103/.test(message.text())) {
                errors.push(message.text());
            }
        });
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
        const [download] = await Promise.all([
            page.waitForEvent("download"),
            remote.getByRole("button", { name: "Export loaded page", exact: true }).click()
        ]);
        const downloadPath = await download.path();
        if (downloadPath == null) {
            throw new Error("Grid CSV was not downloaded.");
        }
        const csv = readFileSync(downloadPath, "utf8")
            .replace(/^\uFEFF/, "")
            .split("\r\n");
        expect(csv).toHaveLength(21);
        expect(csv[0]).toBe("ID,User");
        expect(csv[1]).toBe("1,User 001");
        await remote.locator("th [title='User']").click();
        await expect(remote.locator("[data-request-count]")).toHaveText("Requests: 4");
        await expect(remote.locator("mona-grid")).not.toHaveAttribute("aria-busy", "true");
        await remote.locator("mona-grid-filter-row-cell input").last().fill("User 13");
        await expect(remote.locator("[data-request-count]")).toHaveText("Requests: 5");
        await expect(remote.locator("mona-grid")).not.toHaveAttribute("aria-busy", "true");
        await expect(remote.locator("tbody tr[monaGridRow]")).toHaveCount(8);

        await remote.locator("mona-grid-filter-row-cell input").last().fill("No matching user");
        await expect(remote.locator("[data-request-count]")).toHaveText("Requests: 6");
        await expect(remote.locator("mona-grid")).not.toHaveAttribute("aria-busy", "true");
        await expect(remote.locator("tbody tr[monaGridRow]")).toHaveCount(0);
        await expect(remote.locator("mona-grid")).toContainText("No data");
        await expect(remote.locator("mona-pager")).toContainText("0 - 0 of 0 items");
        for (const name of ["First page", "Previous page", "Next page", "Last page"]) {
            await expect(remote.getByRole("button", { name, exact: true })).toBeDisabled();
        }
        await remote.locator("mona-pager").focus();
        await page.keyboard.press("End");
        await page.keyboard.press("PageDown");
        await expect(remote.locator("[data-request-count]")).toHaveText("Requests: 6");

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

            // Locked columns stay pinned to their logical side after scrolling to the far inline end.
            const pinned = await grid.evaluate(async (element, rtl) => {
                const originalWidth = element.style.width;
                element.style.width = "420px";
                await new Promise(resolveTimeout => setTimeout(resolveTimeout, 300));
                const body = element.querySelector<HTMLElement>("mona-grid-list");
                const row = body?.querySelector("tbody tr[monaGridRow]");
                const cells = Array.from(row?.querySelectorAll<HTMLElement>(":scope > td") ?? []);
                if (body == null || cells.length < 2) {
                    throw new Error("Expected a rendered body row");
                }
                body.scrollLeft = rtl ? -body.scrollWidth : body.scrollWidth;
                await new Promise(resolveFrame => requestAnimationFrame(() => resolveFrame(null)));
                // clientLeft covers an RTL scrollbar that sits on the left.
                const contentLeft = body.getBoundingClientRect().left + body.clientLeft;
                const contentRight = contentLeft + body.clientWidth;
                const first = cells[0].getBoundingClientRect();
                const last = cells[cells.length - 1].getBoundingClientRect();
                const result = {
                    overflow: body.scrollWidth - body.clientWidth,
                    startGap: rtl ? contentRight - first.right : first.left - contentLeft,
                    endGap: rtl ? last.left - contentLeft : contentRight - last.right
                };
                body.scrollLeft = 0;
                element.style.width = originalWidth;
                return result;
            }, direction === "rtl");
            expect(pinned.overflow).toBeGreaterThan(0);
            expect(Math.abs(pinned.startGap)).toBeLessThan(1);
            expect(Math.abs(pinned.endGap)).toBeLessThan(1);

            // Arrow keys follow the screen in both directions and cross from user to structural columns.
            const towardStart = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
            const towardEnd = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
            const focusedColumn = () =>
                page.evaluate(() => document.activeElement?.getAttribute("aria-colindex") ?? null);
            await rows.nth(0).locator('td[aria-colindex="4"]').focus();
            await page.keyboard.press(towardStart);
            expect(await focusedColumn()).toBe("3");
            await page.keyboard.press(towardEnd);
            expect(await focusedColumn()).toBe("4");
            // The header has no detail cell, so navigation steps from the reorder header to the select-all header.
            await grid.locator('thead th[aria-colindex="1"]').focus();
            await page.keyboard.press(towardEnd);
            expect(await focusedColumn()).toBe("3");
        }

        // Every grouped body row spans exactly the colgroup, and detail content lines up with the data columns.
        const groupedDetail = page.locator("#grouped-detail mona-grid");
        await groupedDetail.scrollIntoViewIfNeeded();
        await groupedDetail.locator("tbody tr[monaGridRow]").first().locator("mona-grid-toggle").click();
        await expect(groupedDetail.locator("[data-grouped-detail]")).toBeVisible();
        const groupedGeometry = await groupedDetail.evaluate(element => {
            const table = element.querySelector<HTMLTableElement>("mona-grid-list table");
            if (table == null) {
                throw new Error("Expected the grouped body table");
            }
            const columnCount = table.querySelectorAll("colgroup > col").length;
            const spans = Array.from(table.tBodies[0].rows, row =>
                Array.from(row.cells).reduce((total, cell) => total + cell.colSpan, 0)
            );
            const detailRow = table.querySelector("tr[monaGridDetailRow]");
            const dataRow = detailRow?.previousElementSibling;
            const dataCells = Array.from(dataRow?.querySelectorAll(":scope > td:has(mona-grid-cell)") ?? []);
            const content = detailRow?.lastElementChild?.getBoundingClientRect();
            const first = dataCells[0]?.getBoundingClientRect();
            const last = dataCells[dataCells.length - 1]?.getBoundingClientRect();
            if (content == null || first == null || last == null) {
                throw new Error("Expected an expanded detail row below a data row");
            }
            return {
                columnCount,
                spans,
                startGap: content.left - first.left,
                endGap: content.right - last.right
            };
        });
        expect(groupedGeometry.spans.length).toBeGreaterThan(0);
        expect(groupedGeometry.spans.every(span => span === groupedGeometry.columnCount)).toBe(true);
        expect(Math.abs(groupedGeometry.startGap)).toBeLessThan(1);
        expect(Math.abs(groupedGeometry.endGap)).toBeLessThan(1);

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
            if (id === "virtual-grouped") {
                await grid.locator("cdk-virtual-scroll-viewport").evaluate(async element => {
                    const maximum = element.scrollHeight - element.clientHeight;
                    for (let step = 0; step < 60; step++) {
                        element.scrollTop = (step * 170) % maximum;
                        await new Promise<void>(resolveFrame => requestAnimationFrame(() => resolveFrame()));
                    }
                });
                expect(errors).toEqual([]);
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
        // Rows slide out of the dragged row's way, and the drop slot is dimmed.
        expect(await placeholder.evaluate(element => getComputedStyle(element).opacity)).toBe("0.6");
        expect(
            await page
                .locator("#natural-ltr tbody tr[monaGridRow]")
                .first()
                .evaluate(element => getComputedStyle(element).transitionDuration.split(",")[0])
        ).toBe("0.2s");
        await page.mouse.up();
        await expect(page.locator(".cdk-drag-preview")).toHaveCount(0);

        // Keyboard moves slide the swapped rows and keep focus on the handle, so the row can keep moving.
        const keyboardRows = page.locator("#natural-ltr tbody tr[monaGridRow]");
        const movedUid = await keyboardRows.first().getAttribute("data-ruid");
        await keyboardRows.first().locator("mona-grid-row-reorder-handle button").focus();
        await page.keyboard.press("Alt+ArrowDown");
        await expect(keyboardRows.nth(1)).toHaveAttribute("data-ruid", movedUid!);
        expect(await keyboardRows.nth(1).evaluate(element => element.getAnimations().length)).toBe(1);
        await page.keyboard.press("Alt+ArrowDown");
        await expect(keyboardRows.nth(2)).toHaveAttribute("data-ruid", movedUid!);
        await page.keyboard.press("Alt+ArrowUp");
        await page.keyboard.press("Alt+ArrowUp");
        await expect(keyboardRows.first()).toHaveAttribute("data-ruid", movedUid!);
        await expect(keyboardRows.first().locator("mona-grid-row-reorder-handle button")).toBeFocused();

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
            "Grid browser checks passed: server interactions, natural sizing, RTL/locked cells, editing, fixed virtual geometry, drag and keyboard row moves, and accessibility."
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
