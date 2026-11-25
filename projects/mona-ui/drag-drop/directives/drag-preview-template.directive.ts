import { Directive } from "@angular/core";
import type { DragPreviewContext } from "../models/DragPreviewContext";

/**
 * Template that follows the pointer while a grid's rows or a tile view's tiles are dragged, placed inside `mona-grid`
 * or `mona-tile-view`; for `monaDraggable`, pass it as `dragPreview`. What is dragged is the template's implicit value
 * (`let-data`), `effect` is what a drop would do where the pointer is, and `target` is the target there, so it can say
 * "Move to Documents". Screen readers skip it.
 */
@Directive({
    selector: "ng-template[monaDragPreview]"
})
export class DragPreviewTemplateDirective {
    public static ngTemplateContextGuard(
        _directive: DragPreviewTemplateDirective,
        _context: unknown
        // `any`: what is dragged, and onto what, is up to the app.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): _context is DragPreviewContext<any, any> {
        return true;
    }
}
