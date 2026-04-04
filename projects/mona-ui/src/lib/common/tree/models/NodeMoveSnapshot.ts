export interface NodeMoveSnapshot {
    readonly originalIndex: number;
    readonly originalParentUid: string | null;
    readonly sourceNodeUid: string;
}
