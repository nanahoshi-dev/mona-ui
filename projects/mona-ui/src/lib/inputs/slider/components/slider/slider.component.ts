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
    imports: [NgClass, NgTemplateOutlet, SliderTickDirective],
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
    protected readonly tickValueTemplate = contentChild(SliderTickValueTemplateDirective, { read: TemplateRef });
    protected readonly ticks = computed(() => {
        const min = this.min();
        const max = this.max();
        const tickList: SliderTick[] = [];
        let value = min;
        let index = 0;
        while (value < max) {
            tickList.push({ index, value });
            value += this.step();
            index++;
        }
        tickList.push({ index, value: Math.min(value + this.step(), max) });
        if (this.orientation() === "vertical") {
            tickList.reverse();
        }
        return tickList;
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
     * @description Sets the position of the labels relative to the slider track.
     */
    public readonly labelPosition = input<SliderLabelPosition>("after");

    /**
     * @description Sets the step size for the labels on the slider.
     * @deprecated
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
     * @description Sets the orientation of the slider, either horizontal or vertical.
     */
    public readonly orientation = input<"horizontal" | "vertical">("horizontal");

    /**
     * @description Determines whether to show labels on the slider.
     */
    public readonly showLabels = input(false);

    /**
     * @description Determines whether to show ticks on the slider.
     * If true, clicking on the slider will snap to the nearest tick.
     */
    public readonly showTicks = input(false);

    /**
     * @description Sets the step size for the slider's value.
     */
    public readonly step = input(1, {
        transform: (value: number) => Math.max(1, value)
    });

    /**
     * @description Sets the step size for the ticks on the slider.
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
            const position = this.getPositionFromValue(value);
            this.handleValue.set(value);
            this.handlePosition.set(position);
        }
    }

    private getPositionFromValue(value: number): number {
        if (value === this.min()) {
            return 0;
        }
        if (value === this.max()) {
            return 100;
        }
        return ((value - this.min()) / (this.max() - this.min())) * 100;
    }

    private getValueFromPosition(position: number): number {
        const value = position / 100;
        return Math.max(this.min(), Math.min(this.max(), Math.round(value * this.max())));
    }

    private handleHandleMove(event: MouseEvent, direction: "horizontal" | "vertical"): void {
        if (this.showTicks()) {
            const tick = this.findClosestTickElement(event);
            const valueStr = tick.getAttribute("data-value");
            const value = valueStr ? Number(valueStr) : 0;
            const position = this.getPositionFromValue(value);
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
        let handlePos =
            direction === "horizontal" ? event.clientX - containerRect.left : event.clientY - containerRect.top;
        let normalizedHandlePos = 0;
        if (direction === "horizontal") {
            normalizedHandlePos = Math.max(0, Math.min((handlePos / containerRect.width) * 100, 100));
        } else {
            normalizedHandlePos = Math.max(0, Math.min(100 - (handlePos / containerRect.height) * 100, 100));
        }

        const maxPos = direction === "horizontal" ? containerRect.width : containerRect.height;
        if (
            normalizedHandlePos >= 0 &&
            normalizedHandlePos <= maxPos &&
            normalizedHandlePos !== this.handlePosition()
        ) {
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
                            this.handlePosition.set(this.getPositionFromValue(newValue));
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
