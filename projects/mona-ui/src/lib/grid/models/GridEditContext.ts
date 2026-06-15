import type { Row } from "./Row";

export interface CellEditContext {
    readonly cellUid: string;
    readonly columnId: string;
    readonly mode: "cell";
    readonly row: Row;
    readonly rowUid: string;
}

export interface RowEditContext {
    readonly mode: "row";
    readonly row: Row;
    readonly rowUid: string;
}

export type GridEditContext = CellEditContext | RowEditContext;
