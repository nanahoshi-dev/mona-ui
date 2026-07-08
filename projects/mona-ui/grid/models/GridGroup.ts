import type { GridGroupAggregate } from "./GridAggregate";
import type { Row } from "./Row";

/** A single flattened row in the grid view — either a group header, group footer, or a data row. */
export type GridViewRow = GridViewGroupRow | GridViewGroupFooterRow | GridViewDataRow;

/** A group header row in the flattened grid view. */
export interface GridViewGroupRow {
    readonly type: "group";
    /** The nesting depth (0 = top-level group). */
    readonly depth: number;
    /** The field this group is grouped by. */
    readonly field: string;
    /** A unique identifier for this group (used for collapse tracking). */
    readonly groupKey: string;
    /** The display value for this group header. */
    readonly groupValue: unknown;
    /** The number of data rows (leaf rows) contained in this group. */
    readonly count: number;
    /** The display title for this group header. */
    readonly title: string;
}

/** A footer row for a grouped section in the flattened grid view. */
export interface GridViewGroupFooterRow {
    readonly type: "groupFooter";
    /** The nesting depth (0 = top-level group). */
    readonly depth: number;
    /** The aggregate metadata for this grouped footer. */
    readonly groupAggregate: GridGroupAggregate;
}

/** A data row in the flattened grid view. */
export interface GridViewDataRow {
    readonly type: "data";
    /** The nesting depth (depth of the innermost group this row belongs to). */
    readonly depth: number;
    /** The actual Row model. */
    readonly row: Row;
    /** The groupKey of the innermost group this row belongs to. */
    readonly groupKey: string;
}
