import type { TemplateRef } from "@angular/core";
import type { DataType } from "@nanahoshi/mona-ui/common";
import type { SortDirection } from "@nanahoshi/mona-ui/query";
import type { AggregateFunction } from "./AggregateFunction";
import type { GridColumnLockedPosition } from "./GridColumnLockedPosition";

export type ColumnKind = "command" | "data";
/**
 * Formats a cell's value for display. Written in method form so a formatter typed for the column's own
 * value (`(value: number) => string`) is accepted.
 */
export type ColumnFormatFunction = {
    format(value: unknown, row: Record<PropertyKey, unknown>, column: Column): string;
}["format"];
/** A date format string (date, datetime and time columns), or a formatter function. */
export type ColumnFormat = string | ColumnFormatFunction;
/** Compares two cell values for sorting: negative, zero or positive, as for `Array.prototype.sort`. */
export type ColumnSortComparator = { compare(left: unknown, right: unknown): number }["compare"];

export interface ColumnConfig {
    /** The aggregate shown in the grid footer for this column, or `null` for none. */
    readonly aggregate: AggregateFunction | null;
    /** The column's `monaGridCellTemplate`, which renders its body cells, or `null` for the default text. */
    readonly cellTemplate: TemplateRef<unknown> | null;
    /** A command column's `monaGridCellTemplate`, which replaces the built-in command buttons, or `null`. */
    readonly commandTemplate: TemplateRef<unknown> | null;
    /**
     * The `editable` input as the consumer set it; `null` leaves it to the default, which is every column but
     * the `rowKey` field. Left out, `editable` is used as given.
     */
    readonly configuredEditable?: boolean | null;
    /** The column's data type, which picks the editor and the filter. Command columns use `"string"`. */
    readonly dataType: DataType;
    /**
     * The column's `monaGridEditTemplate`, which renders the cell editor, or `null` for the editor of its data type.
     */
    readonly editTemplate: TemplateRef<unknown> | null;
    /** Whether the column can be edited. The grid resolves it from {@link configuredEditable} when that is set. */
    readonly editable: boolean;
    /** The data property the column shows. A command column uses its `stateKey`, or `"commands"`. */
    readonly field: string;
    /** Whether the column can be filtered when the grid's filtering is enabled. */
    readonly filterable: boolean;
    /** The column's `monaGridFooterTemplate`, which renders its footer cell, or `null`. */
    readonly footerTemplate: TemplateRef<unknown> | null;
    /** How cell values are formatted for display, or `null` to show them as they are. */
    readonly format: ColumnFormat | null;
    /** The column's `monaGridGroupFooterTemplate`, which renders its cell in group footer rows, or `null`. */
    readonly groupFooterTemplate: TemplateRef<unknown> | null;
    /**
     * The column's `monaGridHeaderTemplate`, which replaces the whole header content and receives the column, or
     * `null`.
     */
    readonly headerTemplate: TemplateRef<unknown> | null;
    /** The column's `hidden` input as set. */
    readonly hidden: boolean;
    /** A unique id generated for the column. */
    readonly id: string;
    /** `"data"` for a `mona-grid-column`, `"command"` for a `mona-grid-command-column`. */
    readonly kind: ColumnKind;
    /** Whether the column stays fixed while the grid scrolls horizontally. */
    readonly locked: boolean;
    /** The side of the grid a locked column is fixed to. */
    readonly lockedPosition: GridColumnLockedPosition;
    /** The column's maximum width in pixels, or `null` for no maximum. */
    readonly maxWidth: number | null;
    /** The column's minimum width in pixels, or `null` for no minimum. */
    readonly minWidth: number | null;
    /**
     * Whether the built-in remove command asks for confirmation before emitting `remove`. Only command columns set it.
     */
    readonly removeConfirmation: boolean;
    /** Compares values when the user sorts this column; without it values sort by type, strings by locale. */
    readonly sortComparator?: ColumnSortComparator | null;
    /** Whether the column can be sorted from its header when the grid's sorting is enabled. */
    readonly sortable: boolean;
    /** The key the column's saved state is stored under, or `null` to use `field`. */
    readonly stateKey: string | null;
    /** The text shown in the column header. */
    readonly title: string;
    /**
     * The column's `monaGridColumnTitleTemplate`, shown in the header in place of `title` when there is no header
     * template, or `null`.
     */
    readonly titleTemplate: TemplateRef<unknown> | null;
    /** The column's configured width in pixels, or `null` to size it automatically. */
    readonly width: number | null;
}

/**
 * Set `locked` and `lockedPosition` on a `mona-grid-column` (or `mona-grid-command-column`) to keep it fixed while the
 * grid scrolls horizontally.
 */
export interface Column extends ColumnConfig {
    /** The column's currently rendered width. */
    readonly calculatedWidth: number | null;
    /** The direction the grid is currently sorted by this column, or `null` when it isn't. */
    readonly columnSortDirection: SortDirection | null;
    /**
     * The column's `hidden` input as set. `hidden` follows it whenever the input changes, and can differ from it after
     * the user or saved state hides or shows the column.
     */
    readonly configuredHidden: boolean;
    /** Whether a filter is currently applied to this column. */
    readonly filtered: boolean;
    /** The sort direction of the grid's grouping by this column, or `null` when the grid isn't grouped by it. */
    readonly groupSortDirection: SortDirection | null;
    /** Whether the column is hidden. */
    readonly hidden: boolean;
    /**
     * The column's zero-based position in the grid's column order, after left-locked columns are moved to the start and
     * right-locked ones to the end.
     */
    readonly index: number;
    /** The column's one-based position among the grid's sorted columns, or `null` when it isn't sorted. */
    readonly sortIndex: number | null;
}
