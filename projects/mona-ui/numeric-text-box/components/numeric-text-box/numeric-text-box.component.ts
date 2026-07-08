import { FocusMonitor, FocusOrigin } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    contentChildren,
    DestroyRef,
    ElementRef,
    inject,
    input,
    model,
    output,
    Signal,
    signal,
    TemplateRef,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import type { FormValueControl } from "@angular/forms/signals";
import { LucideChevronDown, LucideChevronUp } from "@lucide/angular";
import { ButtonDirective } from "@mirei/mona-ui/button";
import { Action, rxTimeout } from "@mirei/mona-ui/common";
import { ThemeService } from "@mirei/mona-ui/theme";
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
import { TextBoxDirective } from "@mirei/mona-ui/text-box";
import { NumericTextBoxPrefixTemplateDirective } from "../../directives/numeric-text-box-prefix-template.directive";
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
    readonly #themeService = inject(ThemeService);

    protected readonly beforeInput$ = new Subject<InputEvent>();
    protected readonly classes = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const classes = numericTextboxThemeVariants(theme)({ rounded, size });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly inputClasses = computed(() => {
        const theme = this.#themeService.theme();
        const hasPrefixTemplate = this.prefixTemplateList().length > 0;
        const leftRounded = hasPrefixTemplate ? "none" : this.rounded();
        const rightRounded = this.spinners() ? "none" : this.rounded();
        const inputVariants = numericTextboxInputThemeVariants(theme)({ leftRounded, rightRounded });
        return twMerge(inputVariants);
    });
    protected readonly focused = signal(false);
    protected readonly formattedValue = computed(() => {
        if (this.focused() && !this.readonly()) {
            return this.rawInputValue();
        }
        return this.formatValueForDisplay(this.value());
    });
    protected readonly invalidInput = computed(
        () => this.invalid() || (this.required() && this.value() == null && this.touched())
    );
    protected readonly keydown$ = new Subject<KeyboardEvent>();
    protected readonly rawInputValue = signal("");
    protected readonly spinButtonClasses = computed(() => {
        const theme = this.#themeService.theme();
        const size = this.size();
        return numericTextboxButtonThemeVariants(theme)({ size });
    });
    protected readonly spinButtonIconSize = computed(() => {
        const size = this.size();
        return size === "large" ? 20 : size === "medium" ? 16 : 14;
    });
    protected readonly spin$ = new Subject<Sign>();
    protected readonly spinStop$ = new Subject<void>();
    protected readonly prefixTemplateList = contentChildren(NumericTextBoxPrefixTemplateDirective, {
        read: TemplateRef
    });
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
    public readonly decimals = input(0);

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
     * @description Marks the numeric text box as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false);

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
                            const rawValue = currentValue?.toString() ?? "";
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
            this.applyRawValue("0");
        } else {
            let result = NumericTextBoxComponent.calculate(value, this.step(), "-");
            const min = this.minValue();
            if (min != null && result < min) {
                result = min;
            }
            this.applyRawValue(result.toString());
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
            this.applyRawValue("0");
        } else {
            let result = NumericTextBoxComponent.calculate(value, this.step(), "+");
            const max = this.maxValue();
            if (max != null && result > max) {
                result = max;
            }
            this.applyRawValue(result.toString());
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

    private correctValue(): boolean {
        const value = this.value();
        const min = this.minValue();
        const max = this.maxValue();

        if (value == null) {
            if (this.nullable()) {
                this.applyRawValue("");
            } else if (min != null) {
                this.applyRawValue(min.toString());
            } else {
                this.applyRawValue("0");
            }
            return true;
        }
        if (min != null && value < min) {
            this.applyRawValue(min.toString());
            return true;
        }
        if (max != null && value > max) {
            this.applyRawValue(max.toString());
            return true;
        }
        return false;
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
        if (decimals > 0) {
            return value.toFixed(decimals);
        }
        return value.toString();
    }

    protected applyRawValue(text: string): void {
        this.rawInputValue.set(text);
        this.valueChange$.next(text);
    }

    private setBeforeInputSubscription(): void {
        this.beforeInput$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((event: InputEvent): void => {
            const inputElement = event.target as HTMLInputElement;

            const insertedText = event.data;
            if (insertedText == null) {
                return;
            }

            const { value, selectionStart, selectionEnd } = inputElement;
            if (selectionStart == null || selectionEnd == null) {
                return;
            }

            const proposedValue = value.slice(0, selectionStart) + insertedText + value.slice(selectionEnd);
            if (proposedValue.lastIndexOf("-") > 0) {
                event.preventDefault();
                return;
            }

            if ((proposedValue.match(/\./g) || []).length > 1) {
                event.preventDefault();
                return;
            }

            if (this.decimals() === 0 && proposedValue.includes(".")) {
                event.preventDefault();
                return;
            }

            if (proposedValue.includes(".")) {
                const decimalPart = proposedValue.split(".")[1];
                if (decimalPart && decimalPart.length > this.decimals()) {
                    event.preventDefault();
                    return;
                }
            }

            const numericRegex = new RegExp(`^-?\\d*\\.?\\d{0,${this.decimals()}}$`);
            if (!numericRegex.test(proposedValue)) {
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

    private parseValue(value: string | null | undefined): number | null {
        const normalizedValue = value == null ? "" : value;
        this.rawInputValue.set(normalizedValue);
        if (normalizedValue === "" || normalizedValue === "-") {
            return null;
        }

        const sanitizedValue = normalizedValue.replace(/,/g, "");
        if (!NumericTextBoxComponent.isNumeric(sanitizedValue)) {
            return this.value();
        }

        return parseFloat(sanitizedValue);
    }
}
