import { Directive, input } from "@angular/core";
import type { TimelineEventTemplateContext } from "../models/TimelineTemplateContext";

/**
 * Template for each event's details, in place of its description. On a collapsible timeline, it's what opens and closes.
 *
 * The event is the template's implicit value (`let-event`), with its date (`let-date="date"`), whether its details are
 * open (`let-expanded="expanded"`) and its index (`let-index="index"`). Bind the timeline's data to
 * `monaTimelineBodyTemplateOf` to type the event; without it, the event is `any` in templates.
 */
@Directive({
    selector: "ng-template[monaTimelineBodyTemplate]"
})
// `any` by default, so a template without `monaTimelineBodyTemplateOf` can read the event's fields.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class TimelineBodyTemplateDirective<T = any> {
    /**
     * @description The timeline's data, used only to type the template's event. Optional.
     * @default null
     */
    public readonly monaTimelineBodyTemplateOf = input<Iterable<T> | null | undefined>(null);

    public static ngTemplateContextGuard<T>(
        _directive: TimelineBodyTemplateDirective<T>,
        _context: unknown
    ): _context is TimelineEventTemplateContext<T> {
        return true;
    }
}
