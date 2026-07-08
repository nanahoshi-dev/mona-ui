import { Predicate, Selector } from "@mirei/ts-collections";

export type DropdownFieldSelectorType<TData> = string | Selector<TData, string> | null | undefined;
export type DropdownFieldPredicateType<TData> = string | Predicate<TData> | null | undefined;
