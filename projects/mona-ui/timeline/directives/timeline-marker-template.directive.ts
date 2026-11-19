import { Directive, input } from "@angular/core";
import type { TimelineEventTemplateContext } from "../models/TimelineTemplateContext";

/**
 * Template for each event's marker on the line, in place of its dot, such as an icon for its status. It sits centered on the line. Assistive technology reads what it holds, so give an icon `aria-hidden="true"`, or text that says what it means.
 *
 * The event is the template's implicit value (`let-event`), with its date (`let-date="date"`), whether its details are
 * open (`let-expanded="expanded"`) and its index (`let-index="index"`). Bind the timeline's data to
 * `monaTimelineMarkerTemplateOf` to type the event; without it, the event is `any` in templates.
 */
@Directive({
    selector: "ng-template[monaTimelineMarkerTemplate]"
})
// `any` by default, so a template without `monaTimelineMarkerTemplateOf` can read the event's fields.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class TimelineMarkerTemplateDirective<T = any> {
    /**
     * @description The timeline's data, used only to type the template's event. Optional.
     * @default null
     */
    public readonly monaTimelineMarkerTemplateOf = input<Iterable<T> | null | undefined>(null);

    public static ngTemplateContextGuard<T>(
        _directive: TimelineMarkerTemplateDirective<T>,
        _context: unknown
    ): _context is TimelineEventTemplateContext<T> {
        return true;
    }
}
