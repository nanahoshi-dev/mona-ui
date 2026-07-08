import type { Column } from "./Column";

export interface ColumnResizeEvent {
    column: Column;
    newWidth: number;
    oldWidth: number;
}
