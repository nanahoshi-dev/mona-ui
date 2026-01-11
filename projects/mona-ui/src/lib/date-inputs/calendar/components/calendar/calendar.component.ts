import { DatePipe } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    forwardRef,
    inject,
    input,
    model,
    OnInit,
    signal
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { Dictionary, lastOrDefault, range, select } from "@mirei/ts-collections";
import { ChevronLeft, ChevronRight, LucideAngularModule } from "lucide-angular";
import { DateTime, DurationObjectUnits } from "luxon";
import { bufferCount, Subject, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { CalendarView } from "../../../models/CalendarView";
import { MonthViewDayDirective } from "../../directives/month-view-day.directive";
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
    imports: [ButtonDirective, DatePipe, MonthViewDayDirective, LucideAngularModule],
    host: {
        "[class]": "baseClass()",
        "(blur)": "onBlur()"
    }
})
export class CalendarComponent implements OnInit, ControlValueAccessor, CalendarVariantInput {
    readonly #destroyRef = inject(DestroyRef);
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
    protected readonly decadeTableClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        return calendarDecadeViewTableThemeVariants(theme)({ rounded, size });
    });
    protected readonly decadeYears = computed(() => {
        const navigatedDate = this.navigatedDate();
        const date = DateTime.fromJSDate(navigatedDate);
        const year = date.year;
        const decadeStart = year - (year % 10);
        return Array.from({ length: 10 }, (_, i) => decadeStart + i);
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
        const rounded = this.rounded();
        const size = this.size();
        return calendarYearViewTableThemeVariants(theme)({ rounded, size });
    });

    public readonly disabled = model(false);
    public readonly disabledDates = input<Iterable<Date>>([]);
    public readonly firstDay = input<FirstDayOfWeek>("monday");
    public readonly max = input<Date | null>(null);
    public readonly min = input<Date | null>(null);
    public readonly rounded = input<CalendarVariantProps["rounded"]>("medium");
    public readonly selection = input<CalendarSelection>("single");
    public readonly size = input<CalendarVariantProps["size"]>("medium");
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        toObservable(this.value)
            .pipe(takeUntilDestroyed())
            .subscribe(() => this.#propagateChange?.(this.value()));
        this.setRangeChangeSubscription();
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
}
