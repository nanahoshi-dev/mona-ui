import type { GridGroupAggregate } from "./GridAggregate";
import type { Row } from "./Row";

/** A single row of the grid body — either a group header, a group footer, or a data row. */
export type GridViewRow = GridViewGroupRow | GridViewGroupFooterRow | GridViewDataRow;

/** A group header row in the flattened grid view. */
export interface GridViewGroupRow {
    /** The number of data rows (leaf rows) contained in this group. */
    readonly count: number;
    /** The nesting depth (0 = top-level group). */
    readonly depth: number;
    /** The field this group is grouped by. */
    readonly field: string;
    /** A unique identifier for this group (used for collapse tracking). */
    readonly groupKey: string;
    /** The display value for this group header. */
    readonly groupValue: unknown;
    /** A key that identifies this row among all body rows, for view tracking. */
    readonly key: string;
    /** The display title for this group header. */
    readonly title: string;
    readonly type: "group";
}

/** A footer row for a grouped section in the flattened grid view. */
export interface GridViewGroupFooterRow {
    /** The nesting depth (0 = top-level group). */
    readonly depth: number;
    /** The aggregate metadata for this grouped footer. */
    readonly groupAggregate: GridGroupAggregate;
    /** A key that identifies this row among all body rows, for view tracking. */
    readonly key: string;
    readonly type: "groupFooter";
}

/** A data row in the flattened grid view. */
export interface GridViewDataRow {
    /** The depth of the innermost group this row belongs to, or 0 when the grid is not grouped. */
    readonly depth: number;
    /** The groupKey of the innermost group this row belongs to, or null when the grid is not grouped. */
    readonly groupKey: string | null;
    /** A key that identifies this row among all body rows, for view tracking. */
    readonly key: string;
    /** The actual Row model. */
    readonly row: Row;
    readonly type: "data";
}
