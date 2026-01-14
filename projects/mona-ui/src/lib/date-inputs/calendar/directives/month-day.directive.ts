import { computed, Directive, inject, input, output } from "@angular/core";
import { any, exactly, KeyValuePair } from "@mirei/ts-collections";
import { ThemeService } from "../../../theme/services/theme.service";
import { calendarMonthViewDayThemeVariants, CalendarVariantProps } from "../styles/calendar.styles";
import { compareDates } from "../utils/compareDates";

@Directive({
    selector: "td[monaMonthDay]",
    host: {
        "[attr.tabindex]": "focused() ? 0 : -1",
        "[attr.aria-selected]": "selected() ? 'true' : null",
        "[attr.aria-current]": "isToday() ? 'date' : null",
        "[attr.aria-disabled]": "dayDisabled() ? 'true' : null",
        "[class]": "baseClass()",
        "(click)": "onClick($event)"
    }
})
export class MonthDayDirective {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const disabled = this.dayDisabled();
        const focused = this.focused();
        const outside = this.outside();
        const rounded = this.rounded();
        const selected = this.selected();
        const today = this.isToday();
        return calendarMonthViewDayThemeVariants(theme)({ disabled, focused, outside, rounded, selected, today });
    });
    protected readonly dayDisabled = computed(() => {
        const disabled = this.disabled();
        const entry = this.entry();
        const disabledDates = this.disabledDates();
        const max = this.max();
        const min = this.min();
        return (
            disabled ||
            any(disabledDates, d => compareDates(entry.key, d, "==")) ||
            compareDates(entry.key, max, ">") ||
            compareDates(entry.key, min, "<")
        );
    });
    protected readonly focused = computed(() => {
        const entry = this.entry();
        const navigatedDate = this.navigatedDate();
        return compareDates(entry.key, navigatedDate, "==");
    });
    protected readonly isToday = computed(() => {
        const entry = this.entry();
        const today = new Date();
        return compareDates(entry.key, today, "==");
    });
    protected readonly outside = computed(() => {
        const entry = this.entry();
        const monthStart = this.monthBounds()[0];
        const monthEnd = this.monthBounds()[1];
        return compareDates(entry.key, monthStart, "<") || compareDates(entry.key, monthEnd, ">");
    });
    protected readonly selected = computed(() => {
        const entry = this.entry();
        const value = this.value();
        if (Array.isArray(value)) {
            return exactly(value, 1, d => compareDates(entry.key, d, "=="));
        }
        return compareDates(entry.key, value, "==");
    });
    public readonly daySelect = output<{ date: Date; event: MouseEvent }>();
    public readonly disabled = input.required<boolean>();
    public readonly disabledDates = input.required<Iterable<Date>>();
    public readonly entry = input.required<KeyValuePair<Date, number>>();
    public readonly max = input.required<Date | null | undefined>();
    public readonly min = input.required<Date | null | undefined>();
    public readonly monthBounds = input.required<[Date, Date]>();
    public readonly navigatedDate = input.required<Date>();
    public readonly rounded = input.required<CalendarVariantProps["rounded"]>();
    public readonly size = input.required<CalendarVariantProps["size"]>();
    public readonly value = input.required<Date | Date[] | null>();

    protected onClick(event: MouseEvent) {
        if (this.disabled()) {
            return;
        }
        event.preventDefault();
        this.daySelect.emit({ date: this.entry().key, event });
    }
}
