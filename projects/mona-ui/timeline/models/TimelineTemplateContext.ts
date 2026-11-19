/**
 * The context of a timeline's templates, `monaTimelineHeaderTemplate`, `monaTimelineBodyTemplate`,
 * `monaTimelineDateTemplate` and `monaTimelineMarkerTemplate`: the event, as `let-event`.
 */
export interface TimelineEventTemplateContext<T = unknown> {
    /** The event (`let-event`). */
    readonly $implicit: T;
    /** The event's date, read from its date field, or `null` when it has none (`let-date="date"`). */
    readonly date: Date | null;
    /** Whether the event's details are open: always `true` unless the timeline is collapsible (`let-expanded="expanded"`). */
    readonly expanded: boolean;
    /** The event's index in the timeline's data (`let-index="index"`). */
    readonly index: number;
}
