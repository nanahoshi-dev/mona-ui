import { computed, Directive, inject, input, output } from "@angular/core";
import type { KeyValuePair } from "@mirei/ts-collections";
import { formatGregorianDateToLocaleString, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import type { CalendarVariantProps } from "../styles/calendar.styles";
import { calendarMonthViewDayThemeVariants } from "../styles/calendar.styles";
import { compareDates, toDayKey } from "../utils/compareDates";

/**
 * One day of the month view: a grid cell named by its full date ("Tuesday, November 4, 2026"). The calendar passes
 * the selection and the range preview as sets of day keys, so each cell answers in constant time.
 */
@Directive({
    selector: "[monaMonthDay]",
    host: {
        "[attr.tabindex]": "focused() && !disabled() ? 0 : -1",
        "[attr.aria-current]": "isToday() ? 'date' : null",
        "[attr.aria-disabled]": "dayDisabled() ? 'true' : null",
        "[attr.aria-label]": "ariaLabel()",
        "[attr.aria-selected]": "selected() ? 'true' : null",
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
        const rangePreview = this.rangePreviewed();
        const rounded = this.rounded();
        const selected = this.selected();
        const today = this.isToday();
        return calendarMonthViewDayThemeVariants({
            disabled,
            focused,
            outside,
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
    protected readonly rangePreviewed = computed(() => !this.selected() && this.rangePreviewKeys().has(this.#key()));
    protected readonly selected = computed(() => this.selectedKeys().has(this.#key()));
    public readonly dayPointerEnter = output<Date>();
    public readonly daySelect = output<{ date: Date; event: MouseEvent }>();
    /** Whether the whole calendar is disabled. */
    public readonly disabled = input.required<boolean>();
    public readonly entry = input.required<KeyValuePair<Date, number>>();
    /** Whether a day can't be picked: out of range or in `disabledDates`. */
    public readonly isDayUnavailable = input.required<(date: Date) => boolean>();
    public readonly monthBounds = input.required<[Date, Date]>();
    public readonly navigatedDate = input.required<Date>();
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
