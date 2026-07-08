import { InjectionToken } from "@angular/core";
import type { Column } from "./Column";

export interface GridColumnDefinition {
    getColumn(): Column;
}

export const GRID_COLUMN_DEFINITION = new InjectionToken<GridColumnDefinition>("GRID_COLUMN_DEFINITION");
