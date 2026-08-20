import { Component, DestroyRef, effect, inject, input, OnInit, output } from "@angular/core";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type {
    ChartBrushActivation,
    ChartBrushChangeEvent,
    ChartBrushHitPolicy,
    ChartBrushLineStyle,
    ChartBrushMode,
    ChartBrushSelectionBehavior
} from "../../models/chart-brush.models";

@Component({
    selector: "mona-chart-brush",
    template: "",
    host: {
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class ChartBrushComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);

    /**
     * @description Whether brush gesture interaction is enabled.
     * @default true
     */
    public readonly enabled = input(true);

    /**
     * @description Brush dimension constraint mode ('x', 'y', or 'xy').
     * @default "xy"
     */
    public readonly mode = input<ChartBrushMode>("xy");

    /**
     * @description Activation trigger gesture ('drag' or 'shift-drag').
     * @default "drag"
     */
    public readonly activation = input<ChartBrushActivation>("drag");

    /**
     * @description Optional Cartesian X axis ID to target.
     * @default undefined
     */
    public readonly xAxisId = input<string | undefined>(undefined);

    /**
     * @description Optional Cartesian Y axis ID to target.
     * @default undefined
     */
    public readonly yAxisId = input<string | undefined>(undefined);

    /**
     * @description Minimum drag distance in pixels before brush gesture activates.
     * @default 4
     */
    public readonly minDragDistance = input(4);

    /**
     * @description Mark spatial hit policy ('center', 'intersect', or 'contain').
     * @default "intersect"
     */
    public readonly hitPolicy = input<ChartBrushHitPolicy>("intersect");

    /**
     * @description Selection interaction behavior when brushing over marks.
     * @default "none"
     */
    public readonly selectionBehavior = input<ChartBrushSelectionBehavior>("none");

    /**
     * @description Background fill color of the brush rectangle.
     * @default "#3b82f6"
     */
    public readonly fillColor = input("#3b82f6");

    /**
     * @description Fill opacity of the brush rectangle.
     * @default 0.15
     */
    public readonly fillOpacity = input(0.15);

    /**
     * @description Border color of the brush rectangle.
     * @default "#3b82f6"
     */
    public readonly borderColor = input("#3b82f6");

    /**
     * @description Border width in pixels of the brush rectangle.
     * @default 1
     */
    public readonly borderWidth = input(1);

    /**
     * @description Stroke dash style of the brush rectangle border ('solid', 'dashed', or 'dotted').
     * @default "solid"
     */
    public readonly lineStyle = input<ChartBrushLineStyle>("solid");

    /**
     * @description Emitted during brush lifecycle phases ('start', 'move', 'end', 'cancel').
     */
    public readonly brushChange = output<ChartBrushChangeEvent>();

    #registered = false;

    public constructor() {
        effect(() => {
            this.enabled();
            this.mode();
            this.activation();
            this.xAxisId();
            this.yAxisId();
            this.minDragDistance();
            this.hitPolicy();
            this.selectionBehavior();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Interaction);
            }
        });

        effect(() => {
            this.fillColor();
            this.fillOpacity();
            this.borderColor();
            this.borderWidth();
            this.lineStyle();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Style);
            }
        });
    }

    public ngOnInit(): void {
        if (!this.#chartContext) {
            return;
        }

        this.#registered = true;

        const unregister = this.#chartContext.registerBrush({
            activation: this.activation,
            borderColor: this.borderColor,
            borderWidth: this.borderWidth,
            emitBrushChange: event => this.brushChange.emit(event),
            enabled: this.enabled,
            fillColor: this.fillColor,
            fillOpacity: this.fillOpacity,
            hitPolicy: this.hitPolicy,
            lineStyle: this.lineStyle,
            minDragDistance: this.minDragDistance,
            mode: this.mode,
            selectionBehavior: this.selectionBehavior,
            xAxisId: this.xAxisId,
            yAxisId: this.yAxisId
        });

        this.#destroyRef.onDestroy(() => {
            unregister();
        });
    }
}
