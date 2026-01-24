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
    timeSelectorListThemeVariants,
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
    imports: [DecimalPipe, TimeLimiterPipe, TimeSelectorItemDirective, ButtonDirective],
    host: {
        "[class]": "baseClass()",
        "(blur)": "onBlur()"
    }
})
export class TimeSelectorComponent implements ControlValueAccessor, TimeSelectorVariantInput {
    readonly #height = signal(0);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #itemHeight = computed(() => {
        const size = this.size();
        return size === "small" ? 32 : size === "medium" ? 36 : 40;
    });
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
        const hour = this.navigatedDate().hour;
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
        const itemHeight = this.#itemHeight();
        const popupHeight = this.#height();
        return popupHeight / 2 - itemHeight / 2;
    });
    protected readonly maxDate = computed(() => {
        const max = this.max();
        return max ? DateTime.fromJSDate(max) : null;
    });
    protected readonly meridiem = signal<Meridiem>("AM");
    protected readonly minDate = computed(() => {
        const min = this.min();
        return min ? DateTime.fromJSDate(min) : null;
    });
    protected readonly minute = computed(() => this.navigatedDate().minute);
    protected readonly minutes = select<number, TimeUnit>(range(0, 60), m => ({ value: m, viewValue: m })).toArray();
    protected readonly navigatedDate = signal(DateTime.now());
    protected readonly pmMeridiemVisible = computed(() => {
        const max = this.max();
        return !(max && max.getHours() < 12);
    });
    protected readonly second = computed(() => this.navigatedDate().second);
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

    protected onBlur(): void {
        this.#propagateTouched?.();
    }

    protected onHourChange(hour: number): void {
        this.navigatedDate.update(d => d.set({ hour }));
    }

    protected onMeridiemClick(meridiem: "AM" | "PM"): void {
        if (this.readonly() || this.meridiem() === meridiem) {
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

    protected onSecondChange(second: number): void {
        this.navigatedDate.update(date => date.set({ second }));
    }

    protected onSetTimeClick(): void {
        this.#value.set(this.navigatedDate().toJSDate());
        this.#propagateChange?.(this.#value());
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

    private setDateValues(): void {
        this.initializeNavigatedDate(this.#value());
        const meridiem = this.navigatedDate().hour >= 12 ? "PM" : "AM";
        this.meridiem.set(meridiem);
    }
}
