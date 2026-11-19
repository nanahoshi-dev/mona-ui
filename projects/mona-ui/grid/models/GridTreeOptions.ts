import type { GridKeySelector } from "./GridKeySelector";

/** The field holding a data item's children, or a function returning them. */
export type GridTreeChildren<T = Record<PropertyKey, unknown>> =
    string | { children(dataItem: T): Iterable<T> | null | undefined }["children"];

/** How a tree grid finds each row's parent: from nested children, or from a parent key in flat data. */
export interface GridTreeOptions {
    readonly children: GridTreeChildren | null;
    readonly parentKey: GridKeySelector<unknown> | null;
}
