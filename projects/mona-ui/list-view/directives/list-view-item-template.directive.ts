import { Directive, input } from "@angular/core";
import type { ListViewItemTemplateContext } from "../models/ListViewItemTemplateContext";

/**
 * Template for each item of a list view. The data item is the template's implicit value (`let-item`). Bind the list
 * view's items to `monaListViewItemTemplateOf` to type it; without it, the item is `any` in templates.
 */
@Directive({
    selector: "ng-template[monaListViewItemTemplate]"
})
// `any` by default: a template without `monaListViewItemTemplateOf` keeps an untyped item, as before the guard existed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ListViewItemTemplateDirective<T = any> {
    /**
     * @description The list view's items, used only to type the template's item. Optional.
     * @default null
     */
    public readonly monaListViewItemTemplateOf = input<Iterable<T> | null | undefined>(null);

    public static ngTemplateContextGuard<T>(
        _directive: ListViewItemTemplateDirective<T>,
        _context: unknown
    ): _context is ListViewItemTemplateContext<T> {
        return true;
    }
}
