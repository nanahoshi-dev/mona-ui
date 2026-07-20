import { computed, Directive, inject, input } from "@angular/core";
import { DateTime } from "luxon";
import { calendarDecadeViewCellThemeVariants, CalendarVariantProps } from "../styles/calendar.styles";

@Directive({
    selector: "[monaDecadeYear]",
    host: {
        "[attr.tabindex]": "focused() ? 0 : -1",
        "[attr.aria-current]": "isCurrent() ? 'true' : null",
        "[attr.aria-label]": "ariaLabel()",
        "[attr.aria-selected]": "selected() ? 'true' : null",
        "[class]": "baseClass()",
        role: "gridcell"
    }
})
export class DecadeYearDirective {
    protected readonly ariaLabel = computed(() => `Year ${this.year()}`);
    protected readonly baseClass = computed(() => {
        const focused = this.focused();
        const rounded = this.rounded();
        return calendarDecadeViewCellThemeVariants({ focused, rounded });
    });
    protected readonly focused = computed(() => {
        const navigatedYear = DateTime.fromJSDate(this.navigatedDate()).year;
        return this.year() === navigatedYear;
    });
    protected readonly isCurrent = computed(() => {
        return this.year() === DateTime.now().year;
    });
    protected readonly selected = computed(() => {
        const selectedDate = this.selectedDate();
        if (!selectedDate) {
            return false;
        }
        return this.year() === DateTime.fromJSDate(selectedDate).year;
    });
    public readonly navigatedDate = input.required<Date>();
    public readonly rounded = input.required<CalendarVariantProps["rounded"]>();
    public readonly selectedDate = input<Date | null>(null);
    public readonly year = input.required<number>();
}
