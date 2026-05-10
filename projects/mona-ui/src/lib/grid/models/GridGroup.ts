import type { Column } from "./Column";
import type { Row } from "./Row";

/** A single flattened row in the grid view — either a group header or a data row. */
export type GridViewRow = GridViewGroupRow | GridViewDataRow;

/** A group header row in the flattened grid view. */
export interface GridViewGroupRow {
    readonly type: "group";
    /** The nesting depth (0 = top-level group). */
    readonly depth: number;
    /** The column this group is grouped by. */
    readonly column: Column;
    /** A unique identifier for this group (used for collapse tracking). */
    readonly groupKey: string;
    /** The display value for this group header. */
    readonly groupValue: unknown;
    /** The number of data rows (leaf rows) contained in this group. */
    readonly count: number;
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
