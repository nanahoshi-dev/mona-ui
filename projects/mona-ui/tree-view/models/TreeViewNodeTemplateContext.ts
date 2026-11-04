/** The context of a `monaTreeViewNodeTemplate`. */
export interface TreeViewNodeTemplateContext<T> {
    /** The node's data item (`let-dataItem`). */
    readonly $implicit: T;

    /** The node's element (`let-element="element"`). */
    readonly element: HTMLElement;
}
