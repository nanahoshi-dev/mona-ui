import type { WritableSignal } from "@angular/core";
import type { FieldTree } from "@angular/forms/signals";
import type { Column } from "./Column";
import type { GridEditOperation } from "./GridEditOperation";
import type { Row } from "./Row";

export interface GridEditSession {
    /** The column currently being edited, in cell mode. */
    readonly column: Column | null;
    /** The field name currently being edited, in cell mode. */
    readonly field: string | null;
    /** The Signal Forms field tree backing the row being edited. */
    readonly form: FieldTree<Record<PropertyKey, unknown>>;
    /** Whether this session represents a new row being added. */
    readonly isNew: boolean;
    /** The active editing mode. */
    readonly mode: "cell" | "row";
    /** The signal holding the row's current edited values. */
    readonly model: WritableSignal<Record<PropertyKey, unknown>>;
    /** `"create"` or `"update"`. */
    readonly operation: GridEditOperation;
    /** The row's data before editing began. */
    readonly originalRowData: Record<PropertyKey, unknown> | null;
    /** The internal row wrapper being edited. */
    readonly row: Row | null;
    /** The stable identifier of the row being edited. */
    readonly rowUid: string | null;
}
