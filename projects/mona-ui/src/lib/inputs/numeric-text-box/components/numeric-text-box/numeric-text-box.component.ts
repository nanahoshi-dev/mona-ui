import { FocusMonitor, FocusOrigin } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChildren,
    DestroyRef,
    ElementRef,
    forwardRef,
    inject,
    input,
    OnDestroy,
    OnInit,
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
import { ButtonDirective } from "../../../../buttons/button/button.directive";
import { Action } from "../../../../utils/Action";
import {
    numericTextBoxInputVariants,
    numericTextBoxSpinButtonVariants,
    NumericTextBoxVariantInput,
    NumericTextBoxVariantProps,
    numericTextboxVariants
} from "../../../styles/numeric-textbox.style";
import { TextBoxDirective } from "../../../text-box/directives/text-box.directive";
import { NumericTextBoxPrefixTemplateDirective } from "../../directives/numeric-text-box-prefix-template.directive";

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
        "[attr.data-disabled]": "disabled()",
        "[attr.data-readonly]": "readonly()",
        "[class]": "classes()"
    }
})
export class NumericTextBoxComponent implements OnInit, OnDestroy, ControlValueAccessor, NumericTextBoxVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #focusMonitor = inject(FocusMonitor);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    #propagateChange: Action<number | null> | null = null;

    protected readonly beforeInput$ = new Subject<InputEvent>();
    protected readonly classes = computed(() => {
        const size = this.size();
        const classes = numericTextboxVariants({ size });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly decreaseIcon = ChevronDown;
    protected readonly increaseIcon = ChevronUp;
    protected readonly inputClasses = computed(() => {
        const inputVariants = numericTextBoxInputVariants();
        return twMerge(inputVariants);
    });
    protected readonly focused = signal(false);
    protected readonly formattedValue = computed(() => {
        const value = this.value();
        const focused = this.focused();
        const decimals = this.decimals();
        const formatter = this.formatter();
        if (value == null) {
            return "";
        }
        if (focused && !this.readonly()) {
            return value?.toString() ?? "";
        }
        if (formatter) {
            return formatter(value);
        }
        if (decimals > 0) {
            return value?.toFixed(decimals) ?? "";
        }
        return value?.toString() ?? "";
    });
    protected readonly keydown$ = new Subject<KeyboardEvent>();
    protected readonly spinBottomClasses = computed(() => numericTextBoxSpinButtonVariants({ position: "bottom" }));
    protected readonly spinTopClasses = computed(() => numericTextBoxSpinButtonVariants({ position: "top" }));
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
     * Number of decimals to show.
     * @default 0
     */
    public readonly decimals = input(0);

    /**
     * Sets whether the input is disabled.
     */
    public readonly disabled = input(false);

    /**
     * Formats the value to be displayed in the input when the input is not focused.
     */
    public readonly formatter = input<Action<number | null, string> | null>(null);

    /**
     * Emits when the inner input element is blurred.
     */
    public readonly inputBlur = output<Event>();

    /**
     * Emits when the inner input element is focused.
     */
    public readonly inputFocus = output<Event>();

    /**
     * Emits when the inner input element loses focus.
     */
    public readonly inputFocusOut = output<Event>();

    /**
     * Maximum value that can be entered.
     */
    public readonly max = input<number | undefined>(undefined);

    /**
     * Minimum value that can be entered.
     */
    public readonly min = input<number | undefined>(undefined);

    /**
     * Sets whether the input can be empty.
     */
    public readonly nullable = input(true);

    /**
     * Sets whether the input is readonly.
     */
    public readonly readonly = input(false);

    /**
     * Sets whether the input is required.
     */
    public readonly required = input(false);

    /**
     * Sets the size of the input.
     */
    public readonly size = input<NumericTextBoxVariantProps["size"]>(`default`);

    /**
     * Sets whether the spin buttons are visible.
     */
    public readonly spinners = input(true);

    /**
     * Step value to increment or decrement the value.
     */
    public readonly step = input(1);

    /**
     * Tab index of the input.
     */
    public readonly tabindex = input(0);
    public readonly userClass = input<string>("", { alias: "class" });

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

    public ngOnDestroy(): void {
        this.#focusMonitor.stopMonitoring(this.#hostElementRef.nativeElement);
    }

    public ngOnInit(): void {
        this.setSubscriptions();
        this.#focusMonitor
            .monitor(this.#hostElementRef, true)
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe((focusOrigin: FocusOrigin) => {
                this.focused.set(focusOrigin !== null);
            });
    }

    public onBlur(event: Event): void {
        this.correctValue();
        this.inputBlur.emit(event);
    }

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {}

    public writeValue(obj: number | null | undefined) {
        if (obj == null) {
            this.value.set(null);
            return;
        }
        this.value.set(Number(obj));
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

    private focus(): void {
        this.#focusMonitor.focusVia(this.valueTextBoxRef(), "keyboard");
    }

    private setBeforeInputSubscription(): void {
        this.beforeInput$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((event: InputEvent): void => {
            const inputElement = event.target as HTMLInputElement;

            const insertedText = event.data;
            if (insertedText == null || insertedText === "") {
                return;
            }
            if (!RegExp(/[0-9.-]/).exec(insertedText)) {
                event.preventDefault();
                return;
            }

            const value = inputElement.value;
            const selectionStart = inputElement.selectionStart;
            const selectionEnd = inputElement.selectionEnd;
            if (selectionStart == null || selectionEnd == null) {
                event.preventDefault();
                return;
            }

            if (insertedText === "-") {
                if ((selectionStart !== 0 || value.includes("-")) && selectionEnd - selectionStart !== value.length) {
                    event.preventDefault();
                    return;
                }
            }

            if (insertedText === ".") {
                if (this.decimals() === 0 || value.includes(".")) {
                    event.preventDefault();
                    return;
                }
            }

            const newValue = value.slice(0, selectionStart) + insertedText + value.slice(selectionEnd);
            if (
                selectionEnd - selectionStart === value.length &&
                newValue !== "-" &&
                !NumericTextBoxComponent.isNumeric(newValue)
            ) {
                event.preventDefault();
                return;
            }

            if (newValue.includes(".")) {
                const decimals = newValue.split(".")[1];
                if (decimals.length > String(this.decimals).length) {
                    event.preventDefault();
                    return;
                }
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
                filter(v => v == null || v === "" || NumericTextBoxComponent.isNumeric(v)),
                map(v => {
                    if (v == null || v === "") {
                        return null;
                    }
                    return parseFloat(v.toString());
                })
            )
            .subscribe(value => {
                const previousValue = this.value();
                if (value == null) {
                    this.value.set(null);
                } else {
                    this.value.set(value);
                }
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
