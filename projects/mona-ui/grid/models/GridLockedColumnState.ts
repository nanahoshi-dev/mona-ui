import { GridColumnLockedPosition } from "./GridColumnLockedPosition";

export interface GridLockedColumnState {
    readonly edge: boolean;
    readonly offset: number;
    readonly side: GridColumnLockedPosition;
}
