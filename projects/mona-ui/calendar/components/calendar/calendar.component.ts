import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    linkedSignal,
    model,
    output,
    signal,
    untracked
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import { LucideChevronLeft, LucideChevronRight } from "@lucide/angular";
import { Dictionary, index, lastOrDefault, range, select } from "@mirei/ts-collections";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { PreventableEvent, TakeFirstPipe } from "@nanahoshi/mona-ui/common";
import type { CalendarView, DateDisabledType } from "@nanahoshi/mona-ui/date-input";
import { CalendarService } from "@nanahoshi/mona-ui/date-input";
import { createElementControlId, injectEffectiveDisabled, rxTimeout } from "@nanahoshi/mona-ui/internal";
import type { DurationObjectUnits } from "luxon";
import { DateTime } from "luxon";
import { fromEvent, skip } from "rxjs";
import { twMerge } from "tailwind-merge";
import {
    formatGregorianDateToLocaleString,
    formatNumber,
    getLocaleFirstDayOfWeek,
    gregorianDateTime,
    gregorianDateTimeFromObject,
    injectComponentDirection,
    MonaI18nService
} from "@nanahoshi/mona-ui/i18n";
import { CALENDAR_DEFAULT_MESSAGES } from "../../i18n/calendar.default-messages";
import { CalendarDecadeCellTemplateDirective } from "../../directives/calendar-decade-cell-template.directive";
import { CalendarMonthCellTemplateDirective } from "../../directives/calendar-month-cell-template.directive";
import { CalendarYearCellTemplateDirective } from "../../directives/calendar-year-cell-template.directive";
import { DecadeYearDirective } from "../../directives/decade-year.directive";
import { MonthDayDirective } from "../../directives/month-day.directive";
import { YearMonthDirective } from "../../directives/year-month.directive";
import type { CalendarSelection } from "../../models/CalendarSelection";
import type { FirstDayOfWeek } from "../../models/FirstDayOfWeek";
import type { CalendarVariantInput, CalendarVariantProps } from "../../styles/calendar.styles";
import {
    calendarBaseThemeVariants,
    calendarDecadeViewGridThemeVariants,
    calendarHeaderThemeVariants,
    calendarMonthViewGridHeaderThemeVariants,
    calendarMonthViewGridThemeVariants,
    calendarYearViewGridThemeVariants
} from "../../styles/calendar.styles";
import { compareDates, toDayKey } from "../../utils/compareDates";

/** Midnight at the start of the local day `date` falls on. */
function startOfDay(date: Date): Date {
    return DateTime.fromJSDate(date).startOf("day").toJSDate();
}

/** Whole calendar days from `start` to `end`, whatever their times and across DST changes. */
function calendarDaysBetween(start: DateTime, end: DateTime): number {
    return Math.round(end.startOf("day").diff(start.startOf("day"), "days").days);
}

const FIRST_DAY_OF_WEEK_TO_ISO: Record<FirstDayOfWeek, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7
};

@Component({
    selector: "mona-calendar",
    templateUrl: "./calendar.component.html",
    imports: [
        ButtonDirective,
        MonthDayDirective,
        DecadeYearDirective,
        YearMonthDirective,
        NgTemplateOutlet,
        TakeFirstPipe,
        LucideChevronLeft,
        LucideChevronRight
    ],
    host: {
        // The host is a plain container: the grid inside it is the widget, and focus moves through its cells. A
        // static aria-label written on <mona-calendar> would otherwise stay on the role-less host.
        "[attr.aria-label]": "null",
        "[attr.data-disabled]": "effectiveDisabled() || null",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-required]": "required() || null",
        "[class]": "baseClass()",
        "(focusin)": "refreshToday()",
        "(focusout)": "onFocusOut($event)"
    }
})
export class CalendarComponent implements CalendarVariantInput, FormValueControl<Date | Date[] | null> {
    readonly #calendarService = inject(CalendarService, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #hostElementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #monthDict = computed(() => {
        const day = this.navigatedDate();
        const firstDayOfMonth = gregorianDateTime(day, this.#i18n.localeId()).startOf("month");
        const lastDayOfMonth = gregorianDateTime(day, this.#i18n.localeId()).endOf("month");
        const firstDayIso = FIRST_DAY_OF_WEEK_TO_ISO[this.effectiveFirstDay()];

        const daysToSubtract = (firstDayOfMonth.weekday - firstDayIso + 7) % 7;
        const firstDayOfCalendar = firstDayOfMonth.minus({ days: daysToSubtract });

        const lastDayOfWeekIso = ((firstDayIso + 5) % 7) + 1;
        const daysToAdd = (lastDayOfWeekIso - lastDayOfMonth.weekday + 7) % 7;
        const lastDayOfCalendar = lastDayOfMonth.plus({ days: daysToAdd });

        const dictionary = new Dictionary<Date, number>();
        for (let i = firstDayOfCalendar; i <= lastDayOfCalendar; i = i.plus({ days: 1 })) {
            dictionary.add(i.toJSDate(), i.day);
        }

        return dictionary.toImmutableDictionary(
            e => e.key,
            e => e.value
        );
    });
    readonly #outputValue = computed(() => {
        const selection = this.selection();
        const selectedDates = this.selectedDates();
        if (selection === "single") {
            return lastOrDefault(selectedDates);
        } else if (selection === "multiple") {
            return selectedDates;
        } else if (selection === "range") {
            if (selectedDates.length === 1) {
                return [selectedDates[0], selectedDates[0]];
            }
            if (selectedDates.length > 1) {
                return [selectedDates[0], selectedDates[selectedDates.length - 1]];
            }
            return [];
        }
        return [];
    });
    protected readonly ariaLabel = computed(() => {
        const view = this.calendarView();
        const navigatedDate = this.navigatedDate();
        const locale = this.#i18n.localeId();
        const messages = this.messages();
        switch (view) {
            case "month":
                return messages.calendarLabel(
                    formatGregorianDateToLocaleString(navigatedDate, locale, { year: "numeric", month: "long" })
                );
            case "year":
                return messages.yearViewLabel(
                    formatGregorianDateToLocaleString(navigatedDate, locale, { year: "numeric" })
                );
            case "decade":
                return messages.decadeViewLabel(this.decadeStart(), this.decadeEnd());
        }
    });
    protected readonly baseClass = computed(() => {
        const disabled = this.effectiveDisabled();
        const readonly = this.readonly();
        const rounded = this.rounded() === "full" ? "large" : this.rounded();
        const variantClass = calendarBaseThemeVariants({ disabled, readonly, rounded });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly calendarView = signal<CalendarView>("month");
    protected readonly decadeCellTemplate = contentChild(CalendarDecadeCellTemplateDirective);
    protected readonly decadeEnd = computed(() => {
        return this.decadeStart() + 9;
    });
    protected readonly decadeGridClass = computed(() => {
        return calendarDecadeViewGridThemeVariants();
    });
    protected readonly decadeStart = computed(() => {
        const navigatedDate = this.navigatedDate();
        const date = gregorianDateTime(navigatedDate, this.#i18n.localeId());
        const year = date.year;
        return year - (year % 10);
    });
    protected readonly decadeYears = computed(() => {
        const decadeStart = this.decadeStart();
        return range(decadeStart, 10)
            .chunk(4)
            .select(e => e.toArray())
            .toArray();
    });
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly effectiveFirstDay = computed<FirstDayOfWeek>(() => {
        return this.firstDay() ?? getLocaleFirstDayOfWeek(this.#i18n.localeId());
    });
    protected readonly gridId = createElementControlId();
    protected readonly headerClass = computed(() => {
        return calendarHeaderThemeVariants({});
    });
    protected readonly headerMonthYear = computed(() => {
        const locale = this.#i18n.localeId();
        return formatGregorianDateToLocaleString(this.navigatedDate(), locale, {
            year: "numeric",
            month: "long"
        });
    });
    protected readonly headerYear = computed(() => {
        const locale = this.#i18n.localeId();
        return formatGregorianDateToLocaleString(this.navigatedDate(), locale, {
            year: "numeric"
        });
    });
    protected readonly invalidState = computed(
        () => this.touched() && (this.invalid() || (this.required() && this.isEmptyValue()))
    );
    /**
     * Whether a day can't be picked: outside `minDate`/`maxDate` or in `disabledDates`. An iterable of disabled
     * dates is turned into a set of day keys once, so each of the 42 cells answers in constant time.
     */
    protected readonly isDayUnavailable = computed<(date: Date) => boolean>(() => {
        const disabledDates = this.disabledDates();
        const min = this.minDate();
        const max = this.maxDate();
        const isOutOfRange = (date: Date) => compareDates(date, max, ">") || compareDates(date, min, "<");
        if (typeof disabledDates === "function") {
            return date => isOutOfRange(date) || disabledDates(date);
        }
        const keys = new Set<string>();
        for (const disabledDate of disabledDates ?? []) {
            keys.add(toDayKey(disabledDate));
        }
        return date => isOutOfRange(date) || keys.has(toDayKey(date));
    });
    protected readonly messages = this.#i18n.componentMessages("calendar", CALENDAR_DEFAULT_MESSAGES);
    protected readonly monthBounds = computed(() => {
        const navigatedDate = this.navigatedDate();
        const firstDayOfMonth = gregorianDateTime(navigatedDate, this.#i18n.localeId()).startOf("month");
        const lastDayOfMonth = gregorianDateTime(navigatedDate, this.#i18n.localeId()).endOf("month");
        return { start: firstDayOfMonth.toJSDate(), end: lastDayOfMonth.toJSDate() };
    });
    protected readonly monthCellTemplate = contentChild(CalendarMonthCellTemplateDirective);
    protected readonly monthDictChunked = computed(() => {
        const dict = this.#monthDict();
        return dict
            .chunk(7)
            .select(e =>
                e.toImmutableDictionary(
                    e => e.key,
                    e => e.value
                )
            )
            .toImmutableSet();
    });
    protected readonly monthGridClass = computed(() => {
        return calendarMonthViewGridThemeVariants();
    });
    protected readonly monthGridHeaderClass = computed(() => {
        return calendarMonthViewGridHeaderThemeVariants();
    });
    protected readonly months = computed(() => {
        const locale = this.#i18n.localeId();
        const names = range(1, 12)
            .select(m => gregorianDateTimeFromObject({ year: 2024, month: m, day: 1 }, locale).toFormat("LLL"))
            .toArray();
        return index(names)
            .chunk(3)
            .select(e => e.select(m => [m[0] + 1, m[1]] as const).toImmutableSet())
            .toImmutableSet();
    });
    // Midnight, so a date picked with the keyboard before any value exists carries no clock time.
    protected readonly navigatedDate = signal(startOfDay(new Date()));
    protected readonly nextButtonLabel = computed(() => {
        const view = this.calendarView();
        const messages = this.messages();
        switch (view) {
            case "month":
                return messages.nextMonth;
            case "year":
                return messages.nextYear;
            case "decade":
                return messages.nextDecade;
        }
    });
    protected readonly pendingRangeStart = signal<Date | null>(null);
    protected readonly prevButtonLabel = computed(() => {
        const view = this.calendarView();
        const messages = this.messages();
        switch (view) {
            case "month":
                return messages.previousMonth;
            case "year":
                return messages.previousYear;
            case "decade":
                return messages.previousDecade;
        }
    });
    protected readonly rangePreviewDate = signal<Date | null>(null);
    protected readonly rangePreviewDates = computed(() => {
        if (this.selection() !== "range") {
            return [];
        }
        const pendingRangeStart = this.pendingRangeStart();
        if (!pendingRangeStart) {
            return [];
        }
        return this.getInclusiveDateRange(pendingRangeStart, this.rangePreviewDate() ?? this.navigatedDate());
    });
    protected readonly rangePreviewKeys = computed<ReadonlySet<string>>(
        () => new Set(this.rangePreviewDates().map(toDayKey))
    );
    protected readonly selectedDates = linkedSignal<Date[]>(() => {
        const v = this.value();
        const selection = this.selection();
        if (v == null) {
            return [];
        }
        if (selection === "range" && Array.isArray(v) && v.length >= 2) {
            const date1 = DateTime.fromJSDate(v[0]);
            const date2 = DateTime.fromJSDate(v[v.length - 1]);
            const startDate = date1 <= date2 ? date1 : date2;
            const endDate = date1 <= date2 ? date2 : date1;
            const totalDays = calendarDaysBetween(startDate, endDate) + 1;
            return range(0, totalDays)
                .select(i => startDate.plus({ days: i }).toJSDate())
                .toArray();
        }
        return Array.isArray(v) ? v : [v];
    });
    protected readonly selectedKeys = computed<ReadonlySet<string>>(() => new Set(this.selectedDates().map(toDayKey)));
    /** Today at midnight. Refreshed when focus enters the calendar, so a page left open overnight moves on. */
    protected readonly today = signal(startOfDay(new Date()));
    protected readonly todayButtonLabel = computed(() => {
        const locale = this.#i18n.localeId();
        const todayStr = formatGregorianDateToLocaleString(this.today(), locale, {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
        return this.messages().goToToday(todayStr);
    });
    protected readonly todayUnavailable = computed(() => this.isDayUnavailable()(this.today()));
    protected readonly viewSwitchButtonLabel = computed(() => {
        const view = this.calendarView();
        const locale = this.#i18n.localeId();
        const navigatedDate = this.navigatedDate();
        const messages = this.messages();
        switch (view) {
            case "month":
                return messages.switchToYearView(
                    formatGregorianDateToLocaleString(navigatedDate, locale, { year: "numeric", month: "long" })
                );
            case "year":
                return messages.switchToDecadeView(
                    formatGregorianDateToLocaleString(navigatedDate, locale, { year: "numeric" })
                );
            case "decade":
                return messages.decadeRange(this.decadeStart(), this.decadeEnd());
        }
    });
    protected readonly weekdays = computed(() => {
        const firstDayIso = FIRST_DAY_OF_WEEK_TO_ISO[this.effectiveFirstDay()];
        const locale = this.#i18n.localeId();
        // 2024-01-01 was a Monday (ISO 1)
        const days = range(0, 7)
            .select(i => {
                const dt = gregorianDateTimeFromObject({ year: 2024, month: 1, day: 1 + i }, locale);
                const short = dt.toFormat("ccc");
                const full = dt.toFormat("cccc");
                const narrow = dt.toFormat("ccccc");
                const display = short.length > 4 || (short === full && short.length > 3) ? narrow : short;
                return {
                    display,
                    short,
                    narrow,
                    full
                };
            })
            .toArray();
        const startIndex = firstDayIso - 1;
        return [...days.slice(startIndex), ...days.slice(0, startIndex)];
    });
    protected readonly yearCellTemplate = contentChild(CalendarYearCellTemplateDirective);
    protected readonly yearGridClass = computed(() => {
        return calendarYearViewGridThemeVariants();
    });

    /**
     * @description Sets the disabled state of the calendar.
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the disabled dates of the calendar.
     * Accepts either an iterable of Date objects or a predicate function.
     */
    public readonly disabledDates = input<DateDisabledType>();

    /**
     * @description Sets the first day of the week. If not specified, derives from the active locale.
     * @default null
     */
    public readonly firstDay = input<FirstDayOfWeek | null>(null);

    /**
     * @description Moves focus to the active day when the calendar first renders. An inline calendar on a page
     * should leave focus where it is; a calendar that opens in a popup sets this so focus moves into it.
     * @default false
     */
    public readonly focusOnMount = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the calendar as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the maximum date that can be selected.
     */
    public readonly maxDate = input<Date | null>();

    /**
     * @description Sets the minimum date that can be selected.
     */
    public readonly minDate = input<Date | null>();

    /**
     * @description Sets the readonly state of the calendar.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Sets whether the calendar is required. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the border radius of the calendar.
     * @default "medium"
     */
    public readonly rounded = input<CalendarVariantProps["rounded"]>("medium");

    /**
     * @description Sets the selection mode of the calendar.
     * @default "single"
     */
    public readonly selection = input<CalendarSelection>("single");

    /**
     * @description Emitted when focus leaves the calendar, as a native input is touched on blur. Moving between
     * its buttons and days doesn't count. The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the calendar. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Adds custom CSS classes to the calendar host element.
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description The current value of the calendar: a `Date` in single selection, the selected dates in multiple
     * selection, and `[start, end]` in range selection. A range is written once both ends are picked.
     * @default null
     */
    public readonly value = model<Date | Date[] | null>(null);

    /**
     * @description Enables the display of week numbers in the calendar.
     * @default false
     */
    public readonly weekNumber = input(false, { transform: booleanAttribute });

    public constructor() {
        afterNextRender({
            read: () => {
                this.setupKeyboardNavigation();
                if (this.focusOnMount()) {
                    this.focusActiveCell();
                }
            }
        });
        effect(() => {
            const min = this.minDate();
            const max = this.maxDate();
            untracked(() => {
                // Keep the active day within the range. A day disabled through disabledDates can stay active: it is
                // focusable and announced as unavailable, so the keyboard can move past it.
                const navigationDate = this.navigatedDate();
                if (compareDates(navigationDate, min, "<") && min) {
                    this.navigatedDate.set(min);
                } else if (compareDates(navigationDate, max, ">") && max) {
                    this.navigatedDate.set(max);
                }
            });
        });
        effect(() => {
            const v = this.value();
            untracked(() => {
                // Show the last selected date. Clearing the selection leaves the view where it is.
                const lastDate = Array.isArray(v) ? lastOrDefault(v) : v;
                if (lastDate) {
                    this.navigatedDate.set(lastDate);
                }
            });
        });
        toObservable(this.calendarView)
            .pipe(skip(1))
            .subscribe(() => this.focusActiveCell());
    }

    protected formatInteger(value: number): string {
        if (value == null) {
            return "";
        }
        return formatNumber(value, this.#i18n.localeId(), {
            maximumFractionDigits: 0,
            useGrouping: false
        });
    }

    protected getWeekNumber(date: Date): number {
        const dt = gregorianDateTime(date, this.#i18n.localeId());
        const firstDayIso = FIRST_DAY_OF_WEEK_TO_ISO[this.effectiveFirstDay()];
        const daysToThursday = (4 - firstDayIso + 7) % 7;
        return dt.plus({ days: daysToThursday }).weekNumber;
    }

    protected onDayClick(date: Date, event: MouseEvent): void {
        event.preventDefault();
        if (this.effectiveDisabled() || this.readonly()) {
            return;
        }
        const selection = this.selection();
        if (selection === "single") {
            this.handleSingleSelection(date);
        } else if (selection === "multiple") {
            if (event.ctrlKey || event.metaKey || event.shiftKey) {
                this.handleMultipleSelection(date, event.shiftKey);
            } else {
                this.handleSingleSelection(date);
            }
        } else if (selection === "range") {
            this.handleRangeSelection(date);
            this.navigatedDate.set(date);
        }
        this.focusActiveCell();
        this.commitUserSelection();
    }

    protected onDayPointerEnter(date: Date): void {
        if (
            this.effectiveDisabled() ||
            this.readonly() ||
            this.selection() !== "range" ||
            this.pendingRangeStart() == null
        ) {
            return;
        }
        this.rangePreviewDate.set(date);
    }

    protected onFocusOut(event: FocusEvent): void {
        // Removing a focused calendar from the page fires focusout after it is destroyed.
        if (this.#destroyRef.destroyed) {
            return;
        }
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && this.#hostElementRef.nativeElement.contains(nextTarget)) {
            return;
        }
        this.touch.emit();
    }

    protected onMonthClick(month: number): void {
        this.navigatedDate.set(DateTime.fromJSDate(this.navigatedDate()).set({ month }).toJSDate());
        this.calendarView.set("month");
    }

    protected onMonthGridPointerLeave(): void {
        this.rangePreviewDate.set(null);
    }

    protected onNavigationClick(direction: "prev" | "next"): void {
        this.rangePreviewDate.set(null);
        const date = DateTime.fromJSDate(this.navigatedDate());
        let unit: DurationObjectUnits;
        switch (this.calendarView()) {
            case "month":
                unit = { months: 1 };
                break;
            case "year":
                unit = { years: 1 };
                break;
            case "decade":
                unit = { years: 10 };
                break;
        }
        this.navigatedDate.set(direction === "prev" ? date.minus(unit).toJSDate() : date.plus(unit).toJSDate());
    }

    protected onTodayButtonClick(): void {
        this.refreshToday();
        if (this.effectiveDisabled() || this.readonly() || this.todayUnavailable()) {
            return;
        }
        // Today is picked as a click on its day would pick it, so the same rules apply.
        const today = this.today();
        if (this.selection() === "range") {
            this.handleRangeSelection(today);
            this.navigatedDate.set(today);
        } else {
            this.handleSingleSelection(today);
        }
        this.calendarView.set("month");
        this.commitUserSelection();
    }

    protected onViewChangeClick(view: CalendarView): void {
        this.calendarView.set(view);
    }

    protected onYearClick(year: number): void {
        this.navigatedDate.set(DateTime.fromJSDate(this.navigatedDate()).set({ year }).toJSDate());
        this.calendarView.set("year");
    }

    protected refreshToday(): void {
        const today = startOfDay(new Date());
        if (!compareDates(today, this.today(), "==")) {
            this.today.set(today);
        }
    }

    private clearPendingRange(): void {
        this.pendingRangeStart.set(null);
        this.rangePreviewDate.set(null);
    }

    private commitUserSelection(): void {
        // A range is written once both ends are picked; the first click only starts it.
        if (this.selection() === "range" && this.pendingRangeStart() != null) {
            return;
        }
        this.value.set(this.#outputValue());
    }

    private extendSelection(offset: number): void {
        const currentDate = this.navigatedDate();
        const newDate = DateTime.fromJSDate(currentDate).plus({ days: offset }).toJSDate();
        if (this.isDateDisabled(newDate)) {
            return;
        }
        const currentSelection = this.selectedDates();
        const dateTime = DateTime.fromJSDate(newDate);
        const isAlreadySelected = currentSelection.some(d => DateTime.fromJSDate(d).hasSame(dateTime, "day"));
        if (!isAlreadySelected) {
            this.setCurrentDate([...currentSelection, newDate]);
        }
        this.navigatedDate.set(newDate);
    }

    private focusActiveCell(): void {
        rxTimeout(this.#destroyRef, () => {
            const calendarView = this.calendarView();
            const selector =
                calendarView === "year"
                    ? "[monaYearMonth]"
                    : calendarView === "decade"
                      ? "[monaDecadeYear]"
                      : "[monaMonthDay]";
            const activeCell = this.#hostElementRef.nativeElement.querySelector<HTMLElement>(
                `${selector}[tabindex="0"]`
            );
            activeCell?.focus();
        });
    }

    private getDateArray(date: Date | Date[] | null): Date[] {
        if (date == null) {
            return [];
        }
        return Array.isArray(date) ? date : [date];
    }

    private getDatesForMultipleSelection(date: Date): Date[] {
        const lastSelectedDate = lastOrDefault(this.selectedDates()) ?? this.navigatedDate();
        const startDate = lastSelectedDate < date ? lastSelectedDate : date;
        const endDate = this.navigatedDate() > date ? this.navigatedDate() : date;
        const totalDays = calendarDaysBetween(DateTime.fromJSDate(startDate), DateTime.fromJSDate(endDate)) + 1;
        return range(0, totalDays)
            .select(i => DateTime.fromJSDate(startDate).plus({ days: i }).toJSDate())
            .toArray();
    }

    private getInclusiveDateRange(date1: Date, date2: Date): Date[] {
        const dateTime1 = DateTime.fromJSDate(date1);
        const dateTime2 = DateTime.fromJSDate(date2);
        const startDate = dateTime1 <= dateTime2 ? dateTime1 : dateTime2;
        const endDate = dateTime1 <= dateTime2 ? dateTime2 : dateTime1;
        const totalDays = calendarDaysBetween(startDate, endDate) + 1;
        return range(0, totalDays)
            .select(i => startDate.plus({ days: i }).toJSDate())
            .toArray();
    }

    private handleKeydown(event: KeyboardEvent): void {
        if (this.effectiveDisabled()) {
            return;
        }

        const preventableEvent = new PreventableEvent("calendarKeydown", event);
        this.#calendarService?.keydown$.next(preventableEvent);

        if (preventableEvent.isDefaultPrevented()) {
            return;
        }

        // Keys pressed on the header buttons belong to the buttons: the arrows don't move the active day.
        if ((event.target as HTMLElement).closest("button")) {
            return;
        }

        const view = this.calendarView();
        const isCtrlOrCmd = event.ctrlKey || event.metaKey;
        const isShift = event.shiftKey;
        const selection = this.selection();

        if (!this.readonly() && selection === "multiple" && (isCtrlOrCmd || isShift)) {
            if (this.handleMultipleSelectionKeyboard(event, isCtrlOrCmd, isShift)) {
                this.commitUserSelection();
                this.focusActiveCell();
                return;
            }
        }

        let shouldFocusCell = false;
        switch (event.key) {
            case "ArrowUp":
                event.preventDefault();
                if (isCtrlOrCmd) {
                    this.switchToUpperView();
                } else {
                    this.navigateByWeeksOrRows(-1, view);
                }
                shouldFocusCell = true;
                break;
            case "ArrowDown":
                event.preventDefault();
                if (isCtrlOrCmd) {
                    this.switchToLowerView();
                } else {
                    this.navigateByWeeksOrRows(1, view);
                }
                shouldFocusCell = true;
                break;
            case "ArrowLeft":
                event.preventDefault();
                if (isCtrlOrCmd) {
                    this.navigatePeriodKeyboard(this.horizontalPeriodDirection("ArrowLeft"));
                } else {
                    this.navigateByDaysOrCells(this.horizontalCellDelta("ArrowLeft"), view);
                }
                shouldFocusCell = true;
                break;
            case "ArrowRight":
                event.preventDefault();
                if (isCtrlOrCmd) {
                    this.navigatePeriodKeyboard(this.horizontalPeriodDirection("ArrowRight"));
                } else {
                    this.navigateByDaysOrCells(this.horizontalCellDelta("ArrowRight"), view);
                }
                shouldFocusCell = true;
                break;
            case "Enter":
            case " ": {
                event.preventDefault();
                const previousView = this.calendarView();
                if (this.readonly() && previousView === "month") {
                    shouldFocusCell = true;
                    break;
                }
                if (isCtrlOrCmd && selection === "multiple") {
                    this.toggleFocusedDateInSelection();
                } else if (isShift && selection === "multiple") {
                    this.selectRangeToFocused();
                } else {
                    this.selectFocusedItem();
                }
                if (previousView === "month" && this.calendarView() === "month") {
                    this.commitUserSelection();
                }
                shouldFocusCell = true;
                break;
            }
            case "Home":
                event.preventDefault();
                this.navigateToStart(view);
                shouldFocusCell = true;
                break;
            case "End":
                event.preventDefault();
                this.navigateToEnd(view);
                shouldFocusCell = true;
                break;
            case "PageUp":
                event.preventDefault();
                // Shift+PageUp moves a year in the month view, as in the WAI-ARIA date picker pattern.
                this.navigateByPeriod(isShift && view === "month" ? -12 : -1, view);
                shouldFocusCell = true;
                break;
            case "PageDown":
                event.preventDefault();
                this.navigateByPeriod(isShift && view === "month" ? 12 : 1, view);
                shouldFocusCell = true;
                break;
            case "t":
            case "T":
                if (!isCtrlOrCmd && !isShift) {
                    event.preventDefault();
                    this.navigateToToday();
                    shouldFocusCell = true;
                }
                break;
            case "Escape":
                event.preventDefault();
                return;
        }

        if (shouldFocusCell) {
            this.focusActiveCell();
        }
    }

    private handleMultipleSelection(date: Date, rangedSelection: boolean): void {
        this.clearPendingRange();
        const value = this.selectedDates();
        if (value.length === 0) {
            this.setCurrentDate([date]);
            this.navigatedDate.set(date);
            return;
        }
        if (!rangedSelection) {
            const date1 = DateTime.fromJSDate(date);
            const valueList = this.getDateArray(value);
            const selectedDates = select(valueList, e => DateTime.fromJSDate(e));
            // Compare by day: a selected value carries a time, the clicked day is midnight.
            const alreadySelected = selectedDates.any(e => e.hasSame(date1, "day"));
            if (alreadySelected) {
                const newDates = selectedDates
                    .where(e => !e.hasSame(date1, "day"))
                    .select(e => e.toJSDate())
                    .toArray();
                this.setCurrentDate(newDates);
            } else {
                this.setCurrentDate([...valueList, date]);
            }
            this.navigatedDate.set(date);
        } else {
            const selectedDates = this.getDatesForMultipleSelection(date);
            this.setCurrentDate(selectedDates);
        }
    }

    private handleMultipleSelectionKeyboard(event: KeyboardEvent, isCtrlOrCmd: boolean, isShift: boolean): boolean {
        if (this.calendarView() !== "month") {
            return false;
        }
        if (isShift && !isCtrlOrCmd) {
            switch (event.key) {
                case "ArrowLeft":
                    event.preventDefault();
                    this.extendSelection(this.horizontalCellDelta("ArrowLeft"));
                    return true;
                case "ArrowRight":
                    event.preventDefault();
                    this.extendSelection(this.horizontalCellDelta("ArrowRight"));
                    return true;
                case "ArrowUp":
                    event.preventDefault();
                    this.extendSelection(-7);
                    return true;
                case "ArrowDown":
                    event.preventDefault();
                    this.extendSelection(7);
                    return true;
            }
        }
        return false;
    }

    private handleRangeSelection(date: Date): void {
        const pendingRangeStart = this.pendingRangeStart();
        if (pendingRangeStart == null) {
            this.pendingRangeStart.set(date);
            this.rangePreviewDate.set(null);
            this.setCurrentDate([date]);
            return;
        }

        this.setCurrentDate(this.getInclusiveDateRange(pendingRangeStart, date));
        this.pendingRangeStart.set(null);
        this.rangePreviewDate.set(null);
    }

    private handleSingleSelection(date: Date): void {
        this.clearPendingRange();
        const value = this.selectedDates();
        if (value.length > 0) {
            const date1 = DateTime.fromJSDate(date);
            const valueItem = lastOrDefault(value) ?? DateTime.now().toJSDate();
            const newDate = DateTime.fromJSDate(valueItem)
                .set({ day: date1.day, month: date1.month, year: date1.year })
                .toJSDate();
            this.navigatedDate.set(newDate);
            this.setCurrentDate(newDate);
        } else {
            this.navigatedDate.set(date);
            this.setCurrentDate(date);
        }
    }

    private horizontalCellDelta(key: "ArrowLeft" | "ArrowRight"): -1 | 1 {
        const isRtl = this.#direction() === "rtl";
        if (key === "ArrowLeft") {
            return isRtl ? 1 : -1;
        }
        return isRtl ? -1 : 1;
    }

    private horizontalPeriodDirection(key: "ArrowLeft" | "ArrowRight"): "prev" | "next" {
        const isRtl = this.#direction() === "rtl";
        if (key === "ArrowLeft") {
            return isRtl ? "next" : "prev";
        }
        return isRtl ? "prev" : "next";
    }

    private isDateDisabled(date: Date): boolean {
        return this.isDayUnavailable()(date);
    }

    private isEmptyValue(): boolean {
        const value = this.value();
        return value == null || (Array.isArray(value) && value.length === 0);
    }

    private isOutOfRange(date: Date): boolean {
        return compareDates(date, this.maxDate(), ">") || compareDates(date, this.minDate(), "<");
    }

    private navigateByDaysOrCells(offset: number, view: CalendarView): void {
        const currentDate = this.navigatedDate();
        const dateTime = DateTime.fromJSDate(currentDate);
        let newDate: Date;

        switch (view) {
            case "month":
                newDate = dateTime.plus({ days: offset }).toJSDate();
                break;
            case "year":
                newDate = dateTime.plus({ months: offset }).toJSDate();
                break;
            case "decade":
                newDate = dateTime.plus({ years: offset }).toJSDate();
                break;
        }

        // A disabled day can be focused (it is announced as unavailable); only the range bounds stop the arrows.
        if (view === "month" && this.isOutOfRange(newDate)) {
            return;
        }
        this.rangePreviewDate.set(null);
        this.navigatedDate.set(newDate);
    }

    private navigateByPeriod(offset: number, view: CalendarView): void {
        const currentDate = this.navigatedDate();
        const dateTime = DateTime.fromJSDate(currentDate);
        let newDate: Date;

        switch (view) {
            case "month":
                newDate = dateTime.plus({ months: offset }).toJSDate();
                break;
            case "year":
                newDate = dateTime.plus({ years: offset }).toJSDate();
                break;
            case "decade":
                newDate = dateTime.plus({ years: offset * 10 }).toJSDate();
                break;
        }

        if (view === "month" && this.isDateDisabled(newDate)) {
            const direction = offset > 0 ? 1 : -1;
            const maxAttempts = 31;
            for (let i = 1; i <= maxAttempts; i++) {
                const adjustedDate = DateTime.fromJSDate(newDate)
                    .plus({ days: direction * i })
                    .toJSDate();
                if (!this.isDateDisabled(adjustedDate)) {
                    newDate = adjustedDate;
                    break;
                }
            }
        }
        this.rangePreviewDate.set(null);
        this.navigatedDate.set(newDate);
    }

    private navigateByWeeksOrRows(offset: number, view: CalendarView): void {
        const currentDate = this.navigatedDate();
        const dateTime = DateTime.fromJSDate(currentDate);
        let newDate: Date;

        switch (view) {
            case "month":
                newDate = dateTime.plus({ weeks: offset }).toJSDate();
                break;
            case "year":
                newDate = dateTime.plus({ months: offset * 3 }).toJSDate();
                break;
            case "decade":
                newDate = dateTime.plus({ years: offset * 4 }).toJSDate();
                break;
        }

        // A disabled day can be focused (it is announced as unavailable); only the range bounds stop the arrows.
        if (view === "month" && this.isOutOfRange(newDate)) {
            return;
        }
        this.rangePreviewDate.set(null);
        this.navigatedDate.set(newDate);
    }

    private navigatePeriodKeyboard(direction: "prev" | "next"): void {
        this.rangePreviewDate.set(null);
        this.onNavigationClick(direction);
    }

    private navigateToEnd(view: CalendarView): void {
        const currentDate = this.navigatedDate();
        const dateTime = DateTime.fromJSDate(currentDate);
        let newDate: Date;

        switch (view) {
            case "month": {
                const firstDayIso = FIRST_DAY_OF_WEEK_TO_ISO[this.effectiveFirstDay()];
                const lastDayOfWeekIso = ((firstDayIso + 5) % 7) + 1;
                const daysToAdd = (lastDayOfWeekIso - dateTime.weekday + 7) % 7;
                newDate = dateTime.plus({ days: daysToAdd }).toJSDate();
                if (this.isDateDisabled(newDate)) {
                    for (let i = 1; i <= 6; i++) {
                        const testDate = DateTime.fromJSDate(newDate).minus({ days: i }).toJSDate();
                        if (!this.isDateDisabled(testDate)) {
                            newDate = testDate;
                            break;
                        }
                    }
                }
                break;
            }
            case "year":
                newDate = dateTime.set({ month: 12 }).toJSDate();
                break;
            case "decade": {
                const yearEnd = this.decadeEnd();
                newDate = dateTime.set({ year: yearEnd }).toJSDate();
                break;
            }
        }

        this.rangePreviewDate.set(null);
        this.navigatedDate.set(newDate);
    }

    private navigateToStart(view: CalendarView): void {
        const currentDate = this.navigatedDate();
        const dateTime = DateTime.fromJSDate(currentDate);
        let newDate: Date;

        switch (view) {
            case "month": {
                const firstDayIso = FIRST_DAY_OF_WEEK_TO_ISO[this.effectiveFirstDay()];
                const daysToSubtract = (dateTime.weekday - firstDayIso + 7) % 7;
                newDate = dateTime.minus({ days: daysToSubtract }).toJSDate();
                if (this.isDateDisabled(newDate)) {
                    for (let i = 1; i <= 6; i++) {
                        const testDate = DateTime.fromJSDate(newDate).plus({ days: i }).toJSDate();
                        if (!this.isDateDisabled(testDate)) {
                            newDate = testDate;
                            break;
                        }
                    }
                }
                break;
            }
            case "year":
                newDate = dateTime.set({ month: 1 }).toJSDate();
                break;
            case "decade": {
                const yearStart = this.decadeStart();
                newDate = dateTime.set({ year: yearStart }).toJSDate();
                break;
            }
        }

        this.rangePreviewDate.set(null);
        this.navigatedDate.set(newDate);
    }

    private navigateToToday(): void {
        this.refreshToday();
        const today = this.today();
        if (this.isDateDisabled(today)) {
            return;
        }
        this.rangePreviewDate.set(null);
        this.navigatedDate.set(today);
        this.calendarView.set("month");
    }

    private selectFocusedItem(): void {
        const view = this.calendarView();
        const currentDate = this.navigatedDate();

        switch (view) {
            case "month":
                if (!this.isDateDisabled(currentDate)) {
                    const selection = this.selection();
                    if (selection === "single") {
                        this.handleSingleSelection(currentDate);
                    } else if (selection === "multiple") {
                        this.handleSingleSelection(currentDate);
                    } else if (selection === "range") {
                        this.handleRangeSelection(currentDate);
                    }
                }
                break;
            case "year":
                this.calendarView.set("month");
                break;
            case "decade":
                this.calendarView.set("year");
                break;
        }
    }

    private selectRangeToFocused(): void {
        const focusedDate = this.navigatedDate();
        if (this.isDateDisabled(focusedDate)) {
            return;
        }
        const selectedDates = this.getDatesForMultipleSelection(focusedDate);
        this.setCurrentDate(selectedDates);
    }

    private setCurrentDate(date: Date | Date[] | null): void {
        this.selectedDates.set(this.getDateArray(date));
    }

    private setupKeyboardNavigation(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => this.handleKeydown(event));
    }

    private switchToLowerView(): void {
        const view = this.calendarView();
        switch (view) {
            case "decade":
                this.calendarView.set("year");
                break;
            case "year":
                this.calendarView.set("month");
                break;
        }
    }

    private switchToUpperView(): void {
        const view = this.calendarView();
        switch (view) {
            case "month":
                this.calendarView.set("year");
                break;
            case "year":
                this.calendarView.set("decade");
                break;
        }
    }

    private toggleFocusedDateInSelection(): void {
        const focusedDate = this.navigatedDate();
        if (this.isDateDisabled(focusedDate)) {
            return;
        }
        const currentSelection = this.selectedDates();
        const dateTime = DateTime.fromJSDate(focusedDate);
        const isAlreadySelected = currentSelection.some(d => DateTime.fromJSDate(d).hasSame(dateTime, "day"));
        if (isAlreadySelected) {
            const newSelection = currentSelection.filter(d => !DateTime.fromJSDate(d).hasSame(dateTime, "day"));
            this.setCurrentDate(newSelection);
        } else {
            this.setCurrentDate([...currentSelection, focusedDate]);
        }
    }
}
