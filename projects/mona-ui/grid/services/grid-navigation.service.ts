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
    /**
     * Set when the Tab stop left the body only because its last row went, as when the data is cleared while the next
     * loads. The first row takes the Tab stop back once one is drawn, and the focus too while it is on the cell the
     * grid moved it to (`parked`).
     */
    #bodyEmptied: { parked: HTMLElement | null } | null = null;
    #bodyRefillScheduled = false;
    /** Whether a cell (not a control inside it) had focus last; only then is lost focus brought back. */
    #cellHasFocus = false;
    /** Whether the Tab stop is the grid's own pick, which moves to a better cell as cells register. */
    #defaultTabStop = false;
    /** The cell whose row was scrolled out while it had focus, with the element that had it. */
    #lostFocus: { element: HTMLElement; snapshot: NavigationCellSnapshot } | null = null;
    /** Called with the cell a key moved to, once it has focus, which in a virtual list may be after a scroll. */
    #onArrive: ((cell: NavigationData) => void) | null = null;
    /** A body row the virtual list is scrolling to; its cell takes focus once it is drawn. */
    #pendingFocus: PendingFocus | null = null;
    #pendingFocusScheduled = false;
    /** Whether body rows are moved through as wholes, with focus on each row's first data cell. */
    #rowNavigation = false;
    #rowScroller: GridNavigationRowScroller | null = null;
    #viewport: GridNavigationViewport | null = null;

    public focusActiveCellOrFirstHeader(): boolean {
        const target = this.#getFocusedCell() ?? this.#findFallbackCell(this.#lastFocusedCellSnapshot());
        if (!target) {
            return false;
        }
        // The body has no rows yet: the focus waits here for the first one.
        if (this.#bodyEmptied != null && target.value.section !== "body") {
            this.#bodyEmptied.parked = target.value.element;
        }
        this.#focusCell(target.key, target.value);
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

    /**
     * Focuses the body, without selecting: the current cell when it's in the body (scrolled to in a virtual list),
     * else the first row. Returns whether a row took the focus, or will once a virtual list has drawn it.
     */
    public focusBody(): boolean {
        const current = this.#getFocusedCell();
        if (current != null) {
            if (current.value.section !== "body") {
                return this.#navigateToBodyEdge("first");
            }
            this.#focusCell(current.key, current.value);
            return true;
        }
        const snapshot = this.#lastFocusedCellSnapshot();
        if (snapshot?.section === "body" && snapshot.rowUid != null && this.focusRowByUid(snapshot.rowUid)) {
            return true;
        }
        return this.#navigateToBodyEdge("first");
    }

    /** Focuses a body cell by its row and column, when it's rendered. */
    public focusBodyCell(rowUid: string, columnId: string): boolean {
        const cell = this.#cells().firstOrDefault(
            e => e.value.section === "body" && e.value.rowUid === rowUid && e.value.columnId === columnId
        );
        if (!cell) {
            return false;
        }
        this.#focusCell(cell.key, cell.value);
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

    /**
     * Focuses a body row by its uid, without selecting, in the column the keyboard last moved in; a virtual list
     * scrolls to it. Returns false when no row has it, or when it isn't on the page.
     */
    public focusRowByUid(rowUid: string): boolean {
        const column = this.#getTargetColumn();
        const rowCells = this.#cells()
            .where(e => e.value.section === "body" && e.value.cellKind !== "detail" && e.value.rowUid === rowUid)
            .orderBy(e => e.value.colIndex)
            .toArray();
        if (rowCells.length !== 0) {
            const target = this.#pickCellInRow(rowCells, column);
            this.#focusCell(target.key, target.value);
            this.#lastNonGroupCellKey.set(target.key);
            return true;
        }
        const index = this.#rowScroller?.indexOfRow(rowUid) ?? -1;
        return index >= 0 && this.#focusRow(index, column);
    }

    /**
     * With row navigation, moves focus from another cell of a body row, such as one clicked, to the row's first data
     * cell, which holds it. Returns whether it moved.
     */
    public focusRowOf(cellKey: string): boolean {
        const data = this.#cellElementDict().get(cellKey);
        if (!this.#rowNavigation || data == null || !this.#isRowCell(data)) {
            return false;
        }
        const target = this.#rowFocusCell(data.rowIndex);
        if (target == null || target.key === cellKey) {
            return false;
        }
        this.#focusCell(target.key, target.value);
        this.#lastNonGroupCellKey.set(target.key);
        return true;
    }

    /** The rendered cell an element is in, such as the target of a pointer event. */
    public getCellAt(target: Element | null): NavigationData | null {
        const element = target?.closest("td, th");
        if (element == null) {
            return null;
        }
        return this.#cells().firstOrDefault(e => e.value.element === element)?.value ?? null;
    }

    /** The cell that holds the grid's Tab stop. */
    public getFocusedCell(): NavigationData | null {
        return this.#getFocusedCell()?.value ?? null;
    }

    public isFocused(cellKey: string): boolean {
        return this.#lastFocusedCellKey() === cellKey;
    }

    /**
     * A press with the main or the secondary button on the body's own space, below the rows or where there are none,
     * keeps the focus in the grid, where the browser would drop it on the page: on the cell that has it, or, from
     * outside the grid, on the grid's current cell. A context menu opened by a right-click there gives the focus back
     * to that cell. Presses on a row, and on a scrollbar, are left alone, and so is a control inside a cell that has
     * the focus, such as an editor, which ends its edit as it loses the focus.
     */
    public keepFocusOnPress(event: MouseEvent): void {
        const target = event.target;
        if ((event.button !== 0 && event.button !== 2) || event.defaultPrevented || !(target instanceof Element)) {
            return;
        }
        if (target.closest("tr") != null || this.#onScrollbar(event, target)) {
            return;
        }
        const active = this.#document.activeElement;
        const cell = active == null ? null : this.#cells().firstOrDefault(e => e.value.element.contains(active));
        if (cell != null && cell.value.element !== active) {
            return;
        }
        event.preventDefault();
        if (cell == null) {
            this.focusActiveCellOrFirstHeader();
        }
    }

    /**
     * Moves focus from a cell as a key does. `onArrive` is called with the cell focus moves to, once it has it: in a
     * virtual list, that can be after the row scrolls into view.
     */
    public navigate(cellKey: string, navigationKey: string, onArrive?: (cell: NavigationData) => void): boolean {
        this.#pendingFocus = null;
        this.#onArrive = onArrive ?? null;
        try {
            return this.#navigateBy(cellKey, navigationKey);
        } finally {
            this.#onArrive = null;
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
        if (this.#bodyEmptied != null && data.section === "body") {
            this.#scheduleBodyRefill();
        }
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
            // The user took the focus elsewhere while the body had no rows: it stays there when they come.
            if (this.#bodyEmptied != null && data.element !== this.#bodyEmptied.parked) {
                this.#bodyEmptied = null;
            }
            this.#cellHasFocus = true;
            this.#lostFocus = null;
            this.#setFocusedCell(key, data);
        }
    }

    /** Turns row navigation on or off: body rows are moved through as wholes, with focus on each row's first data cell. */
    public setRowNavigation(rowNavigation: boolean): void {
        this.#rowNavigation = rowNavigation;
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

    /**
     * Starts again at the first row, for rows that replaced every row, as another folder's do in a file list: it
     * becomes the current row, and takes the focus when `focus` is set (scrolled to in a virtual list).
     */
    public startAtFirstRow(focus: boolean): void {
        this.#bodyEmptied = null;
        this.#lostFocus = null;
        this.#pendingFocus = null;
        if (focus && this.#navigateToBodyEdge("first")) {
            return;
        }
        const first = this.#findFirstBodyCell();
        if (first == null) {
            return;
        }
        const target = this.#isRowCell(first.value) ? (this.#rowFocusCell(first.value.rowIndex) ?? first) : first;
        this.#setFocusedCell(target.key, target.value);
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
        if (data.section === "body" && fallback?.value.section !== "body") {
            this.#bodyEmptied = { parked: null };
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
        const current = this.#getFocusedCell();
        if (current && !this.#defaultTabStop) {
            return;
        }
        // Until the user picks a cell, the Tab stop follows the best default: header cells register before the body.
        const snapshot = current ? null : this.#lastFocusedCellSnapshot();
        const fallback = this.#findFallbackCell(snapshot);
        if (fallback && fallback.key !== current?.key) {
            this.#setFocusedCell(fallback.key, fallback.value);
            this.#defaultTabStop = snapshot == null;
        }
    }

    /** The cell in a row that spans a column: the column's own cell, or a column group title over it. */
    #findCellCovering(
        rowCells: readonly { key: string; value: NavigationData }[],
        colIndex: number
    ): { key: string; value: NavigationData } | undefined {
        return rowCells.find(e => e.value.colIndex <= colIndex && colIndex < e.value.colIndex + (e.value.colSpan ?? 1));
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

        // Tab lands on the data. The body is what scrolls, so its scrolling stays reachable from the keyboard, and
        // Arrow Up still reaches the headers.
        return this.#findFirstBodyCell() ?? this.#findFirstHeaderCell() ?? this.#findFirstCell();
    }

    #findFirstBodyCell(): { key: string; value: NavigationData } | null {
        return this.#cells()
            .where(d => d.value.section === "body")
            .orderBy(d => d.value.rowIndex)
            .thenBy(d => d.value.colIndex)
            .firstOrDefault();
    }

    #findFirstCell(): { key: string; value: NavigationData } | null {
        return this.#cells()
            .orderBy(d => this.#sectionOrder(d.value.section))
            .thenBy(d => d.value.rowIndex)
            .thenBy(d => d.value.colIndex)
            .firstOrDefault();
    }

    #findFirstHeaderCell(): { key: string; value: NavigationData } | null {
        // The column headers' row, under any column group rows, comes first in its column.
        return this.#cells()
            .where(d => d.value.section === "header")
            .orderBy(d => d.value.colIndex)
            .thenByDescending(d => d.value.rowIndex)
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
        // With row navigation, a body row's focus is on its first data cell.
        const target = this.#rowNavigation && this.#isRowCell(data) ? this.#rowFocusCell(data.rowIndex) : null;
        const [focusKey, focusData] = target == null ? [key, data] : [target.key, target.value];
        this.#focusElement(focusData.element, target != null);
        this.#setFocusedCell(focusKey, focusData);
        const onArrive = this.#onArrive;
        this.#onArrive = null;
        onArrive?.(focusData);
    }

    /**
     * Focuses a cell and scrolls it into view. A whole row, for row navigation, scrolls only as far as the row needs,
     * so a body scrolled sideways stays where it is.
     */
    #focusElement(element: HTMLTableCellElement, wholeRow = false): void {
        element.focus({ preventScroll: true });
        if (wholeRow) {
            (element.closest("tr") ?? element).scrollIntoView({ block: "nearest", inline: "nearest" });
            return;
        }
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
        this.#pendingFocus = { colIndex, onArrive: this.#onArrive, rowIndex };
        this.#onArrive = null;
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

    /** Whether a header row is a row of column group titles, which sits above the column headers. */
    #isColumnGroupRow(row: { rowIndex: number; section: GridNavigationSection }): boolean {
        return row.section === "header" && row.rowIndex < -1;
    }

    /** Whether a cell is in a data row of the body, which row navigation moves through as a whole. */
    #isRowCell(data: NavigationData): boolean {
        return data.section === "body" && !data.groupHeader && data.cellKind !== "detail";
    }

    #navigateBy(cellKey: string, navigationKey: string): boolean {
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
            case "FirstRow":
                return this.#navigateToBodyEdge("first");
            case "LastRow":
                return this.#navigateToBodyEdge("last");
            default:
                return false;
        }
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
        // Row navigation moves through body rows as wholes.
        if (!data || data.groupHeader || (this.#rowNavigation && this.#isRowCell(data))) {
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

    /** Moves to the first or last row of the body, for row navigation's Home and End. */
    #navigateToBodyEdge(edge: "first" | "last"): boolean {
        const column = this.#getTargetColumn();
        if (this.#rowScroller != null) {
            const count = this.#rowScroller.rowCount();
            const row = edge === "first" ? this.#navigableRowNear(0, "down") : this.#navigableRowNear(count - 1, "up");
            return row != null && this.#focusRow(row, column);
        }
        const rows = this.#cells()
            .where(e => e.value.section === "body")
            .select(e => e.value.rowIndex);
        if (rows.none()) {
            return false;
        }
        return this.#focusRow(edge === "first" ? rows.min() : rows.max(), column);
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
        // A column group's title keeps the column focus came up from, so Arrow Down goes back to it.
        if (!data.groupHeader && !this.#spansColumn(data, this.#getTargetColumn())) {
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

        let nextRow = this.#findNextRow(data.section, data.rowIndex, direction);
        let targetRowCells = nextRow == null ? [] : this.#findCellsInRow(nextRow.rowIndex, nextRow.section);
        // A column group row has no cell over a column outside its groups: the column's header goes on up there.
        while (
            nextRow != null &&
            this.#isColumnGroupRow(nextRow) &&
            this.#findCellCovering(targetRowCells, targetColIndex) == null
        ) {
            nextRow = this.#findNextRow(nextRow.section, nextRow.rowIndex, direction);
            targetRowCells = nextRow == null ? [] : this.#findCellsInRow(nextRow.rowIndex, nextRow.section);
        }
        if (nextRow == null) {
            return false;
        }
        if (nextRow.section === "body") {
            return this.#focusRow(nextRow.rowIndex, targetColIndex);
        }
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
            left.colSpan === right.colSpan &&
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
            this.#findCellCovering(rowCells, colIndex) ??
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

    /** Whether a press is on an element's scrollbar rather than its content. */
    #onScrollbar(event: MouseEvent, element: Element): boolean {
        if (element.clientWidth === 0 || element.clientHeight === 0) {
            return false;
        }
        // A start-side scrollbar, as in right-to-left, is left of the content.
        return event.offsetX < 0 || event.offsetX >= element.clientWidth || event.offsetY >= element.clientHeight;
    }

    /** The cell that holds a body row's focus with row navigation: its first data cell, or its first cell. */
    #rowFocusCell(rowIndex: number): { key: string; value: NavigationData } | null {
        const rowCells = this.#findCellsInRow(rowIndex, "body");
        return rowCells.find(e => e.value.cellKind === "data") ?? rowCells[0] ?? null;
    }

    #sameIdentity(data: NavigationData | NavigationCellSnapshot, snapshot: NavigationCellSnapshot): boolean {
        return (
            data.section === snapshot.section &&
            data.columnId === snapshot.columnId &&
            data.rowUid === snapshot.rowUid &&
            data.groupKey === snapshot.groupKey
        );
    }

    /**
     * Rows came to a body that had none: once every cell of the render has registered, the first row takes the Tab
     * stop back, and the focus with it when the focus is still where the grid moved it, or the rows took it with them.
     */
    #scheduleBodyRefill(): void {
        if (this.#bodyRefillScheduled) {
            return;
        }
        this.#bodyRefillScheduled = true;
        queueMicrotask(() => {
            this.#bodyRefillScheduled = false;
            const emptied = this.#bodyEmptied;
            if (emptied == null) {
                return;
            }
            const active = this.#document.activeElement;
            const parked = emptied.parked != null && active === emptied.parked;
            this.startAtFirstRow(parked || (this.#cellHasFocus && this.#focusIsLost(null)));
        });
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
            this.#onArrive = pending.onArrive;
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
        this.#defaultTabStop = false;
        this.#lastFocusedCellKey.set(key);
        this.#lastFocusedCellSnapshot.set(this.#createSnapshot(data));
    }

    /** Whether a cell spanning several columns, as a column group's title does, is over a column. */
    #spansColumn(data: NavigationData, colIndex: number): boolean {
        const colSpan = data.colSpan ?? 1;
        return colSpan > 1 && data.colIndex <= colIndex && colIndex < data.colIndex + colSpan;
    }
}

export type GridCellKind = "command" | "data" | "detail" | "filter" | "footer" | "group" | "header";

export type GridNavigationSection = "add" | "body" | "filter" | "footer" | "header";

/** Lets the navigation reach rows of a virtual list that aren't drawn. */
export interface GridNavigationRowScroller {
    /** The index of the data row with a uid, drawn or not; -1 when no row has it. */
    indexOfRow(rowUid: string): number;
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
    /** How many columns the cell spans from `colIndex`; 1 when left out. */
    colSpan?: number;
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
    /** Called with the cell once it has focus. */
    onArrive: ((cell: NavigationData) => void) | null;
    rowIndex: number;
}
