import { Directive, input } from "@angular/core";
import type { TimelineEventTemplateContext } from "../models/TimelineTemplateContext";

/**
 * Template for each event's date label, in place of its date formatted with `dateFormat`, such as a relative date. Write the date in a `<time>` element with a `datetime` attribute.
 *
 * The event is the template's implicit value (`let-event`), with its date (`let-date="date"`), whether its details are
 * open (`let-expanded="expanded"`) and its index (`let-index="index"`). Bind the timeline's data to
 * `monaTimelineDateTemplateOf` to type the event; without it, the event is `any` in templates.
 */
@Directive({
    selector: "ng-template[monaTimelineDateTemplate]"
})
// `any` by default, so a template without `monaTimelineDateTemplateOf` can read the event's fields.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class TimelineDateTemplateDirective<T = any> {
    /**
     * @description The timeline's data, used only to type the template's event. Optional.
     * @default null
     */
    public readonly monaTimelineDateTemplateOf = input<Iterable<T> | null | undefined>(null);

    public static ngTemplateContextGuard<T>(
        _directive: TimelineDateTemplateDirective<T>,
        _context: unknown
    ): _context is TimelineEventTemplateContext<T> {
        return true;
    }
}
