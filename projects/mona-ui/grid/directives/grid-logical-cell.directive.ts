import { Clipboard } from "@angular/cdk/clipboard";
import {
    afterNextRender,
    afterRenderEffect,
    computed,
    DestroyRef,
    Directive,
    ElementRef,
    inject,
    input,
    output,
    signal,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent } from "rxjs";
import { GRID_CELL_FOCUSABLE_SELECTOR, isKeyboardEntryElement } from "../services/grid-cell-tab-stops";
import {
    GridCellKind,
    GridNavigationSection,
    GridNavigationService,
    NavigationData
} from "../services/grid-navigation.service";
import { GridService } from "../services/grid.service";

/** Keys that move focus between cells. */
const NAVIGATION_KEYS: ReadonlySet<string> = new Set([
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "End",
    "Home",
    "PageDown",
    "PageUp"
]);
/** Elements that Tab can reach outside the grid. */
const PAGE_TABBABLE_SELECTOR = `${GRID_CELL_FOCUSABLE_SELECTOR}, summary, [contenteditable]`;

/**
 * A cell the grid's keyboard navigation can reach. Arrows, Home, End, PageUp and PageDown move between
 * cells; Enter or F2 starts an edit or moves into the controls inside the cell, where Tab and the arrows
 * move between them and Escape returns to the cell, and Enter on a cell with neither activates its row. Tab
 * itself leaves the grid: only one cell is in the page Tab order.
 */
@Directive({
    selector: "td[monaGridLogicalCell], th[monaGridLogicalCell]",
    host: {
        "[attr.tabindex]": "focused() ? 0 : -1",
        "[attr.aria-colindex]": "resolvedAriaColIndex()",
        "[attr.aria-readonly]": "readOnly()",
        "[attr.aria-selected]": "rangeSelected()"
    }
})
export class GridLogicalCellDirective {
    readonly #cellData = computed(() => {
        const data: NavigationData = {
            cellKind: this.resolvedCellKind(),
            colIndex: this.colIndex(),
            colSpan: this.columnSpan(),
            columnId: this.columnId(),
            editable: this.editable(),
            element: this.#hostElementRef.nativeElement,
            firstInRow: this.firstInRow(),
            groupHeader: this.groupHeader(),
            groupKey: this.groupKey(),
            lastInRow: this.lastInRow(),
            rowIndex: this.rowIndex(),
            rowUid: this.rowUid(),
            section: this.resolvedSection(),
            startEdit: this.editable() ? this.#startEdit : undefined
        };
        return data;
    });
    readonly #cellKey = signal<string | null>(null);
    readonly #clipboard = inject(Clipboard);
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #gridService = inject(GridService);
    readonly #hostElementRef = inject(ElementRef<HTMLTableCellElement>);
    readonly #startEdit = (): void => {
        this.edit.emit();
    };
    protected readonly focused = computed(() => {
        const key = this.#cellKey();
        if (!key) {
            return false;
        }
        return this.#gridNavigationService.isFocused(key);
    });
    /** With range selection on, whether a body data cell is in the selected range; `null` for other cells. */
    protected readonly rangeSelected = computed(() => {
        const rowUid = this.rowUid();
        const columnId = this.columnId();
        if (
            !this.#gridService.rangeSelectionEnabled() ||
            this.resolvedSection() !== "body" ||
            this.resolvedCellKind() !== "data" ||
            rowUid == null ||
            columnId == null
        ) {
            return null;
        }
        return this.#gridService.isCellInRange(rowUid, columnId);
    });
    protected readonly resolvedAriaColIndex = computed(
        () => this.ariaColIndex() ?? this.colIndex() + this.#gridService.groupColumns().length + 1
    );
    protected readonly resolvedCellKind = computed<GridCellKind>(() => {
        const cellKind = this.cellKind();
        if (cellKind != null) {
            return cellKind;
        }
        if (this.groupHeader()) {
            return "group";
        }
        if (this.#hostElementRef.nativeElement.tagName === "TH") {
            return "header";
        }
        return "data";
    });
    protected readonly resolvedSection = computed<GridNavigationSection>(() => {
        const section = this.section();
        if (section != null) {
            return section;
        }
        return this.#hostElementRef.nativeElement.tagName === "TH" ? "header" : "body";
    });
    /**
     * @description Emits the key press when `Enter` on the cell has no other use: it doesn't expand, sort, edit, or
     * move into the cell's controls.
     */
    public readonly activate = output<KeyboardEvent>();
    /**
     * @description The cell's `aria-colindex` when it isn't its column's place in the layout, as for a group
     * row's title cell, which follows the group's indents.
     */
    public readonly ariaColIndex = input<number | null>(null);
    public readonly cellKind = input<GridCellKind | null>(null);
    public readonly colIndex = input.required<number>();
    public readonly columnId = input<string>();
    /**
     * @description How many navigation columns the cell spans from `colIndex`, as a column group's title does. Arrow
     * Up and Arrow Down reach it from any of them.
     */
    public readonly columnSpan = input(1);
    public readonly edit = output();

    /**
     * @description Marks the cell as a participant in Tab-driven cell edit traversal.
     */
    public readonly editable = input(false);
    /**
     * @description Whether the cell's row or group is expanded; ArrowRight expands a collapsed group row or tree row
     * and ArrowLeft collapses an expanded one. `null` when there's nothing to expand.
     */
    public readonly expanded = input<boolean | null>(null);
    public readonly firstInRow = input.required<boolean>();
    public readonly groupHeader = input<boolean>(false);
    public readonly groupKey = input<string>();
    public readonly lastInRow = input.required<boolean>();
    /**
     * @description Emits on Alt+ArrowDown in a header cell, to open the column's filter menu.
     */
    public readonly menuOpen = output();
    /**
     * @description The cell's `aria-readonly`: whether its column can't be edited, or `null` when the grid
     * doesn't edit.
     */
    public readonly readOnly = input<boolean | null>(null);
    public readonly rowIndex = input.required<number>();
    public readonly rowUid = input<string>();
    public readonly section = input<GridNavigationSection | null>(null);
    public readonly toggleExpand = output();
    /**
     * @description Whether the cell shows its row's tree toggle: ArrowRight expands the row and ArrowLeft collapses
     * it, and ArrowLeft at the start of the row moves to the parent row.
     */
    public readonly treeCell = input(false);

    public constructor() {
        // Registering the rendered cell writes the navigation registry's signals.
        afterRenderEffect({
            mixedReadWrite: () => {
                const data = this.#cellData();
                // Cached virtual views must not re-register in response to another view's registry writes.
                untracked(() => {
                    const previousCellKey = this.#cellKey();
                    const nextCellKey = this.#gridNavigationService.registerCell(data);
                    if (previousCellKey && previousCellKey !== nextCellKey) {
                        this.#gridNavigationService.unregisterCell(previousCellKey, data.element);
                    }
                    this.#cellKey.set(nextCellKey);
                });
            }
        });
        afterNextRender({
            read: () => this.#setKeyboardNavigation()
        });
        this.#destroyRef.onDestroy(() => {
            const cellKey = this.#cellKey();
            if (!cellKey) {
                return;
            }
            this.#gridNavigationService.unregisterCell(cellKey, this.#hostElementRef.nativeElement);
        });
    }

    /**
     * Moves focus to the next control outside the grid, as Tab would. Used when Tab ends an edit in the last
     * editable cell, where the key was already taken; returns false when there is nowhere to go.
     */
    public leaveGrid(backwards: boolean): boolean {
        const host: HTMLTableCellElement = this.#hostElementRef.nativeElement;
        const document = host.ownerDocument;
        const position = backwards ? Node.DOCUMENT_POSITION_PRECEDING : Node.DOCUMENT_POSITION_FOLLOWING;
        const candidates = Array.from(document.querySelectorAll<HTMLElement>(PAGE_TABBABLE_SELECTOR)).filter(
            candidate =>
                candidate.tabIndex >= 0 &&
                !host.contains(candidate) &&
                !candidate.contains(host) &&
                (host.compareDocumentPosition(candidate) & position) !== 0 &&
                !this.#isElementDisabled(candidate) &&
                !this.#isElementHidden(candidate)
        );
        for (const candidate of backwards ? candidates.reverse() : candidates) {
            candidate.focus();
            // Hidden or inert elements don't take focus: try the next one.
            if (document.activeElement === candidate) {
                return true;
            }
        }
        return false;
    }

    #copyCellText(event: KeyboardEvent): void {
        // The physical key, so copying works with Caps Lock and with non-Latin layouts.
        if (!(event.ctrlKey || event.metaKey) || event.altKey || event.code !== "KeyC") {
            return;
        }
        if (this.rowIndex() < 0 || this.#gridService.isInEditMode()) {
            return;
        }
        // Text the user selected is theirs to copy.
        const selection = this.#hostElementRef.nativeElement.ownerDocument.getSelection();
        if (selection != null && !selection.isCollapsed && selection.toString() !== "") {
            return;
        }
        // A selected range copies as tab-separated text, which spreadsheets paste as cells.
        const rangeText = this.#gridService.cellRangeBounds() == null ? null : this.#gridService.getCellRangeText();
        if (rangeText != null) {
            event.preventDefault();
            this.#clipboard.copy(rangeText);
            return;
        }
        // The rendered text; textContent where there is no layout to give innerText.
        const host: HTMLElement = this.#hostElementRef.nativeElement;
        const text = (host.innerText ?? host.textContent ?? "").trim();
        if (text) {
            this.#clipboard.copy(text);
        }
    }

    /** Moves focus into the cell, to its first control. */
    #enterCell(): boolean {
        const target = this.#getInnerFocusableTargets()[0];
        if (!target) {
            return false;
        }
        target.focus();
        return true;
    }

    #focusNextInnerTarget(currentTarget: HTMLElement, backwards: boolean, wrap: boolean): boolean {
        const targets = this.#getInnerFocusableTargets();
        if (targets.length === 0) {
            return false;
        }
        const currentIndex = targets.findIndex(target => target === currentTarget || target.contains(currentTarget));
        let nextIndex = currentIndex === -1 ? 0 : currentIndex + (backwards ? -1 : 1);
        if (nextIndex < 0 || nextIndex >= targets.length) {
            if (!wrap) {
                return false;
            }
            nextIndex = (nextIndex + targets.length) % targets.length;
        }
        targets[nextIndex].focus();
        return true;
    }

    /** Moves focus to the same cell of the row's parent in a tree; false when there's no parent shown. */
    #focusTreeParent(): boolean {
        const rowUid = this.rowUid();
        const columnId = this.columnId();
        if (!this.treeCell() || rowUid == null || columnId == null) {
            return false;
        }
        const parentUid = this.#gridService.getTreeParentUid(rowUid);
        return parentUid != null && this.#gridNavigationService.focusBodyCell(parentUid, columnId);
    }

    #getInnerFocusableTargets(): HTMLElement[] {
        const host = this.#hostElementRef.nativeElement;
        const targets = Array.from(host.querySelectorAll(GRID_CELL_FOCUSABLE_SELECTOR)) as HTMLElement[];
        return targets.filter(
            target => target !== host && !this.#isElementDisabled(target) && !this.#isElementHidden(target)
        );
    }

    /** Keys pressed on a control inside the cell. */
    #handleInnerKeydown(event: KeyboardEvent, target: HTMLElement): void {
        // An open editor handles its own keys, except in the row editor's command cell.
        if (this.#gridService.isInEditMode() && this.resolvedCellKind() !== "command") {
            return;
        }
        const host = this.#hostElementRef.nativeElement;
        if (event.key === "Escape") {
            event.preventDefault();
            host.focus();
            return;
        }

        if (event.key === "Tab") {
            event.preventDefault();
            if (this.#focusNextInnerTarget(target, event.shiftKey, false)) {
                return;
            }
            // Past the last control, Tab goes on to the next cell; before the first, back to this cell.
            host.focus();
            if (!event.shiftKey) {
                this.#navigate("ArrowRight");
            }
            return;
        }

        // Text fields, lists and sliders use the arrows themselves.
        if (isKeyboardEntryElement(target)) {
            return;
        }
        const key = this.#toLogicalArrowKey(event.key);
        if (key === "ArrowRight" || key === "ArrowDown") {
            event.preventDefault();
            this.#focusNextInnerTarget(target, false, true);
        } else if (key === "ArrowLeft" || key === "ArrowUp") {
            event.preventDefault();
            this.#focusNextInnerTarget(target, true, true);
        }
    }

    /**
     * With range selection on, Shift and an arrow extend the range of cells, Ctrl+A selects every cell, and Escape
     * clears the range. Returns whether the key was one of them.
     */
    #handleRangeKey(event: KeyboardEvent): boolean {
        const rowUid = this.rowUid();
        const columnId = this.columnId();
        if (
            !this.#gridService.rangeSelectionEnabled() ||
            this.resolvedSection() !== "body" ||
            this.resolvedCellKind() !== "data" ||
            rowUid == null ||
            columnId == null
        ) {
            return false;
        }
        if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.code === "KeyA") {
            if (this.#gridService.selectAllCells()) {
                event.preventDefault();
            }
            return true;
        }
        if (event.key === "Escape" && this.#gridService.cellRange() != null) {
            event.preventDefault();
            this.#gridService.clearCellRange();
            return true;
        }
        if (!event.shiftKey || event.altKey || event.ctrlKey || event.metaKey || !event.key.startsWith("Arrow")) {
            return false;
        }
        event.preventDefault();
        const anchor = this.#gridService.cellRange()?.anchor ?? { columnId, rowUid };
        if (!this.#navigate(this.#toLogicalArrowKey(event.key))) {
            return true;
        }
        const next = this.#gridNavigationService.getFocusedCell();
        if (next?.section === "body" && next.cellKind === "data" && next.rowUid != null && next.columnId != null) {
            this.#gridService.setCellRange(anchor, { columnId: next.columnId, rowUid: next.rowUid });
        }
        return true;
    }

    /**
     * With row navigation, the keys of a data row in the body: the arrows, PageUp and PageDown move by rows, Home and
     * End to the first and last row, and moving selects as in a file list. ArrowLeft and ArrowRight don't move, so the
     * body scrolls, except on a tree row's cell, which expands and collapses. Returns whether the key was one of them.
     */
    #handleRowKey(event: KeyboardEvent): boolean {
        const rowUid = this.rowUid();
        if (
            !this.#gridService.rowNavigation() ||
            this.resolvedSection() !== "body" ||
            this.groupHeader() ||
            this.resolvedCellKind() === "detail" ||
            rowUid == null ||
            event.altKey
        ) {
            return false;
        }
        switch (event.key) {
            case "ArrowDown":
            case "ArrowUp":
            case "PageDown":
            case "PageUp":
                event.preventDefault();
                this.#moveToRow(event.key, event);
                return true;
            case "Home":
            case "End":
                event.preventDefault();
                this.#moveToRow(event.key === "Home" ? "FirstRow" : "LastRow", event);
                return true;
            case "ArrowLeft":
            case "ArrowRight":
                return !this.treeCell();
            case " ":
                if (this.#gridService.handleRowSpace(rowUid, event)) {
                    event.preventDefault();
                }
                return true;
            default:
                return false;
        }
    }

    /** Space, Shift+Space, Shift+ArrowUp/Down and Ctrl+A select rows. Returns whether the key was one of them. */
    #handleSelectionKey(event: KeyboardEvent): boolean {
        const rowUid = this.rowUid();
        if (this.resolvedSection() !== "body" || this.groupHeader() || rowUid == null) {
            return false;
        }
        if (event.key === " " && !event.ctrlKey && !event.metaKey && !event.altKey) {
            if (this.#gridService.selectRowFromKeyboard(rowUid, event.shiftKey)) {
                event.preventDefault();
            }
            return true;
        }
        if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.code === "KeyA") {
            if (this.#gridService.selectAllRowsFromKeyboard()) {
                event.preventDefault();
            }
            return true;
        }
        if (event.shiftKey && !event.altKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            if (!this.#navigate(event.key)) {
                return true;
            }
            const next = this.#gridNavigationService.getFocusedCell();
            if (next?.section === "body" && !next.groupHeader && next.rowUid != null) {
                this.#gridService.selectRowFromKeyboard(next.rowUid, true);
            }
            return true;
        }
        return false;
    }

    #isElementDisabled(element: HTMLElement): boolean {
        if (
            (element instanceof HTMLButtonElement ||
                element instanceof HTMLInputElement ||
                element instanceof HTMLSelectElement ||
                element instanceof HTMLTextAreaElement) &&
            element.disabled
        ) {
            return true;
        }

        return element.getAttribute("aria-disabled") === "true" || element.hasAttribute("disabled");
    }

    #isElementHidden(element: HTMLElement): boolean {
        return element.closest("[hidden], [inert]") != null || element.getAttribute("aria-hidden") === "true";
    }

    #moveToRow(navigationKey: string, event: KeyboardEvent): void {
        const cellKey = this.#cellKey();
        if (!cellKey) {
            return;
        }
        this.#gridService.clearCellRange();
        this.#gridNavigationService.navigate(cellKey, navigationKey, cell => {
            if (cell.section === "body" && !cell.groupHeader && cell.rowUid != null) {
                this.#gridService.handleRowKeyboardMove(cell.rowUid, event);
            }
        });
    }

    #navigate(navigationKey: string): boolean {
        const cellKey = this.#cellKey();
        if (!cellKey) {
            return false;
        }
        return this.#gridNavigationService.navigate(cellKey, navigationKey);
    }

    /**
     * Enter expands or sorts where F2 wouldn't, then does what F2 does. Where neither has a use, as on a cell of a
     * read-only grid, it activates the row.
     */
    #onEnterKey(event: KeyboardEvent): void {
        if (this.groupHeader() || this.resolvedSection() === "header" || this.resolvedCellKind() === "detail") {
            this.toggleExpand.emit();
            return;
        }
        if (!this.#onF2Key()) {
            this.activate.emit(event);
        }
    }

    /**
     * F2 edits an editable cell, or the row from any data cell when the grid edits by row; on any other cell it
     * moves into the cell's controls. Returns whether it did either.
     */
    #onF2Key(): boolean {
        if (this.editable()) {
            this.edit.emit();
            return true;
        }
        if (this.#enterCell()) {
            return true;
        }
        const editableOptions = this.#gridService.editableOptions();
        if (this.resolvedCellKind() === "data" && editableOptions.enabled === true && editableOptions.mode === "row") {
            this.edit.emit();
            return true;
        }
        return false;
    }

    #onHostKeydown(event: KeyboardEvent): void {
        if (event.defaultPrevented || event.isComposing) {
            return;
        }
        const target = event.target as HTMLElement | null;
        const host = this.#hostElementRef.nativeElement;
        if (target && target !== host) {
            this.#handleInnerKeydown(event, target);
            return;
        }

        this.#copyCellText(event);
        if (this.#handleRowKey(event) || this.#handleRangeKey(event) || this.#handleSelectionKey(event)) {
            return;
        }

        const command = event.ctrlKey || event.metaKey;
        if (NAVIGATION_KEYS.has(event.key)) {
            // Moving on without Shift leaves the range behind, as in a spreadsheet.
            this.#gridService.clearCellRange();
        }
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                if (event.altKey) {
                    this.#onAltArrowDown();
                    return;
                }
                this.#navigate("ArrowDown");
                return;
            case "ArrowUp":
                event.preventDefault();
                this.#navigate("ArrowUp");
                return;
            case "ArrowLeft":
            case "ArrowRight": {
                const key = this.#toLogicalArrowKey(event.key);
                // A group row or a tree row expands with ArrowRight and collapses with ArrowLeft, as in a tree.
                const expanded = this.expanded();
                if ((this.groupHeader() || this.treeCell()) && expanded === (key === "ArrowLeft")) {
                    event.preventDefault();
                    this.toggleExpand.emit();
                    return;
                }
                if (this.#navigate(key) || (key === "ArrowLeft" && this.#focusTreeParent())) {
                    event.preventDefault();
                }
                return;
            }
            case "Enter":
                event.preventDefault();
                this.#onEnterKey(event);
                return;
            case "F2":
                event.preventDefault();
                this.#onF2Key();
                return;
            case "Home":
                event.preventDefault();
                this.#navigate(command ? "CtrlHome" : "Home");
                return;
            case "End":
                event.preventDefault();
                this.#navigate(command ? "CtrlEnd" : "End");
                return;
            case "PageDown":
            case "PageUp":
                if (this.#navigate(event.key)) {
                    event.preventDefault();
                }
                return;
        }
    }

    #onAltArrowDown(): void {
        if (this.resolvedSection() === "header") {
            this.menuOpen.emit();
            return;
        }
        this.toggleExpand.emit();
    }

    #setKeyboardNavigation(): void {
        const host = this.#hostElementRef.nativeElement;
        fromEvent<FocusEvent>(host, "focus")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                const key = this.#cellKey();
                // With row navigation, a click on another cell of a row hands the focus to the row's first cell.
                if (key && !this.#gridNavigationService.focusRowOf(key)) {
                    this.#gridNavigationService.setLastFocusedCellKey(key);
                }
            });
        fromEvent<FocusEvent>(host, "blur")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => this.#gridNavigationService.notifyCellBlur());

        // One keydown listener per cell handles copying, selection and navigation.
        fromEvent<KeyboardEvent>(host, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(e => this.#onHostKeydown(e));
    }

    /**
     * Maps a horizontal arrow key to its logical meaning: ArrowRight moves to the next column in LTR
     * and to the previous column in RTL, where columns run right to left.
     */
    #toLogicalArrowKey(key: string): string {
        // Read on demand: a direction observer per cell would be costly in large grids.
        const host = this.#hostElementRef.nativeElement;
        if (host.ownerDocument.defaultView?.getComputedStyle(host).direction !== "rtl") {
            return key;
        }
        if (key === "ArrowLeft") {
            return "ArrowRight";
        }
        return key === "ArrowRight" ? "ArrowLeft" : key;
    }
}
