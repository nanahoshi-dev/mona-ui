import { CdkTrapFocus } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    forwardRef,
    inject,
    input,
    linkedSignal,
    model,
    output,
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
import { twMerge } from "tailwind-merge";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { DropdownPopupHandlerDirective } from "../../../../common/dropdown/directives/dropdown-popup-handler.directive";
import { DropdownService } from "../../../../common/dropdown/services/dropdown.service";
import { FormFieldValidationDirective } from "../../../../common/forms/directives/form-field-validation.directive";
import { FormFieldValidationService } from "../../../../common/forms/services/form-field-validation.service";
import { ListSizeInputType } from "../../../../common/list/models/ListSizeType";
import { AttributeConfig } from "../../../../common/models/AttributeConfig";
import { DropdownPopupInput, DropdownPopupInputToken } from "../../../../dropdowns/models/DropdownPopupInput";
import { TextBoxComponent } from "../../../../inputs/text-box/components/text-box/text-box.component";
import { TextBoxPrefixTemplateDirective } from "../../../../inputs/text-box/directives/text-box-prefix-template.directive";
import { TextBoxSuffixTemplateDirective } from "../../../../inputs/text-box/directives/text-box-suffix-template.directive";
import { PopupCloseEvent } from "../../../../popup/models/PopupCloseEvent";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { createElementControlId } from "../../../../utils/createElementControlId";
import { PreventableEvent } from "../../../../utils/PreventableEvent";
import { CalendarComponent } from "../../../calendar/components/calendar/calendar.component";
import { CalendarDecadeCellTemplateDirective } from "../../../calendar/directives/calendar-decade-cell-template.directive";
import { CalendarMonthCellTemplateDirective } from "../../../calendar/directives/calendar-month-cell-template.directive";
import { CalendarYearCellTemplateDirective } from "../../../calendar/directives/calendar-year-cell-template.directive";
import { FirstDayOfWeek } from "../../../calendar/models/FirstDayOfWeek";
import { DateInputPrefixTemplateDirective } from "../../../directives/date-input-prefix-template.directive";
import { CalendarService } from "../../../services/calendar.service";
import { datePopupThemeVariants, DatePopupVariantInput } from "../../../styles/date-popup.styles";
import {
    datePickerBaseThemeVariants,
    DatePickerVariantInput,
    DatePickerVariantProps
} from "../../styles/date-picker.styles";

@Component({
    selector: "mona-date-picker",
    templateUrl: "./date-picker.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        DropdownService,
        CalendarService,
        FormFieldValidationService,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DatePickerComponent),
            multi: true
        },
        {
            provide: DropdownPopupInputToken,
            useExisting: forwardRef(() => DatePickerComponent),
            multi: false
        }
    ],
    imports: [
        FormsModule,
        FontAwesomeModule,
        CalendarComponent,
        TextBoxComponent,
        TextBoxSuffixTemplateDirective,
        CalendarDecadeCellTemplateDirective,
        NgTemplateOutlet,
        CalendarMonthCellTemplateDirective,
        CalendarYearCellTemplateDirective,
        TextBoxPrefixTemplateDirective,
        ButtonDirective,
        CdkTrapFocus
    ],
    hostDirectives: [DropdownPopupHandlerDirective, FormFieldValidationDirective],
    host: {
        "[attr.tabindex]": "disabled() ? null : 0",
        "[class]": "baseClass()"
    }
})
export class DatePickerComponent
    implements ControlValueAccessor, DropdownPopupInput, DatePickerVariantInput, DatePopupVariantInput
{
    readonly #calendarService = inject(CalendarService);
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
        const variantClass = datePickerBaseThemeVariants(theme)({ focused });
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
    protected readonly decadeCellTemplate = contentChild(CalendarDecadeCellTemplateDirective);
    protected readonly expanded = computed(() => this.#dropdownService.popupRef() !== null);
    protected readonly inputAttributes = computed<AttributeConfig>(() => {
        const controls = this.popupId;
        const expanded = this.#dropdownService.popupRef() != null;
        const hasPopup = "grid";
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
    protected readonly invalid = this.#formFieldValidationService.invalid.asReadonly();
    protected readonly monthCellTemplate = contentChild(CalendarMonthCellTemplateDirective);
    protected readonly navigatedDate = linkedSignal(() => this.value() ?? new Date());
    protected readonly pickerPopupClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const userClass = this.popupClass();
        const variantClass = datePopupThemeVariants(theme)({ rounded, size });
        return twMerge(variantClass, userClass);
    });
    protected readonly popupId = createElementControlId();
    protected readonly popupTemplate = viewChild.required<TemplateRef<any>>("popupTemplate");
    protected readonly prefixTemplate = contentChild(DateInputPrefixTemplateDirective, { read: TemplateRef });
    protected readonly value = signal<Date | null>(null);
    protected readonly yearCellTemplate = contentChild(CalendarYearCellTemplateDirective);

    /**
     * @description Emits when the popup is about to close. This event is preventable.
     */
    public readonly close = output<PopupCloseEvent>();

    /**
     * @description Emits after the popup is closed.
     */
    public readonly closed = output();

    /**
     * @description Sets the disabled state of the date picker.
     */
    public readonly disabled = model(false);

    /**
     * @description Sets the disabled dates of the date picker.
     */
    public readonly disabledDates = input<Iterable<Date>>([]);

    /**
     * @description Sets the first day of the week.
     */
    public readonly firstDay = input<FirstDayOfWeek>("monday");

    /**
     * @description Sets the date format of the date picker.
     */
    public readonly format = input("dd/MM/yyyy");

    /**
     * @description Sets the maximum date of the date picker.
     */
    public readonly max = input<Date | null>();

    /**
     * @description Sets the minimum date of the date picker.
     */
    public readonly min = input<Date | null>();

    /**
     * @description Emits when the popup is about to open. This event is preventable.
     */
    public readonly open = output<PreventableEvent>();

    /**
     * @description Emits after the popup is opened.
     */
    public readonly opened = output();

    /**
     * @description Sets the placeholder of the date picker.
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
    public readonly popupHeight = input<ListSizeInputType>("");

    /**
     * @description Sets the width of the popup element.
     * @default null
     */
    public readonly popupWidth = input<ListSizeInputType>("");

    /**
     * @description Sets the readonly state of the date picker.
     */
    public readonly readonly = input(false);

    /**
     * @description Sets the required state of the date picker.
     */
    public readonly required = input(false);

    /**
     * @description Sets the border radius of the date picker.
     */
    public readonly rounded = input<DatePickerVariantProps["rounded"]>("medium");

    /**
     * @description Sets the visibility of the clear button.
     */
    public readonly showClearButton = input(false);

    /**
     * @description Sets the size of the date picker.
     */
    public readonly size = input<DatePickerVariantProps["size"]>("medium");
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Enables the display of week numbers in the calendar.
     * @default false
     */
    public readonly weekNumber = input<boolean>(false);

    public constructor() {
        effect(() => {
            const popupTemplate = this.popupTemplate();
            untracked(() => this.#dropdownService.popupTemplate.set(popupTemplate));
        });
        afterNextRender({
            read: () => {
                this.setSubscriptions();
                this.setPopupCloseSubscriptions();
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
        this.value.set(date ?? null);
    }

    protected onCalendarValueChange(date: Date | null): void {
        this.setCurrentDate(date);
        this.#dropdownService.popupRef()?.close();
    }

    protected onDateInputBlur(): void {
        if (this.#dropdownService.popupRef()) {
            this.#propagateTouched?.();
            return;
        }
        if (!this.currentDateString() && this.value()) {
            this.setCurrentDate(null);
            this.#propagateTouched?.();
            return;
        }

        const dateTime = DateTime.fromFormat(this.currentDateString(), this.format());
        if (this.dateStringEquals(this.value(), dateTime.toJSDate())) {
            this.#propagateTouched?.();
            return;
        }
        if (dateTime.isValid) {
            const value = this.value();
            const minDate = this.min();
            const maxDate = this.max();
            if (value && DateTime.fromJSDate(value).equals(dateTime)) {
                return;
            }
            if (minDate && dateTime.startOf("day") < DateTime.fromJSDate(minDate).startOf("day")) {
                this.setCurrentDate(minDate);
                return;
            }
            if (maxDate && dateTime.startOf("day") > DateTime.fromJSDate(maxDate).startOf("day")) {
                this.setCurrentDate(maxDate);
                return;
            }
            this.setCurrentDate(dateTime.toJSDate());
        } else {
            this.setCurrentDate(null);
            this.currentDateString.set("");
        }
        this.#propagateTouched?.();
    }

    protected onDateInputButtonClick(): void {
        const popupRef = this.#dropdownService.popupRef();
        if (!this.popupTemplate() || this.readonly()) {
            return;
        }
        if (popupRef) {
            popupRef.close();
            return;
        }
        this.openPopup();
    }

    protected onDateStringEdit(dateString: string): void {
        this.currentDateString.set(dateString);
    }

    private closePopup(): void {
        this.#dropdownService.popupRef()?.close();
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

    private handleKeydown(event: KeyboardEvent): void {
        if (this.disabled() || this.readonly()) {
            return;
        }

        if (event.altKey && event.key === "ArrowDown") {
            event.preventDefault();
            this.openPopup();
        } else if ((event.altKey && event.key === "ArrowUp") || event.key === "Escape") {
            event.preventDefault();
            this.closePopup();
        }
    }

    private openPopup(): void {
        if (!this.#dropdownService.popupRef()) {
            this.#dropdownService.triggerPopupOpen$.next({
                height: "auto",
                maxHeight: "auto",
                width: "auto",
                closeOnScroll: false,
                withScrollTracking: true
            });
        }
    }

    private setCurrentDate(date: Date | null): void {
        const newDate = date ? new Date(date) : null;
        this.value.set(newDate);
        this.#propagateChange?.(date);
    }

    private setKeyboardSubscriptions(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => this.handleKeydown(event));
        this.#calendarService.keydown$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            const keyboardEvent = event.originalEvent;
            if (
                keyboardEvent &&
                (keyboardEvent.key === "Escape" || (keyboardEvent.altKey && keyboardEvent.key === "ArrowUp"))
            ) {
                keyboardEvent.preventDefault();
                this.closePopup();
            }
        });
    }

    private setPopupCloseSubscriptions(): void {
        this.#dropdownService.popupCloseComplete$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.focus();
        });
    }

    private setSubscriptions(): void {
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focusin")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => this.focus());
        this.setKeyboardSubscriptions();
    }
}
