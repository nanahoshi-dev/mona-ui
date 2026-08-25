import { Component, computed, DestroyRef, effect, inject, input, OnInit, output } from "@angular/core";
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
     * @description Activation trigger gesture ('drag' or 'shift-drag').
     * @default "shift-drag"
     */
    public readonly activation = input<ChartBrushActivation>("shift-drag");
    /**
     * @description Border color of the brush rectangle.
     * @default undefined
     */
    public readonly borderColor = input<string | undefined>(undefined);
    /**
     * @description Border width in pixels of the brush rectangle.
     * @default undefined
     */
    public readonly borderWidth = input<number | undefined>(undefined);
    /**
     * @description Emitted during brush lifecycle phases ('start', 'update', 'end', 'cancel').
     */
    public readonly brushChange = output<ChartBrushChangeEvent>();
    /**
     * @description Whether brush gesture interaction is enabled.
     * @default true
     */
    public readonly enabled = input(true);
    /**
     * @description Background fill color of the brush rectangle.
     * @default undefined
     */
    public readonly fillColor = input<string | undefined>(undefined);
    /**
     * @description Fill opacity of the brush rectangle.
     * @default undefined
     */
    public readonly fillOpacity = input<number | undefined>(undefined);
    /**
     * @description Mark spatial hit policy ('center' or 'intersect').
     * @default "intersect"
     */
    public readonly hitPolicy = input<ChartBrushHitPolicy>("intersect");
    /**
     * @description Stroke dash style of the brush rectangle border ('solid', 'dashed', or 'dotted').
     * @default undefined
     */
    public readonly lineStyle = input<ChartBrushLineStyle | undefined>(undefined);
    /**
     * @description Minimum drag distance in pixels before brush gesture activates.
     * @default 4
     */
    public readonly minDragDistance = input(4);
    /**
     * @description Brush dimension constraint mode ('x', 'y', or 'xy').
     * @default "xy"
     */
    public readonly mode = input<ChartBrushMode>("xy");
    /**
     * @description Selection interaction behavior when brushing over marks.
     * @default "none"
     */
    public readonly selectionBehavior = input<ChartBrushSelectionBehavior>("none");
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
                this.#chartContext?.invalidate(ChartInvalidationReason.Interaction);
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
            borderWidth: computed(() => {
                const w = this.borderWidth();
                return w !== undefined ? Math.max(0, w) : undefined;
            }),
            emitBrushChange: event => this.brushChange.emit(event),
            enabled: this.enabled,
            fillColor: this.fillColor,
            fillOpacity: computed(() => {
                const o = this.fillOpacity();
                return o !== undefined ? Math.max(0, Math.min(1, o)) : undefined;
            }),
            hitPolicy: this.hitPolicy,
            lineStyle: computed(() => this.lineStyle() ?? "solid"),
            minDragDistance: computed(() => Math.max(0, this.minDragDistance())),
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
