export type StructuralColumnKind = "detail" | "reorder" | "selection";

export interface StructuralColumnDescriptor {
    readonly kind: StructuralColumnKind;
    readonly visible: boolean;
    readonly width: number;
}
