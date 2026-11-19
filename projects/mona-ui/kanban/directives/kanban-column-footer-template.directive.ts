import { Directive, input } from "@angular/core";
import type { KanbanColumnTemplateContext } from "../models/KanbanTemplateContext";

/**
 * Template for the foot of each column of a Kanban board, below its cards, such as for an Add card button. The column
 * is the template's implicit value (`let-column`), with its cards (`let-cards="cards"`) and how many there are
 * (`let-count="count"`).
 */
@Directive({
    selector: "ng-template[monaKanbanColumnFooterTemplate]"
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class KanbanColumnFooterTemplateDirective<T = any> {
    /**
     * @description The board's data, used only to type the template's cards. Optional.
     * @default null
     */
    public readonly monaKanbanColumnFooterTemplateOf = input<Iterable<T> | null | undefined>(null);

    public static ngTemplateContextGuard<T>(
        _directive: KanbanColumnFooterTemplateDirective<T>,
        _context: unknown
    ): _context is KanbanColumnTemplateContext<T> {
        return true;
    }
}
