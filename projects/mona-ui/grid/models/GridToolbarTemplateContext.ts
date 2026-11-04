import type { GridDataState } from "./GridDataState";
import type { GridEditSession } from "./GridEditSession";

/** The grid state and actions a toolbar template can use. */
export interface GridToolbarContext {
    /** The new row's values while a row is being added, otherwise `null`. */
    readonly addRowData: Record<PropertyKey, unknown> | null;
    /** Whether the add row is open. */
    readonly addRowVisible: boolean;
    /** Closes the add row without saving. Returns whether it closed. */
    cancelAdd(): boolean;
    /** Ends the current cell or row edit without saving. Returns whether an edit was cancelled. */
    cancelEdit(): boolean;
    /** The current paging, sorting and filtering. */
    readonly dataState: GridDataState;
    /** The current edit, or `null` when nothing is being edited. */
    readonly editSession: GridEditSession | null;
    /** Saves the add row. Returns whether it was saved. */
    saveAdd(): boolean;
    /** The selected row keys. */
    readonly selectedKeys: readonly unknown[];
    /** Opens the add row. Returns whether it opened. */
    startAdd(): boolean;
}

/** Context of `monaGridToolbarTemplate`: the toolbar state, also as `$implicit`. */
export interface GridToolbarTemplateContext extends GridToolbarContext {
    readonly $implicit: GridToolbarContext;
}
