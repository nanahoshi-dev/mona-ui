import { DatePipe, NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
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
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { PreventableEvent, TakeFirstPipe } from "@nanahoshi/mona-ui/common";
import { CalendarService, CalendarView, DateDisabledType } from "@nanahoshi/mona-ui/date-input";
import { createElementControlId, rxTimeout } from "@nanahoshi/mona-ui/internal";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { any, Dictionary, index, lastOrDefault, range, select } from "@mirei/ts-collections";
import { DateTime, DurationObjectUnits } from "luxon";
import { fromEvent, skip } from "rxjs";
import { twMerge } from "tailwind-merge";
import { CalendarDecadeCellTemplateDirective } from "../../directives/calendar-decade-cell-template.directive";
import { CalendarMonthCellTemplateDirective } from "../../directives/calendar-month-cell-template.directive";
import { CalendarYearCellTemplateDirective } from "../../directives/calendar-year-cell-template.directive";
import { DecadeYearDirective } from "../../directives/decade-year.directive";
import { MonthDayDirective } from "../../directives/month-day.directive";
import { YearMonthDirective } from "../../directives/year-month.directive";
import { CalendarSelection } from "../../models/CalendarSelection";
import { FirstDayOfWeek } from "../../models/FirstDayOfWeek";
import {
    calendarBaseThemeVariants,
    calendarDecadeViewGridThemeVariants,
    calendarHeaderThemeVariants,
    calendarMonthViewGridHeaderThemeVariants,
    calendarMonthViewGridThemeVariants,
    CalendarVariantInput,
    CalendarVariantProps,
    calendarYearViewGridThemeVariants
} from "../../styles/calendar.styles";
import { compareDates } from "../../utils/compareDates";

@Component({
    selector: "mona-calendar",
    templateUrl: "./calendar.component.html",
    imports: [
        ButtonDirective,
        DatePipe,
        MonthDayDirective,
        DecadeYearDirective,
        YearMonthDirective,
        NgTemplateOutlet,
        TakeFirstPipe,
        LucideChevronLeft,
        LucideChevronRight
    ],
    host: {
        role: "application",
        "[attr.aria-label]": "ariaLabel()",
        "[attr.aria-invalid]": "invalidState() ? 'true' : null",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-required]": "required() || null",
        "[attr.tabindex]": "disabled() ? -1 : 0",
        "[class]": "baseClass()"
    }
})
export class CalendarComponent implements CalendarVariantInput, FormValueControl<Date | Date[] | null> {
    readonly #calendarService = inject(CalendarService, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #monthDict = computed(() => {
        const day = this.navigatedDate();
        const firstDayOfMonth = DateTime.fromJSDate(day).startOf("month");
        const lastDayOfMonth = DateTime.fromJSDate(day).endOf("month");
        const firstDayOfWeek = this.firstDay() === "monday" ? 1 : 0;

        let firstDayOfCalendar: DateTime;
        const monthStartWeekday = firstDayOfMonth.weekday;

        if (firstDayOfWeek === 0) {
            const daysToSubtract = monthStartWeekday === 7 ? 0 : monthStartWeekday;
            firstDayOfCalendar = firstDayOfMonth.minus({ days: daysToSubtract });
        } else {
            firstDayOfCalendar = firstDayOfMonth.startOf("week");
        }

        let lastDayOfCalendar: DateTime;
        const monthEndWeekday = lastDayOfMonth.weekday;

        if (firstDayOfWeek === 0) {
            const daysToAdd = monthEndWeekday === 7 ? 6 : 6 - monthEndWeekday;
            lastDayOfCalendar = lastDayOfMonth.plus({ days: daysToAdd });
        } else {
            lastDayOfCalendar = lastDayOfMonth.endOf("week");
        }

        const dictionary = new Dictionary<Date, number>();
        for (let i = firstDayOfCalendar; i <= lastDayOfCalendar; i = i.plus({ days: 1 })) {
            dictionary.add(i.toJSDate(), i.day);
        }

        if (monthEndWeekday === 7) {
            for (let i = 0; i < 7; i++) {
                dictionary.add(
                    lastDayOfMonth.plus({ days: i + 1 }).toJSDate(),
                    lastDayOfMonth.plus({ days: i + 1 }).day
                );
            }
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
    readonly #themeService = inject(ThemeService);
    protected readonly ariaLabel = computed(() => {
        const view = this.calendarView();
        const navigatedDate = this.navigatedDate();
        const date = DateTime.fromJSDate(navigatedDate);
        switch (view) {
            case "month":
                return `Calendar, ${date.toFormat("MMMM yyyy")}`;
            case "year":
                return `Year view, ${date.toFormat("yyyy")}`;
            case "decade":
                return `Decade view, ${this.decadeStart()} - ${this.decadeEnd()}`;
        }
    });
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const disabled = this.disabled();
        const readonly = this.readonly();
        const rounded = this.rounded() === "full" ? "large" : this.rounded();
        const variantClass = calendarBaseThemeVariants(theme)({ disabled, readonly, rounded });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly calendarView = signal<CalendarView>("month");
    protected readonly decadeCellTemplate = contentChild(CalendarDecadeCellTemplateDirective);
    protected readonly decadeEnd = computed(() => {
        return this.decadeStart() + 9;
    });
    protected readonly decadeGridClass = computed(() => {
        const theme = this.#themeService.theme();
        return calendarDecadeViewGridThemeVariants(theme)();
    });
    protected readonly decadeStart = computed(() => {
        const navigatedDate = this.navigatedDate();
        const date = DateTime.fromJSDate(navigatedDate);
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
    protected readonly gridId = createElementControlId();
    protected readonly headerClass = computed(() => {
        const theme = this.#themeService.theme();
        return calendarHeaderThemeVariants(theme)({});
    });
    protected readonly invalidState = computed(
        () => this.invalid() || (this.required() && this.touched() && this.isEmptyValue())
    );
    protected readonly monthBounds = computed(() => {
        const navigatedDate = this.navigatedDate();
        const firstDayOfMonth = DateTime.fromJSDate(navigatedDate).startOf("month");
        const lastDayOfMonth = DateTime.fromJSDate(navigatedDate).endOf("month");
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
        const theme = this.#themeService.theme();
        return calendarMonthViewGridThemeVariants(theme)();
    });
    protected readonly monthGridHeaderClass = computed(() => {
        const theme = this.#themeService.theme();
        return calendarMonthViewGridHeaderThemeVariants(theme)();
    });
    protected readonly months = computed(() => {
        const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return index(names)
            .chunk(3)
            .select(e => e.select(m => [m[0] + 1, m[1]] as const).toImmutableSet())
            .toImmutableSet();
    });
    protected readonly navigatedDate = signal(new Date());
    protected readonly nextButtonLabel = computed(() => {
        const view = this.calendarView();
        switch (view) {
            case "month":
                return "Next month";
            case "year":
                return "Next year";
            case "decade":
                return "Next decade";
        }
    });
    protected readonly prevButtonLabel = computed(() => {
        const view = this.calendarView();
        switch (view) {
            case "month":
                return "Previous month";
            case "year":
                return "Previous year";
            case "decade":
                return "Previous decade";
        }
    });
    protected readonly pendingRangeStart = signal<Date | null>(null);
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
            const totalDays = endDate.diff(startDate, "days").days + 1;
            return range(0, totalDays)
                .select(i => startDate.plus({ days: i }).toJSDate())
                .toArray();
        }
        return Array.isArray(v) ? v : [v];
    });
    protected readonly timezone = DateTime.local().zoneName ?? undefined;
    protected readonly todayButtonLabel = computed(() => {
        const today = DateTime.now();
        return `Go to today, ${today.toFormat("MMMM d, yyyy")}`;
    });
    protected readonly viewSwitchButtonLabel = computed(() => {
        const view = this.calendarView();
        const date = DateTime.fromJSDate(this.navigatedDate());
        switch (view) {
            case "month":
                return `Switch to year view, currently ${date.toFormat("MMMM yyyy")}`;
            case "year":
                return `Switch to decade view, currently ${date.toFormat("yyyy")}`;
            case "decade":
                return `${this.decadeStart()} to ${this.decadeEnd()}`;
        }
    });
    protected readonly weekdays = computed(() => {
        const firstDayOfWeek = this.firstDay();
        const days = [
            { short: "Sun", full: "Sunday" },
            { short: "Mon", full: "Monday" },
            { short: "Tue", full: "Tuesday" },
            { short: "Wed", full: "Wednesday" },
            { short: "Thu", full: "Thursday" },
            { short: "Fri", full: "Friday" },
            { short: "Sat", full: "Saturday" }
        ];
        return firstDayOfWeek === "monday" ? [...days.slice(1), days[0]] : days;
    });
    protected readonly yearCellTemplate = contentChild(CalendarYearCellTemplateDirective);
    protected readonly yearGridClass = computed(() => {
        const theme = this.#themeService.theme();
        return calendarYearViewGridThemeVariants(theme)();
    });

    /**
     * @description Sets the disabled state of the calendar.
     */
    public readonly disabled = model(false);

    /**
     * @description Sets the disabled dates of the calendar.
     * Accepts either an iterable of Date objects or a predicate function.
     */
    public readonly disabledDates = input<DateDisabledType>();

    /**
     * @description Sets the first day of the week.
     * @default "monday"
     */
    public readonly firstDay = input<FirstDayOfWeek>("monday");

    /**
     * @description Marks the calendar as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false);

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
    public readonly readonly = input(false);

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
     * @description Emitted when the calendar value is changed by user interaction.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets whether the calendar is required. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly required = input(false);

    /**
     * @description Sets the touched state of the calendar. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false);

    /**
     * @description Adds custom CSS classes to the calendar host element.
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description The current value of the calendar.
     * @default null
     */
    public readonly value = model<Date | Date[] | null>(null);

    /**
     * @description Enables the display of week numbers in the calendar.
     * @default false
     */
    public readonly weekNumber = input<boolean>(false);

    public constructor() {
        afterNextRender({
            read: () => {
                this.setupKeyboardNavigation();
                this.focusActiveCell();
            }
        });
        effect(() => {
            const min = this.minDate();
            const max = this.maxDate();
            this.disabledDates();
            untracked(() => {
                const navigationDate = this.navigatedDate();
                if (this.isDateDisabled(navigationDate)) {
                    const newDate = min ?? max;
                    if (newDate) {
                        this.navigatedDate.set(newDate);
                    }
                }
            });
        });
        effect(() => {
            const v = this.value();
            untracked(() => {
                if (v != null) {
                    const lastDate = Array.isArray(v) ? (lastOrDefault(v) ?? DateTime.now().toJSDate()) : v;
                    this.navigatedDate.set(lastDate);
                }
            });
        });
        toObservable(this.calendarView)
            .pipe(skip(1))
            .subscribe(() => this.focusActiveCell());
    }

    protected onDayClick(date: Date, event: MouseEvent): void {
        event.preventDefault();
        if (this.disabled() || this.readonly()) {
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
        if (this.disabled() || this.readonly() || this.selection() !== "range" || this.pendingRangeStart() == null) {
            return;
        }
        this.rangePreviewDate.set(date);
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
        if (this.disabled() || this.readonly()) {
            return;
        }
        const currentDate = DateTime.now();
        const navigatedDate = DateTime.fromJSDate(this.navigatedDate()).set({
            year: currentDate.year,
            month: currentDate.month,
            day: currentDate.day
        });
        this.clearPendingRange();
        this.navigatedDate.set(navigatedDate.toJSDate());
        this.setCurrentDate(navigatedDate.toJSDate());
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

    private clearPendingRange(): void {
        this.pendingRangeStart.set(null);
        this.rangePreviewDate.set(null);
    }

    private commitUserSelection(): void {
        this.value.set(this.#outputValue());
        this.touch.emit();
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
        const totalDays = DateTime.fromJSDate(endDate).diff(DateTime.fromJSDate(startDate), "days").days + 1;
        return range(0, totalDays)
            .select(i => DateTime.fromJSDate(startDate).plus({ days: i }).toJSDate())
            .toArray();
    }

    private getInclusiveDateRange(date1: Date, date2: Date): Date[] {
        const dateTime1 = DateTime.fromJSDate(date1);
        const dateTime2 = DateTime.fromJSDate(date2);
        const startDate = dateTime1 <= dateTime2 ? dateTime1 : dateTime2;
        const endDate = dateTime1 <= dateTime2 ? dateTime2 : dateTime1;
        const totalDays = endDate.diff(startDate, "days").days + 1;
        return range(0, totalDays)
            .select(i => startDate.plus({ days: i }).toJSDate())
            .toArray();
    }

    private handleKeydown(event: KeyboardEvent): void {
        if (this.disabled()) {
            return;
        }

        const preventableEvent = new PreventableEvent("calendarKeydown", event);
        this.#calendarService?.keydown$.next(preventableEvent);

        if (preventableEvent.isDefaultPrevented()) {
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
                    this.navigatePeriodKeyboard("prev");
                } else {
                    this.navigateByDaysOrCells(-1, view);
                }
                shouldFocusCell = true;
                break;
            case "ArrowRight":
                event.preventDefault();
                if (isCtrlOrCmd) {
                    this.navigatePeriodKeyboard("next");
                } else {
                    this.navigateByDaysOrCells(1, view);
                }
                shouldFocusCell = true;
                break;
            case "Enter":
            case " ": {
                const target = event.target as HTMLElement;
                if (target.tagName === "BUTTON" || target.closest("button")) {
                    return;
                }
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
                this.navigateByPeriod(-1, view);
                shouldFocusCell = true;
                break;
            case "PageDown":
                event.preventDefault();
                this.navigateByPeriod(1, view);
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
            const alreadySelected = selectedDates.any(e => e.equals(date1));
            if (alreadySelected) {
                const newDates = selectedDates
                    .where(e => !e.equals(date1))
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
                    this.extendSelection(-1);
                    return true;
                case "ArrowRight":
                    event.preventDefault();
                    this.extendSelection(1);
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

    private isDateDisabled(date: Date): boolean {
        const disabledDates = this.disabledDates();
        const max = this.maxDate();
        const min = this.minDate();

        let isDisabledByInput = false;
        if (typeof disabledDates === "function") {
            isDisabledByInput = disabledDates(date);
        } else if (disabledDates) {
            isDisabledByInput = any(disabledDates, d => compareDates(date, d, "=="));
        }

        return isDisabledByInput || compareDates(date, max, ">") || compareDates(date, min, "<");
    }

    private isEmptyValue(): boolean {
        const value = this.value();
        return value == null || (Array.isArray(value) && value.length === 0);
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

        if (view === "month" && this.isDateDisabled(newDate)) {
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

        if (view === "month" && this.isDateDisabled(newDate)) {
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
            case "month":
                newDate = dateTime.endOf("month").toJSDate();
                if (this.isDateDisabled(newDate)) {
                    for (let i = newDate.getDate() - 1; i >= 1; i--) {
                        const testDate = dateTime.set({ day: i }).toJSDate();
                        if (!this.isDateDisabled(testDate)) {
                            newDate = testDate;
                            break;
                        }
                    }
                }
                break;
            case "year":
                newDate = dateTime.set({ month: 12 }).toJSDate();
                break;
            case "decade":
                const yearEnd = this.decadeEnd();
                newDate = dateTime.set({ year: yearEnd }).toJSDate();
                break;
        }

        this.rangePreviewDate.set(null);
        this.navigatedDate.set(newDate);
    }

    private navigateToStart(view: CalendarView): void {
        const currentDate = this.navigatedDate();
        const dateTime = DateTime.fromJSDate(currentDate);
        let newDate: Date;

        switch (view) {
            case "month":
                newDate = dateTime.startOf("month").toJSDate();
                if (this.isDateDisabled(newDate)) {
                    const daysInMonth = dateTime.daysInMonth ?? 31;
                    for (let i = 2; i <= daysInMonth; i++) {
                        const testDate = dateTime.set({ day: i }).toJSDate();
                        if (!this.isDateDisabled(testDate)) {
                            newDate = testDate;
                            break;
                        }
                    }
                }
                break;
            case "year":
                newDate = dateTime.set({ month: 1 }).toJSDate();
                break;
            case "decade":
                const yearStart = this.decadeStart();
                newDate = dateTime.set({ year: yearStart }).toJSDate();
                break;
        }

        this.rangePreviewDate.set(null);
        this.navigatedDate.set(newDate);
    }

    private navigateToToday(): void {
        const today = DateTime.now().toJSDate();
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
