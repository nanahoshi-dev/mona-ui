import { Directive, input } from "@angular/core";
import type { TileViewItemTemplateContext } from "../models/TileViewItemTemplateContext";

/**
 * Template for each tile of a tile view. The data item is the template's implicit value (`let-item`), and `selected`,
 * `active` and `index` describe the tile. Bind the tile view's items to `monaTileViewItemTemplateOf` to type the item;
 * without it, the item is `any` in templates.
 */
@Directive({
    selector: "ng-template[monaTileViewItemTemplate]"
})
// `any` by default: a template without `monaTileViewItemTemplateOf` keeps an untyped item.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class TileViewItemTemplateDirective<T = any> {
    /**
     * @description The tile view's items, used only to type the template's item. Optional.
     * @default null
     */
    public readonly monaTileViewItemTemplateOf = input<Iterable<T> | null | undefined>(null);

    public static ngTemplateContextGuard<T>(
        _directive: TileViewItemTemplateDirective<T>,
        _context: unknown
    ): _context is TileViewItemTemplateContext<T> {
        return true;
    }
}
