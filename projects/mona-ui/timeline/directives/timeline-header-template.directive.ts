import { Directive, input } from "@angular/core";
import type { TimelineEventTemplateContext } from "../models/TimelineTemplateContext";

/**
 * Template for each event's header, in place of its title and subtitle. It's the event's heading and, on a collapsible timeline, the button that opens its details, so keep it to text and images: no links or controls.
 *
 * The event is the template's implicit value (`let-event`), with its date (`let-date="date"`), whether its details are
 * open (`let-expanded="expanded"`) and its index (`let-index="index"`). Bind the timeline's data to
 * `monaTimelineHeaderTemplateOf` to type the event; without it, the event is `any` in templates.
 */
@Directive({
    selector: "ng-template[monaTimelineHeaderTemplate]"
})
// `any` by default, so a template without `monaTimelineHeaderTemplateOf` can read the event's fields.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class TimelineHeaderTemplateDirective<T = any> {
    /**
     * @description The timeline's data, used only to type the template's event. Optional.
     * @default null
     */
    public readonly monaTimelineHeaderTemplateOf = input<Iterable<T> | null | undefined>(null);

    public static ngTemplateContextGuard<T>(
        _directive: TimelineHeaderTemplateDirective<T>,
        _context: unknown
    ): _context is TimelineEventTemplateContext<T> {
        return true;
    }
}
