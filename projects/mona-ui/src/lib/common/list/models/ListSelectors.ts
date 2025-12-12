import { Selector } from "@mirei/ts-collections";

export type ListKeySelector<T, K = unknown> = string | Selector<T, K> | null;
