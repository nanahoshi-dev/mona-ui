import { CdkTrapFocus } from "@angular/cdk/a11y";
import {
    afterNextRender,
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
import type { FormValueControl } from "@angular/forms/signals";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ButtonDirective } from "@mirei/mona-ui/button";
import { AttributeConfig, createElementControlId, PreventableEvent } from "@mirei/mona-ui/common";
import { HourFormat } from "@mirei/mona-ui/date-input";
import {
    DropdownPopupHandlerDirective,
    DropdownPopupInputToken,
    dropdownPopupThemeVariants,
    DropdownService
} from "@mirei/mona-ui/dropdowns";
import { ListSizeInputType } from "@mirei/mona-ui/list";
import { PopupCloseEvent } from "@mirei/mona-ui/popup";
import { TextBoxComponent, TextBoxSuffixTemplateDirective } from "@mirei/mona-ui/text-box";
import { ThemeService } from "@mirei/mona-ui/theme";
import { TimeSelectorComponent } from "@mirei/mona-ui/time-selector";
import { DateTime } from "luxon";
import { fromEvent } from "rxjs";
import { twMerge } from "tailwind-merge";
import {
    timePickerBaseThemeVariants,
    TimePickerVariantInput,
    TimePickerVariantProps
} from "../../styles/time-picker.styles";

@Component({
    selector: "mona-time-picker",
    templateUrl: "./time-picker.component.html",
    providers: [
        DropdownService,
        {
            provide: DropdownPopupInputToken,
            useExisting: forwardRef(() => TimePickerComponent),
            multi: false
        }
    ],
    imports: [
        ButtonDirective,
        FontAwesomeModule,
        TimeSelectorComponent,
        TextBoxComponent,
        TextBoxSuffixTemplateDirective,
        CdkTrapFocus
    ],
    hostDirectives: [DropdownPopupHandlerDirective],
    host: {
        "[attr.tabindex]": "disabled() ? null : -1",
        "[attr.aria-invalid]": "invalidState() ? 'true' : null",
        "[attr.data-expanded]": "expanded()",
        "[attr.data-invalid]": "invalidState() || null",
        "[class]": "baseClass()",
        "(blur)": "onTimeInputBlur()"
    }
})
export class TimePickerComponent implements FormValueControl<Date | null>, TimePickerVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #id = createElementControlId();
    readonly #themeService = inject(ThemeService);

    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const focused = this.#dropdownService.popupRef() != null;
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = timePickerBaseThemeVariants(theme)({ focused, rounded, size });
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
        const invalid = this.invalid();
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
    protected readonly invalidState = computed(
        () => this.invalid() || (this.required() && this.touched() && !this.value())
    );
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
    protected readonly timePopupTemplateRef: Signal<TemplateRef<unknown>> = viewChild.required("timePopupTemplate");

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
    public readonly disabled = input(false);

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
     * @description Marks the time picker as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false);

    /**
     * @description Sets the maximum date of the time picker.
     * @default null
     */
    public readonly max = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });

    /**
     * @description Sets the minimum date of the time picker.
     * @default null
     */
    public readonly min = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });

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
     * When bound to a signal form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
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

    /**
     * @description Emitted when the time picker is interacted with via blur, selection, or clear.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the time picker. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false);

    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Two-way bindable current time value.
     * @default null
     */
    public readonly value = model<Date | null>(null);

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

    protected onDateStringEdit(dateString: string): void {
        this.currentDateString.set(dateString);
    }

    protected onTimeInputBlur(): void {
        if (this.#dropdownService.popupRef()) {
            this.touch.emit();
            return;
        }
        this.processTimeInput(this.currentDateString());
        this.touch.emit();
    }

    protected onTimeInputButtonClick(): void {
        if (this.disabled() || this.readonly()) {
            return;
        }
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

    public focus(): void {
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
        if (this.disabled() || this.readonly()) {
            return;
        }
        if (e.key === "ArrowDown" && e.altKey) {
            e.preventDefault();
            this.openPopup();
            return;
        }
    }

    private openPopup(): void {
        if (this.#dropdownService.popupRef()) {
            return;
        }
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
        this.touch.emit();
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
