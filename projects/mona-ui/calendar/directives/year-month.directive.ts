import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "@mirei/mona-ui/theme";
import { DateTime } from "luxon";
import { CalendarVariantProps, calendarYearViewCellThemeVariants } from "../styles/calendar.styles";

@Directive({
    selector: "[monaYearMonth]",
    host: {
        "[attr.tabindex]": "focused() ? 0 : -1",
        "[attr.aria-current]": "isCurrent() ? 'date' : null",
        "[attr.aria-label]": "ariaLabel()",
        "[attr.aria-selected]": "selected() ? 'true' : null",
        "[class]": "baseClass()",
        role: "gridcell"
    }
})
export class YearMonthDirective {
    readonly #themeService = inject(ThemeService);
    protected readonly ariaLabel = computed(() => {
        const monthName = this.monthName();
        return `${monthName} ${this.navigatedDate().getFullYear()}`;
    });
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const focused = this.focused();
        const rounded = this.rounded();
        return calendarYearViewCellThemeVariants(theme)({ focused, rounded });
    });
    protected readonly focused = computed(() => {
        const navigatedMonth = DateTime.fromJSDate(this.navigatedDate()).month;
        return this.month() === navigatedMonth;
    });
    protected readonly isCurrent = computed(() => {
        const now = DateTime.now();
        const navDate = DateTime.fromJSDate(this.navigatedDate());
        return this.month() === now.month && navDate.year === now.year;
    });
    protected readonly selected = computed(() => {
        const selectedDate = this.selectedDate();
        if (!selectedDate) {
            return false;
        }
        const navDate = DateTime.fromJSDate(this.navigatedDate());
        const selDate = DateTime.fromJSDate(selectedDate);
        return this.month() === selDate.month && navDate.year === selDate.year;
    });
    public readonly month = input.required<number>();
    public readonly monthName = input.required<string>();
    public readonly navigatedDate = input.required<Date>();
    public readonly rounded = input.required<CalendarVariantProps["rounded"]>();
    public readonly selectedDate = input<Date | null>();
}
