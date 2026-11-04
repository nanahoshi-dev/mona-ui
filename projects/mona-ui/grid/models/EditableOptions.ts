import type { GridEditSchemaFactory } from "./GridEditFormContext";

/** A row command button: Edit, Remove, Save or Cancel. */
export type GridRowCommand = "cancel" | "edit" | "remove" | "save";

export interface EditableOptions {
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
    enabled?: boolean;
    mode: "cell" | "row";
    schema?: GridEditSchemaFactory;
}
