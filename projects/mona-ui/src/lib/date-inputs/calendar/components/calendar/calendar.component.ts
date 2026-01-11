import { DatePipe } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    ElementRef,
    forwardRef,
    inject,
    input,
    model,
    OnInit,
    signal
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { any, Dictionary, index, lastOrDefault, range, select } from "@mirei/ts-collections";
import { ChevronLeft, ChevronRight, LucideAngularModule } from "lucide-angular";
import { DateTime, DurationObjectUnits } from "luxon";
import { bufferCount, distinctUntilChanged, fromEvent, Subject, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { CalendarView } from "../../../models/CalendarView";
import { DecadeYearDirective } from "../../directives/decade-year.directive";
import { MonthDayDirective } from "../../directives/month-day.directive";
import { YearMonthDirective } from "../../directives/year-month.directive";
import { CalendarSelection } from "../../models/CalendarSelection";
import { FirstDayOfWeek } from "../../models/FirstDayOfWeek";
import {
    calendarBaseThemeVariants,
    calendarDecadeViewTableThemeVariants,
    calendarHeaderThemeVariants,
    calendarMonthViewTableThemeVariants,
    CalendarVariantInput,
    CalendarVariantProps,
    calendarYearViewTableThemeVariants
} from "../../styles/calendar.styles";

@Component({
    selector: "mona-calendar",
    templateUrl: "./calendar.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CalendarComponent),
            multi: true
        }
    ],
    imports: [
        ButtonDirective,
        DatePipe,
        MonthDayDirective,
        LucideAngularModule,
        DecadeYearDirective,
        YearMonthDirective
    ],
    host: {
        "[attr.tabindex]": "disabled() ? -1 : 0",
        "[class]": "baseClass()",
        "(blur)": "onBlur()"
    }
})
export class CalendarComponent implements OnInit, ControlValueAccessor, CalendarVariantInput {
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

        if (firstDayOfWeek === 0 && monthEndWeekday === 7) {
            for (let i = 0; i < 7; i++) {
                dictionary.add(
                    lastDayOfMonth.plus({ days: i + 1 }).toJSDate(),
                    lastDayOfMonth.plus({ days: i + 1 }).day
                );
            }
        } else if (firstDayOfWeek === 1 && monthEndWeekday === 7) {
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
    readonly #rangeChange$ = new Subject<Date>();
    readonly #themeService = inject(ThemeService);
    #propagateChange: Action<Date | Date[] | null> | null = null;
    #propagateTouched: Action | null = null;
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const disabled = this.disabled();
        const rounded = this.rounded() === "full" ? "large" : this.rounded();
        const size = this.size();
        const variantClass = calendarBaseThemeVariants(theme)({ disabled, rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly calendarView = signal<CalendarView>("month");
    protected readonly decadeEnd = computed(() => {
        return this.decadeStart() + 9;
    });
    protected readonly decadeStart = computed(() => {
        const navigatedDate = this.navigatedDate();
        const date = DateTime.fromJSDate(navigatedDate);
        const year = date.year;
        return year - (year % 10);
    });
    protected readonly decadeTableClass = computed(() => {
        const theme = this.#themeService.theme();
        return calendarDecadeViewTableThemeVariants(theme)();
    });
    protected readonly decadeYears = computed(() => {
        const decadeStart = this.decadeStart();
        return range(decadeStart, 10)
            .chunk(4)
            .select(e => e.toArray())
            .toArray();
    });
    protected readonly headerClass = computed(() => {
        const theme = this.#themeService.theme();
        return calendarHeaderThemeVariants(theme)({});
    });
    protected readonly monthBounds = computed(() => {
        const navigatedDate = this.navigatedDate();
        const firstDayOfMonth = DateTime.fromJSDate(navigatedDate).startOf("month");
        const lastDayOfMonth = DateTime.fromJSDate(navigatedDate).endOf("month");
        return { start: firstDayOfMonth.toJSDate(), end: lastDayOfMonth.toJSDate() };
    });
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
    protected readonly monthTableClass = computed(() => {
        const theme = this.#themeService.theme();
        return calendarMonthViewTableThemeVariants(theme)();
    });
    protected readonly months = computed(() => {
        const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return index(names)
            .chunk(3)
            .select(e => e.select(m => [m[0] + 1, m[1]] as const).toImmutableSet())
            .toImmutableSet();
    });
    protected readonly navigatedDate = signal(new Date());
    protected readonly nextMonthIcon = ChevronRight;
    protected readonly prevMonthIcon = ChevronLeft;
    protected readonly selectedDates = signal<Date[]>([]);
    protected readonly timezone = DateTime.local().zoneName ?? undefined;
    protected readonly value = computed(() => {
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
    protected readonly weekdays = computed(() => {
        const firstDayOfWeek = this.firstDay();
        return firstDayOfWeek === "monday"
            ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    });
    protected readonly yearTableClass = computed(() => {
        const theme = this.#themeService.theme();
        return calendarYearViewTableThemeVariants(theme)();
    });

    /**
     * @description Sets the disabled state of the calendar.
     */
    public readonly disabled = model(false);

    /**
     * @description Sets the disabled dates of the calendar.
     */
    public readonly disabledDates = input<Iterable<Date>>([]);

    /**
     * @description Sets the first day of the week.
     * @default "monday"
     */
    public readonly firstDay = input<FirstDayOfWeek>("monday");

    /**
     * @description Sets the maximum date that can be selected.
     */
    public readonly max = input<Date | null>(null);

    /**
     * @description Sets the minimum date that can be selected.
     */
    public readonly min = input<Date | null>(null);

    /**
     * @description Sets the border radius of the calendar.
     */
    public readonly rounded = input<CalendarVariantProps["rounded"]>("medium");

    /**
     * @description Sets the selection mode of the calendar.
     * @default "single"
     */
    public readonly selection = input<CalendarSelection>("single");

    /**
     * @description Sets the size of the calendar.
     * @default "medium"
     */
    public readonly size = input<CalendarVariantProps["size"]>("medium");
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        toObservable(this.value)
            .pipe(takeUntilDestroyed(), distinctUntilChanged())
            .subscribe(() => this.#propagateChange?.(this.value()));
        afterNextRender({
            read: () => {
                this.setupKeyboardNavigation();
                this.setRangeChangeSubscription();
            }
        });
    }

    public ngOnInit(): void {
        this.setDateValues();
        const date = lastOrDefault(this.selectedDates()) ?? DateTime.now().toJSDate();
        if (Array.isArray(date)) {
            this.setCurrentDate(lastOrDefault(date));
            return;
        }
        this.navigatedDate.set(date);
    }

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {
        this.#propagateTouched = fn;
    }

    public setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    public writeValue(date: Date | Date[] | null | undefined): void {
        this.selectedDates.set(this.getDateArray(date ?? null));
        const navigatedDate = Array.isArray(date)
            ? (lastOrDefault(date) ?? DateTime.now().toJSDate())
            : (date ?? DateTime.now().toJSDate());
        this.navigatedDate.set(navigatedDate);
        this.setDateValues();
    }

    protected onBlur(): void {
        this.#propagateTouched?.();
    }

    protected onDayClick(date: Date, event: MouseEvent): void {
        event.preventDefault();
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
            this.#rangeChange$.next(date);
            this.navigatedDate.set(date);
        }
    }

    protected onMonthClick(month: number): void {
        this.navigatedDate.set(DateTime.fromJSDate(this.navigatedDate()).set({ month }).toJSDate());
        this.calendarView.set("month");
    }

    protected onNavigationClick(direction: "prev" | "next"): void {
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

    protected onViewChangeClick(view: CalendarView): void {
        this.calendarView.set(view);
    }

    protected onYearClick(year: number): void {
        this.navigatedDate.set(DateTime.fromJSDate(this.navigatedDate()).set({ year }).toJSDate());
        this.calendarView.set("year");
    }

    private getDateArray(date: Date | Date[] | null): Date[] {
        return Array.isArray(date) ? date : [date ?? DateTime.now().toJSDate()];
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

    private handleMultipleSelection(date: Date, rangedSelection: boolean): void {
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

    private handleSingleSelection(date: Date): void {
        const value = this.selectedDates();
        if (value) {
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

    private handleKeydown(event: KeyboardEvent): void {
        if (this.disabled()) {
            return;
        }
        const view = this.calendarView();
        const isCtrlOrCmd = event.ctrlKey || event.metaKey;
        const isShift = event.shiftKey;
        const selection = this.selection();

        // Handle multiple selection mode shortcuts
        if (selection === "multiple" && (isCtrlOrCmd || isShift)) {
            if (this.handleMultipleSelectionKeyboard(event, isCtrlOrCmd, isShift)) {
                return;
            }
        }

        switch (event.key) {
            case "ArrowUp":
                event.preventDefault();
                if (isCtrlOrCmd) {
                    this.switchToUpperView();
                } else {
                    this.navigateByWeeksOrRows(-1, view);
                }
                break;
            case "ArrowDown":
                event.preventDefault();
                if (isCtrlOrCmd) {
                    this.switchToLowerView();
                } else {
                    this.navigateByWeeksOrRows(1, view);
                }
                break;
            case "ArrowLeft":
                event.preventDefault();
                if (isCtrlOrCmd) {
                    this.navigatePeriodKeyboard("prev");
                } else {
                    this.navigateByDaysOrCells(-1, view);
                }
                break;
            case "ArrowRight":
                event.preventDefault();
                if (isCtrlOrCmd) {
                    this.navigatePeriodKeyboard("next");
                } else {
                    this.navigateByDaysOrCells(1, view);
                }
                break;
            case "Enter":
                event.preventDefault();
                if (isCtrlOrCmd && selection === "multiple") {
                    this.toggleFocusedDateInSelection();
                } else if (isShift && selection === "multiple") {
                    this.selectRangeToFocused();
                } else {
                    this.selectFocusedItem();
                }
                break;
            case "Home":
                event.preventDefault();
                this.navigateToStart(view);
                break;
            case "End":
                event.preventDefault();
                this.navigateToEnd(view);
                break;
            case "PageUp":
                event.preventDefault();
                this.navigateByPeriod(-1, view);
                break;
            case "PageDown":
                event.preventDefault();
                this.navigateByPeriod(1, view);
                break;
            case "t":
            case "T":
                if (!isCtrlOrCmd && !isShift) {
                    event.preventDefault();
                    this.navigateToToday();
                }
                break;
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

    private isDateDisabled(date: Date): boolean {
        const disabledDates = this.disabledDates();
        const max = this.max();
        const min = this.min();
        return (
            any(disabledDates, d => this.isSameDay(date, d)) ||
            (max != null && date > max) ||
            (min != null && date < min)
        );
    }

    private isSameDay(date1: Date, date2: Date): boolean {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
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
        this.navigatedDate.set(newDate);
    }

    private navigatePeriodKeyboard(direction: "prev" | "next"): void {
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

        this.navigatedDate.set(newDate);
    }

    private navigateToToday(): void {
        const today = DateTime.now().toJSDate();
        if (this.isDateDisabled(today)) {
            return;
        }
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
                        this.#rangeChange$.next(currentDate);
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
        this.#propagateChange?.(date);
    }

    private setDateValues(): void {
        const value = this.selectedDates();
        if (value && Array.isArray(value)) {
            this.setCurrentDate(lastOrDefault(value));
            return;
        }
        const newNavigatedDate = value ?? DateTime.now().toJSDate();
        this.navigatedDate.set(newNavigatedDate);
    }

    private setRangeChangeSubscription(): void {
        this.#rangeChange$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                tap(date => this.selectedDates.set([date])),
                bufferCount(2, 2),
                tap(([date1, date2]) => {
                    const dateTime1 = DateTime.fromJSDate(date1);
                    const dateTime2 = DateTime.fromJSDate(date2);
                    const startDate = dateTime1.diff(dateTime2, "days").days < 0 ? dateTime1 : dateTime2;
                    const endDate = dateTime1.diff(dateTime2, "days").days < 0 ? dateTime2 : dateTime1;
                    const totalDays = endDate.diff(startDate, "days").days + 1;
                    const selectedDates = range(0, totalDays)
                        .select(i => startDate.plus({ days: i }).toJSDate())
                        .toArray();
                    this.setCurrentDate(selectedDates);
                    this.navigatedDate.set(date2);
                })
            )
            .subscribe();
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
