// `any` by default, so an event annotated without a type argument keeps untyped items.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ListBoxSelectionEvent<T = any> {
    readonly deselectedItems: T[];
    readonly selectedItems: T[];
}
