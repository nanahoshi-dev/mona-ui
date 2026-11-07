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
    readonly aggregate: AggregateFunction | null;
    readonly cellTemplate: TemplateRef<unknown> | null;
    readonly commandTemplate: TemplateRef<unknown> | null;
    /**
     * The `editable` input as the consumer set it; `null` leaves it to the default, which is every column but
     * the `rowKey` field. Left out, `editable` is used as given.
     */
    readonly configuredEditable?: boolean | null;
    readonly dataType: DataType;
    readonly editTemplate: TemplateRef<unknown> | null;
    /** Whether the column can be edited. The grid resolves it from {@link configuredEditable} when that is set. */
    readonly editable: boolean;
    readonly field: string;
    readonly filterable: boolean;
    readonly footerTemplate: TemplateRef<unknown> | null;
    readonly format: ColumnFormat | null;
    readonly groupFooterTemplate: TemplateRef<unknown> | null;
    readonly headerTemplate: TemplateRef<unknown> | null;
    readonly hidden: boolean;
    readonly id: string;
    readonly kind: ColumnKind;
    readonly locked: boolean;
    readonly lockedPosition: GridColumnLockedPosition;
    readonly maxWidth: number | null;
    readonly minWidth: number | null;
    readonly removeConfirmation: boolean;
    /** Compares values when the user sorts this column; without it values sort by type, strings by locale. */
    readonly sortComparator?: ColumnSortComparator | null;
    readonly sortable: boolean;
    readonly stateKey: string | null;
    readonly title: string;
    readonly titleTemplate: TemplateRef<unknown> | null;
    readonly width: number | null;
}

/**
 * Set `locked` and `lockedPosition` on a `mona-grid-column` (or `mona-grid-command-column`) to keep it fixed while the
 * grid scrolls horizontally.
 */
export interface Column extends ColumnConfig {
    /** The column's currently rendered width. */
    readonly calculatedWidth: number | null;
    readonly columnSortDirection: SortDirection | null;
    readonly configuredHidden: boolean;
    /** Whether a filter is currently applied to this column. */
    readonly filtered: boolean;
    readonly groupSortDirection: SortDirection | null;
    /** Whether the column is hidden. */
    readonly hidden: boolean;
    readonly index: number;
    readonly sortIndex: number | null;
}
