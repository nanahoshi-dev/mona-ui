import { Directive, input } from "@angular/core";
import type { TreeViewNodeTemplateContext } from "../models/TreeViewNodeTemplateContext";

/**
 * Template for each node's content. The data item is the template's implicit value (`let-dataItem`) and the node's
 * element is `element`. Bind the tree view's data to `monaTreeViewNodeTemplateOf` to type the data item; without it,
 * the data item is `any` in templates.
 */
@Directive({
    selector: "ng-template[monaTreeViewNodeTemplate]"
})
// `any` by default: a template without `monaTreeViewNodeTemplateOf` keeps an untyped data item, as before the guard.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class TreeViewNodeTemplateDirective<T = any> {
    /**
     * @description The tree view's data, used only to type the template's data item. Optional.
     * @default null
     */
    public readonly monaTreeViewNodeTemplateOf = input<Iterable<T> | null | undefined>(null);

    public static ngTemplateContextGuard<T>(
        _directive: TreeViewNodeTemplateDirective<T>,
        _context: unknown
    ): _context is TreeViewNodeTemplateContext<T> {
        return true;
    }
}
