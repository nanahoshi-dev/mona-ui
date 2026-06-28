import {
    afterNextRender,
    computed,
    contentChild,
    DestroyRef,
    Directive,
    ElementRef,
    inject,
    input,
    NgZone,
    output,
    signal,
    TemplateRef,
    viewChildren
} from "@angular/core";
import { twMerge } from "tailwind-merge";
import { Orientation } from "../../../../models/Orientation";
import { ThemeService } from "../../../../theme/services/theme.service";
import { SliderLabelPosition } from "../../../models/SliderLabelPosition";
import { SliderTick } from "../../../models/SliderTick";
import { SliderHandleTemplateDirective } from "../../directives/slider-handle-template.directive";
import { SliderTickValueTemplateDirective } from "../../directives/slider-tick-value-template.directive";
import { SliderTickDirective } from "../../directives/slider-tick.directive";
import { LabelStyleArgs } from "../../models/LabelStyleArgs";
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
import { valueToPosition } from "../../utils/valueToPosition";

@Directive()
export abstract class SliderBaseComponent implements SliderVariantInputs {
    readonly #themeService = inject(ThemeService);
    protected readonly destroyRef = inject(DestroyRef);
    protected readonly dragging = signal(false);
    protected readonly hostElementRef: ElementRef<HTMLDivElement> = inject(ElementRef);
    protected readonly tickElements = viewChildren(SliderTickDirective);
    protected readonly zone: NgZone = inject(NgZone);
    protected readonly baseClasses = computed(() => sliderBaseThemeVariants(this.#themeService.theme())());
    protected readonly effectiveDisabled = computed(() => this.disabled());
    protected readonly handleTemplate = contentChild(SliderHandleTemplateDirective, { read: TemplateRef });
    protected readonly handleTemplateStyles = computed<Partial<CSSStyleDeclaration>>(() => {
        const template = this.handleTemplate();
        if (!template) {
            return {};
        }
        return { background: "transparent", border: "none", boxShadow: "none" };
    });
    protected readonly labelStyleArgs = computed<LabelStyleArgs>(() => {
        const labelPosition = this.labelPosition();
        const max = this.maxValue();
        const min = this.minValue();
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
        const labels = allTicks.filter(t => t.index % tickStep === 0);
        if (labels.length === 0 || labels[labels.length - 1].value !== lastTick.value) {
            labels.push(lastTick);
        }
        if (labels.length >= 2) {
            const penultimate = labels[labels.length - 2];
            const last = labels[labels.length - 1];
            const penultimatePos = valueToPosition(penultimate.value, this.minValue(), this.maxValue());
            const lastPos = valueToPosition(last.value, this.minValue(), this.maxValue());
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
    protected readonly selectionBackgroundStyle = computed<Partial<CSSStyleDeclaration>>(() => {
        const bg = this.selectionBackground();
        if (!bg) {
            return {};
        }
        return typeof bg === "string" ? { background: bg } : bg;
    });
    protected readonly selectionClasses = computed(() => sliderSelectionThemeVariants(this.#themeService.theme())());
    protected readonly sliderHandleClasses = computed(() => {
        const rounded = this.rounded();
        const handleClasses = this.handleClasses();
        const variants = sliderHandleThemeVariants(this.#themeService.theme())({ rounded });
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
    protected readonly tickClasses = computed(() => sliderTickThemeVariants(this.#themeService.theme())());
    protected readonly tickLabelClasses = computed(() => sliderTickLabelThemeVariants(this.#themeService.theme())());
    protected readonly tickLabelListClasses = computed(() =>
        sliderTickLabelListThemeVariants(this.#themeService.theme())()
    );
    protected readonly tickListClasses = computed(() => sliderTickListThemeVariants(this.#themeService.theme())());
    protected readonly tickStyleArgs = computed<TickStyleArgs>(() => {
        const largeTickStep = this.largeTickStep();
        const max = this.maxValue();
        const min = this.minValue();
        const orientation = this.orientation();
        const smallTickStep = this.smallTickStep();
        return { largeTickStep, max, min, orientation, smallTickStep };
    });
    protected readonly tickValueTemplate = contentChild(SliderTickValueTemplateDirective, { read: TemplateRef });
    protected readonly ticks = computed(() => {
        const min = this.minValue();
        const max = this.maxValue();
        const step = this.step();
        const ticks: SliderTick[] = [];
        const count = Math.floor((max - min) / step);
        for (let i = 0; i <= count; i++) {
            const value = min + i * step;
            ticks.push({ index: i, value });
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
    protected readonly trackClasses = computed(() => sliderTrackThemeVariants(this.#themeService.theme())());

    /**
     * @description Human-readable override for the `aria-valuenow` announcement. Pass a function that receives the current value and returns the string to announce.
     * @default null
     */
    public readonly ariaValueText = input<((value: number) => string) | null>(null);

    /**
     * @description Renders the component with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false);

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
     * @description Marks the control as invalid for form validation purposes, reflecting `aria-invalid` on the handle element.
     * @default false
     */
    public readonly invalid = input(false);

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
    public readonly showLabels = input(false);

    /**
     * @description Displays tick marks at each step position along the track.
     * @default false
     */
    public readonly showTicks = input(false);

    /**
     * @description Controls how many ticks are visible — only every n<sup>th</sup> tick is rendered.
     * @default 1
     */
    public readonly smallTickStep = input(1, {
        transform: (value: number) => Math.max(value, 1)
    });

    /**
     * @description Increment applied when the value changes via keyboard navigation.
     * @default 1
     */
    public readonly step = input(1, {
        transform: (value: number) => (value <= 0 ? 1 : value)
    });

    /**
     * @description Emitted when the slider loses focus or its value changes via keyboard navigation.
     */
    public readonly touch = output<void>();

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

    public constructor() {
        afterNextRender({
            read: () => this.zone.runOutsideAngular(() => this.setSubscriptions())
        });
    }

    protected calculateNewValue(currentValue: number, event: KeyboardEvent): number {
        const min = this.minValue();
        const max = this.maxValue();
        const step = this.step();

        let newValue = currentValue;

        switch (event.key) {
            case "ArrowLeft":
            case "ArrowDown":
                newValue = currentValue - (event.shiftKey ? step * this.shiftMultiplier() : step);
                break;
            case "ArrowRight":
            case "ArrowUp":
                newValue = currentValue + (event.shiftKey ? step * this.shiftMultiplier() : step);
                break;
            case "Home":
                newValue = min;
                break;
            case "End":
                newValue = max;
                break;
            case "PageDown":
                newValue = currentValue - (max - min) * 0.1;
                break;
            case "PageUp":
                newValue = currentValue + (max - min) * 0.1;
                break;
        }

        return this.snapValue(newValue);
    }

    protected clampValue(value: number): number {
        return Math.max(this.minValue(), Math.min(this.maxValue(), value));
    }

    protected findClosestTickElement(event: PointerEvent): HTMLSpanElement {
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

    protected getValueFromPointerEvent(event: PointerEvent): number {
        if (this.showTicks()) {
            const tick = this.findClosestTickElement(event);
            const valueStr = tick.getAttribute("data-value");
            return valueStr ? Number(valueStr) : this.minValue();
        }

        const containerRect = this.hostElementRef.nativeElement.getBoundingClientRect();
        let normalizedHandlePos: number;

        if (this.orientation() === "horizontal") {
            const handlePos = event.clientX - containerRect.left;
            normalizedHandlePos = (handlePos / containerRect.width) * 100;
        } else {
            const handlePos = event.clientY - containerRect.top;
            normalizedHandlePos = 100 - (handlePos / containerRect.height) * 100;
        }

        normalizedHandlePos = Math.max(0, Math.min(normalizedHandlePos, 100));
        return this.getValueFromPosition(normalizedHandlePos);
    }

    protected getValueFromPosition(position: number): number {
        const min = this.minValue();
        const max = this.maxValue();

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
        return valueToPosition(value, this.minValue(), this.maxValue());
    }

    protected snapValue(value: number): number {
        const min = this.minValue();
        const step = this.step();
        const clampedValue = this.clampValue(value);
        const snappedValue = Math.round((clampedValue - min) / step) * step + min;
        return this.clampValue(snappedValue);
    }

    protected abstract setSubscriptions(): void;
}
