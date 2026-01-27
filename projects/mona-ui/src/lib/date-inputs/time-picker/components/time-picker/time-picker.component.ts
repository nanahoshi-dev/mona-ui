import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    forwardRef,
    inject,
    input,
    linkedSignal,
    model,
    output,
    Signal,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DateTime } from "luxon";
import { fromEvent } from "rxjs";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { DropdownPopupHandlerDirective } from "../../../../common/dropdown/directives/dropdown-popup-handler.directive";
import { DropdownService } from "../../../../common/dropdown/services/dropdown.service";
import { ListSizeInputType } from "../../../../common/list/models/ListSizeType";
import { dropdownPopupThemeVariants } from "../../../../common/styles/dropdown-popup.styles";
import { DropdownPopupInputToken } from "../../../../dropdowns/models/DropdownPopupInput";
import { TextBoxComponent } from "../../../../inputs/text-box/components/text-box/text-box.component";
import { TextBoxSuffixTemplateDirective } from "../../../../inputs/text-box/directives/text-box-suffix-template.directive";
import { PopupCloseEvent } from "../../../../popup/models/PopupCloseEvent";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { PreventableEvent } from "../../../../utils/PreventableEvent";
import { HourFormat } from "../../../models/HourFormat";
import { TimeSelectorComponent } from "../../../time-selector/components/time-selector/time-selector.component";
import {
    timePickerBaseThemeVariants,
    TimePickerVariantInput,
    TimePickerVariantProps
} from "../../styles/time-picker.styles";

@Component({
    selector: "mona-time-picker",
    templateUrl: "./time-picker.component.html",
    styleUrls: ["./time-picker.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        DropdownService,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TimePickerComponent),
            multi: true
        },
        {
            provide: DropdownPopupInputToken,
            useExisting: forwardRef(() => TimePickerComponent),
            multi: false
        }
    ],
    imports: [
        FormsModule,
        ButtonDirective,
        FontAwesomeModule,
        TimeSelectorComponent,
        TextBoxComponent,
        TextBoxSuffixTemplateDirective
    ],
    hostDirectives: [DropdownPopupHandlerDirective],
    host: {
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-readonly]": "readonly() ? true : undefined",
        "[attr.role]": "'combobox'",
        "[attr.tabindex]": "disabled() ? null : 0",
        "[class]": "baseClass()",
        "(blur)": "onTimeInputBlur()"
    }
})
export class TimePickerComponent implements ControlValueAccessor, TimePickerVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #themeService = inject(ThemeService);
    #propagateChange: Action<Date | null> | null = null;
    #propagateTouched: Action | null = null;

    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const focused = this.#dropdownService.popupRef() != null;
        return timePickerBaseThemeVariants(theme)({ focused });
    });
    protected readonly currentDateString = linkedSignal(() => {
        const value = this.value();
        const format = this.format();
        if (!value) {
            return "";
        }
        return DateTime.fromJSDate(value).toFormat(format);
    });
    protected readonly navigatedDate = signal(new Date());
    protected readonly pickerPopupClass = computed(() => {
        const theme = this.#themeService.theme();
        return dropdownPopupThemeVariants(theme)();
    });
    protected readonly timePopupTemplateRef: Signal<TemplateRef<any>> = viewChild.required("timePopupTemplate");
    protected readonly value = signal<Date | null>(null);

    /**
     * @description Emits when the popup is about to close. This event is preventable.
     */
    public readonly close = output<PopupCloseEvent>();

    /**
     * @description Emits after the popup is closed.
     */
    public readonly closed = output();

    /**
     * @description Sets the disabled state of the time picker.
     */
    public readonly disabled = model(false);

    /**
     * @description Sets the format of the time picker.
     */
    public readonly format = input("HH:mm");

    /**
     * @description Sets the hour format of the time picker.
     * @default 24
     */
    public readonly hourFormat = input<HourFormat>("24");

    /**
     * @description Sets the maximum date of the time picker.
     * @default null
     */
    public readonly max = input<Date | null>(null);

    /**
     * @description Sets the minimum date of the time picker.
     * @default null
     */
    public readonly min = input<Date | null>(null);

    /**
     * @description Emits when the popup is about to open. This event is preventable.
     */
    public readonly open = output<PreventableEvent>();

    /**
     * @description Emits after the popup is opened.
     */
    public readonly opened = output();

    /**
     * @description Sets the height of the popup element.
     * @default 200
     */
    public readonly popupHeight = input<ListSizeInputType>();

    /**
     * @description Sets the width of the popup element.
     * @default null
     */
    public readonly popupWidth = input<ListSizeInputType>();

    /**
     * @description Sets the readonly state of the time picker.
     */
    public readonly readonly = input(false);

    /**
     * @description Sets the required state of the time picker.
     */
    public readonly required = input(false);

    /**
     * @description Sets the border radius of the time picker.
     */
    public readonly rounded = input<TimePickerVariantProps["rounded"]>("medium");

    /**
     * @description Sets the visibility of the clear button.
     */
    public readonly showClearButton = input(false);

    /**
     * @description Sets the visibility of the second selector.
     */
    public readonly showSeconds = input(false);

    /**
     * @description Sets the size of the time picker.
     */
    public readonly size = input<TimePickerVariantProps["size"]>("medium");

    public constructor() {
        afterNextRender({
            read: () => {
                this.setDateValues();
                this.setSubscriptions();
            }
        });
        effect(() => {
            const popupTemplate = this.timePopupTemplateRef();
            untracked(() => this.#dropdownService.popupTemplate.set(popupTemplate));
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
        this.value.set(date ?? null);
        this.updateCurrentDateString(date, this.format());
        this.setDateValues();
    }

    protected onDateStringEdit(dateString: string): void {
        this.currentDateString.set(dateString);
    }

    protected onTimeInputBlur(): void {
        if (this.#dropdownService.popupRef()) {
            return;
        }
        let dateTime = this.generateValidDateTime(this.currentDateString());
        if (!dateTime) {
            this.setCurrentDate(null);
            return;
        }
        if (this.dateStringEquals(dateTime.toJSDate(), this.value())) {
            this.setCurrentDateString(this.value());
            return;
        }
        if (dateTime.isValid) {
            const inRangeDate = this.updateTimeIfNotInMinMax(dateTime.toJSDate());
            this.setCurrentDate(inRangeDate);
            this.navigatedDate.set(inRangeDate);
        } else {
            this.setCurrentDate(null);
        }
        this.#propagateTouched?.();
    }

    protected onTimeInputButtonClick(): void {
        this.#dropdownService.triggerPopupOpen$.next({
            height: this.popupHeight() || 300,
            width: this.popupWidth() || "auto"
        });
    }

    protected onTimeSelectorValueChange(date: Date | null): void {
        this.setCurrentDate(date);
        this.#dropdownService.popupRef()?.close();
        this.focus();
    }

    private dateStringEquals(date1: Date | null, date2: Date | null): boolean {
        if (date1 && date2) {
            return (
                DateTime.fromJSDate(date1).toFormat(this.format()) ===
                DateTime.fromJSDate(date2).toFormat(this.format())
            );
        }
        return date1 === date2;
    }

    private focus(): void {
        const input = this.#hostElementRef.nativeElement.querySelector("input");
        if (input && !this.readonly()) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    }

    /**
     * Generates a valid date from a string.
     * @param dateString
     * @private
     */
    private generateValidDateTime(dateString: string): DateTime | null {
        const value = this.value();
        const valueDate = value ? DateTime.fromJSDate(value) : DateTime.now();
        let dateTime = DateTime.fromFormat(dateString, this.format());
        if (dateTime.isValid) {
            return dateTime.set({ year: valueDate.year, month: valueDate.month, day: valueDate.day });
        }
        const maxDate = this.max();
        const minDate = this.min();
        const date = minDate ?? maxDate;
        if (date) {
            const newDate = DateTime.fromJSDate(date);
            dateTime = newDate.set({ year: valueDate.year, month: valueDate.month, day: valueDate.day });
            return dateTime;
        }
        return null;
    }

    private setCurrentDate(date: Date | null): void {
        this.value.set(date);
        this.setCurrentDateString(date);
        this.#propagateChange?.(date);
    }

    private setCurrentDateString(date: Date | null): void {
        this.updateCurrentDateString(date, this.format());
    }

    private setDateValues(): void {
        const value = this.value();
        this.navigatedDate.set(value ?? DateTime.now().toJSDate());
        if (value) {
            this.updateCurrentDateString(value, this.format());
        }
    }

    private setSubscriptions(): void {
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focusin")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                this.#dropdownService.popupRef()?.close();
                this.focus();
            });
    }

    private updateTimeIfNotInMinMax(date: Date): Date {
        const min = this.min();
        const max = this.max();
        const minDate = min ? DateTime.fromJSDate(min) : null;
        const maxDate = max ? DateTime.fromJSDate(max) : null;
        let currentDate = DateTime.fromJSDate(date);

        if (minDate) {
            if (currentDate.hour < minDate.hour) {
                currentDate = currentDate.set({ hour: minDate.hour, minute: minDate.minute, second: minDate.second });
            } else if (currentDate.hour === minDate.hour && currentDate.minute < minDate.minute) {
                currentDate = currentDate.set({ minute: minDate.minute, second: minDate.second });
            } else if (
                currentDate.hour === minDate.hour &&
                currentDate.minute === minDate.minute &&
                currentDate.second < minDate.second
            ) {
                currentDate = currentDate.set({ second: minDate.second });
            }
        }

        if (maxDate) {
            if (currentDate.hour > maxDate.hour) {
                currentDate = currentDate.set({ hour: maxDate.hour, minute: maxDate.minute, second: maxDate.second });
            } else if (currentDate.hour === maxDate.hour && currentDate.minute > maxDate.minute) {
                currentDate = currentDate.set({ minute: maxDate.minute, second: maxDate.second });
            } else if (
                currentDate.hour === maxDate.hour &&
                currentDate.minute === maxDate.minute &&
                currentDate.second > maxDate.second
            ) {
                currentDate = currentDate.set({ second: maxDate.second });
            }
        }

        return currentDate.toJSDate();
    }

    private updateCurrentDateString(date: Date | null | undefined, format: string): void {
        if (!date) {
            this.currentDateString.set("");
            return;
        }
        const dateString = DateTime.fromJSDate(date).toFormat(format);
        this.currentDateString.set(dateString);
    }
}
