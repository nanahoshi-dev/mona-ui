import type { GridEditSession } from "./GridEditSession";
import type { Row } from "./Row";

export interface CellEditContext {
    readonly cellUid: string;
    readonly columnId: string;
    readonly mode: "cell";
    readonly row: Row;
    readonly rowUid: string;
    readonly session: GridEditSession;
}

export interface RowEditContext {
    readonly mode: "row";
    readonly row: Row;
    readonly rowUid: string;
    readonly session: GridEditSession;
}

export type GridEditContext = CellEditContext | RowEditContext;
