import {
    Component,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input
} from "@angular/core";
import { v4 as uuidv4 } from "uuid";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartAnnotationRegistration,
    type ChartRegistrationContext
} from "../../internal/context/chart-registration-context";
import { ChartAnnotationLabelTemplateDirective } from "../../directives/chart-annotation-label-template.directive";
import type {
    ChartAnnotationAxisValue,
    ChartAnnotationLabelPlacement,
    ChartAnnotationMarker
} from "../../models/chart-annotation.models";

@Component({
    selector: "mona-chart-annotation",
    template: "",
    host: {
        class: "hidden",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class ChartAnnotationComponent {
    readonly #context = inject<ChartRegistrationContext | null>(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #id = uuidv4();

    /**
     * @description X coordinate value or category key for the annotation anchor.
     */
    public readonly x = input.required<ChartAnnotationAxisValue>();

    /**
     * @description Y coordinate value or category key for the annotation anchor.
     */
    public readonly y = input.required<ChartAnnotationAxisValue>();

    /**
     * @description Explicit target X axis identifier. Defaults to primary X axis.
     */
    public readonly xAxisId = input<string | undefined>(undefined);

    /**
     * @description Explicit target Y axis identifier. Defaults to primary Y axis.
     */
    public readonly yAxisId = input<string | undefined>(undefined);

    /**
     * @description Sets whether the annotation is visible.
     */
    public readonly visible = input(true);

    /**
     * @description Text label displayed for the annotation.
     */
    public readonly label = input("");

    /**
     * @description Custom data object provided to template context.
     */
    public readonly data = input<unknown>(undefined);

    /**
     * @description Stroke and marker color for the annotation.
     */
    public readonly color = input<string | undefined>(undefined);

    /**
     * @description Marker shape drawn at the anchor point: 'circle', 'diamond', or 'none'.
     */
    public readonly marker = input<ChartAnnotationMarker>("circle");

    /**
     * @description Marker radius in pixels.
     */
    public readonly markerRadius = input<number>(4);

    /**
     * @description Marker stroke width in pixels.
     */
    public readonly markerStrokeWidth = input<number>(1.5);

    /**
     * @description Sets whether a connector line is drawn between the anchor point and the label.
     */
    public readonly connector = input(true);

    /**
     * @description Connector stroke width in pixels.
     */
    public readonly connectorWidth = input<number>(1);

    /**
     * @description Relative placement of the label from the anchor point: 'top', 'bottom', 'left', or 'right'.
     */
    public readonly labelPlacement = input<ChartAnnotationLabelPlacement>("top");

    /**
     * @description Additional horizontal pixel offset for label positioning.
     */
    public readonly offsetX = input(0);

    /**
     * @description Additional vertical pixel offset for label positioning.
     */
    public readonly offsetY = input(-12);

    /**
     * @description Custom CSS class name applied to the label badge.
     */
    public readonly labelClass = input("");

    /**
     * @description Custom CSS class name applied to the annotation host.
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Optional custom template for the annotation label.
     */
    public readonly template = contentChild(ChartAnnotationLabelTemplateDirective);

    public constructor() {
        if (!this.#context) {
            return;
        }

        const registration: ChartAnnotationRegistration = {
            color: this.color,
            connector: this.connector,
            connectorWidth: this.connectorWidth,
            data: this.data,
            element: this.#elementRef,
            id: this.#id,
            label: this.label,
            labelClass: this.labelClass,
            labelPlacement: this.labelPlacement,
            marker: this.marker,
            markerRadius: this.markerRadius,
            markerStrokeWidth: this.markerStrokeWidth,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            template: this.template,
            userClass: this.userClass,
            visible: this.visible,
            x: this.x,
            xAxisId: this.xAxisId,
            y: this.y,
            yAxisId: this.yAxisId
        };

        const unregister = this.#context.registerAnnotation(registration);
        this.#destroyRef.onDestroy(() => {
            unregister();
        });

        effect(() => {
            this.x();
            this.y();
            this.xAxisId();
            this.yAxisId();
            this.visible();
            this.label();
            this.data();
            this.color();
            this.marker();
            this.markerRadius();
            this.markerStrokeWidth();
            this.connector();
            this.connectorWidth();
            this.labelPlacement();
            this.offsetX();
            this.offsetY();
            this.labelClass();
            this.userClass();
            this.template();
            this.#context?.invalidate(ChartInvalidationReason.Interaction);
        });
    }
}
