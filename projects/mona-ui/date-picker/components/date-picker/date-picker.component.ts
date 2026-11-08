import { CdkTrapFocus } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    forwardRef,
    inject,
    input,
    model,
    output,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import { LucideCalendar } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    CalendarComponent,
    CalendarDecadeCellTemplateDirective,
    CalendarMonthCellTemplateDirective,
    CalendarYearCellTemplateDirective,
    type FirstDayOfWeek
} from "@nanahoshi/mona-ui/calendar";
import type { PreventableEvent } from "@nanahoshi/mona-ui/common";
import {
    CalendarService,
    createTypedDateInput,
    type DateDisabledType,
    DateInputPrefixTemplateDirective,
    datePopupThemeVariants,
    type DatePopupVariantInput,
    type TypedDateInput
} from "@nanahoshi/mona-ui/date-input";
import {
    DropdownPopupHandlerDirective,
    type DropdownPopupInput,
    DROPDOWN_POPUP_INPUT_TOKEN,
    DropdownService
} from "@nanahoshi/mona-ui/dropdowns";
import { getLocaleDateInputFormat, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { type AttributeConfig, createElementControlId, injectEffectiveDisabled } from "@nanahoshi/mona-ui/internal";
import type { ListSizeInputType } from "@nanahoshi/mona-ui/internal/list";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import {
    TextBoxComponent,
    TextBoxPrefixTemplateDirective,
    TextBoxSuffixTemplateDirective
} from "@nanahoshi/mona-ui/text-box";
import { twMerge } from "tailwind-merge";
import { DATE_PICKER_DEFAULT_MESSAGES } from "../../i18n/date-picker.default-messages";
import {
    datePickerBaseThemeVariants,
    type DatePickerVariantInput,
    type DatePickerVariantProps
} from "../../styles/date-picker.styles";

@Component({
    selector: "mona-date-picker",
    templateUrl: "./date-picker.component.html",
    providers: [
        DropdownService,
        CalendarService,
        {
            provide: DROPDOWN_POPUP_INPUT_TOKEN,
            useExisting: forwardRef(() => DatePickerComponent),
            multi: false
        }
    ],
    imports: [
        LucideCalendar,
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
    hostDirectives: [DropdownPopupHandlerDirective],
    host: {
        // The ARIA inputs below are applied to the inner input, so the host must not keep the static attributes.
        "[attr.aria-describedby]": "null",
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null",
        "[attr.tabindex]": "effectiveDisabled() ? null : -1",
        "[attr.aria-invalid]": "invalidState() ? 'true' : null",
        "[attr.data-disabled]": "effectiveDisabled() || null",
        "[attr.data-expanded]": "expanded()",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[class]": "baseClass()",
        "(focusin)": "onFocusIn($event)",
        "(focusout)": "onFocusOut($event)",
        "(keydown)": "onKeydown($event)"
    }
})
export class DatePickerComponent
    implements FormValueControl<Date | null>, DropdownPopupInput, DatePickerVariantInput, DatePopupVariantInput
{
    readonly #calendarService = inject(CalendarService);
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    protected readonly baseClass = computed(() => {
        const focused = this.#dropdownService.popupRef() != null;
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = datePickerBaseThemeVariants({ focused, rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly decadeCellTemplate = contentChild(CalendarDecadeCellTemplateDirective);
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly effectiveFormat = computed(() => {
        return this.format() ?? getLocaleDateInputFormat(this.#i18n.localeId());
    });
    protected readonly expanded = computed(() => this.#dropdownService.popupRef() !== null);
    protected readonly inputAttributes = computed<AttributeConfig>(() => {
        return {
            "aria-autocomplete": "none",
            "aria-controls": this.popupId,
            // The binder drops `false`, and a combobox must always say whether it's expanded.
            "aria-expanded": this.expanded() ? "true" : "false",
            "aria-haspopup": "dialog",
            // The text box hides its clear button when read-only, so typing is blocked here instead.
            readonly: this.readonly() || this.readonlyInput(),
            role: "combobox"
        };
    });
    protected readonly invalidState = computed(
        () =>
            this.typedInput.errors().length > 0 ||
            (this.touched() && (this.invalid() || (this.required() && !this.value())))
    );
    protected readonly messages = this.#i18n.componentMessages("datePicker", DATE_PICKER_DEFAULT_MESSAGES);
    protected readonly monthCellTemplate = contentChild(CalendarMonthCellTemplateDirective);
    protected readonly pickerPopupClass = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        const userClass = this.popupClass();
        const variantClass = datePopupThemeVariants({ rounded, size });
        return twMerge(variantClass, userClass);
    });
    protected readonly popupId = createElementControlId();
    protected readonly popupTemplate = viewChild.required<TemplateRef<unknown>>("popupTemplate");
    protected readonly prefixTemplate = contentChild(DateInputPrefixTemplateDirective, { read: TemplateRef });
    /** Set in the constructor, which runs after the `value` model it writes to exists. */
    protected readonly typedInput: TypedDateInput;
    protected readonly yearCellTemplate = contentChild(CalendarYearCellTemplateDirective);

    /**
     * @description Id of an element that describes the input, such as a hint or an error message.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description Accessible name of the input. Prefer a visible label, linked through {@link inputId} or
     * `aria-labelledby`; the placeholder is not a label.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description Id of the element that labels the input.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Emits when the popup is about to close. This event is preventable.
     */
    // eslint-disable-next-line @angular-eslint/no-output-native
    public readonly close = output<PopupCloseEvent>();

    /**
     * @description Emits after the popup is closed.
     */
    public readonly closed = output();

    /**
     * @description Sets the disabled state of the date picker.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the disabled dates of the date picker.
     * Accepts either an iterable of Date objects or a predicate function. Typing a disabled date is reported as a
     * `disabledDate` error instead of setting the value.
     */
    public readonly disabledDates = input<DateDisabledType>();

    /**
     * @description Sets the first day of the week. If not specified, derives from the active locale.
     * @default null
     */
    public readonly firstDay = input<FirstDayOfWeek | null>(null);

    /**
     * @description Sets the date format of the date picker. If not specified, derives from the active locale.
     * Typed text is also accepted with one-digit days and months and a two-digit year.
     * @default null
     */
    public readonly format = input<string | null>(null);

    /**
     * @description Id of the inner `<input>` element. Point a `<label for>` or `<mona-label for>` at it to label the
     * date picker. A unique id is generated when it isn't set.
     * @default generated
     */
    public readonly inputId = input(createElementControlId());

    /**
     * @description Marks the date picker as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the maximum date of the date picker. A later typed date is reported as a `maxDate` error.
     */
    public readonly max = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });

    /**
     * @description Sets the minimum date of the date picker. An earlier typed date is reported as a `minDate` error.
     */
    public readonly min = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });

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
     * @description Sets the height of the popup element. When empty, the popup fits the calendar.
     * @default ""
     */
    public readonly popupHeight = input<ListSizeInputType>("");

    /**
     * @description Sets the width of the popup element. When empty, the popup fits the calendar.
     * @default ""
     */
    public readonly popupWidth = input<ListSizeInputType>("");

    /**
     * @description Sets the readonly state of the date picker.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description When true, the input is readonly but the calendar button remains enabled.
     * @default false
     */
    public readonly readonlyInput = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the required state of the date picker.
     * When bound to a signal form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the border radius of the date picker.
     */
    public readonly rounded = input<DatePickerVariantProps["rounded"]>("medium");

    /**
     * @description Sets the visibility of the clear button. Clearing empties the value at once.
     * @default false
     */
    public readonly showClearButton = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the size of the date picker.
     */
    public readonly size = input<DatePickerVariantProps["size"]>("medium");

    /**
     * @description Emitted when focus leaves the date picker and its popup.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the date picker. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /** @description Extra classes for the input's container. */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Two-way bindable current date value. Typed text is written on Enter and when the input loses
     * focus; text that isn't a valid date keeps the previous value and marks the field invalid.
     * @default null
     */
    public readonly value = model<Date | null>(null);

    /**
     * @description Enables the display of week numbers in the calendar.
     * @default false
     */
    public readonly weekNumber = input(false, { transform: booleanAttribute });

    public constructor() {
        this.typedInput = createTypedDateInput({
            constraints: () => ({ disabledDates: this.disabledDates(), max: this.max(), min: this.min(), unit: "date" }),
            format: () => this.effectiveFormat(),
            localeId: () => this.#i18n.localeId(),
            value: this.value
        });
        effect(() => {
            const popupTemplate = this.popupTemplate();
            untracked(() => this.#dropdownService.popupTemplate.set(popupTemplate));
        });
        afterNextRender({
            read: () => {
                this.setCalendarKeyboardSubscription();
                this.setPopupCloseSubscription();
            }
        });
    }

    /**
     * Focuses the input and places the caret after the text. Read-only pickers take focus too.
     * @param options Options passed to the native `focus()` call, such as `preventScroll`.
     */
    public focus(options?: FocusOptions): void {
        const input = this.#hostElementRef.nativeElement.querySelector("input");
        if (input) {
            input.focus(options);
            input.setSelectionRange(input.value.length, input.value.length);
        }
    }

    protected onCalendarValueChange(date: Date | Date[] | null): void {
        const singleDate = Array.isArray(date) ? null : date;
        this.value.set(singleDate ? new Date(singleDate) : null);
        this.closePopup();
    }

    protected onDateInputButtonClick(): void {
        const popupRef = this.#dropdownService.popupRef();
        if (!this.popupTemplate() || this.effectiveDisabled() || this.readonly()) {
            return;
        }
        if (popupRef) {
            popupRef.close();
            return;
        }
        this.openPopup();
    }

    protected onFocusIn(event: FocusEvent): void {
        // The host is focusable only to pass focus on; focus inside it, such as a click in the text, stays put.
        if (event.target === this.#hostElementRef.nativeElement) {
            this.focus();
        }
    }

    protected onFocusOut(event: FocusEvent): void {
        // Removing a focused picker from the page fires focusout after it is destroyed.
        if (this.#destroyRef.destroyed) {
            return;
        }
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node) {
            const popupElement = this.#dropdownService.popupRef()?.overlayRef.overlayElement;
            if (this.#hostElementRef.nativeElement.contains(nextTarget) || popupElement?.contains(nextTarget)) {
                return;
            }
        }
        this.touch.emit();
    }

    protected onInputBlur(): void {
        this.typedInput.commit();
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (this.effectiveDisabled() || this.readonly()) {
            return;
        }
        if (event.altKey && event.key === "ArrowDown") {
            event.preventDefault();
            this.openPopup();
        } else if ((event.altKey && event.key === "ArrowUp") || event.key === "Escape") {
            if (this.expanded()) {
                event.preventDefault();
                this.closePopup();
            }
        } else if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
            // Committed before a surrounding form submits; an IME uses Enter to confirm its text.
            if (!event.isComposing && event.keyCode !== 229) {
                this.typedInput.commit();
            }
        }
    }

    private closePopup(): void {
        this.#dropdownService.popupRef()?.close();
    }

    private openPopup(): void {
        if (!this.#dropdownService.popupRef()) {
            this.#dropdownService.triggerPopupOpen$.next({
                height: this.popupHeight() || "auto",
                maxHeight: "auto",
                width: this.popupWidth() || "auto",
                closeOnScroll: false,
                withScrollTracking: true
            });
        }
    }

    private setCalendarKeyboardSubscription(): void {
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

    private setPopupCloseSubscription(): void {
        this.#dropdownService.popupCloseComplete$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            if (this.#dropdownService.focusCanReturn()) {
                this.focus();
            } else if (!this.#destroyRef.destroyed) {
                // Focus left from inside the popup, which the host's focusout doesn't see.
                this.touch.emit();
            }
        });
    }
}
