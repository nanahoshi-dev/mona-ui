import {
    Component,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input
} from "@angular/core";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartCrosshairRegistration,
    type ChartRegistrationContext
} from "../../internal/context/chart-registration-context";
import { ChartCrosshairLabelTemplateDirective } from "../../directives/chart-crosshair-label-template.directive";
import type {
    ChartCrosshairLineStyle,
    ChartCrosshairMode,
    ChartCrosshairSnapMode
} from "../../models/chart-crosshair.models";

@Component({
    selector: "mona-chart-crosshair",
    template: "",
    host: {
        class: "hidden",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class ChartCrosshairComponent {
    readonly #context = inject<ChartRegistrationContext | null>(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    /**
     * @description Stroke color for the crosshair line.
     */
    public readonly color = input<string | undefined>(undefined);
    /**
     * @description Sets whether crosshair interaction is enabled.
     */
    public readonly enabled = input(true);
    /**
     * @description Pixel offset between axis line and crosshair label badge.
     */
    public readonly labelOffset = input<number>(4);
    /**
     * @description Line dash style for the crosshair.
     */
    public readonly lineStyle = input<ChartCrosshairLineStyle>("dashed");
    /**
     * @description Line stroke width in pixels.
     */
    public readonly lineWidth = input<number | undefined>(undefined);
    /**
     * @description Maximum pixel distance for nearest mark snapping.
     */
    public readonly maxSnapDistance = input<number>(32);
    /**
     * @description Crosshair display mode: auto (follows interaction axis), x, y, or xy.
     */
    public readonly mode = input<ChartCrosshairMode>("auto");
    /**
     * @description Stroke opacity for the crosshair line (0 to 1).
     */
    public readonly opacity = input<number | undefined>(undefined);
    /**
     * @description Sets whether axis value badges are displayed.
     */
    public readonly showAxisLabels = input(true);
    /**
     * @description Sets whether the X axis label badge is displayed.
     */
    public readonly showXLabel = input<boolean | undefined>(undefined);
    /**
     * @description Sets whether the Y axis label badge is displayed.
     */
    public readonly showYLabel = input<boolean | undefined>(undefined);
    /**
     * @description Snapping mode: nearest semantic mark or raw pointer position.
     */
    public readonly snap = input<ChartCrosshairSnapMode>("nearest");
    /**
     * @description Optional custom template for crosshair axis labels.
     */
    public readonly template = contentChild(ChartCrosshairLabelTemplateDirective);
    /**
     * @description Custom CSS class name applied to the crosshair.
     */
    public readonly userClass = input("", { alias: "class" });
    /**
     * @description Explicit target X axis identifier.
     */
    public readonly xAxisId = input<string | undefined>(undefined);

    /**
     * @description Explicit target Y axis identifier.
     */
    public readonly yAxisId = input<string | undefined>(undefined);
    public constructor() {
        if (!this.#context) {
            return;
        }

        const registration: ChartCrosshairRegistration = {
            color: this.color,
            element: this.#elementRef,
            enabled: this.enabled,
            labelOffset: this.labelOffset,
            lineStyle: this.lineStyle,
            lineWidth: this.lineWidth,
            maxSnapDistance: this.maxSnapDistance,
            mode: this.mode,
            opacity: this.opacity,
            showAxisLabels: this.showAxisLabels,
            showXLabel: this.showXLabel,
            showYLabel: this.showYLabel,
            snap: this.snap,
            template: this.template,
            userClass: this.userClass,
            xAxisId: this.xAxisId,
            yAxisId: this.yAxisId
        };

        const unregister = this.#context.registerCrosshair(registration);
        this.#destroyRef.onDestroy(() => {
            unregister();
        });

        effect(() => {
            this.enabled();
            this.mode();
            this.snap();
            this.xAxisId();
            this.yAxisId();
            this.showAxisLabels();
            this.showXLabel();
            this.showYLabel();
            this.lineStyle();
            this.lineWidth();
            this.color();
            this.opacity();
            this.maxSnapDistance();
            this.labelOffset();
            this.userClass();
            this.template();
            this.#context?.invalidate(ChartInvalidationReason.Interaction);
        });
    }
}
