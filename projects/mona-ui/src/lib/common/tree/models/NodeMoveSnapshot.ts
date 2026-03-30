export interface NodeMoveSnapshot<T> {
    readonly originalIndex: number;
    readonly originalParentUid: string | null;
    readonly sourceNodeUid: string;
}
