import type { GridEditSchemaFactory } from "./GridEditFormContext";

/** A row command button: Edit, Remove, Save or Cancel. */
export type GridRowCommand = "cancel" | "edit" | "remove" | "save";

/** `T` is the row type, which a typed `schema` sets. */
export interface EditableOptions<T extends object = Record<PropertyKey, unknown>> {
    /**
     * Returns the accessible name of a row's command button, such as "Edit order 10248". Without it the
     * buttons are named by position ("Edit row 3"). `absoluteIndex` is the row's 0-based position in the
     * filtered and sorted rows; the add row isn't passed here.
     */
    commandAriaLabel?: (
        command: GridRowCommand,
        rowData: Record<PropertyKey, unknown>,
        absoluteIndex: number
    ) => string;
    /** Whether editing is active. On unless set to `false`; options replace earlier ones. */
    enabled?: boolean;
    /** Whether editing commits per cell or per row. */
    mode: "cell" | "row";
    /** Builds a Signal Forms validation schema for the row being edited. */
    schema?: GridEditSchemaFactory<T>;
}
