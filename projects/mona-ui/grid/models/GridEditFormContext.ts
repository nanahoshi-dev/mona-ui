import type { SchemaOrSchemaFn } from "@angular/forms/signals";
import type { Column } from "./Column";
import type { GridEditOperation } from "./GridEditOperation";

/** What a schema factory is told about the edit. `T` is the row type, untyped unless you give one. */
export interface GridEditFormContext<T extends object = Record<PropertyKey, unknown>> {
    readonly column: Column | null;
    readonly field: string | null;
    readonly isNew: boolean;
    readonly mode: "cell" | "row";
    readonly operation: GridEditOperation;
    readonly originalRowData: T | null;
    readonly rowData: T;
}

/** Builds the Signal Forms schema for the row being edited. `T` is the row type, untyped unless you give one. */
export type GridEditSchemaFactory<T extends object = Record<PropertyKey, unknown>> = (
    context: GridEditFormContext<T>
) => SchemaOrSchemaFn<T> | null | undefined;
