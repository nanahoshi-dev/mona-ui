import { afterNextRender, booleanAttribute, computed, contentChild, DestroyRef, Directive, DOCUMENT, effect, ElementRef, inject, input, isDevMode, NgZone, output, signal, Signal, TemplateRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Orientation } from "@nanahoshi/mona-ui/common";
import { injectEffectiveDisabled, injectLabelAssociation } from "@nanahoshi/mona-ui/internal";
import { filter, fromEvent, merge, switchMap, takeUntil, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { formatNumber, injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { SliderHandleTemplateDirective } from "../../directives/slider-handle-template.directive";
import { SliderTickValueTemplateDirective } from "../../directives/slider-tick-value-template.directive";
import { LabelStyleArgs } from "../../models/LabelStyleArgs";
import { SliderLabelPosition } from "../../models/SliderLabelPosition";
import { SliderTick } from "../../models/SliderTick";
import { TickStyleArgs } from "../../models/TickStyleArgs";
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
import { decimalPlaces, roundToPlaces } from "../../utils/stepPrecision";
import { valueToPosition } from "../../utils/valueToPosition";

@Directive()
export abstract class SliderBaseComponent implements SliderVariantInputs {
    readonly #document = inject(DOCUMENT);
    readonly #label = injectLabelAssociation({
        activate: () => this.focus(),
        ariaLabel: () => this.ariaLabel(),
        ariaLabelledBy: () => this.ariaLabelledBy()
    });
    readonly #stepPlaces = computed(() => Math.max(decimalPlaces(this.step()), decimalPlaces(this.effectiveMin())));
    protected readonly baseClasses = computed(() => sliderBaseThemeVariants());
    protected readonly destroyRef = inject(DestroyRef);
    protected readonly direction = injectComponentDirection();
    protected readonly dragging = signal(false);
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly effectiveMax = computed(() => this.getMaxOverride() ?? this.maxValue());
    protected readonly effectiveMin = computed(() => this.getMinOverride() ?? this.minValue());
    protected readonly handleTemplate = contentChild(SliderHandleTemplateDirective, { read: TemplateRef });
    protected readonly handleTemplateStyles = computed<Partial<CSSStyleDeclaration>>(() => {
        const template = this.handleTemplate();
        if (!template) {
            return {};
        }
        return { background: "transparent", border: "none", boxShadow: "none" };
    });
    protected readonly horizontalSelectionLeft = computed(() => {
        if (this.orientation() !== "horizontal") {
            return undefined;
        }
        return this.isRtl() ? 100 - this.selectionRight() : this.selectionLeft();
    });
    protected readonly horizontalSelectionRight = computed(() => {
        if (this.orientation() !== "horizontal") {
            return undefined;
        }
        return this.isRtl() ? this.selectionLeft() : 100 - this.selectionRight();
    });
    protected readonly hostElementRef: ElementRef<HTMLDivElement> = inject(ElementRef);
    protected readonly i18n = inject(MonaI18nService);
    protected readonly interactionDisabled = computed(() => this.effectiveDisabled() || this.readonly());
    protected readonly invalidState = computed(() => this.touched() && this.invalid());
    protected readonly isRtl = computed(() => this.direction() === "rtl");
    protected readonly labelStyleArgs = computed<LabelStyleArgs>(() => {
        const direction = this.direction();
        const labelPosition = this.labelPosition();
        const max = this.effectiveMax();
        const min = this.effectiveMin();
        const orientation = this.orientation();
        const tickCount = this.labelTicks().length;
        return { direction, labelPosition, max, min, orientation, tickCount };
    });
    protected readonly labelTicks = computed(() => {
        const allTicks = this.ticks();
        if (allTicks.length === 0) {
            return [];
        }

        const tickStep = this.labelStep();
        const lastTick = allTicks[allTicks.length - 1];
        const labels = allTicks.filter(t => t.index % tickStep === 0);
        if (labels.length === 0 || labels[labels.length - 1].value !== lastTick.value) {
            labels.push(lastTick);
        }
        if (labels.length >= 2) {
            const penultimate = labels[labels.length - 2];
            const last = labels[labels.length - 1];
            const penultimatePos = valueToPosition(penultimate.value, this.effectiveMin(), this.effectiveMax());
            const lastPos = valueToPosition(last.value, this.effectiveMin(), this.effectiveMax());
            if (this.step() !== 1 && lastPos - penultimatePos < 4) {
                labels.splice(labels.length - 2, 1);
            }
        }
        const localeId = this.i18n.localeId();
        return labels.map(tick => ({
            ...tick,
            label: formatNumber(tick.value, localeId, { maximumFractionDigits: decimalPlaces(tick.value) })
        }));
    });
    protected readonly labelledBy = this.#label.labelledBy;
    protected readonly renderTicks = computed(() => {
        const ticks = this.ticks();
        if (this.orientation() === "vertical") {
            return ticks.slice().reverse();
        }
        return ticks;
    });
    protected readonly selectionBackgroundStyle = computed<Partial<CSSStyleDeclaration>>(() => {
        const bg = this.selectionBackground();
        if (!bg) {
            return {};
        }
        return typeof bg === "string" ? { background: bg } : bg;
    });
    protected readonly selectionClasses = computed(() => sliderSelectionThemeVariants());
    protected readonly sliderHandleClasses = computed(() => {
        const rounded = this.rounded();
        const handleClasses = this.handleClasses();
        const variants = sliderHandleThemeVariants({ rounded });
        return twMerge(variants ?? "", Array.isArray(handleClasses) ? handleClasses.join(" ") : handleClasses);
    });
    protected readonly sliderTrackSize = computed(() => {
        const trackSize = this.trackSize();
        if (trackSize == null || trackSize === "") {
            return null;
        }
        if (typeof trackSize === "number") {
            return `${trackSize}px`;
        }
        const number = Number(trackSize);
        if (isNaN(number)) {
            return trackSize;
        }
        return `${number}px`;
    });
    protected readonly tickClasses = computed(() => sliderTickThemeVariants());
    protected readonly tickLabelClasses = computed(() => sliderTickLabelThemeVariants());
    protected readonly tickLabelListClasses = computed(() => sliderTickLabelListThemeVariants());
    protected readonly tickListClasses = computed(() => sliderTickListThemeVariants());
    protected readonly tickStyleArgs = computed<TickStyleArgs>(() => {
        const direction = this.direction();
        const largeTickStep = this.largeTickStep();
        const max = this.effectiveMax();
        const min = this.effectiveMin();
        const orientation = this.orientation();
        const smallTickStep = this.smallTickStep();
        return { direction, largeTickStep, max, min, orientation, smallTickStep };
    });
    protected readonly tickValueTemplate = contentChild(SliderTickValueTemplateDirective, { read: TemplateRef });
    protected readonly ticks = computed(() => {
        const min = this.effectiveMin();
        const max = this.effectiveMax();
        const step = this.step();
        const ticks: SliderTick[] = [];
        const count = this.#stepCount();
        for (let i = 0; i <= count; i++) {
            ticks.push({ index: i, value: this.#roundToStep(min + i * step) });
        }
        if (ticks.length === 0 || ticks[ticks.length - 1].value < max) {
            ticks.push({ index: ticks.length, value: max });
        }
        return ticks;
    });
    protected readonly trackBackgroundStyle = computed<Partial<CSSStyleDeclaration>>(() => {
        const bg = this.trackBackground();
        if (!bg) {
            return {};
        }
        return typeof bg === "string" ? { background: bg } : bg;
    });
    protected readonly trackClasses = computed(() => {
        const rounded = this.rounded();
        return sliderTrackThemeVariants({ rounded });
    });
    protected readonly zone: NgZone = inject(NgZone);

    /**
     * @description Id of an element that describes the control, such as an error message. On a range slider it describes
     * each handle.
     * @default null
     */
    public readonly ariaDescribedBy = input<string | null>(null, { alias: "aria-describedby" });

    /**
     * @description Accessible name of the control. On a range slider it names the group holding both handles.
     * @default null
     */
    public readonly ariaLabel = input<string | null>(null, { alias: "aria-label" });

    /**
     * @description Id of the element that labels the control. On a range slider each handle reads it before its own
     * name.
     * @default null
     */
    public readonly ariaLabelledBy = input<string | null>(null, { alias: "aria-labelledby" });

    /**
     * @description Human-readable override for the `aria-valuenow` announcement. Pass a function that receives the current value and returns the string to announce.
     * @default null
     */
    public readonly ariaValueText = input<((value: number) => string) | null>(null);

    /**
     * @description Renders the component with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Additional CSS classes to apply to the slider handle.
     * @default []
     */
    public readonly handleClasses = input<string | string[]>([]);

    /**
     * @description Additional inline styles to apply to the slider handle.
     * @default {}
     */
    public readonly handleStyles = input<Partial<CSSStyleDeclaration>>({});

    /**
     * @description Marks the control as invalid for form validation purposes, reflecting `aria-invalid` on the handle
     * element once the control is touched.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Position of the label relative to the component.
     * @default "after"
     */
    public readonly labelPosition = input<SliderLabelPosition>("after");

    /**
     * @description Controls which tick labels are shown — only every n<sup>th</sup> label is rendered.
     * @default 1
     */
    public readonly labelStep = input(1);

    /**
     * @description Controls which ticks render at large size — only every n<sup>th</sup> tick is enlarged. Pass `null` to disable large ticks.
     * @default null
     */
    public readonly largeTickStep = input<number | null>(null);

    /**
     * @description Upper bound of the value range. Must be greater than `minValue`.
     * @default 10
     */
    public readonly maxValue = input(10);

    /**
     * @description Lower bound of the value range.
     * @default 0
     */
    public readonly minValue = input(0);

    /**
     * @description Layout orientation of the component.
     * @default "horizontal"
     */
    public readonly orientation = input<Orientation>("horizontal");

    /**
     * @description Prevents value changes while the control stays focusable and readable. When bound to a signal form
     * field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Border-radius preset applied to the slider handle.
     * @default "full"
     */
    public readonly rounded = input<SliderVariantProps["rounded"]>("full");

    /**
     * @description Background color of the filled selection area between the minimum and the current value. Accepts a CSS color string or a `CSSStyleDeclaration` partial.
     * @default null
     */
    public readonly selectionBackground = input<string | Partial<CSSStyleDeclaration> | null>(null);

    /**
     * @description Multiplier applied to the step when the user holds Shift while pressing an arrow key.
     * @default 10
     */
    public readonly shiftMultiplier = input(10);

    /**
     * @description Displays value labels alongside tick marks. Only takes effect when `showTicks` is `true`.
     * @default false
     */
    public readonly showLabels = input(false, { transform: booleanAttribute });

    /**
     * @description Displays tick marks at each step position along the track.
     * @default false
     */
    public readonly showTicks = input(false, { transform: booleanAttribute });

    /**
     * @description Controls how many ticks are visible — only every n<sup>th</sup> tick is rendered.
     * @default 1
     */
    public readonly smallTickStep = input(1, {
        transform: (value: number) => Math.max(value, 1)
    });

    /**
     * @description Distance between the values the control can take. `maxValue` can always be reached, even when it
     * isn't a whole number of steps from `minValue`.
     * @default 1
     */
    public readonly step = input(1, {
        transform: (value: number) => (value <= 0 ? 1 : value)
    });

    /**
     * @description Emitted when a handle loses focus. A click on the track moves focus to the handle first.
     */
    public readonly touch = output<void>();

    /**
     * @description Marks the slider as touched. Error styling requires both `invalid` and `touched` to be `true`.
     * When bound to a signal form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Background color of the unfilled track portion. Accepts a CSS color string or a `CSSStyleDeclaration` partial.
     * @default null
     */
    public readonly trackBackground = input<string | Partial<CSSStyleDeclaration> | null>(null);

    /**
     * @description Width (vertical orientation) or height (horizontal orientation) of the track. Accepts a pixel number or any CSS length string.
     * @default undefined
     */
    public readonly trackSize = input<string | number>();

    protected abstract readonly selectionLeft: Signal<number>;
    protected abstract readonly selectionRight: Signal<number>;
    protected abstract readonly valueIsShown: Signal<boolean>;

    public constructor() {
        afterNextRender({
            read: () => this.zone.runOutsideAngular(() => this.setSubscriptions())
        });
        if (isDevMode()) {
            this.#warnWhenMisconfigured();
        }
    }

    /**
     * @internal
     */
    public setLabelledBy(id: string | null): void {
        this.#label.setLabelledBy(id);
    }

    protected calculateNewValue(currentValue: number, event: KeyboardEvent): number {
        const min = this.effectiveMin();
        const max = this.effectiveMax();
        const step = this.step();
        const isRtl = this.isRtl();
        const amount = event.shiftKey ? step * this.shiftMultiplier() : step;
        const page = Math.max((max - min) * 0.1, step);
        // Max can sit off the step grid, and stepping down from it lands on the last value of the grid.
        const lastGridValue = this.#roundToStep(min + this.#stepCount() * step);
        const decreaseFrom = currentValue > lastGridValue ? lastGridValue + step : currentValue;
        const decreaseKey = isRtl ? "ArrowRight" : "ArrowLeft";
        const increaseKey = isRtl ? "ArrowLeft" : "ArrowRight";

        let newValue = currentValue;

        switch (event.key) {
            case decreaseKey:
            case "ArrowDown":
                newValue = decreaseFrom - amount;
                break;
            case increaseKey:
            case "ArrowUp":
                newValue = currentValue + amount;
                break;
            case "Home":
                newValue = min;
                break;
            case "End":
                newValue = max;
                break;
            case "PageDown":
                newValue = decreaseFrom - page;
                break;
            case "PageUp":
                newValue = currentValue + page;
                break;
        }

        return this.snapValue(newValue);
    }

    protected clampValue(value: number): number {
        return Math.max(this.effectiveMin(), Math.min(this.effectiveMax(), value));
    }

    protected getMaxOverride(): number | undefined {
        return undefined;
    }

    protected getMinOverride(): number | undefined {
        return undefined;
    }

    protected getValueFromPointerEvent(event: PointerEvent): number {
        const containerRect = this.hostElementRef.nativeElement.getBoundingClientRect();
        let normalizedHandlePos: number;

        if (this.orientation() === "horizontal") {
            const handlePos = this.isRtl()
                ? containerRect.right - event.clientX
                : event.clientX - containerRect.left;
            normalizedHandlePos = (handlePos / containerRect.width) * 100;
        } else {
            const handlePos = event.clientY - containerRect.top;
            normalizedHandlePos = 100 - (handlePos / containerRect.height) * 100;
        }

        normalizedHandlePos = Math.max(0, Math.min(normalizedHandlePos, 100));
        return this.getValueFromPosition(normalizedHandlePos);
    }

    protected getValueFromPosition(position: number): number {
        const min = this.effectiveMin();
        const max = this.effectiveMax();

        if (position >= 100) {
            return max;
        }
        if (position <= 0) {
            return min;
        }

        const range = max - min;
        const rawValue = min + (position / 100) * range;
        return this.snapValue(rawValue);
    }

    protected isNavigationKey(event: KeyboardEvent): boolean {
        return ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(
            event.key
        );
    }

    protected positionFromValue(value: number): number {
        return valueToPosition(value, this.effectiveMin(), this.effectiveMax());
    }

    protected snapValue(value: number): number {
        const min = this.effectiveMin();
        const max = this.effectiveMax();
        if (Number.isNaN(value) || max <= min) {
            return min;
        }
        const step = this.step();
        const clampedValue = this.clampValue(value);
        const snappedValue = this.clampValue(this.#roundToStep(Math.round((clampedValue - min) / step) * step + min));
        // Max counts as a value of the grid even when it's off it, as the last tick does.
        return max - clampedValue < Math.abs(clampedValue - snappedValue) ? max : snappedValue;
    }

    /**
     * Moves a value while the given handle is dragged with the primary button, one finger or a pen. The pointer is
     * captured, so a release outside the page still ends the drag.
     */
    protected trackHandleDrag(handle: HTMLElement, startDrag: () => (event: PointerEvent) => void): void {
        fromEvent<PointerEvent>(handle, "pointerdown")
            .pipe(
                filter(event => event.button === 0 && event.isPrimary && !event.ctrlKey),
                filter(() => !this.dragging() && !this.interactionDisabled()),
                tap(event => {
                    this.zone.run(() => this.dragging.set(true));
                    handle.setPointerCapture?.(event.pointerId);
                    // A touch doesn't focus the element by itself, and touch only fires when focus leaves.
                    handle.focus({ preventScroll: true });
                }),
                switchMap(down => {
                    const pointerEvents = (target: EventTarget, name: string) =>
                        fromEvent<PointerEvent>(target, name).pipe(filter(event => event.pointerId === down.pointerId));
                    const end$ = merge(
                        pointerEvents(this.#document, "pointerup"),
                        pointerEvents(this.#document, "pointercancel"),
                        pointerEvents(handle, "lostpointercapture")
                    ).pipe(tap(() => this.zone.run(() => this.dragging.set(false))));
                    return pointerEvents(this.#document, "pointermove").pipe(tap(startDrag()), takeUntil(end$));
                }),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe();
    }

    protected abstract setSubscriptions(): void;

    #roundToStep(value: number): number {
        return roundToPlaces(value, this.#stepPlaces());
    }

    #stepCount(): number {
        return Math.floor((this.effectiveMax() - this.effectiveMin()) / this.step());
    }

    #warnWhenMisconfigured(): void {
        const host = this.hostElementRef.nativeElement;
        let warnedAboutBounds = false;
        let warnedAboutValue = false;
        effect(() => {
            if (!warnedAboutBounds && this.effectiveMin() >= this.effectiveMax()) {
                warnedAboutBounds = true;
                console.warn(
                    `[Mona Slider] The minimum (${this.effectiveMin()}) must be lower than the maximum ` +
                        `(${this.effectiveMax()}).`,
                    host
                );
            }
        });
        effect(() => {
            if (!warnedAboutValue && !this.valueIsShown()) {
                warnedAboutValue = true;
                console.warn(
                    "[Mona Slider] The value is out of range or off the step grid. The slider shows the nearest " +
                        "valid value, and the model keeps its own until the user changes it.",
                    host
                );
            }
        });
    }

    public abstract focus(options?: FocusOptions): void;
}
