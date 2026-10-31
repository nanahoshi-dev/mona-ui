import type { Column } from "./Column";
import type { GridStickyState } from "./GridStickyState";
import type { StructuralColumnKind } from "./StructuralColumn";

/**
 * A single physical column of the grid tables, in inline-start to inline-end order.
 * Every table section (header, body, add row, footer) renders the same sequence of layout columns.
 */
export type GridLayoutColumn = GridLayoutDataColumn | GridLayoutGroupColumn | GridLayoutStructuralColumn;

/** A user-defined data or command column. */
export interface GridLayoutDataColumn {
    readonly column: Column;
    /** The index among the visible user columns. */
    readonly columnIndex: number;
    readonly key: string;
    readonly kind: "column";
    /** The keyboard-navigation column index. */
    readonly logicalIndex: number;
    readonly sticky: GridStickyState | null;
    readonly width: number | null;
}

/** An indent column rendered for each active group level. It does not participate in keyboard navigation. */
export interface GridLayoutGroupColumn {
    readonly depth: number;
    readonly key: string;
    readonly kind: "group";
    readonly logicalIndex: null;
    readonly sticky: GridStickyState | null;
    readonly width: number;
}

/** A built-in column such as the row reorder handle, the detail toggle or the selection checkbox. */
export interface GridLayoutStructuralColumn {
    readonly key: string;
    readonly kind: StructuralColumnKind;
    /** The keyboard-navigation column index. */
    readonly logicalIndex: number;
    readonly sticky: GridStickyState | null;
    readonly width: number;
}
