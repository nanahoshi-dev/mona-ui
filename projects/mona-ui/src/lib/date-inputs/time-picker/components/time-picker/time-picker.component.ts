import { CdkTrapFocus } from "@angular/cdk/a11y";
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
import {
    AbstractControl,
    ControlValueAccessor,
    FormsModule,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ValidationErrors,
    Validator
} from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DateTime } from "luxon";
import { fromEvent } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { DropdownPopupHandlerDirective } from "../../../../common/dropdown/directives/dropdown-popup-handler.directive";
import { DropdownService } from "../../../../common/dropdown/services/dropdown.service";
import { FormFieldValidationDirective } from "../../../../common/forms/directives/form-field-validation.directive";
import { FormFieldValidationService } from "../../../../common/forms/services/form-field-validation.service";
import { ListSizeInputType } from "../../../../common/list/models/ListSizeType";
import { AttributeConfig } from "../../../../common/models/AttributeConfig";
import { dropdownPopupThemeVariants } from "../../../../common/styles/dropdown-popup.styles";
import { DropdownPopupInputToken } from "../../../../dropdowns/models/DropdownPopupInput";
import { TextBoxComponent } from "../../../../inputs/text-box/components/text-box/text-box.component";
import { TextBoxSuffixTemplateDirective } from "../../../../inputs/text-box/directives/text-box-suffix-template.directive";
import { PopupCloseEvent } from "../../../../popup/models/PopupCloseEvent";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { createElementControlId } from "../../../../utils/createElementControlId";
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
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        DropdownService,
        FormFieldValidationService,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TimePickerComponent),
            multi: true
        },
        {
            provide: DropdownPopupInputToken,
            useExisting: forwardRef(() => TimePickerComponent),
            multi: false
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => TimePickerComponent),
            multi: true
        }
    ],
    imports: [
        FormsModule,
        ButtonDirective,
        FontAwesomeModule,
        TimeSelectorComponent,
        TextBoxComponent,
        TextBoxSuffixTemplateDirective,
        CdkTrapFocus
    ],
    hostDirectives: [DropdownPopupHandlerDirective, FormFieldValidationDirective],
    host: {
        "[attr.tabindex]": "disabled() ? null : 0",
        "[class]": "baseClass()",
        "(blur)": "onTimeInputBlur()"
    }
})
export class TimePickerComponent implements ControlValueAccessor, Validator, TimePickerVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #formFieldValidationService = inject(FormFieldValidationService);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #id = createElementControlId();
    readonly #themeService = inject(ThemeService);
    #propagateChange: Action<Date | null> | null = null;
    #propagateTouched: Action | null = null;

    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const focused = this.#dropdownService.popupRef() != null;
        const variantClass = timePickerBaseThemeVariants(theme)({ focused });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly currentDateString = linkedSignal(() => {
        const value = this.value();
        const format = this.format();
        if (!value) {
            return "";
        }
        return DateTime.fromJSDate(value).toFormat(format);
    });
    protected readonly expanded = computed(() => this.#dropdownService.popupRef() != null);
    protected readonly inputAttributes = computed<AttributeConfig>(() => {
        const controls = this.popupId;
        const expanded = this.#dropdownService.popupRef() != null;
        const hasPopup = "dialog";
        const invalid = this.#formFieldValidationService.invalid();
        return {
            "aria-autocomplete": "none",
            "aria-controls": controls,
            "aria-expanded": expanded,
            "aria-haspopup": hasPopup,
            "aria-invalid": invalid,
            id: this.#id,
            role: "combobox"
        };
    });
    protected readonly navigatedDate = signal(new Date());
    protected readonly pickerPopupClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const userClass = this.popupClass();
        const variantClass = dropdownPopupThemeVariants(theme)({ rounded, size });
        return twMerge(variantClass, userClass);
    });
    protected readonly popupId = createElementControlId();
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
     * @description Sets the hour step of the time picker.
     * @default 1
     */
    public readonly hourStep = input(1);

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
     * @description Sets the minute step of the time picker.
     * @default 1
     */
    public readonly minuteStep = input(1);

    /**
     * @description Emits when the popup is about to open. This event is preventable.
     */
    public readonly open = output<PreventableEvent>();

    /**
     * @description Emits after the popup is opened.
     */
    public readonly opened = output();

    /**
     * @description Sets the placeholder of the time picker.
     */
    public readonly placeholder = input("");

    /**
     * @description Sets the class of the popup element.
     * @default ""
     */
    public readonly popupClass = input("");

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
     * @description When true, the input is readonly but the popup button remains enabled.
     * @default false
     */
    public readonly readonlyInput = input(false);

    /**
     * @description Sets the required state of the time picker.
     */
    public readonly required = input(false);

    /**
     * @description Sets the border radius of the time picker.
     */
    public readonly rounded = input<TimePickerVariantProps["rounded"]>("medium");

    /**
     * @description Sets the second step of the time picker.
     * @default 1
     */
    public readonly secondStep = input(1);

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
    public readonly userClass = input("", { alias: "class" });

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

    public validate(control: AbstractControl): ValidationErrors | null {
        const value = control.value as Date | null;
        if (!value) {
            return null;
        }

        const min = this.min();
        const max = this.max();

        if (min && this.isTimeBefore(value, min)) {
            return { minError: { minValue: min, value } };
        }
        if (max && this.isTimeAfter(value, max)) {
            return { maxError: { maxValue: max, value } };
        }
        return null;
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
        this.processTimeInput(this.currentDateString());
        this.#propagateTouched?.();
    }

    protected onTimeInputButtonClick(): void {
        this.openPopup();
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

    private handleKeydown(e: KeyboardEvent): void {
        if (e.key === "ArrowDown" && e.altKey) {
            e.preventDefault();
            this.openPopup();
            return;
        }
    }

    private isTimeAfter(date: Date, maxDate: Date): boolean {
        const dateTime = DateTime.fromJSDate(date);
        const maxDateTime = DateTime.fromJSDate(maxDate);
        return (
            dateTime.hour > maxDateTime.hour ||
            (dateTime.hour === maxDateTime.hour && dateTime.minute > maxDateTime.minute) ||
            (dateTime.hour === maxDateTime.hour &&
                dateTime.minute === maxDateTime.minute &&
                dateTime.second > maxDateTime.second)
        );
    }

    private isTimeBefore(date: Date, minDate: Date): boolean {
        const dateTime = DateTime.fromJSDate(date);
        const minDateTime = DateTime.fromJSDate(minDate);
        return (
            dateTime.hour < minDateTime.hour ||
            (dateTime.hour === minDateTime.hour && dateTime.minute < minDateTime.minute) ||
            (dateTime.hour === minDateTime.hour &&
                dateTime.minute === minDateTime.minute &&
                dateTime.second < minDateTime.second)
        );
    }

    private openPopup(): void {
        this.#dropdownService.triggerPopupOpen$.next({
            height: this.popupHeight() || "fit-content",
            width: this.popupWidth() || "auto"
        });
    }

    private processTimeInput(inputText: string): void {
        let dateTime = this.generateValidDateTime(inputText);
        if (!dateTime) {
            this.setCurrentDate(null);
            return;
        }
        if (this.dateStringEquals(dateTime.toJSDate(), this.value())) {
            this.setCurrentDateString(this.value());
            return;
        }
        if (dateTime.isValid) {
            this.setCurrentDate(dateTime.toJSDate());
            this.navigatedDate.set(dateTime.toJSDate());
        } else {
            this.setCurrentDate(null);
        }
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

    private setKeyboardNavigation(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(e => this.handleKeydown(e));
    }

    private setSubscriptions(): void {
        this.setKeyboardNavigation();
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focusin")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => this.focus());
        this.#dropdownService.popupCloseComplete$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => this.focus());
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
