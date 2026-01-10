import { computed, Directive, inject, input } from "@angular/core";
import { any, exactly, KeyValuePair } from "@mirei/ts-collections";
import { ThemeService } from "../../../theme/services/theme.service";
import { calendarMonthViewDayThemeVariants } from "../styles/calendar.styles";
import { compareDates } from "../utils/compareDates";

@Directive({
    selector: "td[monaMonthViewDay]",
    host: {
        "[attr.data-disabled]": "dayDisabled()",
        "[attr.data-focused]": "focused()",
        "[attr.data-outside]": "outside()",
        "[attr.data-selected]": "selected()",
        "[attr.tabindex]": "dayDisabled() ? -1 : 0",
        "[class]": "baseClass()"
    }
})
export class MonthViewDayDirective {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const disabled = this.dayDisabled();
        const focused = this.focused();
        const outside = this.outside();
        const selected = this.selected();
        return calendarMonthViewDayThemeVariants(theme)({ disabled, focused, outside, selected });
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
            compareDates(entry.key, max, ">=") ||
            compareDates(entry.key, min, "<=")
        );
    });
    protected readonly focused = computed(() => {
        const entry = this.entry();
        const navigatedDate = this.navigatedDate();
        return compareDates(entry.key, navigatedDate, "==");
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
    public readonly disabled = input.required<boolean>();
    public readonly disabledDates = input.required<Iterable<Date>>();
    public readonly entry = input.required<KeyValuePair<Date, number>>();
    public readonly max = input.required<Date | null>();
    public readonly min = input.required<Date | null>();
    public readonly monthBounds = input.required<[Date, Date]>();
    public readonly navigatedDate = input.required<Date>();
    public readonly value = input.required<Date | Date[] | null>();
}
