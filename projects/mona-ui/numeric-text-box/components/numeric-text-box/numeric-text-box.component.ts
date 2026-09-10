import { FocusMonitor, FocusOrigin } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    contentChildren,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    model,
    output,
    Signal,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import type { FormValueControl } from "@angular/forms/signals";
import { LucideChevronDown, LucideChevronUp } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { Action, rxTimeout } from "@nanahoshi/mona-ui/internal";
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
import {
    formatNumber,
    getNumberSymbols,
    type LocalizedNumberParseMode,
    MonaI18nService,
    normalizeLocalizedDigits,
    normalizeLocalizedInput,
    parseLocalizedNumber,
    validateLocalizedNumber
} from "@nanahoshi/mona-ui/i18n";
import { TextBoxDirective } from "@nanahoshi/mona-ui/text-box";
import { NumericTextBoxPrefixTemplateDirective } from "../../directives/numeric-text-box-prefix-template.directive";
import { NUMERIC_TEXT_BOX_DEFAULT_MESSAGES } from "../../i18n/numeric-text-box.default-messages";
import {
    numericTextboxButtonThemeVariants,
    numericTextboxInputThemeVariants,
    numericTextboxThemeVariants,
    NumericTextboxVariantInputs,
    NumericTextboxVariantProps
} from "../../styles/numeric-textbox.styles";

type Sign = "-" | "+";

@Component({
    selector: "mona-numeric-text-box",
    templateUrl: "./numeric-text-box.component.html",
    imports: [NgTemplateOutlet, TextBoxDirective, FormsModule, ButtonDirective, LucideChevronUp, LucideChevronDown],
    host: {
        "[class]": "classes()",
        "[attr.data-disabled]": "disabled() || null",
        "[attr.data-invalid]": "invalidInput() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[attr.data-required]": "required() || null"
    }
})
export class NumericTextBoxComponent implements NumericTextboxVariantInputs, FormValueControl<number | null> {
    readonly #destroyRef = inject(DestroyRef);
    readonly #focusMonitor = inject(FocusMonitor);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #i18n = inject(MonaI18nService);
    #lastInputSource: "typing" | "paste" = "typing";

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
    protected readonly messages = this.#i18n.componentMessages(
        "numericTextBox",
        NUMERIC_TEXT_BOX_DEFAULT_MESSAGES
    );
    protected readonly prefixTemplateList = contentChildren(NumericTextBoxPrefixTemplateDirective, {
        read: TemplateRef
    });
    protected readonly rawInputValue = signal("");
    protected readonly spin$ = new Subject<Sign>();
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
     * @description Number of decimals to show.
     * @default 0
     */
    public readonly decimals = input(0, {
        transform: (value: number) => {
            const num = Math.trunc(value);
            return Number.isNaN(num) || num < 0 ? 0 : num;
        }
    });

    /**
     * @description Sets whether the input is disabled.
     */
    public readonly disabled = input(false);

    /**
     * @description Formats the value to be displayed in the input when the input is not focused.
     */
    public readonly formatter = input<Action<number | null, string> | null>(null);

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
     * @description Marks the numeric text box as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false);

    /**
     * @description Maximum value that can be entered.
     */
    public readonly maxValue = input<number | null>(null);

    /**
     * @description Minimum value that can be entered.
     */
    public readonly minValue = input<number | null>(null);

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
     * @description Step value to increment or decrement the value.
     */
    public readonly step = input(1);

    /**
     * @description Tab index of the input.
     */
    public readonly tabindex = input(0);

    /**
     * @description Emitted when the numeric text box is interacted with on blur, value change, or spinner update.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output();

    /**
     * @description Sets the touched state of the numeric text box. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Two-way bindable current value of the numeric text box.
     * @default null
     */
    public readonly value = model<number | null>(null);

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

    private static calculate(value: number, step: number, type: Sign): number {
        const precision = Math.max(
            NumericTextBoxComponent.getPrecision(value),
            NumericTextBoxComponent.getPrecision(step)
        );
        const factor = Math.pow(10, precision);
        const signFactor = type === "+" ? 1 : -1;
        const newValue = (value * factor + signFactor * step * factor) / factor;
        return precision > 0 ? parseFloat(newValue.toFixed(precision)) : newValue;
    }

    private static getPrecision(value: number): number {
        const valueString = value.toString();
        if (valueString.includes(".")) {
            const parts = valueString.split(".");
            return parts[1].length;
        }
        return 0;
    }

    private static isNumeric(value: unknown): boolean {
        if (value === "" || value === "-") {
            return true;
        }
        return (
            (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) && !isNaN(value as number)
        );
    }

    public decrease(): void {
        const value = this.value();
        if (value == null) {
            const min = this.minValue();
            const max = this.maxValue();
            let initial = 0;
            if (min != null && initial < min) {
                initial = min;
            }
            if (max != null && initial > max) {
                initial = max;
            }
            this.commitNumericValue(initial);
        } else {
            let result = NumericTextBoxComponent.calculate(value, this.step(), "-");
            const min = this.minValue();
            if (min != null && result < min) {
                result = min;
            }
            this.commitNumericValue(result);
        }
        this.focus();
    }

    public focus(): void {
        this.#focusMonitor.focusVia(this.valueTextBoxRef(), "keyboard");
        rxTimeout(this.#destroyRef, () => {
            this.valueTextBoxRef().nativeElement.scrollLeft = this.valueTextBoxRef().nativeElement.scrollWidth;
        });
    }

    public increase(): void {
        const value = this.value();
        if (value == null) {
            const min = this.minValue();
            const max = this.maxValue();
            let initial = 0;
            if (min != null && initial < min) {
                initial = min;
            }
            if (max != null && initial > max) {
                initial = max;
            }
            this.commitNumericValue(initial);
        } else {
            let result = NumericTextBoxComponent.calculate(value, this.step(), "+");
            const max = this.maxValue();
            if (max != null && result > max) {
                result = max;
            }
            this.commitNumericValue(result);
        }
        this.focus();
    }

    public onBlur(event: FocusEvent): void {
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

    private commitNumericValue(value: number | null): void {
        this.value.set(value);
        this.rawInputValue.set(
            this.focused() && !this.readonly()
                ? this.formatEditValue(value)
                : this.formatValueForDisplay(value)
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
                this.commitNumericValue(min);
                return true;
            } else {
                this.commitNumericValue(0);
                return true;
            }
        }
        if (min != null && value < min) {
            this.commitNumericValue(min);
            return true;
        }
        if (max != null && value > max) {
            this.commitNumericValue(max);
            return true;
        }
        return false;
    }

    private formatEditValue(value: number | null): string {
        if (value == null) {
            return "";
        }
        return formatNumber(value, this.#i18n.localeId(), {
            maximumFractionDigits: 20,
            useGrouping: false
        });
    }

    private formatValueForDisplay(value: number | null): string {
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

    protected onPaste(event: ClipboardEvent): void {
        this.#lastInputSource = "paste";
        const pastedText = event.clipboardData?.getData("text/plain");
        if (pastedText != null) {
            const inputElement = this.valueTextBoxRef()?.nativeElement;
            if (inputElement) {
                const { value, selectionStart, selectionEnd } = inputElement;
                const start = selectionStart ?? value.length;
                const end = selectionEnd ?? value.length;
                const proposedValue = value.slice(0, start) + pastedText + value.slice(end);
                const validation = validateLocalizedNumber(proposedValue, this.#i18n.localeId(), {
                    mode: "locale",
                    decimals: this.decimals()
                });
                if (!validation.valid || validation.value === null) {
                    event.preventDefault();
                }
            }
        }
    }

    private parseValue(value: string | null | undefined): number | null {
        const normalizedValue = value == null ? "" : value;
        this.rawInputValue.set(normalizedValue);
        if (normalizedValue === "" || normalizedValue === "-") {
            return null;
        }

        const isPaste = this.#lastInputSource === "paste";
        this.#lastInputSource = "typing";

        const mode: LocalizedNumberParseMode = isPaste ? "locale" : "edit";
        const validation = validateLocalizedNumber(normalizedValue, this.#i18n.localeId(), {
            mode,
            decimals: this.decimals()
        });

        if (!validation.valid || validation.value === null) {
            return this.value();
        }

        return validation.value;
    }

    private setBeforeInputSubscription(): void {
        this.beforeInput$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((event: InputEvent): void => {
            const inputElement = event.target as HTMLInputElement;

            const insertedText =
                event.data ??
                (event as unknown as { dataTransfer?: DataTransfer }).dataTransfer?.getData("text/plain");

            const isPaste = event.inputType === "insertFromPaste" || this.#lastInputSource === "paste";
            if (isPaste) {
                this.#lastInputSource = "paste";
            }

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
                const validation = validateLocalizedNumber(proposedValue, localeId, {
                    mode: "locale",
                    decimals
                });
                if (!validation.valid || validation.value === null) {
                    event.preventDefault();
                }
                return;
            }

            this.#lastInputSource = "typing";

            const symbols = getNumberSymbols(localeId);

            // Normalize minus, bidi controls, and digits
            const normalized = normalizeLocalizedInput(proposedValue, localeId);

            if (normalized.lastIndexOf("-") > 0) {
                event.preventDefault();
                return;
            }
            if ((normalized.match(/-/g) || []).length > 1) {
                event.preventDefault();
                return;
            }

            const decimalSep = symbols.decimal;
            const sepChars = decimalSep === "." ? ["\\."] : ["\\.", `\\${decimalSep}`];
            const sepRegex = new RegExp(`[${sepChars.join("")}]`, "g");
            const sepCount = (proposedValue.match(sepRegex) || []).length;
            if (sepCount > 1) {
                event.preventDefault();
                return;
            }

            if (decimals === 0 && sepCount > 0) {
                event.preventDefault();
                return;
            }

            if (sepCount === 1) {
                const sepChar = proposedValue.includes(decimalSep) ? decimalSep : ".";
                const decimalPart = proposedValue.split(sepChar)[1];
                if (decimalPart && decimalPart.length > decimals) {
                    event.preventDefault();
                    return;
                }
            }

            let normalizedForRegex = normalized;
            if (decimalSep !== "." && normalizedForRegex.includes(decimalSep)) {
                normalizedForRegex = normalizedForRegex.replaceAll(decimalSep, ".");
            }
            const numericRegex = new RegExp(`^-?\\d*(\\.\\d{0,${decimals}})?$`);
            if (!numericRegex.test(normalizedForRegex)) {
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
}
