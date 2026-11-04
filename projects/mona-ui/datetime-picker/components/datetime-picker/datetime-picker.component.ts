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
    linkedSignal,
    model,
    output,
    signal,
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
    getLocaleHourFormat,
    type HourFormat,
    TimeSelectorService,
    type TypedDateInput
} from "@nanahoshi/mona-ui/date-input";
import {
    DropdownPopupHandlerDirective,
    type DropdownPopupInput,
    DROPDOWN_POPUP_INPUT_TOKEN,
    DropdownService
} from "@nanahoshi/mona-ui/dropdowns";
import { getLocaleDateTimeInputFormat, injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { type AttributeConfig, createElementControlId } from "@nanahoshi/mona-ui/internal";
import type { ListSizeInputType } from "@nanahoshi/mona-ui/internal/list";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import {
    TextBoxComponent,
    TextBoxPrefixTemplateDirective,
    TextBoxSuffixTemplateDirective
} from "@nanahoshi/mona-ui/text-box";
import { TimeSelectorComponent } from "@nanahoshi/mona-ui/time-selector";
import { DateTime } from "luxon";
import { mergeWith } from "rxjs";
import { twMerge } from "tailwind-merge";
import { DATETIME_PICKER_DEFAULT_MESSAGES } from "../../i18n/datetime-picker.default-messages";
import type { ActiveView } from "../../models/ActiveView";
import {
    dateTimePickerBaseThemeVariants,
    dateTimePickerFooterThemeVariants,
    dateTimePickerHeaderThemeVariants,
    type DateTimePickerVariantProps
} from "../../styles/datetime-picker.styles";

@Component({
    selector: "mona-datetime-picker",
    templateUrl: "./datetime-picker.component.html",
    providers: [
        CalendarService,
        DropdownService,
        TimeSelectorService,
        {
            provide: DROPDOWN_POPUP_INPUT_TOKEN,
            useExisting: forwardRef(() => DateTimePickerComponent),
            multi: false
        }
    ],
    imports: [
        LucideCalendar,
        ButtonDirective,
        CalendarComponent,
        TimeSelectorComponent,
        TextBoxComponent,
        TextBoxSuffixTemplateDirective,
        CdkTrapFocus,
        CalendarDecadeCellTemplateDirective,
        CalendarMonthCellTemplateDirective,
        CalendarYearCellTemplateDirective,
        NgTemplateOutlet,
        TextBoxPrefixTemplateDirective
    ],
    hostDirectives: [DropdownPopupHandlerDirective],
    host: {
        // The ARIA inputs below are applied to the inner input, so the host must not keep the static attributes.
        "[attr.aria-describedby]": "null",
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null",
        "[attr.tabindex]": "disabled() ? null : -1",
        "[attr.aria-invalid]": "invalidState() ? 'true' : null",
        "[attr.data-disabled]": "disabled() || null",
        "[attr.data-expanded]": "expanded()",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[class]": "baseClass()",
        "(focusin)": "onFocusIn($event)",
        "(focusout)": "onFocusOut($event)",
        "(keydown)": "onKeydown($event)"
    }
})
export class DateTimePickerComponent implements FormValueControl<Date | null>, DropdownPopupInput {
    readonly #calendarService = inject(CalendarService);
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #timeSelectorService = inject(TimeSelectorService);

    protected readonly activeView = signal<ActiveView>("date");
    protected readonly baseClass = computed(() => {
        const focused = this.#dropdownService.popupRef() != null;
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = dateTimePickerBaseThemeVariants({ focused, rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly dateTabId = createElementControlId();
    protected readonly decadeCellTemplate = contentChild(CalendarDecadeCellTemplateDirective);
    protected readonly effectiveFormat = computed(() => {
        return (
            this.format() ??
            getLocaleDateTimeInputFormat(this.#i18n.localeId(), {
                hourFormat: this.effectiveHourFormat(),
                showSeconds: this.showSeconds()
            })
        );
    });
    protected readonly effectiveHourFormat = computed(
        () => this.hourFormat() ?? getLocaleHourFormat(this.#i18n.localeId())
    );
    protected readonly expanded = computed(() => this.#dropdownService.popupRef() !== null);
    /** Whether the view shown next takes focus: yes after picking a day, no when a tab is chosen. */
    protected readonly focusViewOnMount = signal(true);
    protected readonly footerClass = computed(() => {
        return dateTimePickerFooterThemeVariants();
    });
    protected readonly headerClass = computed(() => {
        return dateTimePickerHeaderThemeVariants();
    });
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
    protected readonly isRtl = computed(() => this.#direction() === "rtl");
    protected readonly messages = this.#i18n.componentMessages("dateTimePicker", DATETIME_PICKER_DEFAULT_MESSAGES);
    protected readonly monthCellTemplate = contentChild(CalendarMonthCellTemplateDirective);
    protected readonly navigatedDate = linkedSignal(() => this.value() ?? new Date());
    protected readonly panelId = createElementControlId();
    protected readonly pickerPopupClass = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        const userClass = this.popupClass();
        const variantClass = datePopupThemeVariants({ rounded, size });
        return twMerge(variantClass, userClass);
    });
    protected readonly popupId = createElementControlId();
    protected readonly popupTemplate = viewChild.required<TemplateRef<unknown>>("datePopupTemplate");
    protected readonly prefixTemplate = contentChild(DateInputPrefixTemplateDirective, { read: TemplateRef });
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
    protected readonly timeTabId = createElementControlId();
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
     * @description Sets the disabled state of the date time picker.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the disabled dates of the date time picker.
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
     * @description Sets the date format of the date time picker. If not specified, derives from the active locale,
     * hourFormat, and showSeconds. Typed text is also accepted with one-digit parts and a two-digit year.
     * @default null
     */
    public readonly format = input<string | null>(null);

    /**
     * @description Sets the hour format of the date time picker. When null, the active locale's clock is used: 12-hour
     * for en-US, 24-hour for de-DE.
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
     * date time picker. A unique id is generated when it isn't set.
     * @default generated
     */
    public readonly inputId = input(createElementControlId());

    /**
     * @description Marks the date time picker as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the maximum date of the date time picker. A later typed date is reported as a `maxDate` error.
     */
    public readonly max = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });

    /**
     * @description Sets the minimum date of the date time picker. An earlier typed date is reported as a `minDate`
     * error.
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
     * @description Sets the placeholder of the date time picker.
     */
    public readonly placeholder = input("");

    /**
     * @description Sets the class of the popup element.
     * @default ""
     */
    public readonly popupClass = input("");

    /**
     * @description Sets the height of the popup element. When not set, the popup fits its content.
     * @default undefined
     */
    public readonly popupHeight = input<ListSizeInputType>();

    /**
     * @description Sets the width of the popup element. When not set, the popup is at least as wide as the input.
     * @default undefined
     */
    public readonly popupWidth = input<ListSizeInputType>();

    /**
     * @description Sets the readonly state of the date time picker.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description When true, the input is readonly but the popup button remains enabled.
     * @default false
     */
    public readonly readonlyInput = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the required state of the date time picker.
     * When bound to a signal form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the border radius of the date time picker.
     */
    public readonly rounded = input<DateTimePickerVariantProps["rounded"]>("medium");

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
     * @description Sets the size of the date time picker.
     */
    public readonly size = input<DateTimePickerVariantProps["size"]>("medium");

    /**
     * @description Emitted when focus leaves the date time picker and its popup.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the date time picker. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Two-way bindable current date time value. Typed text is written on Enter and when the input loses
     * focus; text that isn't a valid date and time keeps the previous value and marks the field invalid.
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
            constraints: () => ({
                disabledDates: this.disabledDates(),
                max: this.max(),
                min: this.min(),
                unit: "datetime"
            }),
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
                this.setPopupKeyboardSubscription();
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
        if (singleDate) {
            // The calendar gives midnight; keep the time already chosen.
            const current = this.navigatedDate();
            const withTime = new Date(singleDate);
            withTime.setHours(current.getHours(), current.getMinutes(), current.getSeconds(), 0);
            this.navigatedDate.set(this.updateDateIfNotInRange(withTime));
        }
        this.focusViewOnMount.set(true);
        this.activeView.set("time");
    }

    protected onCancelClick(): void {
        this.navigatedDate.set(this.value() ?? new Date());
        this.closePopup();
    }

    protected onDateInputButtonClick(): void {
        if (this.disabled() || this.readonly()) {
            return;
        }
        if (this.#dropdownService.popupRef()) {
            this.closePopup();
        } else {
            this.openPopup();
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
        if (this.disabled() || this.readonly()) {
            return;
        }
        const popupOpen = this.expanded();
        if (event.altKey && event.key === "ArrowDown") {
            event.preventDefault();
            this.openPopup();
        } else if (event.altKey && event.key === "ArrowUp") {
            if (popupOpen) {
                event.preventDefault();
                this.closePopup();
            }
        } else if (event.key === "Escape") {
            if (popupOpen) {
                event.preventDefault();
                this.onCancelClick();
            }
        } else if (event.altKey && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
            if (popupOpen) {
                event.preventDefault();
                const towardsTime = (event.key === "ArrowRight") !== this.isRtl();
                this.activeView.set(towardsTime ? "time" : "date");
            }
        } else if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
            // Committed before a surrounding form submits; an IME uses Enter to confirm its text.
            if (!event.isComposing && event.keyCode !== 229) {
                this.typedInput.commit();
            }
        }
    }

    protected onSetDateClick(): void {
        this.value.set(this.navigatedDate());
        this.closePopup();
    }

    /** Arrow keys, Home and End move between the Date and Time tabs, as in the APG tabs pattern. */
    protected onTabKeydown(event: KeyboardEvent): void {
        if (event.altKey) {
            return;
        }
        const forward = this.isRtl() ? "ArrowLeft" : "ArrowRight";
        const backward = this.isRtl() ? "ArrowRight" : "ArrowLeft";
        let view: ActiveView | null = null;
        if (event.key === "Home" || event.key === backward) {
            view = "date";
        } else if (event.key === "End" || event.key === forward) {
            view = "time";
        }
        if (!view) {
            return;
        }
        event.preventDefault();
        this.selectTab(view);
        const tabId = view === "date" ? this.dateTabId : this.timeTabId;
        const tablist = event.currentTarget as HTMLElement;
        tablist.querySelector<HTMLElement>(`[id="${tabId}"]`)?.focus();
    }

    protected onTimeSelectorValueChange(date: Date | null): void {
        if (date) {
            const inRangeDate = this.updateDateIfNotInRange(date);
            this.navigatedDate.set(inRangeDate);
        }
    }

    /** Shows a view from its tab; focus stays on the tab, as in the APG tabs pattern. */
    protected selectTab(view: ActiveView): void {
        this.focusViewOnMount.set(false);
        this.activeView.set(view);
    }

    private closePopup(): void {
        this.#dropdownService.popupRef()?.close();
    }

    private openPopup(): void {
        if (!this.#dropdownService.popupRef()) {
            this.#dropdownService.triggerPopupOpen$.next({
                minWidth: this.popupWidth() || this.#hostElementRef.nativeElement.getBoundingClientRect().width,
                width: this.popupWidth() || "fit-content",
                height: this.popupHeight() || "fit-content",
                closeOnScroll: false,
                withScrollTracking: true
            });
        }
    }

    private setPopupCloseSubscription(): void {
        this.#dropdownService.popupCloseComplete$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            if (this.#dropdownService.focusCanReturn()) {
                this.focus();
            } else if (!this.#destroyRef.destroyed) {
                // Focus left from inside the popup, which the host's focusout doesn't see.
                this.touch.emit();
            }
            this.activeView.set("date");
            this.focusViewOnMount.set(true);
            this.navigatedDate.set(this.value() ?? new Date());
        });
    }

    private setPopupKeyboardSubscription(): void {
        this.#calendarService.keydown$
            .pipe(mergeWith(this.#timeSelectorService.keydown$), takeUntilDestroyed(this.#destroyRef))
            .subscribe(e => {
                const keyboardEvent = e.originalEvent as KeyboardEvent;
                if (!keyboardEvent) {
                    return;
                }
                if (keyboardEvent.key === "Escape") {
                    keyboardEvent.preventDefault();
                    this.onCancelClick();
                } else if (keyboardEvent.altKey && keyboardEvent.key === "ArrowUp") {
                    keyboardEvent.preventDefault();
                    this.closePopup();
                } else if (keyboardEvent.altKey && keyboardEvent.key === "ArrowRight") {
                    keyboardEvent.preventDefault();
                    this.activeView.set(this.isRtl() ? "date" : "time");
                } else if (keyboardEvent.altKey && keyboardEvent.key === "ArrowLeft") {
                    keyboardEvent.preventDefault();
                    this.activeView.set(this.isRtl() ? "time" : "date");
                } else if (keyboardEvent.key === "Enter" && this.activeView() === "time") {
                    const target = keyboardEvent.target as HTMLElement;
                    if (target.tagName === "BUTTON" || target.closest("button")) {
                        return;
                    }
                    keyboardEvent.preventDefault();
                    this.onSetDateClick();
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
}
