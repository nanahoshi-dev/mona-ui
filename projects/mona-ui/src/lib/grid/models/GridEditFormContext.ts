import type { SchemaOrSchemaFn } from "@angular/forms/signals";
import type { Column } from "./Column";
import type { GridEditOperation } from "./GridEditOperation";

export interface GridEditFormContext {
    readonly column: Column | null;
    readonly field: string | null;
    readonly isNew: boolean;
    readonly mode: "cell" | "row";
    readonly operation: GridEditOperation;
    readonly originalRowData: Record<PropertyKey, unknown> | null;
    readonly rowData: Record<PropertyKey, unknown>;
}

export type GridEditSchemaFactory = (
    context: GridEditFormContext
) => SchemaOrSchemaFn<Record<PropertyKey, unknown>> | null | undefined;
