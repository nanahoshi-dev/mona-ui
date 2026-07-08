import type { FieldTree } from "@angular/forms/signals";
import type { WritableSignal } from "@angular/core";
import type { Column } from "./Column";
import type { GridEditOperation } from "./GridEditOperation";
import type { Row } from "./Row";

export interface GridEditSession {
    readonly column: Column | null;
    readonly field: string | null;
    readonly form: FieldTree<Record<PropertyKey, unknown>>;
    readonly isNew: boolean;
    readonly mode: "cell" | "row";
    readonly model: WritableSignal<Record<PropertyKey, unknown>>;
    readonly operation: GridEditOperation;
    readonly originalRowData: Record<PropertyKey, unknown> | null;
    readonly row: Row | null;
    readonly rowUid: string | null;
}
