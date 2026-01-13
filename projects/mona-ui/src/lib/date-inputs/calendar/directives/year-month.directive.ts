import { computed, Directive, inject, input } from "@angular/core";
import { DateTime } from "luxon";
import { ThemeService } from "../../../theme/services/theme.service";
import { CalendarVariantProps, calendarYearViewCellThemeVariants } from "../styles/calendar.styles";

@Directive({
    selector: "td[monaYearMonth]",
    host: {
        "[attr.tabindex]": "focused() ? 0 : -1",
        "[attr.aria-selected]": "selected() ? 'true' : null",
        "[attr.aria-current]": "isCurrent() ? 'date' : null",
        "[class]": "baseClass()"
    }
})
export class YearMonthDirective {
    readonly #themeService = inject(ThemeService);

    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const focused = this.focused();
        const rounded = this.rounded();
        const size = this.size();
        return calendarYearViewCellThemeVariants(theme)({ focused, rounded, size });
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
    public readonly navigatedDate = input.required<Date>();
    public readonly rounded = input.required<CalendarVariantProps["rounded"]>();
    public readonly selectedDate = input<Date | null>();
    public readonly size = input.required<CalendarVariantProps["size"]>();
}
