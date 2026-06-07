import { FocusMonitor, FocusOrigin } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChildren,
    DestroyRef,
    ElementRef,
    forwardRef,
    inject,
    input,
    output,
    Signal,
    signal,
    TemplateRef,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { ChevronDown, ChevronUp, LucideAngularModule } from "lucide-angular";
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
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { rxTimeout } from "../../../../common/utils/rxTimeout";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { TextBoxDirective } from "../../../text-box/directives/text-box.directive";
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
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => NumericTextBoxComponent),
            multi: true
        }
    ],
    imports: [NgTemplateOutlet, TextBoxDirective, FormsModule, ButtonDirective, LucideAngularModule],
    host: {
        "[class]": "classes()",
        "[attr.role]": "'spinbutton'",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-readonly]": "readonly()",
        "[attr.aria-disabled]": "disabled()",
        "[attr.aria-readonly]": "readonly()",
        "[attr.aria-required]": "required()"
    }
})
export class NumericTextBoxComponent implements ControlValueAccessor, NumericTextboxVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #focusMonitor = inject(FocusMonitor);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #themeService = inject(ThemeService);
    #propagateChange: Action<number | null> | null = null;
    #propagateTouched: Action | null = null;

    protected readonly beforeInput$ = new Subject<InputEvent>();
    protected readonly classes = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const classes = numericTextboxThemeVariants(theme)({ rounded, size });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly decreaseIcon = ChevronDown;
    protected readonly increaseIcon = ChevronUp;
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
        const value = this.value();
        const focused = this.focused();
        if (focused && !this.readonly()) {
            return this.rawInputValue();
        }
        return this.formatValueForDisplay(value);
    });
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
    protected readonly value = signal<number | null>(null);
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
    public readonly max = input<number | null>(null);

    /**
     * @description Minimum value that can be entered.
     */
    public readonly min = input<number | null>(null);

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
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        afterNextRender({
            read: () => {
                this.setSubscriptions();
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
            this.valueChange$.next("0");
        } else {
            let result = NumericTextBoxComponent.calculate(value, this.step(), "-");
            const min = this.min();
            if (min != null && result < min) {
                result = min;
            }
            this.valueChange$.next(result.toString());
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
            this.valueChange$.next("0");
        } else {
            let result = NumericTextBoxComponent.calculate(value, this.step(), "+");
            const max = this.max();
            if (max != null && result > max) {
                result = max;
            }
            this.valueChange$.next(result.toString());
        }
        this.focus();
    }

    public onBlur(event: FocusEvent): void {
        const relatedTarget = event.relatedTarget as Node | null;
        if (relatedTarget && this.#hostElementRef.nativeElement.contains(relatedTarget)) {
            return;
        }
        this.#propagateTouched?.();
        this.correctValue();
        this.rawInputValue.set(this.formatValueForDisplay(this.value()));
        this.inputBlur.emit(event);
    }

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {
        this.#propagateTouched = fn;
    }

    public writeValue(obj: number | null | undefined) {
        const value = obj == null ? null : Number(obj);
        this.value.set(value);
        this.rawInputValue.set(this.formatValueForDisplay(value));
    }

    private correctValue(): void {
        const value = this.value();
        const min = this.min();
        const max = this.max();

        if (value == null) {
            if (this.nullable()) {
                this.valueChange$.next("");
            } else if (min != null) {
                this.valueChange$.next(min.toString());
            } else {
                this.valueChange$.next("0");
            }
            return;
        }
        if (min != null && value < min) {
            this.valueChange$.next(min.toString());
        }
        if (max != null && value > max) {
            this.valueChange$.next(max.toString());
        }
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
                filter(() => !this.readonly())
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
                filter(() => !this.readonly()),
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
                tap(text => this.rawInputValue.set(text)),
                map(v => (v === "" || v === "-" ? v : v.toString().replace(/,/g, ""))),
                filter(v => v === "" || v === "-" || v == null || NumericTextBoxComponent.isNumeric(v)),
                map(v => {
                    if (v == null || v === "" || v === "-") {
                        return null;
                    }
                    return parseFloat(v.toString());
                })
            )
            .subscribe(value => {
                const previousValue = this.value();
                this.value.set(value);

                if (previousValue !== this.value()) {
                    this.#propagateChange?.(this.value());
                }
            });
    }

    private setWheelSubscription(): void {
        this.wheel$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(() => !this.readonly())
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
