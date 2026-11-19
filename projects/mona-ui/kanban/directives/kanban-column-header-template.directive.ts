import { Directive, input } from "@angular/core";
import type { KanbanColumnTemplateContext } from "../models/KanbanTemplateContext";

/**
 * Template for the header of each column of a Kanban board, in place of its title and count. The column is the
 * template's implicit value (`let-column`), with its cards (`let-cards="cards"`) and how many there are
 * (`let-count="count"`). The header names the column's list, so keep the title in it.
 */
@Directive({
    selector: "ng-template[monaKanbanColumnHeaderTemplate]"
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class KanbanColumnHeaderTemplateDirective<T = any> {
    /**
     * @description The board's data, used only to type the template's cards. Optional.
     * @default null
     */
    public readonly monaKanbanColumnHeaderTemplateOf = input<Iterable<T> | null | undefined>(null);

    public static ngTemplateContextGuard<T>(
        _directive: KanbanColumnHeaderTemplateDirective<T>,
        _context: unknown
    ): _context is KanbanColumnTemplateContext<T> {
        return true;
    }
}
