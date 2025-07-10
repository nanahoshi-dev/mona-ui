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
    SliderVariantInputs,
    SliderVariantProps
} from "mona-ui/inputs/slider/styles/slider.styles";
import { valueToPosition } from "mona-ui/inputs/slider/utils/valueToPosition";
import { Orientation } from "mona-ui/models/Orientation";
import { ThemeService } from "mona-ui/theme/services/theme.service";
import { filter, fromEvent, map, switchMap, takeUntil, tap } from "rxjs";
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
        const rounded = this.rounded();
        return sliderHandleThemeVariants(theme)({ rounded });
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

    private handleHandleMove(event: MouseEvent, orientation: Orientation): void {
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

        if (value !== this.handleValue()) {
            this.handlePosition.set(snappedPosition);
            this.#zone.run(() => {
                this.handleValue.set(value);
                this.#propagateChange?.(value);
            });
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
                this.handleHandleMove(event, this.orientation());
            });
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
                }),
                map((event: KeyboardEvent) => {
                    const currentValue = this.handleValue();
                    const stepDirection = event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 1;
                    const stepAmount = this.step() * stepDirection;
                    const newValue = currentValue + stepAmount;
                    return Math.max(this.min(), Math.min(this.max(), newValue));
                })
            )
            .subscribe(newValue => {
                this.#zone.run(() => {
                    this.handleValue.set(newValue);
                    this.handlePosition.set(valueToPosition(newValue, this.min(), this.max()));
                    this.#propagateChange?.(newValue);
                });
            });
    }

    private setMouseMoveSubscription(): void {
        const mouseDown$ = fromEvent<MouseEvent>(this.sliderHandle().nativeElement, "mousedown");
        const mouseMove$ = fromEvent<MouseEvent>(document, "mousemove");
        const mouseUp$ = fromEvent<MouseEvent>(document, "mouseup");

        mouseDown$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(() => !this.disabled()),
                tap(() => this.dragging.set(true)),
                switchMap(() =>
                    mouseMove$.pipe(
                        tap((event: MouseEvent) => this.handleHandleMove(event, this.orientation())), // Action is here
                        takeUntil(mouseUp$.pipe(tap(() => this.#zone.run(() => this.dragging.set(false)))))
                    )
                )
            )
            .subscribe();
    }

    private setSubscription(): void {
        this.#zone.runOutsideAngular(() => {
            this.setClickSubscription();
            this.setKeydownSubscription();
            this.setMouseMoveSubscription();
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
