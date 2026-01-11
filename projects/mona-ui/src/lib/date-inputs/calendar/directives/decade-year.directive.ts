import { computed, Directive, inject, input } from "@angular/core";
import { DateTime } from "luxon";
import { ThemeService } from "../../../theme/services/theme.service";
import { calendarDecadeViewCellThemeVariants, CalendarVariantProps } from "../styles/calendar.styles";

@Directive({
    selector: "td[monaDecadeYear]",
    host: {
        "[attr.tabindex]": "focused() ? 0 : -1",
        "[class]": "baseClass()"
    }
})
export class DecadeYearDirective {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const focused = this.focused();
        const rounded = this.rounded();
        const size = this.size();
        return calendarDecadeViewCellThemeVariants(theme)({ focused, rounded, size });
    });
    protected readonly focused = computed(() => {
        const navigatedYear = DateTime.fromJSDate(this.navigatedDate()).year;
        return this.year() === navigatedYear;
    });

    public readonly navigatedDate = input.required<Date>();
    public readonly rounded = input.required<CalendarVariantProps["rounded"]>();
    public readonly size = input.required<CalendarVariantProps["size"]>();
    public readonly year = input.required<number>();
}
