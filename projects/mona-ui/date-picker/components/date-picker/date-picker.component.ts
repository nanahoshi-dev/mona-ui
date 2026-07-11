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
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import { any } from "@mirei/ts-collections";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    CalendarComponent,
    CalendarDecadeCellTemplateDirective,
    CalendarMonthCellTemplateDirective,
    CalendarYearCellTemplateDirective,
    FirstDayOfWeek
} from "@nanahoshi/mona-ui/calendar";
import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import {
    CalendarService,
    DateDisabledType,
    DateInputPrefixTemplateDirective,
    datePopupThemeVariants,
    DatePopupVariantInput
} from "@nanahoshi/mona-ui/date-input";
import {
    DropdownPopupHandlerDirective,
    DropdownPopupInput,
    DropdownPopupInputToken,
    DropdownService
} from "@nanahoshi/mona-ui/dropdowns";
import { type AttributeConfig, createElementControlId } from "@nanahoshi/mona-ui/internal";
import { ListSizeInputType } from "@nanahoshi/mona-ui/internal/list";
import { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import {
    TextBoxComponent,
    TextBoxPrefixTemplateDirective,
    TextBoxSuffixTemplateDirective
} from "@nanahoshi/mona-ui/text-box";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { DateTime } from "luxon";
import { fromEvent } from "rxjs";
import { twMerge } from "tailwind-merge";
import { DATE_PICKER_STYLE_STRATEGY, DatePickerVariantInput, DatePickerVariantProps } from "../../styles/date-picker.styles";

@Component({
    selector: "mona-date-picker",
    templateUrl: "./date-picker.component.html",
    providers: [
        DropdownService,
        CalendarService,
        {
            provide: DropdownPopupInputToken,
            useExisting: forwardRef(() => DatePickerComponent),
            multi: false
        }
    ],
    imports: [
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
        "[attr.tabindex]": "disabled() ? null : -1",
        "[attr.aria-invalid]": "invalidState() ? 'true' : null",
        "[attr.data-expanded]": "expanded()",
        "[attr.data-invalid]": "invalidState() || null",
        "[class]": "baseClass()"
    }
})
export class DatePickerComponent
    implements FormValueControl<Date | null>, DropdownPopupInput, DatePickerVariantInput, DatePopupVariantInput
{
    readonly #calendarService = inject(CalendarService);
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #id = createElementControlId();
    readonly #styleStrategy = inject(DATE_PICKER_STYLE_STRATEGY);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const focused = this.#dropdownService.popupRef() != null;
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = this.#styleStrategy.resolve(theme).base({ focused, rounded, size });
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
    protected readonly popupTemplate = viewChild.required<TemplateRef<unknown>>("popupTemplate");
    protected readonly prefixTemplate = contentChild(DateInputPrefixTemplateDirective, { read: TemplateRef });
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
    public readonly disabled = input(false);

    /**
     * @description Sets the disabled dates of the date picker.
     * Accepts either an iterable of Date objects or a predicate function.
     */
    public readonly disabledDates = input<DateDisabledType>();

    /**
     * @description Sets the first day of the week.
     */
    public readonly firstDay = input<FirstDayOfWeek>("monday");

    /**
     * @description Sets the date format of the date picker.
     */
    public readonly format = input("dd/MM/yyyy");

    /**
     * @description Marks the date picker as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false);

    /**
     * @description Sets the maximum date of the date picker.
     */
    public readonly max = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });

    /**
     * @description Sets the minimum date of the date picker.
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
     * @description When true, the input is readonly but the calendar button remains enabled.
     * @default false
     */
    public readonly readonlyInput = input(false);

    /**
     * @description Sets the required state of the date picker.
     * When bound to a signal form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
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

    /**
     * @description Emitted when the date picker is interacted with via blur, selection, or clear.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the date picker. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false);

    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Two-way bindable current date value.
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

    protected onCalendarValueChange(date: Date | Date[] | null): void {
        const singleDate = Array.isArray(date) ? null : date;
        this.setCurrentDate(singleDate);
        this.#dropdownService.popupRef()?.close();
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
        const popupRef = this.#dropdownService.popupRef();
        if (!this.popupTemplate() || this.disabled() || this.readonly()) {
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

    private isDateDisabledByInput(date: Date, disabledDates: DateDisabledType): boolean {
        if (typeof disabledDates === "function") {
            return disabledDates(date);
        } else if (disabledDates) {
            return any(disabledDates, d => this.compareDatesEqual(date, d));
        }
        return false;
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

    private setCurrentDate(date: Date | null): void {
        const newDate = date ? new Date(date) : null;
        this.value.set(newDate);
        this.touch.emit();
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
