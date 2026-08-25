import { Component, contentChild, DestroyRef, effect, ElementRef, inject, input } from "@angular/core";
import { v4 as uuidv4 } from "uuid";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartReferenceBandRegistration,
    type ChartRegistrationContext
} from "../../internal/context/chart-registration-context";
import { ChartReferenceLabelTemplateDirective } from "../../directives/chart-reference-label-template.directive";
import type {
    ChartAnnotationAxisValue,
    ChartOverlayLayer,
    ChartReferenceLabelPosition
} from "../../models/chart-annotation.models";

@Component({
    selector: "mona-chart-reference-band",
    template: "",
    host: {
        class: "hidden",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class ChartReferenceBandComponent {
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
     * @description Border stroke color of the reference band.
     */
    public readonly borderColor = input<string | undefined>(undefined);
    /**
     * @description Border stroke width of the reference band in pixels.
     */
    public readonly borderWidth = input<number | undefined>(undefined);
    /**
     * @description Fill color of the reference band.
     */
    public readonly fillColor = input<string | undefined>(undefined);
    /**
     * @description Fill opacity of the reference band (0 to 1).
     */
    public readonly fillOpacity = input<number | undefined>(undefined);
    /**
     * @description Starting coordinate value or category key for the reference band.
     */
    public readonly from = input.required<ChartAnnotationAxisValue>();
    /**
     * @description Text label displayed inside or alongside the reference band.
     */
    public readonly label = input("");
    /**
     * @description Custom CSS class name applied to the label badge.
     */
    public readonly labelClass = input("");
    /**
     * @description Pixel offset between the band boundary and the label.
     */
    public readonly labelOffset = input(6);
    /**
     * @description Alignment position for the label: 'start', 'center', or 'end'.
     */
    public readonly labelPosition = input<ChartReferenceLabelPosition>("center");
    /**
     * @description Render layer: 'underlay' (behind series) or 'overlay' (in front of series).
     */
    public readonly layer = input<ChartOverlayLayer>("underlay");
    /**
     * @description Optional custom template for the reference band label.
     */
    public readonly template = contentChild(ChartReferenceLabelTemplateDirective);
    /**
     * @description Ending coordinate value or category key for the reference band.
     */
    public readonly to = input.required<ChartAnnotationAxisValue>();
    /**
     * @description Custom CSS class name applied to the reference band host.
     */
    public readonly userClass = input("", { alias: "class" });
    /**
     * @description Sets whether the reference band is visible.
     */
    public readonly visible = input(true);
    public constructor() {
        if (!this.#context) {
            return;
        }

        const registration: ChartReferenceBandRegistration = {
            axis: this.axis,
            axisId: this.axisId,
            borderColor: this.borderColor,
            borderWidth: this.borderWidth,
            element: this.#elementRef,
            fillColor: this.fillColor,
            fillOpacity: this.fillOpacity,
            from: this.from,
            id: this.#id,
            label: this.label,
            labelClass: this.labelClass,
            labelOffset: this.labelOffset,
            labelPosition: this.labelPosition,
            layer: this.layer,
            template: this.template,
            to: this.to,
            userClass: this.userClass,
            visible: this.visible
        };

        const unregister = this.#context.registerReferenceBand(registration);
        this.#destroyRef.onDestroy(() => {
            unregister();
        });

        effect(() => {
            this.axis();
            this.axisId();
            this.from();
            this.to();
            this.visible();
            this.fillColor();
            this.fillOpacity();
            this.borderColor();
            this.borderWidth();
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
