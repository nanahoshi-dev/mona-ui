import { Directive, input } from "@angular/core";
import type { ListBoxItemTemplateContext } from "../models/ListBoxItemTemplateContext";

/**
 * Template for each item of a list box. The data item is the template's implicit value (`let-item`). Bind the list
 * box's items to `monaListBoxItemTemplateOf` to type it; without it, the item is `any` in templates.
 */
@Directive({
    selector: "ng-template[monaListBoxItemTemplate]"
})
// `any` by default: a template without `monaListBoxItemTemplateOf` keeps an untyped item, as before the guard existed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ListBoxItemTemplateDirective<T = any> {
    /**
     * @description The list box's items, used only to type the template's item. Optional.
     * @default null
     */
    public readonly monaListBoxItemTemplateOf = input<Iterable<T> | null | undefined>(null);

    public static ngTemplateContextGuard<T>(
        _directive: ListBoxItemTemplateDirective<T>,
        _context: unknown
    ): _context is ListBoxItemTemplateContext<T> {
        return true;
    }
}
