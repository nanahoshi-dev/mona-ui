import { DOCUMENT } from "@angular/common";
import { afterNextRender, inject, Injectable, Injector, signal } from "@angular/core";
import type { IEnumerable, KeyValuePair } from "@mirei/ts-collections";
import { ImmutableDictionary } from "@mirei/ts-collections";
import { v4 } from "uuid";

/** Rows per page when the body has no measurable height, as in a hidden grid. */
const FALLBACK_PAGE_ROWS = 10;

@Injectable()
export class GridNavigationService {
    readonly #cellElementDict = signal(ImmutableDictionary.create<string, NavigationData>());
    readonly #document = inject(DOCUMENT);
    readonly #injector = inject(Injector);
    readonly #lastFocusedCellKey = signal<string | null>(null);
    readonly #lastFocusedCellSnapshot = signal<NavigationCellSnapshot | null>(null);
    readonly #lastNonGroupCellKey = signal<string | null>(null);
    /** Whether a cell (not a control inside it) had focus last; only then is lost focus brought back. */
    #cellHasFocus = false;
    /** The cell whose row was scrolled out while it had focus, with the element that had it. */
    #lostFocus: { element: HTMLElement; snapshot: NavigationCellSnapshot } | null = null;
    /** A body row the virtual list is scrolling to; its cell takes focus once it is drawn. */
    #pendingFocus: PendingFocus | null = null;
    #pendingFocusScheduled = false;
    #rowScroller: GridNavigationRowScroller | null = null;
    #viewport: GridNavigationViewport | null = null;

    public focusActiveCellOrFirstHeader(): boolean {
        const focusedCell = this.#getFocusedCell();
        if (focusedCell) {
            this.#focusCell(focusedCell.key, focusedCell.value);
            return true;
        }

        const fallback = this.#findFallbackCell(this.#lastFocusedCellSnapshot());
        if (!fallback) {
            return false;
        }

        this.#focusCell(fallback.key, fallback.value);
        return true;
    }

    public focusAdjacentEditableCell(rowUid: string, columnId: string, direction: "next" | "previous"): boolean {
        const editableCells = this.#cells()
            .where(
                e =>
                    e.value.section === "body" &&
                    e.value.cellKind === "data" &&
                    e.value.editable &&
                    e.value.rowUid != null &&
                    e.value.columnId != null
            )
            .orderBy(e => e.value.rowIndex)
            .thenBy(e => e.value.colIndex)
            .toArray();
        const currentIndex = editableCells.findIndex(e => e.value.rowUid === rowUid && e.value.columnId === columnId);
        if (currentIndex === -1) {
            return false;
        }
        const target = editableCells[currentIndex + (direction === "next" ? 1 : -1)];
        if (!target) {
            return false;
        }
        this.#focusCell(target.key, target.value);
        target.value.startEdit?.();
        return true;
    }

    public focusFirstCell(): void {
        const firstCell = this.#findFirstHeaderCell() ?? this.#findFirstCell();
        if (firstCell) {
            this.#focusCell(firstCell.key, firstCell.value);
        }
    }

    /** Focuses the header cell of a column, for example after the header was dragged. */
    public focusHeaderCell(columnId: string): boolean {
        const cell = this.#cells().firstOrDefault(e => e.value.section === "header" && e.value.columnId === columnId);
        if (!cell) {
            return false;
        }
        this.#focusCell(cell.key, cell.value);
        return true;
    }

    /** The cell that holds the grid's Tab stop. */
    public getFocusedCell(): NavigationData | null {
        return this.#getFocusedCell()?.value ?? null;
    }

    public isFocused(cellKey: string): boolean {
        return this.#lastFocusedCellKey() === cellKey;
    }

    public navigate(cellKey: string, navigationKey: string): boolean {
        this.#pendingFocus = null;
        switch (navigationKey) {
            case "ArrowDown":
                return this.#navigateVertically("down", cellKey);
            case "ArrowUp":
                return this.#navigateVertically("up", cellKey);
            case "ArrowLeft":
                return this.#navigateHorizontally("previous", cellKey);
            case "ArrowRight":
                return this.#navigateHorizontally("next", cellKey);
            case "Home":
                return this.#navigateToRowEdge("first", cellKey);
            case "End":
                return this.#navigateToRowEdge("last", cellKey);
            case "CtrlHome":
                return this.#navigateToGridEdge("first");
            case "CtrlEnd":
                return this.#navigateToGridEdge("last");
            case "PageDown":
                return this.#navigateByPage("down", cellKey);
            case "PageUp":
                return this.#navigateByPage("up", cellKey);
            default:
                return false;
        }
    }

    /** Records that focus left the cell itself, for a control inside it or outside the grid. */
    public notifyCellBlur(): void {
        this.#cellHasFocus = false;
    }

    /**
     * After the next render, focuses the active cell, or the nearest one when the active cell's row is gone,
     * if focus was lost with it: after the add row closes or a row is removed.
     */
    public refocusAfterRender(): void {
        afterNextRender(
            {
                write: () => {
                    if (this.#focusIsLost(null)) {
                        this.focusActiveCellOrFirstHeader();
                    }
                }
            },
            { injector: this.#injector }
        );
    }

    public registerCell(data: NavigationData): string {
        const cellKey = this.#createCellKey(data);
        const currentData = this.#cellElementDict().get(cellKey);
        if (!currentData || !this.#navigationDataEqual(currentData, data)) {
            this.#cellElementDict.update(dict => dict.put(cellKey, data));
        }
        this.#ensureFocusedCell();
        if (this.#pendingFocus?.rowIndex === data.rowIndex && data.section === "body") {
            this.#schedulePendingFocus();
        }
        if (this.#lostFocus != null && this.#sameIdentity(data, this.#lostFocus.snapshot)) {
            queueMicrotask(() => this.restoreLostFocus());
        }
        return cellKey;
    }

    /**
     * Brings focus back to the cell that had it when its row was scrolled out of a virtual grid, once
     * the row is drawn again and focus hasn't gone anywhere else.
     */
    public restoreLostFocus(): void {
        if (this.#lostFocus == null) {
            // A virtual list detaches the views it scrolls out, so a focused cell can leave the document.
            const key = this.#lastFocusedCellKey();
            const focused = key == null ? null : this.#cellElementDict().get(key);
            if (focused != null && !focused.element.isConnected && this.#cellHasFocus && this.#focusIsLost(null)) {
                this.#lostFocus = { element: focused.element, snapshot: this.#createSnapshot(focused) };
            }
            return;
        }
        const lostFocus = this.#lostFocus;
        if (!this.#focusIsLost(lostFocus.element)) {
            this.#lostFocus = null;
            return;
        }
        const cell = this.#cells().firstOrDefault(e => this.#sameIdentity(e.value, lostFocus.snapshot));
        if (cell == null) {
            return;
        }
        this.#lostFocus = null;
        cell.value.element.focus({ preventScroll: true });
        this.#setFocusedCell(cell.key, cell.value);
    }

    public setLastFocusedCellKey(key: string): void {
        const data = this.#cellElementDict().get(key);
        if (data) {
            this.#cellHasFocus = true;
            this.#lostFocus = null;
            this.#setFocusedCell(key, data);
        }
    }

    /** Lets a virtual list move focus to rows it hasn't drawn yet. */
    public setRowScroller(scroller: GridNavigationRowScroller | null): void {
        this.#rowScroller = scroller;
        this.#pendingFocus = null;
    }

    /** Tells the service where the body scrolls and how wide its pinned columns are. */
    public setViewport(viewport: GridNavigationViewport | null): void {
        this.#viewport = viewport;
    }

    public unregisterCell(cellKey: string, element?: HTMLTableCellElement): void {
        const data = this.#cellElementDict().get(cellKey);
        // A cached view may be destroyed after another view has taken over this logical identity.
        if (!data || (element != null && data.element !== element)) {
            return;
        }
        this.#cellElementDict.update(dict => dict.remove(cellKey));
        if (this.#lastFocusedCellKey() !== cellKey) {
            return;
        }

        // A virtual list reuses the element for another row: remember the cell to bring focus back to it.
        if (this.#cellHasFocus && this.#focusIsLost(data.element)) {
            this.#lostFocus = { element: data.element, snapshot: this.#createSnapshot(data) };
        }
        const fallback = this.#findFallbackCell(this.#createSnapshot(data));
        if (fallback) {
            this.#setFocusedCell(fallback.key, fallback.value);
        } else {
            this.#lastFocusedCellKey.set(null);
        }
    }

    /** Registered cells that are in the document; a virtual list keeps detached views registered. */
    #cells(): IEnumerable<KeyValuePair<string, NavigationData>> {
        return this.#cellElementDict().where(e => e.value.element.isConnected);
    }

    #createCellKey(data: NavigationData): string {
        if (data.groupHeader) {
            return `group:${data.groupKey ?? v4()}`;
        }
        if (
            data.section === "header" ||
            data.section === "filter" ||
            data.section === "add" ||
            data.section === "footer"
        ) {
            return `${data.section}:${data.columnId ?? data.colIndex}`;
        }
        if (data.rowUid != null || data.columnId != null) {
            return `body:${data.rowUid ?? data.rowIndex}:${data.columnId ?? data.colIndex}`;
        }
        return `${data.section}:${data.rowIndex}:${data.colIndex}`;
    }

    #createSnapshot(data: NavigationData): NavigationCellSnapshot {
        return {
            cellKind: data.cellKind,
            colIndex: data.colIndex,
            columnId: data.columnId,
            groupHeader: data.groupHeader,
            groupKey: data.groupKey,
            rowIndex: data.rowIndex,
            rowUid: data.rowUid,
            section: data.section
        };
    }

    #ensureFocusedCell(): void {
        if (this.#getFocusedCell()) {
            return;
        }
        const fallback = this.#findFallbackCell(this.#lastFocusedCellSnapshot());
        if (fallback) {
            this.#setFocusedCell(fallback.key, fallback.value);
        }
    }

    #findCellsInRow(rowIndex: number, section: GridNavigationSection): { key: string; value: NavigationData }[] {
        return this.#cells()
            .where(e => e.value.section === section && e.value.rowIndex === rowIndex)
            .orderBy(e => e.value.colIndex)
            .toArray();
    }

    #findFallbackCell(snapshot: NavigationCellSnapshot | null): { key: string; value: NavigationData } | null {
        const dict = this.#cells();
        if (dict.none()) {
            return null;
        }

        if (snapshot) {
            const sameIdentity = dict.firstOrDefault(e => this.#sameIdentity(e.value, snapshot));
            if (sameIdentity) {
                return sameIdentity;
            }

            const sameColumn = dict
                .where(e => e.value.section === snapshot.section && e.value.columnId === snapshot.columnId)
                .orderBy(e => Math.abs(e.value.rowIndex - snapshot.rowIndex))
                .thenBy(e => e.value.colIndex)
                .firstOrDefault();
            if (sameColumn) {
                return sameColumn;
            }

            const sameSection = dict
                .where(e => e.value.section === snapshot.section)
                .orderBy(e => Math.abs(e.value.rowIndex - snapshot.rowIndex))
                .thenBy(e => Math.abs(e.value.colIndex - snapshot.colIndex))
                .firstOrDefault();
            if (sameSection) {
                return sameSection;
            }
        }

        return this.#findFirstHeaderCell() ?? this.#findFirstCell();
    }

    #findFirstCell(): { key: string; value: NavigationData } | null {
        return this.#cells()
            .orderBy(d => this.#sectionOrder(d.value.section))
            .thenBy(d => d.value.rowIndex)
            .thenBy(d => d.value.colIndex)
            .firstOrDefault();
    }

    #findFirstHeaderCell(): { key: string; value: NavigationData } | null {
        return this.#cells()
            .where(d => d.value.section === "header")
            .orderBy(d => d.value.colIndex)
            .firstOrDefault();
    }

    /** The registered row next to a row, across sections in the order header, filter, add row, body. */
    #findNextRow(
        section: GridNavigationSection,
        rowIndex: number,
        direction: "down" | "up"
    ): { rowIndex: number; section: GridNavigationSection } | null {
        const current = [this.#sectionOrder(section), rowIndex] as const;
        const isAfter = (order: number, index: number): boolean =>
            order > current[0] || (order === current[0] && index > current[1]);
        const isBefore = (order: number, index: number): boolean =>
            order < current[0] || (order === current[0] && index < current[1]);
        let best: { order: number; rowIndex: number; section: GridNavigationSection } | null = null;
        for (const entry of this.#cells()) {
            const order = this.#sectionOrder(entry.value.section);
            const index = entry.value.rowIndex;
            if (direction === "down" ? !isAfter(order, index) : !isBefore(order, index)) {
                continue;
            }
            const closer =
                best == null ||
                (direction === "down"
                    ? order < best.order || (order === best.order && index < best.rowIndex)
                    : order > best.order || (order === best.order && index > best.rowIndex));
            if (closer) {
                best = { order, rowIndex: index, section: entry.value.section };
            }
        }
        return best == null ? null : { rowIndex: best.rowIndex, section: best.section };
    }

    #focusCell(key: string, data: NavigationData): void {
        this.#focusElement(data.element);
        this.#setFocusedCell(key, data);
    }

    #focusElement(element: HTMLTableCellElement): void {
        element.focus({ preventScroll: true });
        element.scrollIntoView({ block: "nearest", inline: "nearest" });
        this.#revealFromPinnedColumns(element);
    }

    /** Whether focus is nowhere, or still on an element that a virtual list gave to another row. */
    #focusIsLost(previousElement: HTMLElement | null): boolean {
        const activeElement = this.#document.activeElement;
        return (
            activeElement == null ||
            activeElement === this.#document.body ||
            !activeElement.isConnected ||
            activeElement === previousElement
        );
    }

    /**
     * Focuses a body row by its index. A virtual list may not have drawn it yet: then the list scrolls to
     * it, and the cell takes focus once it is registered.
     */
    #focusRow(rowIndex: number, colIndex: number | "last"): boolean {
        const rowCells = this.#findCellsInRow(rowIndex, "body");
        if (rowCells.length !== 0) {
            const target = this.#pickCellInRow(rowCells, colIndex);
            this.#focusCell(target.key, target.value);
            if (!target.value.groupHeader) {
                this.#lastNonGroupCellKey.set(target.key);
            }
            return true;
        }
        if (this.#rowScroller == null) {
            return false;
        }
        this.#pendingFocus = { colIndex, rowIndex };
        this.#rowScroller.scrollToRow(rowIndex);
        return true;
    }

    #getFocusedCell(): { key: string; value: NavigationData } | null {
        const key = this.#lastFocusedCellKey();
        if (!key) {
            return null;
        }
        const data = this.#cellElementDict().get(key);
        return data && data.element.isConnected ? { key, value: data } : null;
    }

    /** The cell's column in rows that aren't group rows, remembered across group rows. */
    #getTargetColumn(): number {
        const lastNonGroupCellKey = this.#lastNonGroupCellKey();
        const lastNonGroupCellData = lastNonGroupCellKey ? this.#cellElementDict().get(lastNonGroupCellKey) : null;
        return lastNonGroupCellData?.colIndex ?? 0;
    }

    #navigateByPage(direction: "down" | "up", cellKey: string): boolean {
        const data = this.#cellElementDict().get(cellKey);
        if (!data || data.section !== "body") {
            return false;
        }
        if (!data.groupHeader) {
            this.#lastNonGroupCellKey.set(cellKey);
        }
        const step = this.#pageRows(data.element) * (direction === "down" ? 1 : -1);
        const rowCount = this.#rowScroller?.rowCount() ?? 0;
        // Stop at the first or last row; search back towards the current row from there.
        const target = this.#rowScroller
            ? this.#navigableRowNear(
                  Math.min(Math.max(data.rowIndex + step, 0), rowCount - 1),
                  direction === "down" ? "up" : "down"
              )
            : this.#registeredRowNear(data.rowIndex + step, direction);
        if (target == null || target === data.rowIndex) {
            return false;
        }
        return this.#focusRow(target, this.#getTargetColumn());
    }

    // Moves in logical column order; callers map arrow keys to it according to the text direction.
    #navigateHorizontally(direction: "next" | "previous", cellKey: string): boolean {
        const data = this.#cellElementDict().get(cellKey);
        if (!data || data.groupHeader) {
            return false;
        }
        if (direction === "previous" ? data.firstInRow : data.lastInRow) {
            return false;
        }
        // Not every layout column registers a cell in every section (the header has no detail cell),
        // so move to the nearest registered cell instead of the adjacent index.
        const rowCells = this.#findCellsInRow(data.rowIndex, data.section);
        const target =
            direction === "previous"
                ? rowCells.filter(cell => cell.value.colIndex < data.colIndex).at(-1)
                : rowCells.find(cell => cell.value.colIndex > data.colIndex);
        if (!target) {
            return false;
        }
        this.#focusCell(target.key, target.value);
        return true;
    }

    #navigateToGridEdge(edge: "first" | "last"): boolean {
        // A virtual list draws only some rows: reach the last row by its index.
        if (edge === "last" && this.#rowScroller != null) {
            const lastRow = this.#navigableRowNear(this.#rowScroller.rowCount() - 1, "up");
            if (lastRow != null) {
                return this.#focusRow(lastRow, "last");
            }
        }
        const sorted = this.#cells()
            .orderBy(d => this.#sectionOrder(d.value.section))
            .thenBy(d => d.value.rowIndex)
            .thenBy(d => d.value.colIndex);
        const target = edge === "first" ? sorted.firstOrDefault() : sorted.lastOrDefault();
        if (!target) {
            return false;
        }
        this.#focusCell(target.key, target.value);
        if (!target.value.groupHeader) {
            this.#lastNonGroupCellKey.set(target.key);
        }
        return true;
    }

    #navigateToRowEdge(edge: "first" | "last", cellKey: string): boolean {
        const data = this.#cellElementDict().get(cellKey);
        if (!data || data.groupHeader) {
            return false;
        }
        const rowCells = this.#findCellsInRow(data.rowIndex, data.section);
        if (rowCells.length === 0) {
            return false;
        }
        const target = edge === "first" ? rowCells[0] : rowCells[rowCells.length - 1];
        if (target.key === cellKey) {
            return false;
        }
        this.#focusCell(target.key, target.value);
        if (!target.value.groupHeader) {
            this.#lastNonGroupCellKey.set(target.key);
        }
        return true;
    }

    #navigateVertically(direction: "down" | "up", cellKey: string): boolean {
        const data = this.#cellElementDict().get(cellKey);
        if (!data) {
            return false;
        }
        if (!data.groupHeader) {
            this.#lastNonGroupCellKey.set(cellKey);
        }
        const targetColIndex = this.#getTargetColumn();

        // In a virtual list the next row may not be drawn yet; move by index while inside the body.
        if (data.section === "body" && this.#rowScroller != null) {
            const step = direction === "down" ? 1 : -1;
            const nextRow = this.#navigableRowNear(data.rowIndex + step, direction);
            if (nextRow != null) {
                return this.#focusRow(nextRow, targetColIndex);
            }
            if (direction === "down") {
                return false;
            }
        }

        const nextRow = this.#findNextRow(data.section, data.rowIndex, direction);
        if (nextRow == null) {
            return false;
        }
        if (nextRow.section === "body") {
            return this.#focusRow(nextRow.rowIndex, targetColIndex);
        }
        const targetRowCells = this.#findCellsInRow(nextRow.rowIndex, nextRow.section);
        const targetCell = this.#pickCellInRow(targetRowCells, targetColIndex);
        this.#focusCell(targetCell.key, targetCell.value);
        return true;
    }

    /** The nearest row a virtual list can focus, from an index towards a direction; footers are skipped. */
    #navigableRowNear(rowIndex: number, direction: "down" | "up"): number | null {
        const scroller = this.#rowScroller;
        if (scroller == null) {
            return null;
        }
        const rowCount = scroller.rowCount();
        const step = direction === "down" ? 1 : -1;
        for (let index = rowIndex; index >= 0 && index < rowCount; index += step) {
            if (scroller.isNavigableRow(index)) {
                return index;
            }
        }
        return null;
    }

    #navigationDataEqual(left: NavigationData, right: NavigationData): boolean {
        return (
            left.cellKind === right.cellKind &&
            left.colIndex === right.colIndex &&
            left.columnId === right.columnId &&
            left.editable === right.editable &&
            left.element === right.element &&
            left.firstInRow === right.firstInRow &&
            left.groupHeader === right.groupHeader &&
            left.groupKey === right.groupKey &&
            left.lastInRow === right.lastInRow &&
            left.rowIndex === right.rowIndex &&
            left.rowUid === right.rowUid &&
            left.section === right.section &&
            left.startEdit === right.startEdit
        );
    }

    /** How many body rows fit in the visible part of the body. */
    #pageRows(element: HTMLElement): number {
        const scrollElement = this.#viewport?.scrollElement() ?? null;
        const rowHeight = element.closest("tr")?.getBoundingClientRect().height ?? 0;
        if (scrollElement == null || rowHeight <= 0 || scrollElement.clientHeight <= 0) {
            return FALLBACK_PAGE_ROWS;
        }
        return Math.max(1, Math.floor(scrollElement.clientHeight / rowHeight));
    }

    #pickCellInRow(
        rowCells: { key: string; value: NavigationData }[],
        colIndex: number | "last"
    ): { key: string; value: NavigationData } {
        if (colIndex === "last" || rowCells[0].value.groupHeader) {
            return colIndex === "last" ? rowCells[rowCells.length - 1] : rowCells[0];
        }
        return (
            rowCells.find(e => e.value.colIndex === colIndex) ??
            rowCells.find(e => e.value.colIndex >= colIndex) ??
            rowCells[rowCells.length - 1]
        );
    }

    /** The registered body row closest to an index without passing it, or the last one in that direction. */
    #registeredRowNear(rowIndex: number, direction: "down" | "up"): number | null {
        const rows = this.#cells()
            .where(e => e.value.section === "body")
            .select(e => e.value.rowIndex)
            .distinct()
            .orderBy(index => index)
            .toArray();
        if (rows.length === 0) {
            return null;
        }
        if (direction === "down") {
            return rows.filter(index => index <= rowIndex).at(-1) ?? rows[0];
        }
        return rows.find(index => index >= rowIndex) ?? rows[rows.length - 1];
    }

    /** Scrolls a cell out from under the pinned columns, which a plain scrollIntoView doesn't account for. */
    #revealFromPinnedColumns(element: HTMLTableCellElement): void {
        const viewport = this.#viewport;
        const scrollElement = viewport?.scrollElement() ?? null;
        if (viewport == null || scrollElement == null || element.style.position === "sticky") {
            return;
        }
        const inset = viewport.stickyInset();
        if (inset.start === 0 && inset.end === 0) {
            return;
        }
        const cell = element.getBoundingClientRect();
        const box = scrollElement.getBoundingClientRect();
        const left = box.left + scrollElement.clientLeft;
        const right = left + scrollElement.clientWidth;
        const rtl = this.#document.defaultView?.getComputedStyle(scrollElement).direction === "rtl";
        const [visibleLeft, visibleRight] = rtl
            ? [left + inset.end, right - inset.start]
            : [left + inset.start, right - inset.end];
        let delta = 0;
        if (cell.left < visibleLeft) {
            delta = cell.left - visibleLeft;
        } else if (cell.right > visibleRight) {
            delta = Math.min(cell.right - visibleRight, cell.left - visibleLeft);
        }
        if (delta !== 0) {
            scrollElement.scrollBy({ left: delta });
        }
    }

    #sameIdentity(data: NavigationData | NavigationCellSnapshot, snapshot: NavigationCellSnapshot): boolean {
        return (
            data.section === snapshot.section &&
            data.columnId === snapshot.columnId &&
            data.rowUid === snapshot.rowUid &&
            data.groupKey === snapshot.groupKey
        );
    }

    #schedulePendingFocus(): void {
        if (this.#pendingFocusScheduled) {
            return;
        }
        this.#pendingFocusScheduled = true;
        // Every cell of the row registers in the same render pass; pick the column once they all have.
        queueMicrotask(() => {
            this.#pendingFocusScheduled = false;
            const pending = this.#pendingFocus;
            if (pending == null) {
                return;
            }
            const rowCells = this.#findCellsInRow(pending.rowIndex, "body");
            if (rowCells.length === 0) {
                return;
            }
            this.#pendingFocus = null;
            const target = this.#pickCellInRow(rowCells, pending.colIndex);
            this.#focusCell(target.key, target.value);
            if (!target.value.groupHeader) {
                this.#lastNonGroupCellKey.set(target.key);
            }
        });
    }

    #sectionOrder(section: GridNavigationSection): number {
        switch (section) {
            case "header":
                return 0;
            case "filter":
                return 1;
            case "add":
                return 2;
            case "body":
                return 3;
            case "footer":
                return 4;
        }
    }

    #setFocusedCell(key: string, data: NavigationData): void {
        this.#lastFocusedCellKey.set(key);
        this.#lastFocusedCellSnapshot.set(this.#createSnapshot(data));
    }
}

export type GridCellKind = "command" | "data" | "detail" | "filter" | "footer" | "group" | "header";

export type GridNavigationSection = "add" | "body" | "filter" | "footer" | "header";

/** Lets the navigation reach rows of a virtual list that aren't drawn. */
export interface GridNavigationRowScroller {
    /** Whether a row can take focus; group footers can't. */
    isNavigableRow(rowIndex: number): boolean;
    /** The number of body rows, drawn or not. */
    rowCount(): number;
    scrollToRow(rowIndex: number): void;
}

export interface GridNavigationViewport {
    /** The element that scrolls the body. */
    scrollElement(): HTMLElement | null;
    /** The widths of the columns pinned to the start and to the end. */
    stickyInset(): { end: number; start: number };
}

export interface NavigationData {
    cellKind: GridCellKind;
    colIndex: number;
    columnId?: string;
    editable: boolean;
    element: HTMLTableCellElement;
    firstInRow: boolean;
    groupHeader: boolean;
    groupKey?: string;
    lastInRow: boolean;
    rowIndex: number;
    rowUid?: string;
    section: GridNavigationSection;
    startEdit?: () => void;
}

interface NavigationCellSnapshot {
    cellKind: GridCellKind;
    colIndex: number;
    columnId?: string;
    groupHeader: boolean;
    groupKey?: string;
    rowIndex: number;
    rowUid?: string;
    section: GridNavigationSection;
}

interface PendingFocus {
    colIndex: number | "last";
    rowIndex: number;
}
