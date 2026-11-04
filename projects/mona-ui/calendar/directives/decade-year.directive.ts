import { computed, Directive, inject, input } from "@angular/core";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { DateTime } from "luxon";
import { CALENDAR_DEFAULT_MESSAGES } from "../i18n/calendar.default-messages";
import type { CalendarVariantProps } from "../styles/calendar.styles";
import { calendarDecadeViewCellThemeVariants } from "../styles/calendar.styles";

/** One year of the decade view: a grid cell. */
@Directive({
    selector: "[monaDecadeYear]",
    host: {
        "[attr.tabindex]": "focused() && !disabled() ? 0 : -1",
        "[attr.aria-current]": "isCurrent() ? 'true' : null",
        "[attr.aria-disabled]": "disabled() ? 'true' : null",
        "[attr.aria-label]": "ariaLabel()",
        "[attr.aria-selected]": "selected() ? 'true' : null",
        "[class]": "baseClass()",
        role: "gridcell"
    }
})
export class DecadeYearDirective {
    readonly #i18n = inject(MonaI18nService);
    protected readonly ariaLabel = computed(() => this.messages().yearCellLabel(this.year()));
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
    protected readonly messages = this.#i18n.componentMessages("calendar", CALENDAR_DEFAULT_MESSAGES);
    protected readonly selected = computed(() => {
        const selectedDate = this.selectedDate();
        if (!selectedDate) {
            return false;
        }
        return this.year() === DateTime.fromJSDate(selectedDate).year;
    });
    /** Whether the whole calendar is disabled. */
    public readonly disabled = input(false);
    public readonly navigatedDate = input.required<Date>();
    public readonly rounded = input.required<CalendarVariantProps["rounded"]>();
    public readonly selectedDate = input<Date | null>(null);
    public readonly year = input.required<number>();
}
