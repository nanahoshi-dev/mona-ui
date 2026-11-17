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
    numberAttribute,
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
    type DateDisabledType,
    datePopupThemeVariants,
    type DatePopupVariantInput
} from "@nanahoshi/mona-ui/date-input";
import {
    DropdownPopupHandlerDirective,
    type DropdownPopupInput,
    DROPDOWN_POPUP_INPUT_TOKEN,
    DropdownService
} from "@nanahoshi/mona-ui/dropdowns";
import { getLocaleDateInputFormat, getLocaleFirstDayOfWeek, gregorianDateTime, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import {
    type AttributeConfig,
    createElementControlId,
    FIELD_ASSOCIATION_BOUNDARY,
    injectEffectiveDisabled,
    injectLabelAssociation
} from "@nanahoshi/mona-ui/internal";
import type { ListSizeInputType } from "@nanahoshi/mona-ui/internal/list";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { twMerge } from "tailwind-merge";
import { DATE_RANGE_PICKER_DEFAULT_MESSAGES } from "../../i18n/date-range-picker.default-messages";
import type { DateRange } from "../../models/DateRange";
import type { DateRangePreset, DateRangePresetKey } from "../../models/DateRangePreset";
import {
    dateRangePickerBaseThemeVariants,
    dateRangePickerButtonThemeVariants,
    dateRangePickerFieldThemeVariants,
    dateRangePickerPopupThemeVariants,
    dateRangePickerPresetListThemeVariants,
    dateRangePickerPresetThemeVariants,
    dateRangePickerSeparatorThemeVariants,
    dateRangePickerSizerThemeVariants,
    type DateRangePickerVariantInput,
    type DateRangePickerVariantProps
} from "../../styles/date-range-picker.styles";
import { type DateRangePresetItem, resolveDateRangePresets } from "../../utils/dateRangePresets";
import { createTypedDateRangeInput, type DateRangePart, type TypedDateRangeInput } from "../../utils/typedDateRangeInput";

/** Today's date, at the start of the day. */
function startOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** The texts that size an input: the samples, and its placeholder. */
function sizerTexts(samples: readonly string[], placeholder: string): string[] {
    return placeholder ? [...samples, placeholder] : [...samples];
}

/**
 * Picks a range of days: two inputs for its first and last day, typed in the locale's format, and a calendar popup
 * that shows two months at a time.
 */
@Component({
    selector: "mona-date-range-picker",
    templateUrl: "./date-range-picker.component.html",
    providers: [
        DropdownService,
        CalendarService,
        {
            provide: DROPDOWN_POPUP_INPUT_TOKEN,
            useExisting: forwardRef(() => DateRangePickerComponent),
            multi: false
        }
    ],
    imports: [
        ButtonDirective,
        CalendarComponent,
        CalendarDecadeCellTemplateDirective,
        CalendarMonthCellTemplateDirective,
        CalendarYearCellTemplateDirective,
        CdkTrapFocus,
        LucideCalendar,
        NgTemplateOutlet,
        TextBoxComponent
    ],
    hostDirectives: [DropdownPopupHandlerDirective],
    viewProviders: [...FIELD_ASSOCIATION_BOUNDARY],
    host: {
        // The group is named by its label; the hint and errors describe each input, so the host drops the static
        // aria-describedby it was given.
        role: "group",
        "[attr.aria-describedby]": "null",
        "[attr.aria-disabled]": "effectiveDisabled() || null",
        "[attr.aria-label]": "ariaLabel() || null",
        "[attr.aria-labelledby]": "labelledBy()",
        "[attr.tabindex]": "effectiveDisabled() ? null : -1",
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
export class DateRangePickerComponent
    implements FormValueControl<DateRange | null>, DropdownPopupInput, DateRangePickerVariantInput, DatePopupVariantInput
{
    /** The input focused last, which gets focus back when the popup closes. */
    readonly #activePart = signal<DateRangePart>("start");
    readonly #calendarService = inject(CalendarService);
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #label = injectLabelAssociation({
        ariaDescribedBy: () => this.ariaDescribedBy(),
        ariaLabel: () => this.ariaLabel(),
        ariaLabelledBy: () => this.ariaLabelledBy(),
        focus: () => this.focus()
    });
    /**
     * Dates in the format as wide as any: each month's name, each weekday's, and two-digit days and months. The inputs
     * show digits at one width, so one digit stands for all of them.
     */
    readonly #sampleTexts = computed(() => {
        const format = this.effectiveFormat();
        const localeId = this.#i18n.localeId();
        const texts = new Set<string>();
        const dates = [
            ...Array.from({ length: 12 }, (_, month) => new Date(2000, month, 28)),
            ...Array.from({ length: 7 }, (_, offset) => new Date(2000, 0, 22 + offset))
        ];
        for (const date of dates) {
            texts.add(gregorianDateTime(date, localeId).toFormat(format).replace(/[0-9]/g, "0"));
        }
        return [...texts];
    });
    /** Today, worked out again each time the popup opens, so the quick ranges stay current. */
    readonly #today = signal(startOfToday());
    protected readonly baseClass = computed(() => {
        const focused = this.#dropdownService.popupRef() != null;
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = dateRangePickerBaseThemeVariants({ focused, rounded, size });
        return twMerge(variantClass, this.userClass());
    });
    protected readonly buttonClass = computed(() => dateRangePickerButtonThemeVariants({ size: this.size() }));
    /** The value as the calendar takes it: both ends, or the start alone, which the next day picked ends. */
    protected readonly calendarValue = computed<Date[] | null>(() => {
        const range = this.value();
        const ends = [range?.start, range?.end].filter((date): date is Date => date != null);
        return ends.length > 0 ? ends : null;
    });
    protected readonly decadeCellTemplate = contentChild(CalendarDecadeCellTemplateDirective);
    protected readonly describedBy = this.#label.describedBy;
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly effectiveFormat = computed(() => this.format() ?? getLocaleDateInputFormat(this.#i18n.localeId()));
    protected readonly endInputId = createElementControlId();
    protected readonly endInvalid = computed(
        () => this.typedInput.partErrors().end.length > 0 || this.fieldInvalid()
    );
    protected readonly endSizerTexts = computed(() => sizerTexts(this.#sampleTexts(), this.endPlaceholder()));
    protected readonly expanded = computed(() => this.#dropdownService.popupRef() !== null);
    protected readonly fieldClass = dateRangePickerFieldThemeVariants();
    /** Whether the range as a whole is invalid: marked so, or required and empty, once touched. */
    protected readonly fieldInvalid = computed(
        () => this.touched() && (this.invalid() || (this.required() && this.value() == null))
    );
    protected readonly inputAttributes = computed<AttributeConfig>(() => ({
        "aria-autocomplete": "none",
        "aria-controls": this.popupId,
        // The binder drops `false`, and a combobox must always say whether it's expanded.
        "aria-expanded": this.expanded() ? "true" : "false",
        "aria-haspopup": "dialog",
        // The text box hides its clear button when read-only, so typing is blocked here instead.
        readonly: this.readonly() || this.readonlyInput(),
        role: "combobox"
    }));
    protected readonly inputClass = "tabular-nums";
    /** The input takes no room of its own, so the hidden text beside it sets its width. */
    protected readonly inputStyle = "flex: 1 1 0%; min-width: 0; width: 0";
    protected readonly invalidState = computed(() => this.startInvalid() || this.endInvalid());
    protected readonly labelledBy = this.#label.labelledBy;
    protected readonly messages = this.#i18n.componentMessages("dateRangePicker", DATE_RANGE_PICKER_DEFAULT_MESSAGES);
    protected readonly monthCellTemplate = contentChild(CalendarMonthCellTemplateDirective);
    protected readonly pickerPopupClass = computed(() => {
        const variantClass = datePopupThemeVariants({ rounded: this.rounded(), size: this.size() });
        return twMerge(variantClass, dateRangePickerPopupThemeVariants(), this.popupClass());
    });
    protected readonly popupId = createElementControlId();
    protected readonly popupTemplate = viewChild.required<TemplateRef<unknown>>("popupTemplate");
    protected readonly presetClass = computed(() => dateRangePickerPresetThemeVariants({ size: this.size() }));
    protected readonly presetItems = computed<readonly DateRangePresetItem[]>(() => {
        const presets = this.presets();
        if (presets.length === 0) {
            return [];
        }
        return resolveDateRangePresets(presets, {
            disabledDates: this.disabledDates(),
            firstDay: this.firstDay() ?? getLocaleFirstDayOfWeek(this.#i18n.localeId()),
            max: this.maxDate(),
            messages: this.messages(),
            min: this.minDate(),
            today: this.#today(),
            value: this.value()
        });
    });
    protected readonly presetListClass = dateRangePickerPresetListThemeVariants();
    protected readonly separatorClass = dateRangePickerSeparatorThemeVariants();
    protected readonly sizerClass = computed(() => dateRangePickerSizerThemeVariants({ clearButton: this.showClearButton() }));
    protected readonly startInputId = createElementControlId();
    protected readonly startInvalid = computed(
        () => this.typedInput.partErrors().start.length > 0 || this.fieldInvalid()
    );
    protected readonly startSizerTexts = computed(() => sizerTexts(this.#sampleTexts(), this.startPlaceholder()));
    /** Set in the constructor, which runs after the `value` model it writes to exists. */
    protected readonly typedInput: TypedDateRangeInput;
    protected readonly yearCellTemplate = contentChild(CalendarYearCellTemplateDirective);

    /**
     * @description Id of an element that describes the range, such as a hint or an error message. It describes both
     * inputs.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description Accessible name of the range, on the group that holds its two inputs. Prefer a visible label from a
     * `mona-label` or a `mona-form-field`. Each input is named for its end, as in "Start date".
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description Id of the element that labels the range, on the group that holds its two inputs.
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
     * @description Sets the disabled state of the date range picker.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Days that can't be picked, as an iterable of dates or a predicate. Typing one is reported as a
     * `disabledDate` error. A range may still span a disabled day.
     */
    public readonly disabledDates = input<DateDisabledType>();

    /**
     * @description Placeholder of the end input.
     * @default ""
     */
    public readonly endPlaceholder = input("");

    /**
     * @description Sets the first day of the week. If not specified, derives from the active locale.
     * @default null
     */
    public readonly firstDay = input<FirstDayOfWeek | null>(null);

    /**
     * @description The date format of both inputs. If not specified, derives from the active locale. Typed text is
     * also accepted with one-digit days and months and a two-digit year.
     * @default null
     */
    public readonly format = input<string | null>(null);

    /**
     * @description Marks the range as invalid. When bound to a signal form field via `[formField]`, this is written
     * by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description The last day either end can be. A later typed date is reported as a `maxDate` error.
     */
    public readonly maxDate = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });

    /**
     * @description The first day either end can be. An earlier typed date is reported as a `minDate` error.
     */
    public readonly minDate = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });

    /**
     * @description How many months the calendar shows side by side. They wrap onto new rows on a narrow screen.
     * @default 2
     */
    public readonly months = input(2, { transform: (value: unknown) => numberAttribute(value, 2) });

    /**
     * @description Emits when the popup is about to open. This event is preventable.
     */
    public readonly open = output<PreventableEvent>();

    /**
     * @description Emits after the popup is opened.
     */
    public readonly opened = output();

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
     * @description Quick ranges shown beside the calendar, such as "Last 7 days". Give the key of a built-in range,
     * named by the locale's messages, or a `DateRangePreset` with a label of its own. Picking one writes its range and
     * closes the popup. A range is kept within `minDate` and `maxDate`; one with no day left in them, or with an end
     * on a disabled date, is disabled.
     * @default []
     */
    public readonly presets = input<readonly (DateRangePreset | DateRangePresetKey)[]>([]);

    /**
     * @description Sets the readonly state of the date range picker.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description When true, the inputs are read-only but the calendar button stays enabled.
     * @default false
     */
    public readonly readonlyInput = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the range as required, which an empty value doesn't meet. When bound to a signal form
     * field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the border radius of the date range picker.
     */
    public readonly rounded = input<DateRangePickerVariantProps["rounded"]>("medium");

    /**
     * @description Shows a clear button in each input, which empties that end at once.
     * @default false
     */
    public readonly showClearButton = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the size of the date range picker.
     */
    public readonly size = input<DateRangePickerVariantProps["size"]>("medium");

    /**
     * @description Placeholder of the start input.
     * @default ""
     */
    public readonly startPlaceholder = input("");

    /**
     * @description Emitted when focus leaves the date range picker and its popup.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the date range picker. When bound to a signal form field via
     * `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /** @description Extra classes for the control's container. */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Two-way bindable range. Typed text is written on Enter and when an input loses focus; text that
     * isn't a valid date, or an end before the start, keeps the previous range and marks the field invalid. A range
     * picked in the calendar is written once both ends are picked.
     * @default null
     */
    public readonly value = model<DateRange | null>(null);

    /**
     * @description Enables the display of week numbers in the calendar.
     * @default false
     */
    public readonly weekNumber = input(false, { transform: booleanAttribute });

    public constructor() {
        this.typedInput = createTypedDateRangeInput({
            constraints: () => ({ disabledDates: this.disabledDates(), max: this.maxDate(), min: this.minDate() }),
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
     * Focuses the start input and places the caret after its text. Read-only pickers take focus too.
     * @param options Options passed to the native `focus()` call, such as `preventScroll`.
     */
    public focus(options?: FocusOptions): void {
        this.focusPart("start", options);
    }

    protected onCalendarButtonClick(): void {
        if (this.effectiveDisabled() || this.readonly()) {
            return;
        }
        if (this.expanded()) {
            this.closePopup();
            return;
        }
        this.openPopup();
    }

    protected onCalendarValueChange(dates: Date | Date[] | null): void {
        // The calendar writes a range once both ends are picked.
        if (!Array.isArray(dates) || dates.length < 2) {
            return;
        }
        this.value.set({ end: new Date(dates[dates.length - 1]), start: new Date(dates[0]) });
        this.#activePart.set("end");
        this.closePopup();
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

    protected onInputBlur(part: DateRangePart): void {
        this.typedInput.commit(part);
    }

    protected onInputFocus(part: DateRangePart): void {
        this.#activePart.set(part);
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
                this.typedInput.commit(event.target.id === this.endInputId ? "end" : "start");
            }
        }
    }

    protected onPresetClick(item: DateRangePresetItem): void {
        if (item.disabled || !item.range) {
            return;
        }
        this.value.set({ end: new Date(item.range.end), start: new Date(item.range.start) });
        this.#activePart.set("end");
        this.closePopup();
    }

    protected onPresetKeydown(event: KeyboardEvent): void {
        if (event.key === "Escape" || (event.altKey && event.key === "ArrowUp")) {
            event.preventDefault();
            this.closePopup();
        }
    }

    private closePopup(): void {
        this.#dropdownService.popupRef()?.close();
    }

    private focusPart(part: DateRangePart, options?: FocusOptions): void {
        const id = part === "start" ? this.startInputId : this.endInputId;
        const input = this.#hostElementRef.nativeElement.querySelector<HTMLInputElement>(`#${CSS.escape(id)}`);
        if (input) {
            input.focus(options);
            input.setSelectionRange(input.value.length, input.value.length);
        }
    }

    private openPopup(): void {
        if (!this.#dropdownService.popupRef()) {
            this.#today.set(startOfToday());
            this.#dropdownService.triggerPopupOpen$.next({
                height: this.popupHeight() || "auto",
                maxHeight: "auto",
                width: this.popupWidth() || "auto",
                closeOnScroll: false,
                // Several months can be wider than a phone: when no side of the inputs has room, the popup
                // moves onto the screen rather than past its edge.
                withPush: true,
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
                this.focusPart(this.#activePart());
            } else if (!this.#destroyRef.destroyed) {
                // Focus left from inside the popup, which the host's focusout doesn't see.
                this.touch.emit();
            }
        });
    }
}
