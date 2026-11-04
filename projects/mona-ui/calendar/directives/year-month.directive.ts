import { computed, Directive, inject, input } from "@angular/core";
import { formatGregorianDateToLocaleString, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { DateTime } from "luxon";
import type { CalendarVariantProps } from "../styles/calendar.styles";
import { calendarYearViewCellThemeVariants } from "../styles/calendar.styles";

/** One month of the year view: a grid cell named by the long month and the year ("November 2026"). */
@Directive({
    selector: "[monaYearMonth]",
    host: {
        "[attr.tabindex]": "focused() && !disabled() ? 0 : -1",
        "[attr.aria-current]": "isCurrent() ? 'date' : null",
        "[attr.aria-disabled]": "disabled() ? 'true' : null",
        "[attr.aria-label]": "ariaLabel()",
        "[attr.aria-selected]": "selected() ? 'true' : null",
        "[class]": "baseClass()",
        role: "gridcell"
    }
})
export class YearMonthDirective {
    readonly #i18n = inject(MonaI18nService);
    protected readonly ariaLabel = computed(() => {
        const date = new Date(this.navigatedDate().getFullYear(), this.month() - 1, 1);
        return formatGregorianDateToLocaleString(date, this.#i18n.localeId(), { year: "numeric", month: "long" });
    });
    protected readonly baseClass = computed(() => {
        const focused = this.focused();
        const rounded = this.rounded();
        return calendarYearViewCellThemeVariants({ focused, rounded });
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
    /** Whether the whole calendar is disabled. */
    public readonly disabled = input(false);
    public readonly month = input.required<number>();
    public readonly navigatedDate = input.required<Date>();
    public readonly rounded = input.required<CalendarVariantProps["rounded"]>();
    public readonly selectedDate = input<Date | null>();
}
