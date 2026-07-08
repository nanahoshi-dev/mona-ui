import type { GridEditSchemaFactory } from "./GridEditFormContext";

export interface EditableOptions {
    enabled?: boolean;
    mode: "cell" | "row";
    schema?: GridEditSchemaFactory;
}
