import { Selector } from "@mirei/ts-collections";

export type GridKeySelector<TData, TKey = unknown> = string | Selector<TData, TKey> | null;
