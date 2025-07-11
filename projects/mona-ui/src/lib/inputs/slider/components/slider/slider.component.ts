import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    DestroyRef,
    ElementRef,
    forwardRef,
    inject,
    input,
    NgZone,
    Signal,
    signal,
    TemplateRef,
    viewChild,
    viewChildren
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { filter, fromEvent, switchMap, takeUntil, tap } from "rxjs";
import { Orientation } from "../../../../models/Orientation";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { SliderLabelPosition } from "../../../models/SliderLabelPosition";
import { SliderTick } from "../../../models/SliderTick";
import { SliderHandleTemplateDirective } from "../../directives/slider-handle-template.directive";
import { SliderTickValueTemplateDirective } from "../../directives/slider-tick-value-template.directive";
import { SliderTickDirective } from "../../directives/slider-tick.directive";
import { LabelStyleArgs } from "../../models/LabelStyleArgs";
import { TickStyleArgs } from "../../models/TickStyleArgs";
import { LabelStylePipe } from "../../pipes/label-style.pipe";
import { TickStylePipe } from "../../pipes/tick-style.pipe";
import {
    sliderBaseThemeVariants,
    sliderHandleThemeVariants,
    sliderSelectionThemeVariants,
    sliderTickLabelListThemeVariants,
    sliderTickLabelThemeVariants,
    sliderTickListThemeVariants,
    sliderTickThemeVariants,
    sliderTrackThemeVariants,
    SliderVariantInputs,
    SliderVariantProps
} from "../../styles/slider.styles";
import { valueToPosition } from "../../utils/valueToPosition";

@Component({
    selector: "mona-slider",
    templateUrl: "./slider.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SliderComponent),
            multi: true
        }
    ],
    imports: [NgTemplateOutlet, SliderTickDirective, LabelStylePipe, TickStylePipe],
    host: {
        "[class]": "baseClasses()",
        "[class.mona-slider]": "true",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-orientation]": "orientation()",
        "(focus)": "onFocus()"
    }
})
export class SliderComponent implements ControlValueAccessor, SliderVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef: ElementRef<HTMLDivElement> = inject(ElementRef);
    #propagateChange: Action<number | [number, number]> | null = null;
    #propagateTouched: Action | null = null;
    readonly #themeService = inject(ThemeService);
    readonly #zone: NgZone = inject(NgZone);
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        return sliderBaseThemeVariants(theme)();
    });
    protected readonly dragging = signal(false);
    protected readonly handleClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return sliderHandleThemeVariants(theme)({ rounded });
    });
    protected readonly handlePositions = signal<[number, number]>([0, 0]);
    protected readonly handleTemplate = contentChild(SliderHandleTemplateDirective, { read: TemplateRef });
    protected readonly handleTemplateStyles = computed<Partial<CSSStyleDeclaration>>(() => {
        const template = this.handleTemplate();
        if (!template) {
            return {};
        }
        return { background: "transparent", border: "none", boxShadow: "none" };
    });
    protected readonly handleValues = signal<[number, number]>([0, 0]);
    protected readonly handlesOverlap = computed(() => {
        if (!this.ranged()) {
            return false;
        }
        const values = this.handleValues();
        return values[0] === values[1];
    });
    protected readonly labelStyleArgs = computed<LabelStyleArgs>(() => {
        const labelPosition = this.labelPosition();
        const max = this.max();
        const min = this.min();
        const orientation = this.orientation();
        const tickCount = this.labelTicks().length;
        return { labelPosition, max, min, orientation, tickCount };
    });
    protected readonly labelTicks = computed(() => {
        const allTicks = this.ticks();
        if (allTicks.length === 0) {
            return [];
        }

        const tickStep = this.labelStep();
        const lastTick = allTicks[allTicks.length - 1];
        let labels = allTicks.filter(t => t.index % tickStep === 0);
        if (labels.length === 0 || labels[labels.length - 1].value !== lastTick.value) {
            labels.push(lastTick);
        }
        if (labels.length >= 2) {
            const penultimate = labels[labels.length - 2];
            const last = labels[labels.length - 1];
            const penultimatePos = valueToPosition(penultimate.value, this.min(), this.max());
            const lastPos = valueToPosition(last.value, this.min(), this.max());
            if (this.step() !== 1 && lastPos - penultimatePos < 4) {
                labels.splice(labels.length - 2, 1);
            }
        }
        return labels;
    });
    protected readonly primaryHandleFocused = signal(false);
    protected readonly primaryHandlePosition = computed(() => this.rangeSelection().left);
    protected readonly primaryHandleStyle = computed(() => {
        const baseStyle = this.handleTemplateStyles();
        if (this.ranged() && this.handlesOverlap()) {
            return { ...baseStyle, zIndex: this.secondaryHandleOnTop() ? "1" : "2" };
        }
        return baseStyle;
    });
    protected readonly rangeSelection = computed(() => {
        const handlePositions = this.handlePositions();
        if (this.ranged()) {
            return {
                left: handlePositions[0],
                right: handlePositions[1]
            };
        }
        return {
            left: 0,
            right: handlePositions[0]
        };
    });
    protected readonly renderTicks = computed(() => {
        const ticks = this.ticks();
        if (this.orientation() === "vertical") {
            return ticks.slice().reverse();
        }
        return ticks;
    });
    protected readonly secondaryHandleFocused = signal(false);
    protected readonly secondaryHandlePosition = computed(() => this.rangeSelection().right);
    protected readonly secondaryHandleOnTop = signal(true);
    protected readonly secondaryHandleStyle = computed(() => {
        const baseStyle = this.handleTemplateStyles();
        if (this.ranged() && this.handlesOverlap()) {
            return { ...baseStyle, zIndex: this.secondaryHandleOnTop() ? "2" : "1" };
        }
        return baseStyle;
    });
    protected readonly secondarySliderHandle: Signal<ElementRef<HTMLDivElement> | undefined> =
        viewChild("secondarySliderHandle");
    protected readonly selectionClasses = computed(() => {
        const theme = this.#themeService.theme();
        return sliderSelectionThemeVariants(theme)();
    });
    protected readonly selectionLeft = computed(() => this.rangeSelection().left);
    protected readonly selectionRight = computed(() => this.rangeSelection().right);
    protected readonly sliderHandle: Signal<ElementRef<HTMLDivElement>> = viewChild.required("sliderHandle");
    protected readonly tickClasses = computed(() => {
        const theme = this.#themeService.theme();
        return sliderTickThemeVariants(theme)();
    });
    protected readonly tickElements = viewChildren(SliderTickDirective);
    protected readonly tickLabelClasses = computed(() => {
        const theme = this.#themeService.theme();
        return sliderTickLabelThemeVariants(theme)();
    });
    protected readonly tickLabelListClasses = computed(() => {
        const theme = this.#themeService.theme();
        return sliderTickLabelListThemeVariants(theme)();
    });
    protected readonly tickListClasses = computed(() => {
        const theme = this.#themeService.theme();
        return sliderTickListThemeVariants(theme)();
    });
    protected readonly tickStyleArgs = computed<TickStyleArgs>(() => {
        const largeTickStep = this.largeTickStep();
        const max = this.max();
        const min = this.min();
        const orientation = this.orientation();
        const smallTickStep = this.smallTickStep();
        return { largeTickStep, max, min, orientation, smallTickStep };
    });
    protected readonly tickValueTemplate = contentChild(SliderTickValueTemplateDirective, { read: TemplateRef });
    protected readonly ticks = computed(() => {
        const min = this.min();
        const max = this.max();
        const step = this.step();
        const ticks: SliderTick[] = [];
        const count = Math.floor((max - min) / step);
        for (let i = 0; i <= count; i++) {
            const value = min + i * step;
            ticks.push({ index: i, value });
        }
        if (ticks[ticks.length - 1].value < max) {
            ticks.push({ index: ticks.length, value: max });
        }
        return ticks;
    });
    protected readonly trackClasses = computed(() => {
        const theme = this.#themeService.theme();
        return sliderTrackThemeVariants(theme)();
    });

    /**
     * @description Sets the disabled state of the slider.
     */
    public readonly disabled = input(false);

    /**
     * @description Sets the position of the label relative to the slider track.
     */
    public readonly labelPosition = input<SliderLabelPosition>("after");

    /**
     * @description Display every n<sup>th</sup> label on the slider.
     */
    public readonly labelStep = input(1);

    /**
     * @description Display every n<sup>th</sup> tick as large.
     */
    public readonly largeTickStep = input<number | null>(null);

    /**
     * @description Sets the maximum value of the slider.
     */
    public readonly max = input(10);

    /**
     * @description Sets the minimum value of the slider.
     */
    public readonly min = input(0);

    /**
     * @description Sets the orientation of the slider.
     */
    public readonly orientation = input<Orientation>("horizontal");

    /**
     * @description Enables ranged mode with two handles for min/max value selection.
     */
    public readonly ranged = input(false);

    /**
     * @description Sets the border radius of the slider handle.
     */
    public readonly rounded = input<SliderVariantProps["rounded"]>("full");

    /**
     * @description Sets the background color of the selection area of the slider.
     */
    public readonly selectionBackground = input<string | Partial<CSSStyleDeclaration> | null>(null);

    /**
     * @description Sets whether to show labels on the slider.
     * Only applicable if `showTicks` is `true`.
     */
    public readonly showLabels = input(false);

    /**
     * @description Sets whether to show ticks on the slider.
     */
    public readonly showTicks = input(false);

    /**
     * @description Displays every n<sup>th</sup> tick on the slider.
     */
    public readonly smallTickStep = input(1, {
        transform: (value: number) => Math.max(value, 1)
    });

    /**
     * @description Sets the step size for the slider.
     */
    public readonly step = input(1, {
        transform: (value: number) => (value <= 0 ? 1 : value)
    });

    /**
     * @description Sets the background color of the slider track.
     */
    public readonly trackBackground = input<string | Partial<CSSStyleDeclaration> | null>(null);

    public constructor() {
        afterNextRender({
            read: () => this.setSubscriptions()
        });
    }

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {
        this.#propagateTouched = fn;
    }

    public writeValue(obj: number | [number, number]): void {
        if (obj != null) {
            if (this.ranged()) {
                if (Array.isArray(obj) && obj.length === 2) {
                    const [minVal, maxVal] = obj;
                    const clampedMin = Math.max(this.min(), Math.min(minVal, this.max()));
                    const clampedMax = Math.max(this.min(), Math.min(maxVal, this.max()));
                    const sortedMin = Math.min(clampedMin, clampedMax);
                    const sortedMax = Math.max(clampedMin, clampedMax);
                    const minPosition = valueToPosition(sortedMin, this.min(), this.max());
                    const maxPosition = valueToPosition(sortedMax, this.min(), this.max());

                    this.handleValues.set([sortedMin, sortedMax]);
                    this.handlePositions.set([minPosition, maxPosition]);

                    // Initialize handle z-index - secondary handle on top by default when overlapping
                    if (sortedMin === sortedMax) {
                        this.secondaryHandleOnTop.set(true);
                    }
                }
            } else {
                const value = Math.max(this.min(), Math.min(obj as number, this.max()));
                const position = valueToPosition(value, this.min(), this.max());
                // In non-ranged mode, only use the first position, second is unused
                this.handleValues.set([value, value]);
                this.handlePositions.set([position, position]);
            }
        }
    }

    protected onFocus(): void {
        if (!this.disabled()) {
            this.sliderHandle().nativeElement.focus();
        }
    }

    private findClosestTickElement(event: MouseEvent): HTMLSpanElement {
        const elements = this.tickElements().map(tick => tick.host.nativeElement);
        let maxDistance = Number.MAX_VALUE;
        let index = 0;
        for (const [ex, element] of elements.entries()) {
            const rect = element.getBoundingClientRect();
            const distance = Math.sqrt(Math.pow(rect.left - event.clientX, 2) + Math.pow(rect.top - event.clientY, 2));
            if (distance < maxDistance) {
                maxDistance = distance;
                index = ex;
            }
        }
        return elements[index] as HTMLSpanElement;
    }

    private getClosestHandle(event: MouseEvent): boolean {
        if (!this.ranged() || !this.secondarySliderHandle()) {
            return false;
        }

        const currentValues = this.handleValues();
        if (currentValues[0] === currentValues[1]) {
            const containerRect = this.#hostElementRef.nativeElement.getBoundingClientRect();
            let normalizedClickPos: number;

            if (this.orientation() === "horizontal") {
                const clickPos = event.clientX - containerRect.left;
                normalizedClickPos = (clickPos / containerRect.width) * 100;
            } else {
                const clickPos = event.clientY - containerRect.top;
                normalizedClickPos = 100 - (clickPos / containerRect.height) * 100;
            }

            const clickValue = this.getValueFromPosition(normalizedClickPos);
            // Clicking to greater value uses secondary handle
            // Clicking to smaller value uses primary handle
            return clickValue > currentValues[0];
        }

        const primaryRect = this.sliderHandle().nativeElement.getBoundingClientRect();
        const secondaryRect = this.secondarySliderHandle()!.nativeElement.getBoundingClientRect();
        const primaryDistance = Math.sqrt(
            Math.pow(primaryRect.left + primaryRect.width / 2 - event.clientX, 2) +
                Math.pow(primaryRect.top + primaryRect.height / 2 - event.clientY, 2)
        );
        const secondaryDistance = Math.sqrt(
            Math.pow(secondaryRect.left + secondaryRect.width / 2 - event.clientX, 2) +
                Math.pow(secondaryRect.top + secondaryRect.height / 2 - event.clientY, 2)
        );

        return secondaryDistance < primaryDistance;
    }

    private getValueFromPosition(position: number): number {
        const min = this.min();
        const max = this.max();
        const step = this.step();

        if (position >= 100) {
            return max;
        }
        if (position <= 0) {
            return min;
        }

        const range = max - min;
        const rawValue = min + (position / 100) * range;
        const value = Math.round((rawValue - min) / step) * step + min;
        return Math.max(min, Math.min(max, value));
    }

    private handleHandleMove(event: MouseEvent, orientation: Orientation, isSecondary: boolean = false): void {
        if (this.showTicks()) {
            const tick = this.findClosestTickElement(event);
            const valueStr = tick.getAttribute("data-value");
            const value = valueStr ? Number(valueStr) : 0;
            const position = valueToPosition(value, this.min(), this.max());

            if (this.ranged()) {
                this.updateRangedValue(value, isSecondary, true);
            } else {
                if (position !== this.handlePositions()[0]) {
                    this.#zone.run(() => {
                        this.handlePositions.set([position, position]);
                        this.handleValues.set([value, value]);
                        this.#propagateChange?.(value);
                    });
                }
            }
            return;
        }

        const containerRect = this.#hostElementRef.nativeElement.getBoundingClientRect();
        let normalizedHandlePos: number;

        if (orientation === "horizontal") {
            const handlePos = event.clientX - containerRect.left;
            normalizedHandlePos = (handlePos / containerRect.width) * 100;
        } else {
            const handlePos = event.clientY - containerRect.top;
            normalizedHandlePos = 100 - (handlePos / containerRect.height) * 100;
        }

        normalizedHandlePos = Math.max(0, Math.min(normalizedHandlePos, 100));

        const value = this.getValueFromPosition(normalizedHandlePos);
        const snappedPosition = valueToPosition(value, this.min(), this.max());

        if (this.ranged()) {
            this.updateRangedValue(value, isSecondary, true);
        } else {
            if (value !== this.handleValues()[0]) {
                this.#zone.run(() => {
                    this.handlePositions.set([snappedPosition, snappedPosition]);
                    this.handleValues.set([value, value]);
                    this.#propagateChange?.(value);
                });
            }
        }
    }

    private setClickSubscription(): void {
        fromEvent<MouseEvent>(this.#hostElementRef.nativeElement, "click")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                tap(() => this.dragging.set(false)),
                filter(() => !this.disabled())
            )
            .subscribe((event: MouseEvent) => {
                const isSecondary = this.getClosestHandle(event);
                this.handleHandleMove(event, this.orientation(), isSecondary);
            });
    }

    private setFocusSubscription(): void {
        fromEvent(this.sliderHandle().nativeElement, "focus")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                this.#zone.run(() => {
                    this.primaryHandleFocused.set(true);
                    this.secondaryHandleFocused.set(false);
                });
            });

        fromEvent(this.sliderHandle().nativeElement, "blur")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                this.#zone.run(() => {
                    this.primaryHandleFocused.set(false);
                    this.#propagateTouched?.();
                });
            });

        const secondaryHandle = this.secondarySliderHandle();
        if (this.ranged() && secondaryHandle) {
            fromEvent(secondaryHandle.nativeElement, "focus")
                .pipe(takeUntilDestroyed(this.#destroyRef))
                .subscribe(() => {
                    this.#zone.run(() => {
                        this.secondaryHandleFocused.set(true);
                        this.primaryHandleFocused.set(false);
                    });
                });

            fromEvent(secondaryHandle.nativeElement, "blur")
                .pipe(takeUntilDestroyed(this.#destroyRef))
                .subscribe(() => {
                    this.#zone.run(() => {
                        this.secondaryHandleFocused.set(false);
                        this.#propagateTouched?.();
                    });
                });
        }
    }

    private setKeydownSubscription(): void {
        fromEvent<KeyboardEvent>(this.sliderHandle().nativeElement, "keydown")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(() => !this.disabled()),
                filter(event => ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)),
                tap(event => {
                    event.preventDefault();
                    event.stopPropagation();
                })
            )
            .subscribe(event => {
                const stepDirection = event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 1;
                const stepAmount = this.step() * stepDirection;

                if (this.ranged()) {
                    const currentValues = this.handleValues();
                    const currentValue = currentValues[0];
                    const newValue = Math.max(this.min(), Math.min(this.max(), currentValue + stepAmount));
                    this.updateRangedValue(newValue, false, false);
                } else {
                    const currentValue = this.handleValues()[0];
                    const newValue = Math.max(this.min(), Math.min(this.max(), currentValue + stepAmount));
                    this.#zone.run(() => {
                        this.handleValues.set([newValue, newValue]);
                        this.handlePositions.set([
                            valueToPosition(newValue, this.min(), this.max()),
                            valueToPosition(newValue, this.min(), this.max())
                        ]);
                        this.#propagateChange?.(newValue);
                    });
                }
            });

        const secondaryHandle = this.secondarySliderHandle();
        if (this.ranged() && secondaryHandle) {
            fromEvent<KeyboardEvent>(secondaryHandle.nativeElement, "keydown")
                .pipe(
                    takeUntilDestroyed(this.#destroyRef),
                    filter(() => !this.disabled()),
                    filter(event => ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)),
                    tap(event => {
                        event.preventDefault();
                        event.stopPropagation();
                    })
                )
                .subscribe(event => {
                    const stepDirection = event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 1;
                    const stepAmount = this.step() * stepDirection;
                    const currentValues = this.handleValues();
                    const currentValue = currentValues[1];
                    const newValue = Math.max(this.min(), Math.min(this.max(), currentValue + stepAmount));
                    this.updateRangedValue(newValue, true, false);
                });
        }
    }

    private setMouseMoveSubscription(): void {
        const mouseMove$ = fromEvent<MouseEvent>(document, "mousemove");
        const mouseUp$ = fromEvent<MouseEvent>(document, "mouseup");

        fromEvent<MouseEvent>(this.sliderHandle().nativeElement, "mousedown")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(() => !this.disabled()),
                tap(() => this.dragging.set(true)),
                switchMap(() =>
                    mouseMove$.pipe(
                        tap((event: MouseEvent) => this.handleHandleMove(event, this.orientation(), false)),
                        takeUntil(mouseUp$.pipe(tap(() => this.#zone.run(() => this.dragging.set(false)))))
                    )
                )
            )
            .subscribe();

        const secondaryHandle = this.secondarySliderHandle();
        if (this.ranged() && secondaryHandle) {
            fromEvent<MouseEvent>(secondaryHandle.nativeElement, "mousedown")
                .pipe(
                    takeUntilDestroyed(this.#destroyRef),
                    filter(() => !this.disabled()),
                    tap(() => this.dragging.set(true)),
                    switchMap(() =>
                        mouseMove$.pipe(
                            tap((event: MouseEvent) => this.handleHandleMove(event, this.orientation(), true)),
                            takeUntil(mouseUp$.pipe(tap(() => this.#zone.run(() => this.dragging.set(false)))))
                        )
                    )
                )
                .subscribe();
        }
    }

    private setSubscriptions(): void {
        this.#zone.runOutsideAngular(() => {
            this.setClickSubscription();
            this.setKeydownSubscription();
            this.setMouseMoveSubscription();
            this.setFocusSubscription();
        });
    }

    private updateRangedValue(value: number, isSecondary: boolean, isDragging: boolean = false): void {
        const currentValues = this.handleValues();
        const currentMinValue = currentValues[0];
        const currentMaxValue = currentValues[1];

        let newMinValue = currentMinValue;
        let newMaxValue = currentMaxValue;

        if (isSecondary) {
            if (isDragging && value < currentMinValue) {
                newMinValue = value;
                newMaxValue = value;
                this.secondaryHandleOnTop.set(true);
            } else {
                newMaxValue = Math.max(value, currentMinValue);
                if (newMaxValue === currentMinValue) {
                    this.secondaryHandleOnTop.set(true);
                }
            }
        } else {
            if (isDragging && value > currentMaxValue) {
                newMinValue = value;
                newMaxValue = value;
                this.secondaryHandleOnTop.set(false);
            } else {
                newMinValue = Math.min(value, currentMaxValue);
                if (newMinValue === currentMaxValue) {
                    this.secondaryHandleOnTop.set(false);
                }
            }
        }

        if (newMinValue !== currentMinValue || newMaxValue !== currentMaxValue) {
            const minPosition = valueToPosition(newMinValue, this.min(), this.max());
            const maxPosition = valueToPosition(newMaxValue, this.min(), this.max());

            this.handleValues.set([newMinValue, newMaxValue]);
            this.handlePositions.set([minPosition, maxPosition]);
            this.#zone.run(() => this.#propagateChange?.([newMinValue, newMaxValue]));
        }
    }
}
