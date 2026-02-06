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
import { ButtonGroupComponent } from "../../../../buttons/button-group/components/button-group/button-group.component";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { DropdownPopupHandlerDirective } from "../../../../common/dropdown/directives/dropdown-popup-handler.directive";
import { DropdownService } from "../../../../common/dropdown/services/dropdown.service";
import { FormFieldValidationDirective } from "../../../../common/forms/directives/form-field-validation.directive";
import { FormFieldValidationService } from "../../../../common/forms/services/form-field-validation.service";
import { ListSizeInputType } from "../../../../common/list/models/ListSizeType";
import { DropdownPopupInput, DropdownPopupInputToken } from "../../../../dropdowns/models/DropdownPopupInput";
import { TextBoxComponent } from "../../../../inputs/text-box/components/text-box/text-box.component";
import { TextBoxSuffixTemplateDirective } from "../../../../inputs/text-box/directives/text-box-suffix-template.directive";
import { PopupCloseEvent } from "../../../../popup/models/PopupCloseEvent";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { createElementControlId } from "../../../../utils/createElementControlId";
import { PreventableEvent } from "../../../../utils/PreventableEvent";
import { CalendarComponent } from "../../../calendar/components/calendar/calendar.component";
import { HourFormat } from "../../../models/HourFormat";
import { CalendarService } from "../../../services/calendar.service";
import { datePopupThemeVariants } from "../../../styles/date-popup.styles";
import { TimeSelectorComponent } from "../../../time-selector/components/time-selector/time-selector.component";
import { ActiveView } from "../../models/ActiveView";
import {
    dateTimePickerBaseThemeVariants,
    dateTimePickerFooterThemeVariants,
    dateTimePickerHeaderThemeVariants,
    DateTimePickerVariantProps
} from "../../styles/datetime-picker.styles";

@Component({
    selector: "mona-datetime-picker",
    templateUrl: "./datetime-picker.component.html",
    styleUrls: ["./datetime-picker.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        CalendarService,
        DropdownService,
        FormFieldValidationService,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DateTimePickerComponent),
            multi: true
        },
        {
            provide: DropdownPopupInputToken,
            useExisting: forwardRef(() => DateTimePickerComponent),
            multi: false
        }
    ],
    imports: [
        FormsModule,
        ButtonDirective,
        FontAwesomeModule,
        CalendarComponent,
        TimeSelectorComponent,
        TextBoxComponent,
        TextBoxSuffixTemplateDirective,
        ButtonGroupComponent,
        CdkTrapFocus
    ],
    hostDirectives: [DropdownPopupHandlerDirective, FormFieldValidationDirective],
    host: {
        "[attr.aria-controls]": "popupId",
        "[attr.aria-expanded]": "expanded()",
        "[attr.role]": "'grid'",
        "[attr.tabindex]": "disabled() ? null : 0",
        "[class]": "baseClass()"
    }
})
export class DateTimePickerComponent implements ControlValueAccessor, DropdownPopupInput {
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef = inject(ElementRef);
    readonly #themeService = inject(ThemeService);
    readonly #value = signal<Date | null>(null);
    #propagateChange: Action<Date | null> | null = null;
    #propagateTouched: Action | null = null;

    protected readonly activeView = signal<ActiveView>("date");
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const focused = this.#dropdownService.popupRef() != null;
        const variantClass = dateTimePickerBaseThemeVariants(theme)({ focused });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly currentDateString = linkedSignal(() => {
        const value = this.#value();
        const format = this.format();
        if (!value) {
            return "";
        }
        return DateTime.fromJSDate(value).toFormat(format);
    });
    protected readonly expanded = computed(() => this.#dropdownService.popupRef() !== null);
    protected readonly footerClass = computed(() => {
        const theme = this.#themeService.theme();
        return dateTimePickerFooterThemeVariants(theme)();
    });
    protected readonly headerClass = computed(() => {
        const theme = this.#themeService.theme();
        return dateTimePickerHeaderThemeVariants(theme)();
    });
    protected readonly navigatedDate = signal(new Date());
    protected readonly pickerPopupClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const userClass = this.popupClass();
        const variantClass = datePopupThemeVariants(theme)({ rounded, size });
        return twMerge(variantClass, userClass);
    });
    protected readonly popupId = createElementControlId();
    protected readonly popupTemplate = viewChild.required<TemplateRef<any>>("datePopupTemplate");
    protected readonly timePickerMax = computed(() => {
        const maxDate = this.max();
        const navigatedDate = this.navigatedDate();
        if (!maxDate) {
            return null;
        }
        const max = DateTime.fromJSDate(maxDate);
        const date = DateTime.fromJSDate(navigatedDate);
        if (max.year === date.year && max.month === date.month && max.day === date.day) {
            return maxDate;
        }
        return null;
    });
    protected readonly timePickerMin = computed(() => {
        const minDate = this.min();
        const navigatedDate = this.navigatedDate();
        if (!minDate) {
            return null;
        }
        const min = DateTime.fromJSDate(minDate);
        const date = DateTime.fromJSDate(navigatedDate);
        if (min.year === date.year && min.month === date.month && min.day === date.day) {
            return minDate;
        }
        return null;
    });

    /**
     * @description Emits when the popup is about to close. This event is preventable.
     */
    public readonly close = output<PopupCloseEvent>();

    /**
     * @description Emits after the popup is closed.
     */
    public readonly closed = output();

    public readonly disabled = model(false);
    public readonly disabledDates = input<Iterable<Date>>([]);
    public readonly format = input("dd/MM/yyyy HH:mm");
    public readonly hourFormat = input<HourFormat>("24");
    public readonly max = input<Date | null>(null);
    public readonly min = input<Date | null>(null);

    /**
     * @description Emits when the popup is about to open. This event is preventable.
     */
    public readonly open = output<PreventableEvent>();

    /**
     * @description Emits after the popup is opened.
     */
    public readonly opened = output();

    public readonly rounded = input<DateTimePickerVariantProps["rounded"]>("medium");

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

    public readonly readonly = input(false);
    public readonly showSeconds = input(false);
    /**
     * @description Sets the size of the date time picker.
     */
    public readonly size = input<DateTimePickerVariantProps["size"]>("medium");
    public readonly userClass = input("", { alias: "class" });

    public constructor() {
        effect(() => {
            const popupTemplate = this.popupTemplate();
            untracked(() => this.#dropdownService.popupTemplate.set(popupTemplate));
        });
        afterNextRender({
            read: () => {
                this.setDateValues();
                this.setSubscriptions();
            }
        });
    }

    public onCalendarValueChange(date: Date | null): void {
        if (date) {
            const inRangeDate = this.updateDateIfNotInRange(date);
            this.navigatedDate.set(inRangeDate);
        }
        this.activeView.set("time");
    }

    public onDateInputBlur(): void {
        if (this.#dropdownService.popupRef()) {
            this.#propagateTouched?.();
            return;
        }
        if (!this.currentDateString() && this.#value()) {
            this.setCurrentDate(null);
            this.#propagateTouched?.();
            return;
        }

        const dateTime = DateTime.fromFormat(this.currentDateString(), this.format());
        if (this.dateStringEquals(this.#value(), dateTime.toJSDate())) {
            this.#propagateTouched?.();
            return;
        }
        if (dateTime.isValid) {
            const value = this.#value();
            const minDate = this.min();
            const maxDate = this.max();
            if (value && DateTime.fromJSDate(value).equals(dateTime)) {
                return;
            }
            if (minDate && dateTime < DateTime.fromJSDate(minDate)) {
                this.setCurrentDate(minDate);
                return;
            }
            if (maxDate && dateTime > DateTime.fromJSDate(maxDate)) {
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

    public onDateInputButtonClick(): void {
        this.#dropdownService.triggerPopupOpen$.next({
            width: 266,
            height: "min-content",
            closeOnScroll: false,
            withScrollTracking: true
        });
    }

    public onDateStringEdit(dateString: string): void {
        this.currentDateString.set(dateString);
    }

    public onTimeSelectorValueChange(date: Date | null): void {
        if (date) {
            const inRangeDate = this.updateDateIfNotInRange(date);
            this.navigatedDate.set(inRangeDate);
        }
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
        this.updateCurrentDateString(date, this.format());
        this.setDateValues();
    }

    protected onSetDateClick(): void {
        this.#value.set(this.navigatedDate());
        this.#dropdownService.popupRef()?.close();
        this.#propagateChange?.(this.#value());
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

    private setCurrentDate(date: Date | null): void {
        this.#value.set(date);
        this.updateCurrentDateString(date, this.format());
        this.#propagateChange?.(date);
    }

    private setDateValues(): void {
        const value = this.#value();
        const maxDate = this.max();
        const minDate = this.min();
        if (value) {
            this.navigatedDate.set(DateTime.fromJSDate(value).toJSDate());
        } else if (minDate) {
            this.navigatedDate.set(DateTime.fromJSDate(minDate).toJSDate());
        } else if (maxDate) {
            if (maxDate.getTime() < DateTime.now().toMillis()) {
                this.navigatedDate.set(DateTime.fromJSDate(maxDate).toJSDate());
            } else {
                this.navigatedDate.set(DateTime.now().toJSDate());
            }
        } else {
            this.navigatedDate.set(DateTime.now().toJSDate());
        }
        if (this.#value()) {
            this.updateCurrentDateString(this.#value(), this.format());
        }
    }

    private setSubscriptions(): void {
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focusin")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                const input = this.#hostElementRef.nativeElement.querySelector("input");
                if (input) {
                    input.focus();
                    input.setSelectionRange(-1, -1);
                }
            });
        this.#dropdownService.popupCloseStart$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.focus();
        });
        this.#dropdownService.popupCloseComplete$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.activeView.set("date");
            const value = this.#value();
            if (value) {
                this.currentDateString.set(DateTime.fromJSDate(value).toFormat(this.format()));
            } else {
                this.currentDateString.set("");
            }
        });
    }

    private updateDateIfNotInRange(date: Date): Date {
        const maxDate = this.max();
        const minDate = this.min();
        if (minDate && date < minDate) {
            return minDate;
        }
        if (maxDate && date > maxDate) {
            return maxDate;
        }
        return date;
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
