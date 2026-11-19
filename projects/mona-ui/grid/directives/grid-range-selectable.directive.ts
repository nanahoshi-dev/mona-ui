import {
    booleanAttribute,
    DestroyRef,
    Directive,
    effect,
    ElementRef,
    inject,
    input,
    output,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter, fromEvent, merge, takeUntil } from "rxjs";
import type { GridCellAddress, GridCellRange } from "../models/GridCellRange";
import type { GridRangePasteEvent } from "../models/GridRangePasteEvent";
import { GridNavigationService, type NavigationData } from "../services/grid-navigation.service";
import { GridService } from "../services/grid.service";

/** Controls that take a press themselves, so pressing them never starts a range. */
const OWN_PRESS_SELECTOR = "a, button, input, select, textarea, [contenteditable], [data-grid-tree-toggle]";

/**
 * Lets the user select a rectangle of cells: drag across them with the mouse, Shift+click the far corner, or extend
 * from the focused cell with Shift and the arrow keys. Ctrl+A selects every cell and Escape clears the range.
 * Ctrl+C copies the range as tab-separated text, which spreadsheets paste as cells. With `monaGridEditable`, Ctrl+V
 * pastes such text from the focused cell, or from the range's first cell, and `rangePaste` reports what changes.
 */
@Directive({
    selector: "mona-grid[monaGridRangeSelectable]",
    exportAs: "monaGridRangeSelectable"
})
export class GridRangeSelectableDirective<T = Record<PropertyKey, unknown>> {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #gridService = inject(GridService);
    readonly #hostElementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    /** Whether a paste event followed the last Ctrl+V, so the clipboard needn't be read another way. */
    #pasteEventSeen = true;

    /**
     * @description Turns range selection on; `false` turns it off.
     * @default true
     */
    public readonly enabled = input(true, {
        alias: "monaGridRangeSelectable",
        transform: (value: unknown) => value === "" || booleanAttribute(value)
    });

    /**
     * @description Emitted when the user changes the selected range, with the data items of its rows and the
     * fields of its columns, and with `null` when the range is cleared.
     */
    public readonly rangeChange = output<GridCellRange<T> | null>();

    /**
     * @description Emitted after a paste into the cells, with each changed row's data as it was and with the pasted
     * values. The grid doesn't change its data: save `rowData` as you would an edit. Only editable columns take
     * values, and only text that fits the column's type.
     */
    public readonly rangePaste = output<GridRangePasteEvent<T>>();

    public constructor() {
        effect(() => {
            const enabled = this.enabled();
            untracked(() => this.#gridService.setRangeSelectionEnabled(enabled));
        });
        this.#gridService.cellRangeChange$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            const range = this.#gridService.getCellRange();
            this.rangeChange.emit(
                range == null
                    ? null
                    : {
                          fields: range.columns.map(column => column.field),
                          rows: range.rows.map(row => row.data as T)
                      }
            );
        });
        this.#destroyRef.onDestroy(() => this.#gridService.setRangeSelectionEnabled(false));
        this.#setPointerSelection();
        this.#setPaste();
    }

    /** Clears the selected range. */
    public clearRange(): void {
        this.#gridService.clearCellRange();
    }

    /** Selects every cell of the current page, or of the whole view in a virtual grid. */
    public selectAll(): void {
        this.#gridService.selectAllCells();
    }

    /** The body data cell an event happened in, unless it happened on a control of its own or in an editor. */
    #cellOf(target: EventTarget | null): NavigationData | null {
        if (!(target instanceof Element) || target.closest(OWN_PRESS_SELECTOR) != null) {
            return null;
        }
        const cell = this.#gridNavigationService.getCellAt(target);
        return cell != null && isRangeCell(cell) ? cell : null;
    }

    #paste(text: string): void {
        const focused = this.#gridNavigationService.getFocusedCell();
        const at = focused != null && isRangeCell(focused) ? toAddress(focused) : null;
        const result = this.#gridService.pasteIntoCells(text, at);
        if (result != null) {
            this.rangePaste.emit(result as GridRangePasteEvent<T>);
        }
    }

    #setPaste(): void {
        const host = this.#hostElementRef.nativeElement;
        fromEvent<ClipboardEvent>(host, "paste")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                this.#pasteEventSeen = true;
                // Text fields, such as an open editor, paste into themselves.
                if (!this.#gridService.rangeSelectionEnabled() || isTextEntry(event.target)) {
                    return;
                }
                const text = event.clipboardData?.getData("text/plain") ?? "";
                if (text !== "") {
                    event.preventDefault();
                    this.#paste(text);
                }
            });
        // Some browsers fire no paste event while a cell, which isn't a text field, has focus: read the clipboard.
        fromEvent<KeyboardEvent>(host, "keydown")
            .pipe(
                filter(
                    event =>
                        (event.ctrlKey || event.metaKey) &&
                        !event.altKey &&
                        event.code === "KeyV" &&
                        this.#gridService.rangeSelectionEnabled() &&
                        !isTextEntry(event.target)
                ),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe(() => {
                this.#pasteEventSeen = false;
                setTimeout(() => {
                    const clipboard = host.ownerDocument.defaultView?.navigator.clipboard;
                    if (this.#pasteEventSeen || typeof clipboard?.readText !== "function") {
                        return;
                    }
                    clipboard.readText().then(
                        text => {
                            if (text !== "") {
                                this.#paste(text);
                            }
                        },
                        () => undefined
                    );
                });
            });
    }

    #setPointerSelection(): void {
        const host = this.#hostElementRef.nativeElement;
        const document = host.ownerDocument;
        fromEvent<PointerEvent>(host, "pointerdown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                if (
                    event.button !== 0 ||
                    event.ctrlKey ||
                    event.metaKey ||
                    event.altKey ||
                    !this.#gridService.rangeSelectionEnabled() ||
                    this.#gridService.isInEditMode()
                ) {
                    return;
                }
                const cell = this.#cellOf(event.target);
                if (cell == null) {
                    return;
                }
                if (event.shiftKey) {
                    // Shift+click selects from where the range started, or from the focused cell, to this cell.
                    const focused = this.#gridNavigationService.getFocusedCell();
                    const anchor =
                        this.#gridService.cellRange()?.anchor ??
                        (focused != null && isRangeCell(focused) ? toAddress(focused) : toAddress(cell));
                    event.preventDefault();
                    this.#gridService.setCellRange(anchor, toAddress(cell));
                    cell.element.focus();
                    return;
                }
                this.#gridService.clearCellRange();
                // Touch drags scroll the grid, so only a mouse or pen drags out a range.
                if (event.pointerType === "touch") {
                    return;
                }
                const anchor = toAddress(cell);
                const end$ = merge(fromEvent(document, "pointerup"), fromEvent(document, "pointercancel"));
                let dragged = false;
                fromEvent<PointerEvent>(document, "pointermove")
                    .pipe(takeUntil(end$), takeUntilDestroyed(this.#destroyRef))
                    .subscribe({
                        complete: () => {
                            // Focus follows the far corner, so Shift and the arrows go on from there.
                            const range = this.#gridService.cellRange();
                            if (dragged && range != null) {
                                this.#gridNavigationService.focusBodyCell(range.focus.rowUid, range.focus.columnId);
                            }
                        },
                        next: move => {
                            const over = this.#cellOf(document.elementFromPoint(move.clientX, move.clientY));
                            if (over == null) {
                                return;
                            }
                            const focus = toAddress(over);
                            if (!dragged && focus.rowUid === anchor.rowUid && focus.columnId === anchor.columnId) {
                                return;
                            }
                            dragged = true;
                            move.preventDefault();
                            this.#gridService.setCellRange(anchor, focus);
                        }
                    });
            });
    }
}

function isRangeCell(cell: NavigationData): boolean {
    return cell.section === "body" && cell.cellKind === "data" && cell.rowUid != null && cell.columnId != null;
}

function isTextEntry(target: EventTarget | null): boolean {
    return target instanceof Element && target.closest("input, textarea, select, [contenteditable]") != null;
}

function toAddress(cell: NavigationData): GridCellAddress {
    return { columnId: cell.columnId!, rowUid: cell.rowUid! };
}
