// slider.component.ts

import { NgClass, NgTemplateOutlet } from "@angular/common";
import {
    AfterViewInit,
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
import { SliderTickDirective } from "mona-ui/inputs/slider/directives/slider-tick.directive";
import { LabelStyleArgs } from "mona-ui/inputs/slider/models/LabelStyleArgs";
import { TickStyleArgs } from "mona-ui/inputs/slider/models/TickStyleArgs";
import { LabelStylePipe } from "mona-ui/inputs/slider/pipes/label-style.pipe";
import { TickStylePipe } from "mona-ui/inputs/slider/pipes/tick-style.pipe";
import {
    sliderBaseThemeVariants,
    sliderHandleThemeVariants,
    sliderSelectionThemeVariants,
    sliderTickLabelListThemeVariants,
    sliderTickLabelThemeVariants,
    sliderTickListThemeVariants,
    sliderTickThemeVariants,
    sliderTrackThemeVariants,
    SliderVariantInputs
} from "mona-ui/inputs/slider/styles/slider.styles";
import { valueToPosition } from "mona-ui/inputs/slider/utils/valueToPosition";
import { ThemeService } from "mona-ui/theme/services/theme.service";
import { filter, fromEvent, mergeMap, take, takeUntil, tap } from "rxjs";
import { Action } from "../../../../utils/Action";
import { SliderLabelPosition } from "../../../models/SliderLabelPosition";
import { SliderTick } from "../../../models/SliderTick";
import { SliderTickValueTemplateDirective } from "../../directives/slider-tick-value-template.directive";

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
    imports: [NgClass, NgTemplateOutlet, SliderTickDirective, LabelStylePipe, TickStylePipe],
    host: {
        "[class]": "baseClasses()",
        "[class.mona-slider]": "true",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-orientation]": "orientation()"
    }
})
export class SliderComponent implements AfterViewInit, ControlValueAccessor, SliderVariantInputs {
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #hostElementRef: ElementRef<HTMLDivElement> = inject(ElementRef);
    readonly #themeService = inject(ThemeService);
    readonly #zone: NgZone = inject(NgZone);
    #propagateChange: Action<number> | null = null;
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        return sliderBaseThemeVariants(theme)();
    });
    protected readonly dragging = signal(false);
    protected readonly handleClasses = computed(() => {
        const theme = this.#themeService.theme();
        return sliderHandleThemeVariants(theme)();
    });
    protected readonly handlePosition = signal(0);
    protected readonly handleValue = signal(0);
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
    protected readonly renderTicks = computed(() => {
        const ticks = this.ticks();
        if (this.orientation() === "vertical") {
            return ticks.slice().reverse();
        }
        return ticks;
    });
    protected readonly selectionClasses = computed(() => {
        const theme = this.#themeService.theme();
        return sliderSelectionThemeVariants(theme)();
    });
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
        const max = this.max();
        const min = this.min();
        const orientation = this.orientation();
        const tickStep = this.tickStep();
        return { max, min, orientation, tickStep };
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
    public readonly orientation = input<"horizontal" | "vertical">("horizontal");

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
     * @description Sets the step size for the slider.
     */
    public readonly step = input(1, {
        transform: (value: number) => Math.max(1, value)
    });

    /**
     * @description Displays every n<sup>th</sup> tick on the slider.
     */
    public readonly tickStep = input(1, {
        transform: (value: number) => Math.max(1, value)
    });

    public ngAfterViewInit(): void {
        this.setSubscription();
    }

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {}

    public writeValue(obj: number): void {
        if (obj != null) {
            const value = Math.max(this.min(), Math.min(obj, this.max()));
            const position = valueToPosition(value, this.min(), this.max());
            this.handleValue.set(value);
            this.handlePosition.set(position);
        }
    }

    protected getTickPositionStyle(tick: SliderTick): Partial<CSSStyleDeclaration> {
        const position = valueToPosition(tick.value, this.min(), this.max());

        if (this.orientation() === "horizontal") {
            return {
                position: "absolute",
                left: `${position}%`,
                top: "50%",
                transform: "translateX(-75%) translateY(-50%)",
                width: "1px",
                height: "8px" // Base height for 100% ticks
            };
        } else {
            return {
                position: "absolute",
                bottom: `${position}%`,
                left: "50%",
                transform: "translateX(-50%) translateY(50%)",
                width: "8px",
                height: "1px"
            };
        }
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

    private handleHandleMove(event: MouseEvent, direction: "horizontal" | "vertical"): void {
        if (this.showTicks()) {
            const tick = this.findClosestTickElement(event);
            const valueStr = tick.getAttribute("data-value");
            const value = valueStr ? Number(valueStr) : 0;
            const position = valueToPosition(value, this.min(), this.max());
            if (position !== this.handlePosition()) {
                this.#zone.run(() => {
                    this.handlePosition.set(position);
                    this.handleValue.set(value);
                    this.#propagateChange?.(value);
                });
            }
            return;
        }

        const containerRect = this.#hostElementRef.nativeElement.getBoundingClientRect();
        let normalizedHandlePos: number;

        if (direction === "horizontal") {
            const handlePos = event.clientX - containerRect.left;
            normalizedHandlePos = (handlePos / containerRect.width) * 100;
        } else {
            const handlePos = event.clientY - containerRect.top;
            normalizedHandlePos = 100 - (handlePos / containerRect.height) * 100;
        }
        normalizedHandlePos = Math.max(0, Math.min(normalizedHandlePos, 100));

        if (Math.abs(normalizedHandlePos - this.handlePosition()) < 0.01) {
            return;
        }

        const value = this.getValueFromPosition(normalizedHandlePos);
        if (!this.showTicks()) {
            this.#zone.run(() => {
                this.handlePosition.set(normalizedHandlePos);
            });
        }
        if (value !== this.handleValue()) {
            this.#zone.run(() => {
                if (this.showTicks() && this.handlePosition() !== normalizedHandlePos) {
                    this.handlePosition.set(normalizedHandlePos);
                }
                this.handleValue.set(value);
                this.#propagateChange?.(value);
            });
        }
    }

    private setSubscription(): void {
        this.#zone.runOutsideAngular(() => {
            fromEvent<MouseEvent>(this.sliderHandle().nativeElement, "mousedown")
                .pipe(
                    takeUntilDestroyed(this.#destroyRef),
                    filter(() => !this.disabled()),
                    mergeMap(() => {
                        this.dragging.set(true);
                        return fromEvent<MouseEvent>(document, "mousemove").pipe(
                            tap((event: MouseEvent) => this.handleHandleMove(event, this.orientation())),
                            takeUntil(
                                fromEvent<MouseEvent>(document, "mouseup").pipe(
                                    take(1),
                                    tap(() => this.#zone.run(() => this.dragging.set(false)))
                                )
                            )
                        );
                    })
                )
                .subscribe();

            fromEvent<MouseEvent>(this.#hostElementRef.nativeElement, "click")
                .pipe(
                    takeUntilDestroyed(this.#destroyRef),
                    tap(() => this.dragging.set(false)),
                    filter(() => !this.disabled())
                )
                .subscribe((event: MouseEvent) => {
                    this.handleHandleMove(event, this.orientation());
                });

            fromEvent<KeyboardEvent>(this.sliderHandle().nativeElement, "keydown")
                .pipe(
                    filter(
                        (event: KeyboardEvent) =>
                            event.key === "ArrowLeft" ||
                            event.key === "ArrowRight" ||
                            event.key === "ArrowUp" ||
                            (event.key === "ArrowDown" && !this.disabled())
                    ),
                    tap((event: KeyboardEvent) => {
                        event.stopPropagation();
                        this.#zone.run(() => {
                            this.dragging.set(true);
                        });
                        const value = this.handleValue();
                        const step =
                            event.key === "ArrowLeft" || event.key === "ArrowDown" ? -this.step() : this.step();
                        const newValue = Math.max(this.min(), Math.min(this.max(), value + step));
                        this.#zone.run(() => {
                            this.handleValue.set(newValue);
                            this.handlePosition.set(valueToPosition(newValue, this.min(), this.max()));
                            this.#propagateChange?.(newValue);
                        });
                    }),
                    takeUntilDestroyed(this.#destroyRef)
                )
                .subscribe();
        });
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
}
