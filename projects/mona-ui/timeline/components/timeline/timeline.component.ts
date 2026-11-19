import { NgTemplateOutlet } from "@angular/common";
import { booleanAttribute, Component, computed, contentChild, inject, input, model, TemplateRef } from "@angular/core";
import { LucideChevronDown } from "@lucide/angular";
import {
    CollapsibleContentDirective,
    CollapsibleDirective,
    CollapsibleTriggerDirective
} from "@nanahoshi/mona-ui/collapsible";
import { formatGregorianDateToLocaleString, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { toHeadingLevel } from "@nanahoshi/mona-ui/internal";
import { twMerge } from "tailwind-merge";
import { TimelineBodyTemplateDirective } from "../../directives/timeline-body-template.directive";
import { TimelineDateTemplateDirective } from "../../directives/timeline-date-template.directive";
import { TimelineHeaderTemplateDirective } from "../../directives/timeline-header-template.directive";
import { TimelineMarkerTemplateDirective } from "../../directives/timeline-marker-template.directive";
import type { TimelineOrientation } from "../../models/TimelineOrientation";
import type { TimelineEventTemplateContext } from "../../models/TimelineTemplateContext";
import {
    TIMELINE_BODY_CLASSES,
    TIMELINE_COLLAPSIBLE_BODY_CLASSES,
    TIMELINE_DOT_CLASSES,
    TIMELINE_HEADER_CLASSES,
    TIMELINE_SUBTITLE_CLASSES,
    TIMELINE_TITLE_CLASSES,
    TIMELINE_TRIGGER_CLASSES,
    timelineAxisThemeVariants,
    timelineBaseThemeVariants,
    timelineCardThemeVariants,
    timelineChevronThemeVariants,
    timelineContentThemeVariants,
    timelineDateThemeVariants,
    timelineItemThemeVariants,
    type TimelineLayout,
    timelineLineThemeVariants,
    timelineListThemeVariants,
    timelineMarkerThemeVariants
} from "../../styles/timeline.styles";
import { readTimelineDate, showsTime, toDateTimeAttribute } from "../../utils/timeline-dates";

/** What an event shows, read from its fields once for each change of the data or the fields. */
interface TimelineEntry<T> {
    readonly date: Date | null;
    readonly dateText: string;
    readonly dateTime: string | null;
    readonly description: string;
    readonly event: T;
    readonly key: unknown;
    readonly subtitle: string;
    readonly title: string;
}

/** An event as the template renders it: what it shows, whether its details are open, and its classes. */
interface TimelineItem<T> extends TimelineEntry<T> {
    readonly classes: {
        readonly axis: string;
        readonly content: string;
        readonly date: string;
        readonly item: string;
        readonly line: string;
    };
    readonly context: TimelineEventTemplateContext<T>;
    /** Whether the event has details to show: a description, or a body template. */
    readonly hasDetails: boolean;
}

function readField(event: object, field: string): unknown {
    return field.length > 0 ? (event as Record<string, unknown>)[field] : undefined;
}

function readText(event: object, field: string): string {
    const value = readField(event, field);
    return value == null ? "" : String(value);
}

/**
 * @description
 * Events in order along a line: each one's date, a marker on the line, and a card with its title, subtitle and
 * description. It runs down the page, with the cards on one side of the line or on alternating sides, or across it,
 * scrolling sideways. It's an ordered list to assistive technology, each event's date read before its card, whose title
 * is a heading. On a collapsible timeline, each card's header is a button that opens its details.
 *
 * The events are shown in the order of `data`, so sort them the way they should read: oldest first, or newest first.
 */
@Component({
    selector: "mona-timeline",
    templateUrl: "./timeline.component.html",
    imports: [
        NgTemplateOutlet,
        CollapsibleContentDirective,
        CollapsibleDirective,
        CollapsibleTriggerDirective,
        LucideChevronDown
    ],
    host: {
        // The name is the list's, not the host's, which has no role to carry it.
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null",
        "[class]": "baseClass()"
    }
})
export class TimelineComponent<T extends object = Record<string, unknown>> {
    /** What each event shows. It doesn't depend on which events are open, so opening one formats no dates. */
    readonly #entries = computed<TimelineEntry<T>[]>(() => {
        const dateField = this.dateField();
        const descriptionField = this.descriptionField();
        const format = this.dateFormat();
        const keyField = this.keyField();
        const locale = this.#i18n.localeId();
        const subtitleField = this.subtitleField();
        const titleField = this.titleField();
        const withTime = showsTime(format);
        return Array.from(this.data(), event => {
            const date = readTimelineDate(readField(event, dateField));
            return {
                date,
                dateText: date == null ? "" : formatGregorianDateToLocaleString(date, locale, format),
                dateTime: date == null ? null : toDateTimeAttribute(date, withTime),
                description: readText(event, descriptionField),
                event,
                key: keyField ? readField(event, keyField) : event,
                subtitle: readText(event, subtitleField),
                title: readText(event, titleField)
            };
        });
    });
    readonly #horizontal = computed(() => this.orientation() === "horizontal");
    readonly #i18n = inject(MonaI18nService);
    readonly #layout = computed<TimelineLayout>(() => {
        if (this.#horizontal()) {
            return "horizontal";
        }
        return this.alternate() ? "alternate" : "vertical";
    });
    protected readonly baseClass = computed(() =>
        twMerge(timelineBaseThemeVariants({ container: this.#layout() === "alternate" }), this.userClass())
    );
    protected readonly bodyClass = TIMELINE_BODY_CLASSES;
    protected readonly bodyTemplate = contentChild(TimelineBodyTemplateDirective, { read: TemplateRef });
    protected readonly collapsibleBodyClass = TIMELINE_COLLAPSIBLE_BODY_CLASSES;
    protected readonly collapsibleCardClass = timelineCardThemeVariants({ collapsible: true });
    protected readonly dateTemplate = contentChild(TimelineDateTemplateDirective, { read: TemplateRef });
    protected readonly dotClass = TIMELINE_DOT_CLASSES;
    protected readonly headerClass = TIMELINE_HEADER_CLASSES;
    protected readonly headerTemplate = contentChild(TimelineHeaderTemplateDirective, { read: TemplateRef });
    protected readonly headingRole = computed(() => (this.headingLevel() === null ? null : "heading"));
    protected readonly items = computed<TimelineItem<T>[]>(() => {
        const collapsible = this.collapsible();
        const entries = this.#entries();
        const expandedKeys = new Set(this.expandedKeys());
        const hasBodyTemplate = this.bodyTemplate() != null;
        const horizontal = this.#horizontal();
        const layout = this.#layout();
        const alternate = this.alternate();
        return entries.map((entry, index) => {
            const first = index === 0;
            const last = index === entries.length - 1;
            const flipped = alternate && index % 2 === 1;
            return {
                ...entry,
                classes: {
                    axis: timelineAxisThemeVariants({ layout }),
                    content: timelineContentThemeVariants({ flipped, last, layout }),
                    date: timelineDateThemeVariants({ flipped, layout }),
                    item: timelineItemThemeVariants({ layout }),
                    line: first && last ? "" : timelineLineThemeVariants({ first, horizontal, last })
                },
                context: {
                    $implicit: entry.event,
                    date: entry.date,
                    expanded: !collapsible || expandedKeys.has(entry.key),
                    index
                },
                hasDetails: hasBodyTemplate || entry.description.length > 0
            };
        });
    });
    protected readonly listClass = computed(() => timelineListThemeVariants({ horizontal: this.#horizontal() }));
    /** A horizontal timeline scrolls, so it takes focus to scroll with the arrow keys. */
    protected readonly listTabIndex = computed(() => (this.#horizontal() ? 0 : null));
    protected readonly markerClass = computed(() => timelineMarkerThemeVariants({ horizontal: this.#horizontal() }));
    protected readonly markerTemplate = contentChild(TimelineMarkerTemplateDirective, { read: TemplateRef });
    protected readonly staticCardClass = timelineCardThemeVariants({ collapsible: false });
    protected readonly subtitleClass = TIMELINE_SUBTITLE_CLASSES;
    protected readonly titleClass = TIMELINE_TITLE_CLASSES;
    protected readonly triggerClass = TIMELINE_TRIGGER_CLASSES;

    /**
     * @description Puts the cards on alternating sides of the line: on a vertical timeline, after it and before it, once
     * the timeline is 32rem wide, with each date on the side across from its card; on a horizontal one, below it and
     * above it.
     * @default false
     */
    public readonly alternate = input(false, { transform: booleanAttribute });

    /**
     * @description The timeline's name, such as "Project history", which assistive technology reads with its list.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description The id of an element that names the timeline, such as a heading above it.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Makes each card's header a button that opens and closes its details: its description, or its body
     * template. The open events are `expandedKeys`; all are closed by default.
     * @default false
     */
    public readonly collapsible = input(false, { transform: booleanAttribute });

    /**
     * @description The events, in the order they're shown.
     */
    public readonly data = input.required<Iterable<T>>();

    /**
     * @description The field of each event that holds its date: a `Date`, a timestamp in milliseconds, or an ISO 8601
     * string, which is in local time unless it gives an offset. An event without one shows no date.
     * @default "date"
     */
    public readonly dateField = input("date");

    /**
     * @description How each event's date is formatted, in the locale, such as `{ year: "numeric", month: "long" }`.
     * The `<time>` element around it holds the date, and its time too when the format shows one.
     * @default { dateStyle: "medium" }
     */
    public readonly dateFormat = input<Intl.DateTimeFormatOptions>({ dateStyle: "medium" });

    /**
     * @description The field of each event shown as its details, below its title.
     * @default "description"
     */
    public readonly descriptionField = input("description");

    /**
     * @description The keys of the events whose details are open, on a collapsible timeline: the values of their
     * `keyField`, or the events themselves without one. Bind it two-way, `[(expandedKeys)]`, to follow the user's
     * toggles.
     * @default []
     */
    public readonly expandedKeys = model<readonly unknown[]>([]);

    /**
     * @description The level of each event's heading, its title, from 1 to 6. Set it to fit the page's outline, or to
     * `null` for no headings.
     * @default 3
     */
    public readonly headingLevel = input<number | null, unknown>(3, { transform: toHeadingLevel });

    /**
     * @description The field of each event that identifies it in `expandedKeys`, so an open event stays open when the
     * data is replaced with copies. Without it, an event is its own key.
     * @default ""
     */
    public readonly keyField = input("");

    /**
     * @description Which way the timeline runs: `"vertical"`, down the page, or `"horizontal"`, across it, scrolling
     * sideways when its events don't fit. A horizontal timeline takes focus, so the arrow keys scroll it.
     * @default "vertical"
     */
    public readonly orientation = input<TimelineOrientation>("vertical");

    /**
     * @description The field of each event shown below its title, such as a place or a person.
     * @default "subtitle"
     */
    public readonly subtitleField = input("subtitle");

    /**
     * @description The field of each event shown as its title, the heading of its card.
     * @default "title"
     */
    public readonly titleField = input("title");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`. A horizontal timeline's
     * events are 16rem wide; set `--mona-timeline-event-width` to change it, as in
     * `class="[--mona-timeline-event-width:20rem]"`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    protected chevronClass(expanded: boolean): string {
        return timelineChevronThemeVariants({ expanded });
    }

    protected onExpandedChange(item: TimelineItem<T>, expanded: boolean): void {
        const keys = this.expandedKeys().filter(key => key !== item.key);
        this.expandedKeys.set(expanded ? [...keys, item.key] : keys);
    }
}
