import type { FocusOrigin } from "@angular/cdk/a11y";
import { FocusMonitor } from "@angular/cdk/a11y";
import type { ModelSignal, Signal } from "@angular/core";
import {
    afterNextRender,
    booleanAttribute,
    computed,
    contentChildren,
    DestroyRef,
    Directive,
    effect,
    ElementRef,
    inject,
    input,
    output,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { Action } from "@nanahoshi/mona-ui/internal";
import { createElementControlId, injectEffectiveDisabled, rxTimeout } from "@nanahoshi/mona-ui/internal";
import { formatNumber, getNumberSymbols, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { concatMap, delay, filter, map, of, Subject, switchMap, takeUntil, tap, timer } from "rxjs";
import { twMerge } from "tailwind-merge";
import { NumericTextBoxPrefixTemplateDirective } from "../../directives/numeric-text-box-prefix-template.directive";
import { NUMERIC_TEXT_BOX_DEFAULT_MESSAGES } from "../../i18n/numeric-text-box.default-messages";
import type { NumericTextboxVariantInputs, NumericTextboxVariantProps } from "../../styles/numeric-textbox.styles";
import {
    numericTextboxButtonThemeVariants,
    numericTextboxInputThemeVariants,
    numericTextboxThemeVariants
} from "../../styles/numeric-textbox.styles";

/** PageUp and PageDown move by this many steps. */
const PAGE_STEP_COUNT = 10;

export type NumericTextBoxStepDirection = "-" | "+";

/** Text read from the input: whether it is acceptable and, when complete, the value it holds. */
export interface NumericTextBoxTextResult<TValue> {
    readonly valid: boolean;
    readonly value: TValue | null;
}

/**
 * Typing, pasting, spinning, formatting and ARIA for a numeric input, shared by the number and decimal text boxes.
 * Subclasses declare the value-typed inputs and say how to parse, compare and step their value type.
 */
@Directive({
    host: {
        // The host has no role: the inner input is the spinbutton and carries the name, description and state. A
        // static aria-* attribute written on the host element would otherwise stay on the host as well.
        "[attr.aria-describedby]": "null",
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null",
        "[class]": "classes()",
        "[attr.data-disabled]": "effectiveDisabled() || null",
        "[attr.data-invalid]": "invalidInput() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[attr.data-required]": "required() || null",
        "(focusout)": "onBlur($event)"
    }
})
export abstract class NumericTextBoxBaseComponent<
    TValue extends number | string
> implements NumericTextboxVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #focusMonitor = inject(FocusMonitor);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #i18n = inject(MonaI18nService);
    /** The value this component last wrote, so a value set from outside can be told apart. */
    #ownValue: TValue | null | undefined = undefined;
    #pendingPaste = false;

    protected readonly beforeInput$ = new Subject<InputEvent>();
    protected readonly classes = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        const classes = numericTextboxThemeVariants({ rounded, size });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly focused = signal(false);
    protected readonly formattedValue = computed(() => {
        if (this.focused() && !this.readonly()) {
            return this.rawInputValue();
        }
        return this.formatValueForDisplay(this.value());
    });
    protected readonly inputClasses = computed(() => {
        const hasPrefixTemplate = this.prefixTemplateList().length > 0;
        const startRounded = hasPrefixTemplate ? "none" : this.rounded();
        const endRounded = this.showSpinners() ? "none" : this.rounded();
        const inputVariants = numericTextboxInputThemeVariants({ endRounded, startRounded });
        return twMerge(inputVariants);
    });
    protected readonly invalidInput = computed(
        () => this.touched() && (this.invalid() || (this.required() && this.value() == null))
    );
    protected readonly keydown$ = new Subject<KeyboardEvent>();
    protected readonly messages = this.#i18n.componentMessages("numericTextBox", NUMERIC_TEXT_BOX_DEFAULT_MESSAGES);
    protected readonly prefixTemplateList = contentChildren(NumericTextBoxPrefixTemplateDirective, {
        read: TemplateRef
    });
    protected readonly rawInputValue = signal("");
    /** Spin buttons on a read-only field would look usable but do nothing, so they are hidden there. */
    protected readonly showSpinners = computed(() => this.spinners() && !this.readonly());
    protected readonly spin$ = new Subject<NumericTextBoxStepDirection>();
    protected readonly spinButtonClasses = computed(() => {
        const size = this.size();
        return numericTextboxButtonThemeVariants({ size });
    });
    protected readonly spinButtonIconSize = computed(() => {
        const size = this.size();
        return size === "large" ? 20 : size === "medium" ? 16 : 14;
    });
    protected readonly spinStop$ = new Subject<void>();
    protected readonly valueChange$ = new Subject<string>();
    protected readonly valueTextBoxRef: Signal<ElementRef<HTMLInputElement>> = viewChild.required("valueTextBox");
    protected readonly wheel$ = new Subject<WheelEvent>();

    /**
     * @description ID of an element that provides an extended description for the input, such as a hint or an
     * error message.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description Accessible name for the input. Prefer a visible label, linked through {@link inputId} or
     * `aria-labelledby`.
     */
    public readonly ariaLabel = input<string | null>(null, { alias: "aria-label" });

    /**
     * @description ID of an external element that provides the accessible name for the input.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Number of fractional decimal places to display and accept. Values are truncated to an integer
     * and clamped to the range 0–20. Non-finite and negative values normalize to 0.
     * @default 0
     */
    public readonly decimals = input(0, {
        transform: (value: number) => {
            const num = Math.trunc(value);
            if (!Number.isFinite(num) || num < 0) {
                return 0;
            }
            return Math.min(20, num);
        }
    });

    /**
     * @description Sets whether the input is disabled.
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Emits when focus leaves the component, after the value has been clamped to the bounds. Moving
     * focus between the input and elements inside the component (such as a prefix template) doesn't count.
     */
    public readonly inputBlur = output<FocusEvent>();

    /**
     * @description Emits when the inner input element is focused.
     */
    public readonly inputFocus = output<FocusEvent>();

    /**
     * @description Emits when the inner input element loses focus.
     */
    public readonly inputFocusOut = output<FocusEvent>();

    /**
     * @description ID of the inner input, so a `<label for>` or `<mona-label for>` can point at it.
     * @default a generated ID
     */
    public readonly inputId = input(createElementControlId());

    /**
     * @description Marks the text box as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Sets whether the input can be empty. When `false`, leaving an empty field sets it to the
     * minimum, or to zero when there is no minimum (clamped to the maximum).
     */
    public readonly nullable = input(true, { transform: booleanAttribute });

    /**
     * @description Text shown in the input while it is empty. It isn't a label: it disappears once there is a
     * value.
     * @default ""
     */
    public readonly placeholder = input("");

    /**
     * @description Sets whether the input is readonly. The spin buttons are hidden while it is.
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Sets whether the input is required.
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the border radius of the input.
     */
    public readonly rounded = input<NumericTextboxVariantProps["rounded"]>(`medium`);

    /**
     * @description Sets the size of the input.
     */
    public readonly size = input<NumericTextboxVariantProps["size"]>(`medium`);

    /**
     * @description Sets whether the spin buttons are visible.
     */
    public readonly spinners = input(true, { transform: booleanAttribute });

    /**
     * @description Tab index of the input.
     */
    public readonly tabindex = input(0);

    /**
     * @description Emitted when focus leaves the component, as a native input is touched on blur. Typing and
     * spinning don't count. The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output();

    /**
     * @description Sets the touched state of the text box. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /** The most fraction digits shown while editing. */
    protected abstract readonly editFractionDigits: number;
    /** The value a spin starts from when the input is empty. */
    protected abstract readonly zeroValue: TValue;

    public abstract readonly formatter: Signal<Action<TValue | null, string> | null>;
    public abstract readonly maxValue: Signal<TValue | null>;
    public abstract readonly minValue: Signal<TValue | null>;
    public abstract readonly value: ModelSignal<TValue | null>;

    public constructor() {
        effect(() => {
            const value = this.value();
            untracked(() => {
                if (value === this.#ownValue) {
                    return;
                }
                // Set from outside (a form patch, a binding): show it, even while the user is in the field.
                this.#ownValue = value;
                if (this.focused() && !this.readonly()) {
                    this.rawInputValue.set(this.formatEditValue(value));
                }
            });
        });
        effect(() => {
            this.#i18n.localeId();
            untracked(() => {
                if (this.focused() && !this.readonly()) {
                    this.rawInputValue.set(this.formatEditValue(this.value()));
                }
            });
        });
        afterNextRender({
            read: () => {
                this.setSubscriptions();
                this.rawInputValue.set(this.formatValueForDisplay(this.value()));
                this.#focusMonitor
                    .monitor(this.#hostElementRef, true)
                    .pipe(takeUntilDestroyed(this.#destroyRef))
                    .subscribe((focusOrigin: FocusOrigin) => {
                        const isFocused = focusOrigin !== null;
                        this.focused.set(isFocused);
                        if (isFocused && !this.readonly()) {
                            const currentValue = this.value();
                            const rawValue = this.formatEditValue(currentValue);
                            this.rawInputValue.set(rawValue);
                        }
                    });
            }
        });
        this.#destroyRef.onDestroy(() => this.#focusMonitor.stopMonitoring(this.#hostElementRef.nativeElement));
    }

    /** Steps the value down by `step` and moves focus to the input. */
    public decrease(): void {
        this.spinValue("-");
        this.focus();
    }

    /**
     * Moves focus to the input, with the caret at the end.
     * @param options passed to the native `focus()` call, for example `{ preventScroll: true }`.
     */
    public focus(options?: FocusOptions): void {
        this.#focusMonitor.focusVia(this.valueTextBoxRef(), "keyboard", options);
        rxTimeout(this.#destroyRef, () => {
            this.valueTextBoxRef().nativeElement.scrollLeft = this.valueTextBoxRef().nativeElement.scrollWidth;
        });
    }

    /** Steps the value up by `step` and moves focus to the input. */
    public increase(): void {
        this.spinValue("+");
        this.focus();
    }

    /** Runs when focus leaves an element inside the component: clamps the value and marks the field touched. */
    public onBlur(event: FocusEvent): void {
        // Removing a focused text box from the page fires focusout after it is destroyed.
        if (this.#destroyRef.destroyed) {
            return;
        }
        this.#pendingPaste = false;
        const relatedTarget = event.relatedTarget;
        if (relatedTarget instanceof Node && this.#hostElementRef.nativeElement.contains(relatedTarget)) {
            return;
        }
        this.correctValue();
        this.rawInputValue.set(this.formatValueForDisplay(this.value()));
        this.touch.emit();
        this.inputBlur.emit(event);
    }

    protected applyRawValue(text: string): void {
        this.rawInputValue.set(text);
        this.valueChange$.next(text);
    }

    protected onPaste(event: ClipboardEvent): void {
        const pastedText = event.clipboardData?.getData("text/plain");
        if (pastedText == null) {
            this.#pendingPaste = false;
            return;
        }
        const inputElement = this.valueTextBoxRef()?.nativeElement;
        if (!inputElement) {
            this.#pendingPaste = false;
            return;
        }
        const { value, selectionStart, selectionEnd } = inputElement;
        const start = selectionStart ?? value.length;
        const end = selectionEnd ?? value.length;
        const proposedValue = value.slice(0, start) + pastedText + value.slice(end);
        const validation = this.readLocaleText(proposedValue, this.#i18n.localeId(), this.decimals());
        if (!validation.valid || validation.value === null) {
            event.preventDefault();
            this.#pendingPaste = false;
            return;
        }
        this.#pendingPaste = true;
    }

    protected onSpinPointerDown(event: PointerEvent, direction: NumericTextBoxStepDirection): void {
        // Only the primary button spins: a right-click opens the context menu and would never see a pointerup.
        if (event.button !== 0) {
            return;
        }
        this.spin$.next(direction);
    }

    /** Limits a value to the min and max bounds. */
    private clampValue(value: TValue): TValue {
        const min = this.minValue();
        const max = this.maxValue();
        if (min != null && this.compareValues(value, min) < 0) {
            return min;
        }
        if (max != null && this.compareValues(value, max) > 0) {
            return max;
        }
        return value;
    }

    private commitValue(value: TValue | null): void {
        this.setOwnValue(value);
        this.rawInputValue.set(
            this.focused() && !this.readonly() ? this.formatEditValue(value) : this.formatValueForDisplay(value)
        );
    }

    private correctValue(): void {
        const value = this.value();
        if (value == null) {
            if (this.nullable()) {
                if (this.rawInputValue() !== "") {
                    this.rawInputValue.set("");
                }
                return;
            }
            this.commitValue(this.clampValue(this.minValue() ?? this.zeroValue));
            return;
        }
        const clamped = this.clampValue(value);
        if (this.compareValues(clamped, value) !== 0) {
            this.commitValue(clamped);
        }
    }

    private formatEditValue(value: TValue | null): string {
        if (value == null) {
            return "";
        }
        return formatNumber(value, this.#i18n.localeId(), {
            maximumFractionDigits: this.editFractionDigits,
            useGrouping: false
        });
    }

    private formatValueForDisplay(value: TValue | null): string {
        if (value == null) {
            return "";
        }
        const formatter = this.formatter();
        if (formatter) {
            return formatter(value);
        }
        const decimals = this.decimals();
        return formatNumber(value, this.#i18n.localeId(), {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
            useGrouping: false
        });
    }

    /**
     * The numpad decimal key types "." or "," depending on the keyboard layout, not the locale. Insert the
     * locale's decimal separator instead, so a de-DE layout used with an en-US locale still types a decimal.
     */
    private insertLocaleDecimal(event: KeyboardEvent): void {
        const localeId = this.#i18n.localeId();
        const decimal = getNumberSymbols(localeId).decimal;
        if (event.key.length !== 1 || event.key === decimal || event.ctrlKey || event.altKey || event.metaKey) {
            return;
        }
        event.preventDefault();
        const inputElement = this.valueTextBoxRef().nativeElement;
        const { value, selectionStart, selectionEnd } = inputElement;
        const start = selectionStart ?? value.length;
        const end = selectionEnd ?? value.length;
        const proposedValue = value.slice(0, start) + decimal + value.slice(end);
        if (!this.readEditText(proposedValue, localeId, this.decimals()).valid) {
            return;
        }
        inputElement.setRangeText(decimal, start, end, "end");
        inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    }

    private parseValue(value: string | null | undefined): TValue | null {
        const raw = value == null ? "" : value;
        this.rawInputValue.set(raw);

        const isPaste = this.#pendingPaste;
        this.#pendingPaste = false;

        if (isPaste) {
            const validation = this.readLocaleText(raw, this.#i18n.localeId(), this.decimals());
            return validation.valid && validation.value !== null ? validation.value : this.value();
        }

        if (raw === "") {
            return null;
        }

        if (raw.trim() !== raw) {
            return this.value();
        }

        const edit = this.readEditText(raw, this.#i18n.localeId(), this.decimals());

        if (edit.valid) {
            return edit.value === null ? this.value() : edit.value;
        }

        const localeValidation = this.readLocaleText(raw, this.#i18n.localeId(), this.decimals());
        if (localeValidation.valid && localeValidation.value !== null) {
            return localeValidation.value;
        }

        return this.value();
    }

    private setBeforeInputSubscription(): void {
        this.beforeInput$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((event: InputEvent): void => {
            const inputElement = event.target as HTMLInputElement;

            const isPaste =
                event.inputType === "insertFromPaste" || (this.#pendingPaste && event.inputType !== "insertText");
            if (!isPaste) {
                this.#pendingPaste = false;
            }

            const insertedText =
                event.data ?? (event as unknown as { dataTransfer?: DataTransfer }).dataTransfer?.getData("text/plain");

            if (insertedText == null) {
                return;
            }

            const { value, selectionStart, selectionEnd } = inputElement;
            if (selectionStart == null || selectionEnd == null) {
                return;
            }

            const proposedValue = value.slice(0, selectionStart) + insertedText + value.slice(selectionEnd);
            const localeId = this.#i18n.localeId();
            const decimals = this.decimals();

            if (isPaste) {
                const validation = this.readLocaleText(proposedValue, localeId, decimals);
                if (!validation.valid || validation.value === null) {
                    event.preventDefault();
                    this.#pendingPaste = false;
                } else {
                    this.#pendingPaste = true;
                }
                return;
            }

            this.#pendingPaste = false;

            if (!this.readEditText(proposedValue, localeId, decimals).valid) {
                event.preventDefault();
            }
        });
    }

    private setKeydownSubscription(): void {
        this.keydown$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                // Keys pressed while an IME is composing belong to the IME (Safari reports them as keyCode 229).
                filter(event => !event.isComposing && event.keyCode !== 229),
                filter(() => !this.readonly() && !this.effectiveDisabled())
            )
            .subscribe((event: KeyboardEvent) => {
                switch (event.key) {
                    case "ArrowUp":
                        event.preventDefault();
                        this.increase();
                        return;
                    case "ArrowDown":
                        event.preventDefault();
                        this.decrease();
                        return;
                    case "PageUp":
                        event.preventDefault();
                        this.spinValue("+", PAGE_STEP_COUNT);
                        return;
                    case "PageDown":
                        event.preventDefault();
                        this.spinValue("-", PAGE_STEP_COUNT);
                        return;
                    case "Home":
                        // Without a minimum, Home keeps moving the caret.
                        this.spinToBound(event, this.minValue());
                        return;
                    case "End":
                        this.spinToBound(event, this.maxValue());
                        return;
                }

                if (event.code === "NumpadDecimal") {
                    this.insertLocaleDecimal(event);
                }
            });
    }

    private setOwnValue(value: TValue | null): void {
        this.#ownValue = value;
        this.value.set(value);
    }

    private setSpinSubscription(): void {
        this.spin$
            .pipe(
                filter(() => !this.readonly() && !this.effectiveDisabled()),
                switchMap(sign =>
                    of(sign).pipe(
                        tap(sign => (sign === "-" ? this.decrease() : this.increase())),
                        delay(300),
                        concatMap(() =>
                            timer(0, 30).pipe(
                                tap(() => (sign === "-" ? this.decrease() : this.increase())),
                                takeUntil(this.spinStop$)
                            )
                        ),
                        takeUntil(this.spinStop$)
                    )
                ),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe();
    }

    private setSubscriptions(): void {
        this.setValueChangeSubscription();
        this.setKeydownSubscription();
        this.setSpinSubscription();
        this.setWheelSubscription();
        this.setBeforeInputSubscription();
    }

    private setValueChangeSubscription(): void {
        this.valueChange$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                map(v => this.parseValue(v))
            )
            .subscribe(value => this.setOwnValue(value));
    }

    private setWheelSubscription(): void {
        this.wheel$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                // The wheel spins only the field being edited: scrolling the page over an unfocused field, a
                // horizontal scroll and Ctrl+wheel (zoom) are left to the browser.
                filter(event => this.focused() && event.deltaY !== 0 && !event.ctrlKey),
                filter(() => !this.readonly() && !this.effectiveDisabled())
            )
            .subscribe((event: WheelEvent) => {
                event.preventDefault();
                this.spinValue(event.deltaY < 0 ? "+" : "-");
            });
    }

    private spinToBound(event: KeyboardEvent, bound: TValue | null): void {
        if (bound == null) {
            return;
        }
        event.preventDefault();
        this.commitValue(bound);
    }

    private spinValue(direction: NumericTextBoxStepDirection, steps = 1): void {
        const value = this.value();
        if (value == null) {
            this.commitValue(this.clampValue(this.zeroValue));
            return;
        }
        let result = value;
        for (let index = 0; index < steps; index++) {
            result = this.stepValue(result, direction);
        }
        // A value outside the bounds (set from outside) comes back inside them in the direction of the step.
        this.commitValue(this.clampValue(result));
    }

    /** Negative when `a < b`, zero when equal, positive when `a > b`. */
    protected abstract compareValues(a: TValue, b: TValue): number;

    /** Reads text as it is being typed (edit mode). */
    protected abstract readEditText(text: string, localeId: string, decimals: number): NumericTextBoxTextResult<TValue>;

    /** Reads pasted or complete text with the locale's canonical rules. */
    protected abstract readLocaleText(
        text: string,
        localeId: string,
        decimals: number
    ): NumericTextBoxTextResult<TValue>;

    /** The value one step up or down from `value`. */
    protected abstract stepValue(value: TValue, direction: NumericTextBoxStepDirection): TValue;
}
