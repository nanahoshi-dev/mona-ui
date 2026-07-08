import { CdkTrapFocus } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
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
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ButtonDirective } from "@mirei/mona-ui/button";
import { ButtonGroupComponent } from "@mirei/mona-ui/button-group";
import {
    CalendarComponent,
    CalendarDecadeCellTemplateDirective,
    CalendarMonthCellTemplateDirective,
    CalendarYearCellTemplateDirective,
    FirstDayOfWeek
} from "@mirei/mona-ui/calendar";
import { PreventableEvent } from "@mirei/mona-ui/common";
import {
    CalendarService,
    DateDisabledType,
    DateInputPrefixTemplateDirective,
    datePopupThemeVariants,
    HourFormat,
    TimeSelectorService
} from "@mirei/mona-ui/date-input";
import {
    DropdownPopupHandlerDirective,
    DropdownPopupInput,
    DropdownPopupInputToken,
    DropdownService
} from "@mirei/mona-ui/dropdowns";
import { type AttributeConfig, createElementControlId } from "@mirei/mona-ui/internal";
import { ListSizeInputType } from "@mirei/mona-ui/internal/list";
import { PopupCloseEvent } from "@mirei/mona-ui/popup";
import {
    TextBoxComponent,
    TextBoxPrefixTemplateDirective,
    TextBoxSuffixTemplateDirective
} from "@mirei/mona-ui/text-box";
import { ThemeService } from "@mirei/mona-ui/theme";
import { TimeSelectorComponent } from "@mirei/mona-ui/time-selector";
import { any } from "@mirei/ts-collections";
import { DateTime } from "luxon";
import { fromEvent, mergeWith } from "rxjs";
import { twMerge } from "tailwind-merge";
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
    providers: [
        CalendarService,
        DropdownService,
        TimeSelectorService,
        {
            provide: DropdownPopupInputToken,
            useExisting: forwardRef(() => DateTimePickerComponent),
            multi: false
        }
    ],
    imports: [
        ButtonDirective,
        FontAwesomeModule,
        CalendarComponent,
        TimeSelectorComponent,
        TextBoxComponent,
        TextBoxSuffixTemplateDirective,
        ButtonGroupComponent,
        CdkTrapFocus,
        CalendarDecadeCellTemplateDirective,
        CalendarMonthCellTemplateDirective,
        CalendarYearCellTemplateDirective,
        NgTemplateOutlet,
        TextBoxPrefixTemplateDirective
    ],
    hostDirectives: [DropdownPopupHandlerDirective],
    host: {
        "[attr.tabindex]": "disabled() ? null : -1",
        "[attr.aria-invalid]": "invalidState() ? 'true' : null",
        "[attr.data-expanded]": "expanded()",
        "[attr.data-invalid]": "invalidState() || null",
        "[class]": "baseClass()",
        "(blur)": "onDateInputBlur()"
    }
})
export class DateTimePickerComponent implements FormValueControl<Date | null>, DropdownPopupInput {
    readonly #calendarService = inject(CalendarService);
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #id = createElementControlId();
    readonly #themeService = inject(ThemeService);
    readonly #timeSelectorService = inject(TimeSelectorService);

    protected readonly activeView = signal<ActiveView>("date");
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const focused = this.#dropdownService.popupRef() != null;
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = dateTimePickerBaseThemeVariants(theme)({ focused, rounded, size });
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
    protected readonly footerClass = computed(() => {
        const theme = this.#themeService.theme();
        return dateTimePickerFooterThemeVariants(theme)();
    });
    protected readonly headerClass = computed(() => {
        const theme = this.#themeService.theme();
        return dateTimePickerHeaderThemeVariants(theme)();
    });
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
            role: "group"
        };
    });
    protected readonly invalidState = computed(
        () => this.invalid() || (this.required() && this.touched() && !this.value())
    );
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
     * @description Sets the disabled state of the date time picker.
     */
    public readonly disabled = input(false);

    /**
     * @description Sets the disabled dates of the date time picker.
     * Accepts either an iterable of Date objects or a predicate function.
     */
    public readonly disabledDates = input<DateDisabledType>();

    /**
     * @description Sets the first day of the week.
     */
    public readonly firstDay = input<FirstDayOfWeek>("monday");

    /**
     * @description Sets the date format of the date time picker.
     */
    public readonly format = input("dd/MM/yyyy HH:mm");

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
     * @description Marks the date time picker as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false);

    /**
     * @description Sets the maximum date of the date time picker.
     */
    public readonly max = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });

    /**
     * @description Sets the minimum date of the date time picker.
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
     * @description Sets the readonly state of the date time picker.
     */
    public readonly readonly = input(false);

    /**
     * @description When true, the input is readonly but the popup button remains enabled.
     * @default false
     */
    public readonly readonlyInput = input(false);

    /**
     * @description Sets the required state of the date time picker.
     * When bound to a signal form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly required = input(false);

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
     * @description Sets the visibility of the clear button.
     */
    public readonly showClearButton = input(false);

    /**
     * @description Sets the visibility of the second selector.
     */
    public readonly showSeconds = input(false);
    /**
     * @description Sets the size of the date time picker.
     */
    public readonly size = input<DateTimePickerVariantProps["size"]>("medium");

    /**
     * @description Emitted when the date time picker is interacted with via blur, selection, or clear.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the date time picker. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false);

    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Two-way bindable current date time value.
     * @default null
     */
    public readonly value = model<Date | null>(null);

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

    protected onCancelClick(): void {
        this.navigatedDate.set(this.value() ?? new Date());
        this.#dropdownService.popupRef()?.close();
        this.touch.emit();
    }

    protected onCalendarValueChange(date: Date | Date[] | null): void {
        const singleDate = Array.isArray(date) ? null : date;
        if (singleDate) {
            const inRangeDate = this.updateDateIfNotInRange(singleDate);
            this.navigatedDate.set(inRangeDate);
        }
        this.activeView.set("time");
    }

    protected onDateInputBlur(): void {
        if (this.#dropdownService.popupRef()) {
            this.touch.emit();
            return;
        }
        if (!this.currentDateString() && this.value()) {
            this.setCurrentDate(null);
            this.touch.emit();
            return;
        }

        const dateTime = DateTime.fromFormat(this.currentDateString(), this.format());
        if (this.dateStringEquals(this.value(), dateTime.toJSDate())) {
            this.touch.emit();
            return;
        }
        if (dateTime.isValid) {
            const value = this.value();
            if (value && DateTime.fromJSDate(value).equals(dateTime)) {
                this.touch.emit();
                return;
            }
            this.setCurrentDate(dateTime.toJSDate());
        } else {
            this.setCurrentDate(null);
            this.currentDateString.set("");
        }
        this.touch.emit();
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

    protected onDateStringEdit(dateString: string): void {
        this.currentDateString.set(dateString);
    }

    protected onSetDateClick(): void {
        this.value.set(this.navigatedDate());
        this.#dropdownService.popupRef()?.close();
        this.touch.emit();
    }

    protected onTimeSelectorValueChange(date: Date | null): void {
        if (date) {
            const inRangeDate = this.updateDateIfNotInRange(date);
            this.navigatedDate.set(inRangeDate);
        }
    }

    private compareDatesEqual(date1: Date, date2: Date): boolean {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
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

    private isDateDisabledByInput(date: Date, disabledDates: DateDisabledType): boolean {
        if (typeof disabledDates === "function") {
            return disabledDates(date);
        } else if (disabledDates) {
            return any(disabledDates, d => this.compareDatesEqual(date, d));
        }
        return false;
    }

    private setCurrentDate(date: Date | null): void {
        this.value.set(date);
        this.updateCurrentDateString(date, this.format());
        this.touch.emit();
    }

    private closePopup(): void {
        this.#dropdownService.popupRef()?.close();
    }

    private handleKeydown(event: KeyboardEvent): void {
        if (this.disabled() || this.readonly()) {
            return;
        }

        const popupOpen = this.#dropdownService.popupRef() !== null;

        if (event.altKey && event.key === "ArrowDown") {
            event.preventDefault();
            this.openPopup();
            return;
        }
        if (event.altKey && event.key === "ArrowUp") {
            event.preventDefault();
            console.warn("ArrowUp is not supported yet");
            this.closePopup();
            return;
        }
        if (event.key === "Escape" && popupOpen) {
            event.preventDefault();
            this.onCancelClick();
            return;
        }
        if (event.altKey && event.key === "ArrowRight" && popupOpen) {
            event.preventDefault();
            this.activeView.set("time");
            return;
        }
        if (event.altKey && event.key === "ArrowLeft" && popupOpen) {
            event.preventDefault();
            this.activeView.set("date");
            return;
        }
        if (event.key === "Enter" && popupOpen) {
            const target = event.target as HTMLElement;
            if (target.tagName === "BUTTON" || target.closest("button")) {
                return;
            }
            event.preventDefault();
            if (this.activeView() === "date") {
                this.activeView.set("time");
            } else {
                this.onSetDateClick();
            }
            return;
        }
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

    private setKeyboardSubscriptions(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => this.handleKeydown(event));

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
                } else if (keyboardEvent.altKey && keyboardEvent.key === "ArrowRight" && this.activeView() === "date") {
                    keyboardEvent.preventDefault();
                    this.activeView.set("time");
                } else if (keyboardEvent.altKey && keyboardEvent.key === "ArrowLeft" && this.activeView() === "time") {
                    keyboardEvent.preventDefault();
                    this.activeView.set("date");
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

    private setPopupCloseSubscriptions(): void {
        this.#dropdownService.popupCloseComplete$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.focus();
            this.activeView.set("date");
            this.navigatedDate.set(this.value() ?? new Date());
        });
    }

    private setSubscriptions(): void {
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focusin")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => this.focus());
        this.setKeyboardSubscriptions();
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
