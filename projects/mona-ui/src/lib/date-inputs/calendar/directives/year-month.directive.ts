import { computed, Directive, inject, input } from "@angular/core";
import { DateTime } from "luxon";
import { ThemeService } from "../../../theme/services/theme.service";
import { CalendarVariantProps, calendarYearViewCellThemeVariants } from "../styles/calendar.styles";

@Directive({
    selector: "td[monaYearMonth]",
    host: {
        "[attr.tabindex]": "focused() ? 0 : -1",
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

    public readonly navigatedDate = input.required<Date>();
    public readonly rounded = input.required<CalendarVariantProps["rounded"]>();
    public readonly size = input.required<CalendarVariantProps["size"]>();
    public readonly month = input.required<number>();
}
