import { CdkTrapFocus } from "@angular/cdk/a11y";
import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    forwardRef,
    inject,
    input,
    model,
    output,
    type Signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import { LucideClock } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import type { PreventableEvent } from "@nanahoshi/mona-ui/common";
import {
    createTypedDateInput,
    getLocaleHourFormat,
    type HourFormat,
    type TypedDateInput
} from "@nanahoshi/mona-ui/date-input";
import {
    DropdownPopupHandlerDirective,
    DROPDOWN_POPUP_INPUT_TOKEN,
    dropdownPopupThemeVariants,
    DropdownService
} from "@nanahoshi/mona-ui/dropdowns";
import { getLocaleTimeInputFormat, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { type AttributeConfig, createElementControlId, injectEffectiveDisabled } from "@nanahoshi/mona-ui/internal";
import type { ListSizeInputType } from "@nanahoshi/mona-ui/internal/list";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import { TextBoxComponent, TextBoxSuffixTemplateDirective } from "@nanahoshi/mona-ui/text-box";
import { TimeSelectorComponent } from "@nanahoshi/mona-ui/time-selector";
import { twMerge } from "tailwind-merge";
import { TIME_PICKER_DEFAULT_MESSAGES } from "../../i18n/time-picker.default-messages";
import {
    timePickerBaseThemeVariants,
    type TimePickerVariantInput,
    type TimePickerVariantProps
} from "../../styles/time-picker.styles";

@Component({
    selector: "mona-time-picker",
    templateUrl: "./time-picker.component.html",
    providers: [
        DropdownService,
        {
            provide: DROPDOWN_POPUP_INPUT_TOKEN,
            useExisting: forwardRef(() => TimePickerComponent),
            multi: false
        }
    ],
    imports: [
        LucideClock,
        ButtonDirective,
        TimeSelectorComponent,
        TextBoxComponent,
        TextBoxSuffixTemplateDirective,
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
export class TimePickerComponent implements FormValueControl<Date | null>, TimePickerVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #i18n = inject(MonaI18nService);

    protected readonly baseClass = computed(() => {
        const focused = this.#dropdownService.popupRef() != null;
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = timePickerBaseThemeVariants({ focused, rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly effectiveFormat = computed(() => {
        return (
            this.format() ??
            getLocaleTimeInputFormat(this.#i18n.localeId(), {
                hourFormat: this.effectiveHourFormat(),
                showSeconds: this.showSeconds()
            })
        );
    });
    protected readonly effectiveHourFormat = computed(
        () => this.hourFormat() ?? getLocaleHourFormat(this.#i18n.localeId())
    );
    protected readonly expanded = computed(() => this.#dropdownService.popupRef() != null);
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
    protected readonly messages = this.#i18n.componentMessages("timePicker", TIME_PICKER_DEFAULT_MESSAGES);
    protected readonly pickerPopupClass = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        const userClass = this.popupClass();
        const variantClass = dropdownPopupThemeVariants({ rounded, size });
        return twMerge(variantClass, userClass);
    });
    protected readonly popupId = createElementControlId();
    protected readonly timePopupTemplateRef: Signal<TemplateRef<unknown>> = viewChild.required("timePopupTemplate");
    /** Set in the constructor, which runs after the `value` model it writes to exists. */
    protected readonly typedInput: TypedDateInput;

    /**
     * @description Id of an element that describes the input, such as a hint or an error message.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description Accessible name of the input. Prefer a visible label, linked through {@link inputId} or
     * {@link ariaLabelledBy}; the placeholder is not a label.
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
     * @description Sets the disabled state of the time picker.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the format of the time picker. If not specified, derives from the active locale, hourFormat,
     * and showSeconds. Typed text is also accepted with one-digit hours, minutes and seconds.
     * @default null
     */
    public readonly format = input<string | null>(null);

    /**
     * @description Sets the hour format of the time picker. When null, the active locale's clock is used: 12-hour for
     * en-US, 24-hour for de-DE.
     * @default null
     */
    public readonly hourFormat = input<HourFormat | null>(null);

    /**
     * @description Sets the hour step of the time picker.
     * @default 1
     */
    public readonly hourStep = input(1);

    /**
     * @description Id of the inner `<input>` element. Point a `<label for>` or `<mona-label for>` at it to label the
     * time picker. A unique id is generated when it isn't set.
     * @default generated
     */
    public readonly inputId = input(createElementControlId());

    /**
     * @description Marks the time picker as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the latest time of the time picker. Only the time of day is compared; a later typed time is
     * reported as a `maxDate` error.
     * @default undefined
     */
    public readonly max = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });

    /**
     * @description Sets the earliest time of the time picker. Only the time of day is compared; an earlier typed time
     * is reported as a `minDate` error.
     * @default undefined
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
     * @description Sets the height of the popup element. When not set, the popup fits the time selector.
     * @default undefined
     */
    public readonly popupHeight = input<ListSizeInputType>();

    /**
     * @description Sets the width of the popup element. When not set, the popup fits the time selector.
     * @default undefined
     */
    public readonly popupWidth = input<ListSizeInputType>();

    /**
     * @description Sets the readonly state of the time picker.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description When true, the input is readonly but the popup button remains enabled.
     * @default false
     */
    public readonly readonlyInput = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the required state of the time picker.
     * When bound to a signal form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

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
     * @description Sets the visibility of the clear button. Clearing empties the value at once.
     * @default false
     */
    public readonly showClearButton = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the visibility of the second selector.
     * @default false
     */
    public readonly showSeconds = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the size of the time picker.
     */
    public readonly size = input<TimePickerVariantProps["size"]>("medium");

    /**
     * @description Emitted when focus leaves the time picker and its popup.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the time picker. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Two-way bindable current time value. Typed text is written on Enter and when the input loses
     * focus, on the current value's day (today when empty); text that isn't a valid time keeps the previous value
     * and marks the field invalid.
     * @default null
     */
    public readonly value = model<Date | null>(null);

    public constructor() {
        this.typedInput = createTypedDateInput({
            constraints: () => ({ max: this.max(), min: this.min(), unit: "time" }),
            format: () => this.effectiveFormat(),
            localeId: () => this.#i18n.localeId(),
            resolve: (parsed, current) => {
                const day = current ?? new Date();
                return parsed
                    .set({ year: day.getFullYear(), month: day.getMonth() + 1, day: day.getDate() })
                    .toJSDate();
            },
            value: this.value
        });
        afterNextRender({
            read: () => this.setPopupCloseSubscription()
        });
        effect(() => {
            const popupTemplate = this.timePopupTemplateRef();
            untracked(() => this.#dropdownService.popupTemplate.set(popupTemplate));
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
                this.#dropdownService.popupRef()?.close();
            }
        } else if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
            // Committed before a surrounding form submits; an IME uses Enter to confirm its text.
            if (!event.isComposing && event.keyCode !== 229) {
                this.typedInput.commit();
            }
        }
    }

    protected onTimeInputButtonClick(): void {
        if (this.effectiveDisabled() || this.readonly()) {
            return;
        }
        if (this.#dropdownService.popupRef()) {
            this.#dropdownService.popupRef()?.close();
            return;
        }
        this.openPopup();
    }

    protected onTimeSelectorValueChange(date: Date | null): void {
        this.value.set(date);
        this.#dropdownService.popupRef()?.close();
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
