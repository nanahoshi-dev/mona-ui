import { computed, Directive, inject, input, output } from "@angular/core";
import { formatGregorianDateToLocaleString, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { RippleDirective } from "@nanahoshi/mona-ui/ripple";
import type { CalendarVariantProps } from "../styles/calendar.styles";
import { calendarMonthViewDayThemeVariants } from "../styles/calendar.styles";
import { compareDates, toDayKey } from "../utils/compareDates";

/** A day of the month view: its date, and its day of the month. */
export interface MonthDayEntry {
    readonly key: Date;
    readonly value: number;
}

/** The day keys of a selected range's first and last days. */
export interface MonthDayRangeEnds {
    readonly end: string;
    readonly start: string;
}

/** Where a selected day sits in a range: an end, or a day between the ends. */
export type MonthDayRangePart = "end" | "middle" | "start";

/**
 * One day of the month view: a grid cell named by its full date ("Tuesday, November 4, 2026"). The calendar passes
 * the selection and the range preview as sets of day keys, so each cell answers in constant time.
 */
@Directive({
    selector: "[monaMonthDay]",
    hostDirectives: [RippleDirective],
    host: {
        "[attr.tabindex]": "focused() && !disabled() ? 0 : -1",
        "[attr.aria-current]": "isToday() ? 'date' : null",
        "[attr.aria-disabled]": "dayDisabled() ? 'true' : null",
        "[attr.aria-label]": "ariaLabel()",
        "[attr.aria-selected]": "selected() ? 'true' : null",
        "[attr.data-range]": "rangePart()",
        "[attr.data-range-preview]": "rangePreviewed() ? 'true' : null",
        "[class]": "baseClass()",
        "(click)": "onClick($event)",
        "(pointerenter)": "onPointerEnter()",
        role: "gridcell"
    }
})
export class MonthDayDirective {
    readonly #i18n = inject(MonaI18nService);
    readonly #key = computed(() => toDayKey(this.entry().key));
    protected readonly ariaLabel = computed(() =>
        formatGregorianDateToLocaleString(this.entry().key, this.#i18n.localeId(), {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        })
    );
    protected readonly baseClass = computed(() => {
        const disabled = this.dayDisabled();
        const focused = this.focused();
        const outside = this.outside();
        const rangeMiddle = this.rangePart() === "middle";
        const rangePreview = this.rangePreviewed();
        const rounded = this.rounded();
        // The days between a range's ends take the selected tint, so the ends stand out.
        const selected = this.selected() && !rangeMiddle;
        const today = this.isToday();
        return calendarMonthViewDayThemeVariants({
            disabled,
            focused,
            outside,
            rangeMiddle,
            rangePreview,
            rounded,
            selected,
            today
        });
    });
    protected readonly dayDisabled = computed(() => this.disabled() || this.isDayUnavailable()(this.entry().key));
    protected readonly focused = computed(() => compareDates(this.entry().key, this.navigatedDate(), "=="));
    protected readonly isToday = computed(() => compareDates(this.entry().key, this.today(), "=="));
    protected readonly outside = computed(() => {
        const entry = this.entry();
        const monthStart = this.monthBounds()[0];
        const monthEnd = this.monthBounds()[1];
        return compareDates(entry.key, monthStart, "<") || compareDates(entry.key, monthEnd, ">");
    });
    protected readonly rangePart = computed<MonthDayRangePart | null>(() => {
        const ends = this.rangeEnds();
        if (!ends || !this.selected()) {
            return null;
        }
        const key = this.#key();
        if (key === ends.start) {
            return "start";
        }
        return key === ends.end ? "end" : "middle";
    });
    protected readonly rangePreviewed = computed(() => !this.selected() && this.rangePreviewKeys().has(this.#key()));
    protected readonly selected = computed(() => this.selectedKeys().has(this.#key()));
    public readonly dayPointerEnter = output<Date>();
    public readonly daySelect = output<{ date: Date; event: MouseEvent }>();
    /** Whether the whole calendar is disabled. */
    public readonly disabled = input.required<boolean>();
    public readonly entry = input.required<MonthDayEntry>();
    /** Whether a day can't be picked: out of range or in `disabledDates`. */
    public readonly isDayUnavailable = input.required<(date: Date) => boolean>();
    public readonly monthBounds = input.required<[Date, Date]>();
    public readonly navigatedDate = input.required<Date>();
    /** The ends of the selected range in range selection, so the days between them are drawn apart from the ends. */
    public readonly rangeEnds = input<MonthDayRangeEnds | null>(null);
    public readonly rangePreviewKeys = input.required<ReadonlySet<string>>();
    public readonly rounded = input.required<CalendarVariantProps["rounded"]>();
    public readonly selectedKeys = input.required<ReadonlySet<string>>();
    public readonly today = input.required<Date>();

    protected onClick(event: MouseEvent) {
        if (this.dayDisabled()) {
            return;
        }
        event.preventDefault();
        this.daySelect.emit({ date: this.entry().key, event });
    }

    protected onPointerEnter() {
        if (this.dayDisabled()) {
            return;
        }
        this.dayPointerEnter.emit(this.entry().key);
    }
}
