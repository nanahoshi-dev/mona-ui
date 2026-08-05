import { Predicate, Selector } from "@mirei/ts-collections";

export type DropdownFieldSelectorType<TData, TResult = unknown> =
    | string
    | Selector<TData, TResult>
    | null
    | undefined;
export type DropdownFieldPredicateType<TData> = string | Predicate<TData> | null | undefined;
