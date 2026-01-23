import { DecimalPipe } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    forwardRef,
    inject,
    input,
    model,
    signal
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { Enumerable, range, select } from "@mirei/ts-collections";
import { DateTime } from "luxon";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { HourFormat } from "../../../models/HourFormat";
import { Meridiem } from "../../../models/Meridiem";
import { TimeUnit } from "../../../models/TimeUnit";
import { TimeLimiterPipe } from "../../../pipes/time-limiter.pipe";
import { generateHourSet } from "../../../utils/generateHourSet";
import { TimeSelectorItemDirective } from "../../directives/time-selector-item.directive";
import {
    timeSelectorBaseThemeVariants,
    timeSelectorListContainerThemeVariants,
    timeSelectorListThemeVariants
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
    imports: [DecimalPipe, TimeLimiterPipe, TimeSelectorItemDirective, ButtonDirective],
    host: {
        "[class]": "baseClass()"
    }
})
export class TimeSelectorComponent implements ControlValueAccessor {
    readonly #height = signal(0);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #themeService = inject(ThemeService);
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
    protected readonly hour = computed(() => {
        const hour = this.navigatedDate().getHours();
        const hourFormat = this.hourFormat();
        if (hourFormat === "24") {
            return hour;
        }
        return hour % 12 || 12;
    });
    protected readonly listClass = computed(() => {
        const theme = this.#themeService.theme();
        return timeSelectorListThemeVariants(theme)();
    });
    protected readonly listContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        return timeSelectorListContainerThemeVariants(theme)();
    });
    protected readonly listPadding = computed(() => {
        const itemHeight = 36; // TODO: Replace with height based on size
        const popupHeight = this.#height();
        return popupHeight / 2 - itemHeight / 2;
    });
    protected readonly meridiem = signal<Meridiem>("AM");
    protected readonly minute = computed(() => this.navigatedDate().getMinutes());
    protected readonly minutes = select<number, TimeUnit>(range(0, 60), m => ({ value: m, viewValue: m })).toArray();
    protected readonly navigatedDate = signal(new Date());
    protected readonly pmMeridiemVisible = computed(() => {
        const max = this.max();
        return !(max && max.getHours() < 12);
    });
    protected readonly second = computed(() => this.navigatedDate().getSeconds());
    protected readonly seconds = Enumerable.range(0, 60)
        .select<TimeUnit>(s => ({ value: s, viewValue: s }))
        .toArray();
    protected readonly viewHours = computed(() => {
        const meridiem = this.meridiem();
        const hourFormat = this.hourFormat();
        return generateHourSet(hourFormat, meridiem);
    });

    public readonly disabled = model(false);
    public readonly hourFormat = input<HourFormat>("24");
    public readonly max = input<Date | null>(null);
    public readonly min = input<Date | null>(null);
    public readonly readonly = input(false);
    public readonly showSeconds = input(false);

    public constructor() {
        afterNextRender({
            read: () => {
                this.#height.set(this.#hostElementRef.nativeElement.offsetHeight);
                this.setDateValues();
                const value = this.#value();
                if (value) {
                    this.navigatedDate.set(value);
                }
            }
        });
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

    public onHourChange(value: number): void {
        const updatedDate = DateTime.fromJSDate(this.navigatedDate()).set({ hour: value });
        this.navigatedDate.set(updatedDate.toJSDate());
    }

    public onMeridiemClick(meridiem: "AM" | "PM"): void {
        if (this.readonly() || this.meridiem() === meridiem) {
            return;
        }
        const hour = this.navigatedDate().getHours();

        if (meridiem === "PM" && hour < 12) {
            this.navigatedDate().setHours(hour + 12);
        } else if (meridiem === "AM" && hour >= 12) {
            this.navigatedDate().setHours(hour - 12);
        }

        this.meridiem.set(meridiem);
    }

    public onMinuteChange(value: number): void {
        this.navigatedDate.set(DateTime.fromJSDate(this.navigatedDate()).set({ minute: value }).toJSDate());
    }

    public onSecondChange(value: number): void {
        this.navigatedDate.set(DateTime.fromJSDate(this.navigatedDate()).set({ second: value }).toJSDate());
    }

    protected onSetTimeClick(): void {
        this.#value.set(this.navigatedDate());
        this.#propagateChange?.(this.#value());
    }

    private initializeNavigatedDate(date: Date | null): void {
        const min = this.min();
        const max = this.max();
        if (!date) {
            this.navigatedDate.set(DateTime.now().toJSDate());
        } else if (min && date < min) {
            this.navigatedDate.set(min);
        } else if (max && date > max) {
            this.navigatedDate.set(max);
        } else {
            this.navigatedDate.set(date);
        }
    }

    private setCurrentDate(date: Date | null): void {
        this.#value.set(date);
        this.#propagateChange?.(date);
    }

    private setDateValues(): void {
        this.initializeNavigatedDate(this.#value());
        const meridiem = this.navigatedDate().getHours() >= 12 ? "PM" : "AM";
        this.meridiem.set(meridiem);
    }

    private updateHourToFitInMaxAndMin(): TimeUnit | null {
        const min = this.min();
        const max = this.max();
        const timeLimiterPipe = new TimeLimiterPipe();
        const hours = generateHourSet(this.hourFormat(), this.meridiem());
        const hourRange = timeLimiterPipe.transform(hours, "h", this.navigatedDate(), min, max);
        if (!hourRange.select(h => h.value).contains(this.hour())) {
            const date = new Date(this.navigatedDate());
            date.setHours(hourRange.first().value);
            this.navigatedDate.set(date);
            return hourRange.first();
        }
        return null;
    }

    private updateMinuteToFitInMaxAndMin(): TimeUnit | null {
        const min = this.min();
        const max = this.max();
        const timeLimiterPipe = new TimeLimiterPipe();
        const minuteRange = timeLimiterPipe.transform(this.minutes, "m", this.navigatedDate(), min, max);
        if (!minuteRange.select(m => m.value).contains(this.minute())) {
            const date = new Date(this.navigatedDate());
            date.setMinutes(minuteRange.first().value);
            this.navigatedDate.set(date);
            return minuteRange.first();
        }
        return null;
    }

    private updateSecondToFitInMaxAndMin(): TimeUnit | null {
        const min = this.min();
        const max = this.max();
        const timeLimiterPipe = new TimeLimiterPipe();
        const secondRange = timeLimiterPipe.transform(this.seconds, "s", this.navigatedDate(), min, max);
        if (!secondRange.select(s => s.value).contains(this.second())) {
            const date = new Date(this.navigatedDate());
            date.setSeconds(secondRange.first().value);
            this.navigatedDate.set(date);
            return secondRange.first();
        }
        return null;
    }
}
