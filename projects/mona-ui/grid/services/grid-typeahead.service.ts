import { inject, Injectable, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { findTypeaheadMatch, isTypeaheadKey, setupTypeahead, TYPEAHEAD_RESET_DELAY } from "@nanahoshi/mona-ui/internal";
import { Subject } from "rxjs";
import { GridNavigationService } from "./grid-navigation.service";
import { GridService } from "./grid.service";

/** Keys that move the focus, which end a search. */
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

const NO_MODIFIERS = { ctrlKey: false, metaKey: false, shiftKey: false };

/** A row's text for typeahead: the name of the field holding it, or a function that gives it. */
export type GridTextField<T = unknown> = string | ((item: T) => string);

/**
 * Typeahead in the grid's body: typing the first letters of a row's text moves the focus to the row, as in a file list.
 * It searches every row of the body, in the order shown, not only the rows a virtual grid has drawn.
 */
@Injectable()
export class GridTypeaheadService {
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #gridService = inject(GridService);
    readonly #key$ = new Subject<string>();
    /** The body row the focus was on when the last key was typed, by its index among the body rows. */
    #focusedRowIndex = -1;
    /**
     * A row the search moved the focus to that a virtual grid hasn't drawn yet, and the row the focus is still on: the
     * next key goes on from the row being scrolled to.
     */
    #pending: { readonly from: number; readonly to: number } | null = null;
    /** The row the search goes on from: the focused one, or the one it moves the focus to. */
    #rowIndex = -1;
    /** Until when a space continues the search rather than selecting. */
    #typingUntil = 0;

    /** Where a row's text comes from; `null` or `""` turns typeahead off. */
    public readonly textField = signal<GridTextField | null>(null);

    public constructor() {
        setupTypeahead(this.#key$)
            .pipe(takeUntilDestroyed())
            .subscribe(buffer => this.#find(buffer));
    }

    /**
     * Takes a key pressed in the grid before the cell's own handling: a key that types something, on a body cell
     * itself rather than a control inside it, feeds the search. While a search is under way, a space is part of it.
     * Keys that move the focus end the search. Returns whether the key was typed.
     */
    public handleKeydown(event: KeyboardEvent): boolean {
        if (this.#textOf() == null || event.defaultPrevented || event.isComposing) {
            return false;
        }
        if (NAVIGATION_KEYS.has(event.key)) {
            this.#reset();
            return false;
        }
        if (!isTypeaheadKey(event.key, event) || (event.key === " " && Date.now() >= this.#typingUntil)) {
            return false;
        }
        const cell = this.#gridNavigationService.getCellAt(event.target as Element | null);
        if (
            cell == null ||
            cell.element !== event.target ||
            cell.section !== "body" ||
            cell.cellKind === "detail" ||
            this.#gridService.isInEditMode()
        ) {
            return false;
        }
        event.preventDefault();
        const pending = this.#pending;
        this.#pending = null;
        this.#focusedRowIndex = cell.rowIndex;
        this.#rowIndex = pending?.from === cell.rowIndex ? pending.to : cell.rowIndex;
        this.#typingUntil = Date.now() + TYPEAHEAD_RESET_DELAY;
        this.#key$.next(event.key);
        return true;
    }

    /** Moves the focus to the row the search finds, and selects it as an arrow key would. */
    #find(buffer: string): void {
        const textOf = this.#textOf();
        if (textOf == null) {
            return;
        }
        const rows = this.#gridService.bodyRows();
        const index = findTypeaheadMatch(buffer, rows.length, this.#rowIndex, i => {
            const row = rows[i];
            return row.type === "data" ? textOf(row.row.data) : null;
        });
        const match = rows[index];
        if (match?.type !== "data" || !this.#gridNavigationService.focusRowByUid(match.row.uid)) {
            return;
        }
        this.#rowIndex = index;
        if (this.#gridNavigationService.getFocusedCell()?.rowIndex !== index) {
            this.#pending = { from: this.#focusedRowIndex, to: index };
        }
        this.#gridService.clearCellRange();
        // Row navigation selects the row it moves to when rows select on click; moving by cell doesn't select.
        if (this.#gridService.rowNavigation()) {
            this.#gridService.handleRowKeyboardMove(match.row.uid, NO_MODIFIERS);
        }
    }

    #reset(): void {
        this.#pending = null;
        this.#typingUntil = 0;
        this.#key$.next("");
    }

    /** Gives a row's text from its data, or `null` without a text field. */
    #textOf(): ((data: Record<PropertyKey, unknown>) => string) | null {
        const field = this.textField();
        if (field == null || field === "") {
            return null;
        }
        if (typeof field === "function") {
            return data => field(data);
        }
        return data => {
            const value = data[field];
            return value == null ? "" : String(value);
        };
    }
}
