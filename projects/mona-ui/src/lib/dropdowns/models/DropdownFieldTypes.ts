import { Predicate, Selector } from "@mirei/ts-collections";

export type DropdownFieldSelectionType<TData> = string | Selector<TData, string> | null;
export type DropdownFieldPredicateType<TData> = string | Predicate<TData> | null;
