import { DecimalPipe } from "@angular/common";
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
    signal,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { DateTime } from "luxon";
import { fromEvent, tap } from "rxjs";
import { filter } from "rxjs/operators";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { createElementControlId } from "../../../../utils/createElementControlId";
import { PreventableEvent } from "../../../../utils/PreventableEvent";
import { HourFormat } from "../../../models/HourFormat";
import { Meridiem } from "../../../models/Meridiem";
import { TimeLimiterPipe } from "../../../pipes/time-limiter.pipe";
import { TimeSelectorService } from "../../../services/time-selector.service";
import { TimePickerVariantProps } from "../../../time-picker/styles/time-picker.styles";
import { generateHourSet, generateMinuteSet, generateSecondSet } from "../../../utils/generateHourSet";
import { TimeSelectorItemDirective } from "../../directives/time-selector-item.directive";
import { TimeSelectorListDirective } from "../../directives/time-selector-list.directive";
import { TimeListType } from "../../models/TimeListType";
import {
    timeSelectorBaseThemeVariants,
    timeSelectorFooterThemeVariants,
    timeSelectorHeaderThemeVariants,
    timeSelectorInfoContainerThemeVariants,
    timeSelectorListContainerThemeVariants,
    TimeSelectorVariantInput,
    TimeSelectorVariantProps
} from "../../styles/time-selector.styles";

@Component({
    selector: "mona-time-selector",
    templateUrl: "./time-selector.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TimeSelectorComponent),
            multi: true
        }
    ],
    imports: [DecimalPipe, TimeLimiterPipe, TimeSelectorItemDirective, ButtonDirective, TimeSelectorListDirective],
    host: {
        role: "group",
        "[attr.aria-label]": "ariaLabel()",
        "[class]": "baseClass()",
        "(blur)": "onBlur()"
    }
})
export class TimeSelectorComponent implements ControlValueAccessor, TimeSelectorVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #height = signal(0);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #themeService = inject(ThemeService);
    readonly #timeSelectorService = inject(TimeSelectorService, { optional: true });
    readonly #value = signal<Date | null>(null);
    #propagateChange: Action<Date | null> | null = null;
    #propagateTouched: Action | null = null;

    protected readonly amMeridiemVisible = computed(() => {
        const min = this.min();
        return !(min && min.getHours() >= 12);
    });
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const disabled = this.disabled();
        return timeSelectorBaseThemeVariants(theme)({ disabled });
    });
    protected readonly computedPopupHeight = this.#height.asReadonly();
    protected readonly focusedList = signal<TimeListType>("hours");
    protected readonly footerClass = computed(() => {
        const theme = this.#themeService.theme();
        return timeSelectorFooterThemeVariants(theme)();
    });
    protected readonly headerClass = computed(() => {
        const theme = this.#themeService.theme();
        return timeSelectorHeaderThemeVariants(theme)();
    });
    protected readonly hour = computed(() => {
        const hour = this.navigatedDate().hour;
        const hourFormat = this.hourFormat();
        if (hourFormat === "24") {
            return hour;
        }
        return hour % 12 || 12;
    });
    protected readonly hourListId = createElementControlId();
    protected readonly hourListRef = viewChild.required<ElementRef<HTMLOListElement>>("hourList");
    protected readonly infoContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        return timeSelectorInfoContainerThemeVariants(theme)();
    });
    protected readonly listContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        return timeSelectorListContainerThemeVariants(theme)();
    });
    protected readonly maxDate = computed(() => {
        const max = this.max();
        return max ? DateTime.fromJSDate(max) : null;
    });
    protected readonly meridiem = signal<Meridiem>("AM");
    protected readonly meridiemListId = createElementControlId();
    protected readonly meridiemListRef = viewChild<ElementRef<HTMLOListElement>>("meridiemList");
    protected readonly minDate = computed(() => {
        const min = this.min();
        return min ? DateTime.fromJSDate(min) : null;
    });
    protected readonly minute = computed(() => this.navigatedDate().minute);
    protected readonly minuteListId = createElementControlId();
    protected readonly minuteListRef = viewChild.required<ElementRef<HTMLOListElement>>("minuteList");
    protected readonly minutes = computed(() => generateMinuteSet(this.minuteStep()));
    protected readonly navigatedDate = signal(DateTime.now());
    protected readonly navigatedDateText = computed(() => {
        const hourFormat = this.hourFormat();
        return this.navigatedDate().toLocaleString({ hour: "numeric", minute: "numeric", hour12: hourFormat === "12" });
    });
    protected readonly pmMeridiemVisible = computed(() => {
        const max = this.max();
        return !(max && max.getHours() < 12);
    });
    protected readonly second = computed(() => this.navigatedDate().second);
    protected readonly secondListId = createElementControlId();
    protected readonly secondListRef = viewChild<ElementRef<HTMLOListElement>>("secondList");
    protected readonly seconds = computed(() => generateSecondSet(this.secondStep()));
    protected readonly viewHours = computed(() => {
        const meridiem = this.meridiem();
        const hourFormat = this.hourFormat();
        const hourStep = this.hourStep();
        return generateHourSet(hourFormat, meridiem, hourStep);
    });

    public readonly ariaLabel = input<string>("Time selector");
    public readonly disabled = model(false);
    public readonly focusOnMount = input(true);
    public readonly footer = input(true);
    public readonly hourFormat = input<HourFormat>("24");
    public readonly hourStep = input(1);
    public readonly max = input<Date | null>(null);
    public readonly min = input<Date | null>(null);
    public readonly minuteStep = input(1);
    public readonly rounded = input<TimePickerVariantProps["rounded"]>("medium");
    public readonly secondStep = input(1);
    public readonly showSeconds = input(false);
    public readonly size = input<TimeSelectorVariantProps["size"]>("medium");

    public constructor() {
        afterNextRender({
            read: () => {
                this.#height.set(this.#hostElementRef.nativeElement.offsetHeight);
                this.setDateValues();
                const value = this.#value();
                if (value) {
                    const dt = DateTime.fromJSDate(value);
                    if (dt.isValid) {
                        this.navigatedDate.set(dt);
                    } else {
                        this.initializeNavigatedDate(value);
                    }
                }
                this.setupKeyboardNavigation();
                if (this.focusOnMount()) {
                    this.focusList(this.focusedList());
                }
            }
        });
        toObservable(this.navigatedDate)
            .pipe(
                takeUntilDestroyed(),
                filter(() => !this.footer()),
                tap(() => this.updateValue(this.navigatedDate().toJSDate(), true))
            )
            .subscribe();
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

    public writeValue(date: Date | null | undefined): void {
        this.#value.set(date ?? null);
        this.setDateValues();
    }

    protected onBlur(): void {
        this.#propagateTouched?.();
    }

    protected onHourChange(hour: number): void {
        this.navigatedDate.update(d => d.set({ hour }));
    }

    protected onMeridiemClick(meridiem: "AM" | "PM"): void {
        if (this.meridiem() === meridiem) {
            return;
        }
        const hour = this.navigatedDate().hour;

        if (meridiem === "PM" && hour < 12) {
            this.navigatedDate.update(date => date.set({ hour: hour + 12 }));
        } else if (meridiem === "AM" && hour >= 12) {
            this.navigatedDate.update(date => date.set({ hour: hour - 12 }));
        }
        this.meridiem.set(meridiem);
    }

    protected onMinuteChange(minute: number): void {
        this.navigatedDate.update(date => date.set({ minute }));
    }

    protected onNowClick(event: Event): void {
        let now = DateTime.now();
        const min = this.minDate();
        const max = this.maxDate();
        if (min && now < min) {
            if (min.isValid) {
                now = min;
            }
        } else if (max && now > max) {
            if (max.isValid) {
                now = max;
            }
        }
        this.navigatedDate.update(date =>
            date.set({ hour: now.hour, minute: now.minute, second: now.second, millisecond: now.millisecond })
        );
        this.meridiem.set(now.hour >= 12 ? "PM" : "AM");
    }

    protected onSecondChange(second: number): void {
        this.navigatedDate.update(date => date.set({ second }));
    }

    protected onSetTimeClick(): void {
        this.updateValue(this.navigatedDate().toJSDate(), true);
    }

    private getListRef(listType: TimeListType): ElementRef<HTMLOListElement> | undefined {
        switch (listType) {
            case "hours":
                return this.hourListRef();
            case "minutes":
                return this.minuteListRef();
            case "seconds":
                return this.secondListRef();
            case "meridiem":
                return this.meridiemListRef();
        }
    }

    private getNextList(current: TimeListType, direction: "left" | "right"): TimeListType {
        const lists: TimeListType[] = ["hours", "minutes"];
        if (this.showSeconds()) {
            lists.push("seconds");
        }
        if (this.hourFormat() === "12") {
            lists.push("meridiem");
        }
        const currentIndex = lists.indexOf(current);
        if (direction === "right") {
            return lists[(currentIndex + 1) % lists.length];
        } else {
            return lists[(currentIndex - 1 + lists.length) % lists.length];
        }
    }

    private handleKeydown(event: KeyboardEvent): void {
        const preventableEvent = new PreventableEvent("calendarKeydown", event);
        this.#timeSelectorService?.keydown$.next(preventableEvent);

        if (preventableEvent.isDefaultPrevented()) {
            return;
        }

        const focusedList = this.focusedList();

        switch (event.key) {
            case "ArrowUp":
                event.preventDefault();
                this.navigateItem(focusedList, -1);
                break;
            case "ArrowDown":
                event.preventDefault();
                this.navigateItem(focusedList, 1);
                break;
            case "ArrowLeft":
                if (event.altKey) {
                    return;
                }
                event.preventDefault();
                this.focusedList.set(this.getNextList(focusedList, "left"));
                this.focusList(this.focusedList());
                break;
            case "ArrowRight":
                if (event.altKey) {
                    return;
                }
                event.preventDefault();
                this.focusedList.set(this.getNextList(focusedList, "right"));
                this.focusList(this.focusedList());
                break;
            case "Home":
                event.preventDefault();
                this.navigateToEdge(focusedList, "first");
                break;
            case "End":
                event.preventDefault();
                this.navigateToEdge(focusedList, "last");
                break;
            case "Enter":
            case " ":
                this.updateValue(this.navigatedDate().toJSDate(), true);
                break;
        }
    }

    private focusList(listType: TimeListType): void {
        const listRef = this.getListRef(listType);
        listRef?.nativeElement.focus();
    }

    private initializeNavigatedDate(date: Date | null): void {
        const min = this.min();
        const max = this.max();
        if (!date) {
            this.navigatedDate.set(DateTime.now());
        } else if (min && date < min) {
            const minDate = DateTime.fromJSDate(min);
            if (minDate.isValid) {
                this.navigatedDate.set(minDate);
            }
        } else if (max && date > max) {
            const maxDate = DateTime.fromJSDate(max);
            if (maxDate.isValid) {
                this.navigatedDate.set(maxDate);
            }
        } else {
            const dateToSet = DateTime.fromJSDate(date);
            if (dateToSet.isValid) {
                this.navigatedDate.set(dateToSet);
            }
        }
    }

    private navigateItem(listType: TimeListType, direction: number): void {
        switch (listType) {
            case "hours": {
                const hours = Array.from(this.viewHours());
                const currentIndex = hours.findIndex(h => h.viewValue === this.hour());
                const newIndex = Math.max(0, Math.min(hours.length - 1, currentIndex + direction));
                if (hours[newIndex]) {
                    this.onHourChange(hours[newIndex].value);
                }
                break;
            }
            case "minutes": {
                const currentMinute = this.minute();
                const newMinute = Math.max(0, Math.min(59, currentMinute + direction));
                this.onMinuteChange(newMinute);
                break;
            }
            case "seconds": {
                const currentSecond = this.second();
                const newSecond = Math.max(0, Math.min(59, currentSecond + direction));
                this.onSecondChange(newSecond);
                break;
            }
            case "meridiem": {
                const current = this.meridiem();
                if (direction !== 0) {
                    this.onMeridiemClick(current === "AM" ? "PM" : "AM");
                }
                break;
            }
        }
    }

    private navigateToEdge(listType: TimeListType, edge: "first" | "last"): void {
        switch (listType) {
            case "hours": {
                const hours = Array.from(this.viewHours());
                const target = edge === "first" ? hours[0] : hours[hours.length - 1];
                if (target) {
                    this.onHourChange(target.value);
                }
                break;
            }
            case "minutes": {
                this.onMinuteChange(edge === "first" ? 0 : 59);
                break;
            }
            case "seconds": {
                this.onSecondChange(edge === "first" ? 0 : 59);
                break;
            }
            case "meridiem": {
                this.onMeridiemClick(edge === "first" ? "AM" : "PM");
                break;
            }
        }
    }

    private setDateValues(): void {
        this.initializeNavigatedDate(this.#value());
        const meridiem = this.navigatedDate().hour >= 12 ? "PM" : "AM";
        this.meridiem.set(meridiem);
    }

    private setupKeyboardNavigation(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(() => !this.disabled())
            )
            .subscribe(event => this.handleKeydown(event));
    }

    private updateValue(date: Date | null, notify: boolean): void {
        this.#value.set(date);
        if (notify) {
            this.#propagateChange?.(date);
        }
    }
}
