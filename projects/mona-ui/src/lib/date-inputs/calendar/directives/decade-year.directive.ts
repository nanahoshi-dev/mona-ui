import { computed, Directive, inject, input } from "@angular/core";
import { DateTime } from "luxon";
import { ThemeService } from "../../../theme/services/theme.service";
import { calendarDecadeViewCellThemeVariants, CalendarVariantProps } from "../styles/calendar.styles";

@Directive({
    selector: "td[monaDecadeYear]",
    host: {
        "[class]": "baseClass()"
    }
})
export class DecadeYearDirective {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const navigatedYear = DateTime.fromJSDate(this.navigatedDate()).year;
        const focused = this.year() === navigatedYear;
        const rounded = this.rounded();
        const size = this.size();
        return calendarDecadeViewCellThemeVariants(theme)({ focused, rounded, size });
    });

    public readonly navigatedDate = input.required<Date>();
    public readonly rounded = input.required<CalendarVariantProps["rounded"]>();
    public readonly size = input.required<CalendarVariantProps["size"]>();
    public readonly year = input.required<number>();
}
