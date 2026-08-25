import { Component, contentChild, DestroyRef, effect, ElementRef, inject, input } from "@angular/core";
import { v4 as uuidv4 } from "uuid";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartReferenceLineRegistration,
    type ChartRegistrationContext
} from "../../internal/context/chart-registration-context";
import { ChartReferenceLabelTemplateDirective } from "../../directives/chart-reference-label-template.directive";
import type {
    ChartAnnotationAxisValue,
    ChartOverlayLayer,
    ChartReferenceLabelPosition,
    ChartReferenceLineStyle
} from "../../models/chart-annotation.models";

@Component({
    selector: "mona-chart-reference-line",
    template: "",
    host: {
        class: "hidden",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class ChartReferenceLineComponent {
    readonly #context = inject<ChartRegistrationContext | null>(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #id = uuidv4();

    /**
     * @description Target Cartesian axis dimension: 'x' or 'y'.
     */
    public readonly axis = input.required<"x" | "y">();

    /**
     * @description Explicit identifier of the target axis. Defaults to primary axis for the dimension.
     */
    public readonly axisId = input<string | undefined>(undefined);
    /**
     * @description Stroke color of the reference line.
     */
    public readonly color = input<string | undefined>(undefined);
    /**
     * @description Text label displayed alongside the reference line.
     */
    public readonly label = input("");
    /**
     * @description Custom CSS class name applied to the label badge.
     */
    public readonly labelClass = input("");
    /**
     * @description Pixel offset between the reference line and the label.
     */
    public readonly labelOffset = input(6);
    /**
     * @description Alignment position for the label: 'start', 'center', or 'end'.
     */
    public readonly labelPosition = input<ChartReferenceLabelPosition>("end");
    /**
     * @description Render layer: 'underlay' (behind series) or 'overlay' (in front of series).
     */
    public readonly layer = input<ChartOverlayLayer>("overlay");
    /**
     * @description Line dash style: 'dashed', 'dotted', or 'solid'.
     */
    public readonly lineStyle = input<ChartReferenceLineStyle>("dashed");
    /**
     * @description Stroke opacity of the reference line (0 to 1).
     */
    public readonly opacity = input<number | undefined>(undefined);
    /**
     * @description Optional custom template for the reference line label.
     */
    public readonly template = contentChild(ChartReferenceLabelTemplateDirective);
    /**
     * @description Custom CSS class name applied to the reference line host.
     */
    public readonly userClass = input("", { alias: "class" });
    /**
     * @description Semantic coordinate value or category key for the reference line.
     */
    public readonly value = input.required<ChartAnnotationAxisValue>();

    /**
     * @description Sets whether the reference line is visible.
     */
    public readonly visible = input(true);
    /**
     * @description Stroke width of the reference line in pixels.
     */
    public readonly width = input<number | undefined>(undefined);
    public constructor() {
        if (!this.#context) {
            return;
        }

        const registration: ChartReferenceLineRegistration = {
            axis: this.axis,
            axisId: this.axisId,
            color: this.color,
            element: this.#elementRef,
            id: this.#id,
            label: this.label,
            labelClass: this.labelClass,
            labelOffset: this.labelOffset,
            labelPosition: this.labelPosition,
            layer: this.layer,
            lineStyle: this.lineStyle,
            opacity: this.opacity,
            template: this.template,
            userClass: this.userClass,
            value: this.value,
            visible: this.visible,
            width: this.width
        };

        const unregister = this.#context.registerReferenceLine(registration);
        this.#destroyRef.onDestroy(() => {
            unregister();
        });

        effect(() => {
            this.axis();
            this.axisId();
            this.value();
            this.visible();
            this.color();
            this.opacity();
            this.width();
            this.lineStyle();
            this.layer();
            this.label();
            this.labelPosition();
            this.labelOffset();
            this.labelClass();
            this.userClass();
            this.template();
            this.#context?.invalidate(ChartInvalidationReason.Interaction);
        });
    }
}
