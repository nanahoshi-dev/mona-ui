import type { Signal } from "@angular/core";
import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    model,
    output,
    signal,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import { ButtonDirective, type ButtonVariantProps } from "@nanahoshi/mona-ui/button";
import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import type { HourFormat, Meridiem, TimeUnit } from "@nanahoshi/mona-ui/date-input";
import {
    generateHourSet,
    generateMinuteSet,
    generateSecondSet,
    getLocaleHourFormat,
    TimeLimiterPipe,
    TimeSelectorService
} from "@nanahoshi/mona-ui/date-input";
import { formatNumber, injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { DateTime } from "luxon";
import { filter, fromEvent } from "rxjs";
import { TimeSelectorItemDirective } from "../../directives/time-selector-item.directive";
import { TimeSelectorListDirective } from "../../directives/time-selector-list.directive";
import { TIME_SELECTOR_DEFAULT_MESSAGES } from "../../i18n/time-selector.default-messages";
import type { TimeListType } from "../../models/TimeListType";
import type { TimeSelectorVariantInput, TimeSelectorVariantProps } from "../../styles/time-selector.styles";
import {
    timeSelectorBaseThemeVariants,
    timeSelectorFooterThemeVariants,
    timeSelectorHeaderThemeVariants,
    timeSelectorInfoContainerThemeVariants,
    timeSelectorListContainerThemeVariants
} from "../../styles/time-selector.styles";

const TIME_LIMITER = new TimeLimiterPipe();

@Component({
    selector: "mona-time-selector",
    templateUrl: "./time-selector.component.html",
    imports: [TimeSelectorItemDirective, ButtonDirective, TimeSelectorListDirective],
    host: {
        role: "group",
        "[attr.aria-label]": "ariaLabel() || messages().timeSelector",
        "[attr.aria-disabled]": "disabled() || null",
        "[attr.aria-invalid]": "invalidState() ? 'true' : null",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[attr.data-required]": "required() || null",
        "[class]": "baseClass()",
        "(focusout)": "onFocusOut($event)"
    }
})
export class TimeSelectorComponent implements FormValueControl<Date | null>, TimeSelectorVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #height = signal(0);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #i18n = inject(MonaI18nService);
    readonly #timeSelectorService = inject(TimeSelectorService, { optional: true });

    protected readonly amMeridiemVisible = computed(() => {
        const min = this.min();
        return !(min && min.getHours() >= 12);
    });
    protected readonly baseClass = computed(() => {
        const disabled = this.disabled();
        return timeSelectorBaseThemeVariants({ disabled });
    });
    protected readonly computedPopupHeight = this.#height.asReadonly();
    /** The clock in use: the `hourFormat` input, or the locale's own when it isn't set. */
    protected readonly effectiveHourFormat = computed<HourFormat>(
        () => this.hourFormat() ?? getLocaleHourFormat(this.#i18n.localeId())
    );
    protected readonly focusedList = signal<TimeListType>("hours");
    protected readonly footerClass = computed(() => {
        return timeSelectorFooterThemeVariants();
    });
    protected readonly headerClass = computed(() => {
        return timeSelectorHeaderThemeVariants();
    });
    protected readonly hour = computed(() => {
        const hour = this.navigatedDate().hour;
        if (this.effectiveHourFormat() === "24") {
            return hour;
        }
        return hour % 12 || 12;
    });
    protected readonly hourListId = createElementControlId();
    protected readonly hourListRef = viewChild.required<ElementRef<HTMLOListElement>>("hourList");
    /** The hours shown and reachable with the keyboard: on the step, within min and max. */
    protected readonly hourOptions = computed(() => this.limit(this.viewHours(), "h"));
    protected readonly infoContainerClass = computed(() => {
        return timeSelectorInfoContainerThemeVariants();
    });
    protected readonly invalidState = computed(() => this.touched() && this.invalid());
    protected readonly isRtl = computed(() => this.#direction() === "rtl");
    protected readonly listContainerClass = computed(() => {
        return timeSelectorListContainerThemeVariants();
    });
    protected readonly maxDate = computed(() => {
        const max = this.max();
        const locale = this.#i18n.localeId();
        return max ? DateTime.fromJSDate(max).setLocale(locale) : null;
    });
    protected readonly meridiem = signal<Meridiem>("AM");
    protected readonly meridiemListId = createElementControlId();
    protected readonly meridiemListRef = viewChild<ElementRef<HTMLOListElement>>("meridiemList");
    protected readonly messages = this.#i18n.componentMessages("timeSelector", TIME_SELECTOR_DEFAULT_MESSAGES);
    protected readonly minDate = computed(() => {
        const min = this.min();
        const locale = this.#i18n.localeId();
        return min ? DateTime.fromJSDate(min).setLocale(locale) : null;
    });
    protected readonly minute = computed(() => this.navigatedDate().minute);
    protected readonly minuteListId = createElementControlId();
    protected readonly minuteListRef = viewChild.required<ElementRef<HTMLOListElement>>("minuteList");
    protected readonly minuteOptions = computed(() => this.limit(generateMinuteSet(this.minuteStep()), "m"));
    protected readonly navigatedDate = signal<DateTime>(DateTime.now());
    protected readonly navigatedDateText = computed(() => {
        const locale = this.#i18n.localeId();
        return this.navigatedDate()
            .setLocale(locale)
            .toLocaleString({ hour: "numeric", minute: "numeric", hour12: this.effectiveHourFormat() === "12" });
    });
    protected readonly pmMeridiemVisible = computed(() => {
        const max = this.max();
        return !(max && max.getHours() < 12);
    });
    protected readonly second = computed(() => this.navigatedDate().second);
    protected readonly secondListId = createElementControlId();
    protected readonly secondListRef = viewChild<ElementRef<HTMLOListElement>>("secondList");
    protected readonly secondOptions = computed(() => this.limit(generateSecondSet(this.secondStep()), "s"));
    protected readonly viewHours = computed(() =>
        generateHourSet(this.effectiveHourFormat(), this.meridiem(), this.hourStep())
    );

    /**
     * @description Accessible label for the time selector group.
     * @default ""
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Moves focus to the hour list when the selector first renders. The pickers set it for their popups;
     * an inline selector leaves focus where it is, so the page doesn't jump to it on load.
     * @default false
     */
    public readonly focusOnMount = input(false, { transform: booleanAttribute });

    /**
     * @description Shows the Set button. Without it, every change of hour, minute, second or AM/PM made by the user
     * is written to the value at once.
     * @default true
     */
    public readonly footer = input(true, { transform: booleanAttribute });

    /**
     * @description The clock to show: "12" with an AM/PM list, or "24". When not set, the active locale's own clock
     * is used (12-hour for en-US, 24-hour for de-DE).
     * @default null
     */
    public readonly hourFormat = input<HourFormat | null>(null);
    public readonly hourStep = input(1);

    /**
     * @description Marks the time selector as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    public readonly max = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });
    public readonly min = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });
    public readonly minuteStep = input(1);

    /**
     * @description Prevents value changes while preserving the component's visual state.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Sets whether the time selector is required. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    public readonly rounded = input<ButtonVariantProps["rounded"]>("medium");
    public readonly secondStep = input(1);
    public readonly showSeconds = input(false, { transform: booleanAttribute });
    public readonly size = input<TimeSelectorVariantProps["size"]>("medium");

    /**
     * @description Emitted when focus leaves the time selector, as a native input is touched on blur. Moving between
     * its lists and buttons doesn't count. The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the time selector. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Two-way bindable current time value. It is written by the Set button and Enter, or, without a
     * footer, by each change the user makes; never on its own.
     * @default null
     */
    public readonly value = model<Date | null>(null);

    public constructor() {
        afterNextRender({
            read: () => {
                this.#height.set(this.#hostElementRef.nativeElement.offsetHeight);
                this.setDateValues();
                const value = this.value();
                if (value) {
                    const dt = DateTime.fromJSDate(value).setLocale(this.#i18n.localeId());
                    if (dt.isValid) {
                        this.navigatedDate.set(dt);
                    } else {
                        this.initializeNavigatedDate(value);
                    }
                }
                this.setupKeyboardNavigation();
                if (this.focusOnMount()) {
                    this.focusList(this.focusedList());
                }
            }
        });
        effect(() => {
            const value = this.value();
            untracked(() => this.setDateValues(value));
        });
    }

    /**
     * Moves focus to the active list.
     * @param options passed to the native `focus()` call, for example `{ preventScroll: true }`.
     */
    public focus(options?: FocusOptions): void {
        this.focusList(this.focusedList(), options);
    }

    /** The id of the active option, or null while the time isn't one of the options (between steps, say). */
    protected activeOptionId(listId: string, options: Iterable<TimeUnit>, value: number): string | null {
        for (const option of options) {
            if (option.value === value) {
                return `${listId}${value}`;
            }
        }
        return null;
    }

    protected formatTwoDigit(value: number): string {
        return formatNumber(value, this.#i18n.localeId(), {
            minimumIntegerDigits: 2,
            useGrouping: false
        });
    }

    protected onFocusOut(event: FocusEvent): void {
        // Removing a focused selector from the page fires focusout after it is destroyed.
        if (this.#destroyRef.destroyed) {
            return;
        }
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && this.#hostElementRef.nativeElement.contains(nextTarget)) {
            return;
        }
        this.touch.emit();
    }

    protected onHourChange(hour: number): void {
        if (this.disabled() || this.readonly()) {
            return;
        }
        this.navigateTo(this.navigatedDate().set({ hour }));
    }

    protected onMeridiemClick(meridiem: Meridiem): void {
        if (this.disabled() || this.readonly()) {
            return;
        }
        if (this.meridiem() === meridiem) {
            return;
        }
        const hour = this.navigatedDate().hour;
        if (meridiem === "PM" && hour < 12) {
            this.navigateTo(this.navigatedDate().set({ hour: hour + 12 }));
        } else if (meridiem === "AM" && hour >= 12) {
            this.navigateTo(this.navigatedDate().set({ hour: hour - 12 }));
        }
    }

    protected onMinuteChange(minute: number): void {
        if (this.disabled() || this.readonly()) {
            return;
        }
        this.navigateTo(this.navigatedDate().set({ minute }));
    }

    protected onNowClick(): void {
        if (this.disabled() || this.readonly()) {
            return;
        }
        const now = DateTime.now();
        this.navigateTo(
            this.navigatedDate().set({
                hour: now.hour,
                minute: now.minute,
                second: now.second,
                millisecond: now.millisecond
            })
        );
    }

    protected onSecondChange(second: number): void {
        if (this.disabled() || this.readonly()) {
            return;
        }
        this.navigateTo(this.navigatedDate().set({ second }));
    }

    protected onSetTimeClick(): void {
        if (this.disabled() || this.readonly()) {
            return;
        }
        this.updateValue(this.clampToRange(this.navigatedDate()).toJSDate());
    }

    /** Moves a time inside min and max, on the same day. */
    private clampToRange(date: DateTime): DateTime {
        const day = { year: date.year, month: date.month, day: date.day };
        const min = this.minDate()?.set(day);
        const max = this.maxDate()?.set(day);
        const timeOf = (bound: DateTime) => ({
            hour: bound.hour,
            minute: bound.minute,
            second: bound.second,
            millisecond: bound.millisecond
        });
        if (min && date < min) {
            return date.set(timeOf(min));
        }
        if (max && date > max) {
            return date.set(timeOf(max));
        }
        return date;
    }

    private dateValuesEqual(date1: Date | null, date2: Date | null): boolean {
        return date1?.getTime() === date2?.getTime();
    }

    private focusList(listType: TimeListType, options?: FocusOptions): void {
        const listRef = this.getListRef(listType);
        listRef?.nativeElement.focus(options);
    }

    private getListRef(listType: TimeListType): ElementRef<HTMLOListElement> | undefined {
        switch (listType) {
            case "hours":
                return this.hourListRef();
            case "minutes":
                return this.minuteListRef();
            case "seconds":
                return this.secondListRef();
            case "meridiem":
                return this.meridiemListRef();
        }
    }

    private getNextList(current: TimeListType, direction: "left" | "right"): TimeListType {
        const lists: TimeListType[] = ["hours", "minutes"];
        if (this.showSeconds()) {
            lists.push("seconds");
        }
        if (this.effectiveHourFormat() === "12") {
            lists.push("meridiem");
        }
        const currentIndex = lists.indexOf(current);
        const isRtl = this.isRtl();
        const effectiveDirection = isRtl ? (direction === "left" ? "right" : "left") : direction;
        if (effectiveDirection === "right") {
            return lists[(currentIndex + 1) % lists.length];
        } else {
            return lists[(currentIndex - 1 + lists.length) % lists.length];
        }
    }

    private getOptions(listType: Exclude<TimeListType, "meridiem">): TimeUnit[] {
        const options: Signal<Iterable<TimeUnit>> =
            listType === "hours" ? this.hourOptions : listType === "minutes" ? this.minuteOptions : this.secondOptions;
        return Array.from(options());
    }

    private handleKeydown(event: KeyboardEvent): void {
        if (this.disabled() || this.readonly()) {
            return;
        }
        const preventableEvent = new PreventableEvent("calendarKeydown", event);
        this.#timeSelectorService?.keydown$.next(preventableEvent);

        if (preventableEvent.isDefaultPrevented()) {
            return;
        }

        // Keys pressed on the Now and Set buttons belong to the buttons, which act on click.
        if ((event.target as HTMLElement).closest("button")) {
            return;
        }

        const focusedList = this.focusedList();

        switch (event.key) {
            case "ArrowUp":
                event.preventDefault();
                this.navigateItem(focusedList, -1);
                break;
            case "ArrowDown":
                event.preventDefault();
                this.navigateItem(focusedList, 1);
                break;
            case "ArrowLeft":
                if (event.altKey) {
                    return;
                }
                event.preventDefault();
                this.focusedList.set(this.getNextList(focusedList, "left"));
                this.focusList(this.focusedList());
                break;
            case "ArrowRight":
                if (event.altKey) {
                    return;
                }
                event.preventDefault();
                this.focusedList.set(this.getNextList(focusedList, "right"));
                this.focusList(this.focusedList());
                break;
            case "Home":
                event.preventDefault();
                this.navigateToEdge(focusedList, "first");
                break;
            case "End":
                event.preventDefault();
                this.navigateToEdge(focusedList, "last");
                break;
            case "Enter":
            case " ":
                // Space would otherwise scroll the focused list.
                event.preventDefault();
                this.updateValue(this.clampToRange(this.navigatedDate()).toJSDate());
                break;
        }
    }

    private initializeNavigatedDate(date: Date | null): void {
        const min = this.min();
        const max = this.max();
        const locale = this.#i18n.localeId();
        if (!date) {
            this.navigatedDate.set(DateTime.now().setLocale(locale));
        } else if (min && date < min) {
            const minDate = DateTime.fromJSDate(min).setLocale(locale);
            if (minDate.isValid) {
                this.navigatedDate.set(minDate);
            }
        } else if (max && date > max) {
            const maxDate = DateTime.fromJSDate(max).setLocale(locale);
            if (maxDate.isValid) {
                this.navigatedDate.set(maxDate);
            }
        } else {
            const dateToSet = DateTime.fromJSDate(date).setLocale(locale);
            if (dateToSet.isValid) {
                this.navigatedDate.set(dateToSet);
            }
        }
    }

    /** The options of a list that pass the step and the min/max bounds for the time being edited. */
    private limit(values: Iterable<TimeUnit>, type: "h" | "m" | "s"): Iterable<TimeUnit> {
        return TIME_LIMITER.transform(values, type, this.navigatedDate(), this.minDate(), this.maxDate());
    }

    /** Moves through the options of a list, so the keyboard reaches what the mouse can: steps within min and max. */
    private navigateItem(listType: TimeListType, direction: -1 | 1): void {
        if (listType === "meridiem") {
            const target: Meridiem = this.meridiem() === "AM" ? "PM" : "AM";
            if (target === "AM" ? this.amMeridiemVisible() : this.pmMeridiemVisible()) {
                this.onMeridiemClick(target);
            }
            return;
        }
        const options = this.getOptions(listType);
        if (options.length === 0) {
            return;
        }
        const current =
            listType === "hours" ? this.navigatedDate().hour : listType === "minutes" ? this.minute() : this.second();
        const index = options.findIndex(option => option.value === current);
        let target: TimeUnit | undefined;
        if (index >= 0) {
            target = options[Math.max(0, Math.min(options.length - 1, index + direction))];
        } else {
            // Between steps: go to the nearest option in the direction of the key.
            target =
                direction > 0
                    ? (options.find(option => option.value > current) ?? options[options.length - 1])
                    : ([...options].reverse().find(option => option.value < current) ?? options[0]);
        }
        this.setUnit(listType, target.value);
    }

    private navigateTo(date: DateTime): void {
        const clamped = this.clampToRange(date);
        this.navigatedDate.set(clamped);
        this.meridiem.set(clamped.hour >= 12 ? "PM" : "AM");
        if (!this.footer()) {
            this.updateValue(clamped.toJSDate());
        }
    }

    private navigateToEdge(listType: TimeListType, edge: "first" | "last"): void {
        if (listType === "meridiem") {
            this.onMeridiemClick(edge === "first" ? "AM" : "PM");
            return;
        }
        const options = this.getOptions(listType);
        const target = edge === "first" ? options[0] : options[options.length - 1];
        if (target) {
            this.setUnit(listType, target.value);
        }
    }

    private setDateValues(value = this.value()): void {
        const currentDate = this.navigatedDate().toJSDate();
        if (!this.dateValuesEqual(currentDate, value)) {
            this.initializeNavigatedDate(value);
        }
        const meridiem = this.navigatedDate().hour >= 12 ? "PM" : "AM";
        this.meridiem.set(meridiem);
    }

    private setUnit(listType: Exclude<TimeListType, "meridiem">, value: number): void {
        switch (listType) {
            case "hours":
                this.onHourChange(value);
                break;
            case "minutes":
                this.onMinuteChange(value);
                break;
            case "seconds":
                this.onSecondChange(value);
                break;
        }
    }

    private setupKeyboardNavigation(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(() => !this.disabled())
            )
            .subscribe(event => this.handleKeydown(event));
    }

    private updateValue(date: Date | null): void {
        if (this.dateValuesEqual(this.value(), date)) {
            return;
        }
        this.value.set(date);
    }
}
