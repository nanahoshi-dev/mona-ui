import { Selector } from "@mirei/ts-collections";

/** The field holding a row's key, or a function returning it. */
export type GridKeySelector<TData, TKey = unknown> = string | Selector<TData, TKey> | null;
