import { FocusMonitor, FocusOrigin } from "@angular/cdk/a11y";
import {
    afterNextRender,
    computed,
    contentChildren,
    DestroyRef,
    Directive,
    effect,
    ElementRef,
    inject,
    input,
    ModelSignal,
    output,
    Signal,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Action, rxTimeout } from "@nanahoshi/mona-ui/internal";
import { formatNumber, getNumberSymbols, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import {
    concatMap,
    delay,
    distinctUntilChanged,
    filter,
    map,
    of,
    Subject,
    switchMap,
    takeUntil,
    tap,
    timer
} from "rxjs";
import { twMerge } from "tailwind-merge";
import { NumericTextBoxPrefixTemplateDirective } from "../../directives/numeric-text-box-prefix-template.directive";
import { NUMERIC_TEXT_BOX_DEFAULT_MESSAGES } from "../../i18n/numeric-text-box.default-messages";
import {
    numericTextboxButtonThemeVariants,
    numericTextboxInputThemeVariants,
    numericTextboxThemeVariants,
    NumericTextboxVariantInputs,
    NumericTextboxVariantProps
} from "../../styles/numeric-textbox.styles";

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
        "[class]": "classes()",
        "[attr.data-disabled]": "disabled() || null",
        "[attr.data-invalid]": "invalidInput() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[attr.data-required]": "required() || null"
    }
})
export abstract class NumericTextBoxBaseComponent<
    TValue extends number | string
> implements NumericTextboxVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #focusMonitor = inject(FocusMonitor);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #i18n = inject(MonaI18nService);
    #pendingPaste = false;

    protected readonly beforeInput$ = new Subject<InputEvent>();
    protected readonly classes = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        const classes = numericTextboxThemeVariants({ rounded, size });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
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
        const endRounded = this.spinners() ? "none" : this.rounded();
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
     * @description ARIA label for the input.
     */
    public readonly ariaLabel = input<string | null>(null, { alias: "aria-label" });

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
    public readonly disabled = input(false);

    /**
     * @description Emits when the inner input element is blurred.
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
     * @description Marks the text box as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false);

    /**
     * @description Sets whether the input can be empty.
     */
    public readonly nullable = input(true);

    /**
     * @description Sets whether the input is readonly.
     */
    public readonly readonly = input(false);

    /**
     * @description Sets whether the input is required.
     */
    public readonly required = input(false);

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
    public readonly spinners = input(true);

    /**
     * @description Tab index of the input.
     */
    public readonly tabindex = input(0);

    /**
     * @description Emitted when the text box is interacted with on blur, value change, or spinner update.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output();

    /**
     * @description Sets the touched state of the text box. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false);

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

    public decrease(): void {
        this.spinValue("-");
    }

    public focus(): void {
        this.#focusMonitor.focusVia(this.valueTextBoxRef(), "keyboard");
        rxTimeout(this.#destroyRef, () => {
            this.valueTextBoxRef().nativeElement.scrollLeft = this.valueTextBoxRef().nativeElement.scrollWidth;
        });
    }

    public increase(): void {
        this.spinValue("+");
    }

    public onBlur(event: FocusEvent): void {
        this.#pendingPaste = false;
        const relatedTarget = event.relatedTarget as Node | null;
        if (relatedTarget && this.#hostElementRef.nativeElement.contains(relatedTarget)) {
            return;
        }
        const corrected = this.correctValue();
        if (!corrected) {
            this.touch.emit();
        }
        this.rawInputValue.set(this.formatValueForDisplay(this.value()));
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

    private commitValue(value: TValue | null): void {
        this.value.set(value);
        this.rawInputValue.set(
            this.focused() && !this.readonly() ? this.formatEditValue(value) : this.formatValueForDisplay(value)
        );
        this.touch.emit();
    }

    private correctValue(): boolean {
        const value = this.value();
        const min = this.minValue();
        const max = this.maxValue();

        if (value == null) {
            if (this.nullable()) {
                if (this.rawInputValue() !== "") {
                    this.rawInputValue.set("");
                }
                return false;
            } else if (min != null) {
                this.commitValue(min);
                return true;
            } else {
                this.commitValue(this.zeroValue);
                return true;
            }
        }
        if (min != null && this.compareValues(value, min) < 0) {
            this.commitValue(min);
            return true;
        }
        if (max != null && this.compareValues(value, max) > 0) {
            this.commitValue(max);
            return true;
        }
        return false;
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

    private setInputFocusSubscription(): void {
        this.inputFocus.subscribe(() => this.#hostElementRef.nativeElement.focus());
    }

    private setKeydownSubscription(): void {
        this.keydown$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(() => !this.readonly() && !this.disabled())
            )
            .subscribe((event: KeyboardEvent) => {
                if (event.key === "ArrowUp") {
                    event.preventDefault();
                    this.increase();
                    return;
                }

                if (event.key === "ArrowDown") {
                    event.preventDefault();
                    this.decrease();
                    return;
                }

                if (event.code === "NumpadDecimal") {
                    this.insertLocaleDecimal(event);
                }
            });
    }

    private setSpinSubscription(): void {
        this.spin$
            .pipe(
                filter(() => !this.readonly() && !this.disabled()),
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
        this.setInputFocusSubscription();
        this.setBeforeInputSubscription();
    }

    private setValueChangeSubscription(): void {
        this.valueChange$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                distinctUntilChanged(),
                map(v => this.parseValue(v))
            )
            .subscribe(value => {
                this.value.set(value);
                this.touch.emit();
            });
    }

    private setWheelSubscription(): void {
        this.wheel$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(() => !this.readonly() && !this.disabled())
            )
            .subscribe((event: WheelEvent) => {
                event.preventDefault();
                if (event.deltaY < 0) {
                    this.increase();
                } else {
                    this.decrease();
                }
            });
    }

    private spinValue(direction: NumericTextBoxStepDirection): void {
        const value = this.value();
        const min = this.minValue();
        const max = this.maxValue();
        if (value == null) {
            let initial = this.zeroValue;
            if (min != null && this.compareValues(initial, min) < 0) {
                initial = min;
            }
            if (max != null && this.compareValues(initial, max) > 0) {
                initial = max;
            }
            this.commitValue(initial);
        } else {
            let result = this.stepValue(value, direction);
            if (direction === "-" && min != null && this.compareValues(result, min) < 0) {
                result = min;
            }
            if (direction === "+" && max != null && this.compareValues(result, max) > 0) {
                result = max;
            }
            this.commitValue(result);
        }
        this.focus();
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
