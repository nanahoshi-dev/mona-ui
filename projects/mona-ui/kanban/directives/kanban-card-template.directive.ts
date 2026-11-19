import { Directive, input } from "@angular/core";
import type { KanbanCardTemplateContext } from "../models/KanbanTemplateContext";

/**
 * Template for each card of a Kanban board. The card is the template's implicit value (`let-card`), with its column
 * (`let-column="column"`) and its index in the column (`let-index="index"`). Bind the board's data to
 * `monaKanbanCardTemplateOf` to type the card; without it, the card is `any` in templates.
 */
@Directive({
    selector: "ng-template[monaKanbanCardTemplate]"
})
// `any` by default, so a template without `monaKanbanCardTemplateOf` can read the card's fields.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class KanbanCardTemplateDirective<T = any> {
    /**
     * @description The board's data, used only to type the template's card. Optional.
     * @default null
     */
    public readonly monaKanbanCardTemplateOf = input<Iterable<T> | null | undefined>(null);

    public static ngTemplateContextGuard<T>(
        _directive: KanbanCardTemplateDirective<T>,
        _context: unknown
    ): _context is KanbanCardTemplateContext<T> {
        return true;
    }
}
