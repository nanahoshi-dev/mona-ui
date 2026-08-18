import {
    Component,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    model,
    OnInit,
    signal
} from "@angular/core";
import { ImmutableSet } from "@mirei/ts-collections";
import { ChartWaterfallLabelTemplateDirective } from "../../directives/chart-waterfall-label-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartWaterfallSeriesRegistration
} from "../../internal/context/chart-registration-context";
import type { ChartField, ChartValueFormatter } from "../../models/chart.models";

let nextWaterfallSeriesId = 0;

@Component({
    selector: "mona-waterfall-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class WaterfallSeriesComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #seriesId = `mona-waterfall-series-${++nextWaterfallSeriesId}`;
    readonly #hiddenKinds = signal<ImmutableSet<string>>(ImmutableSet.create());
    readonly #visibilityRevision = signal(0);
    #registered = false;

    public constructor() {
        effect(() => {
            this.visible();
            this.#visibilityRevision();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Visibility);
            }
        });

        effect(() => {
            this.data();
            this.field();
            this.kindField();
            this.xField();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Data);
            }
        });

        effect(() => {
            this.borderRadius();
            this.maxBarWidth();
            this.maxLabels();
            this.minLabelWidth();
            this.name();
            this.showConnectors();
            this.showLabels();
            this.startValue();
            this.valueFormatter();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Layout);
            }
        });

        effect(() => {
            this.connectorColor();
            this.connectorWidth();
            this.decreaseColor();
            this.fillOpacity();
            this.increaseColor();
            this.neutralColor();
            this.strokeColor();
            this.strokeWidth();
            this.subtotalColor();
            this.totalColor();
            this.userClass();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Style);
            }
        });
    }

    /**
     * @description Corner radius in pixels applied to the four corners of waterfall bars.
     * @default undefined
     */
    public readonly borderRadius = input<number | undefined>(undefined);

    /**
     * @description Color of the horizontal connector lines joining consecutive bars.
     * @default ""
     */
    public readonly connectorColor = input<string>("");

    /**
     * @description Line width in pixels of the connector lines between steps.
     * @default undefined
     */
    public readonly connectorWidth = input<number | undefined>(undefined);

    /**
     * @description Array of step data items overriding chart-level root data.
     * @default undefined
     */
    public readonly data = input<readonly unknown[] | undefined>(undefined);

    /**
     * @description Fill color for negative change steps (decreases).
     * @default ""
     */
    public readonly decreaseColor = input<string>("");

    /**
     * @description Property key or accessor function extracting the numeric value/delta for each step.
     * @default "value"
     */
    public readonly field = input<ChartField>("value");

    /**
     * @description Fill opacity applied to waterfall bars (0 to 1).
     * @default undefined
     */
    public readonly fillOpacity = input<number | undefined>(undefined);

    /**
     * @description Fill color for positive change steps (increases).
     * @default ""
     */
    public readonly increaseColor = input<string>("");

    /**
     * @description Property key or accessor extracting step kind ('change' | 'subtotal' | 'total').
     * @default "kind"
     */
    public readonly kindField = input<ChartField | undefined>("kind");

    /**
     * @description Custom ng-template directive for custom waterfall step label rendering.
     * @default undefined
     */
    public readonly labelTemplate = contentChild(ChartWaterfallLabelTemplateDirective);

    /**
     * @description Maximum width in pixels for waterfall bars.
     * @default undefined
     */
    public readonly maxBarWidth = input<number | undefined>(undefined);

    /**
     * @description Maximum number of visible step labels rendered simultaneously.
     * @default 100
     */
    public readonly maxLabels = input<number>(100);

    /**
     * @description Minimum bar width in pixels required to render its value label.
     * @default undefined
     */
    public readonly minLabelWidth = input<number | undefined>(undefined);

    /**
     * @description Descriptive series name displayed in chart legend and tooltips.
     * @default "Waterfall"
     */
    public readonly name = input<string>("Waterfall");

    /**
     * @description Fill color for zero-change steps.
     * @default ""
     */
    public readonly neutralColor = input<string>("");

    /**
     * @description Controls whether horizontal connector lines are drawn between steps.
     * @default true
     */
    public readonly showConnectors = input<boolean>(true);

    /**
     * @description Controls whether built-in value text labels are rendered.
     * @default true
     */
    public readonly showLabels = input<boolean>(true);

    /**
     * @description Starting cumulative baseline value before the first step.
     * @default 0
     */
    public readonly startValue = input<number>(0);

    /**
     * @description Stroke outline color for waterfall bars.
     * @default ""
     */
    public readonly strokeColor = input<string>("");

    /**
     * @description Stroke width in pixels for waterfall bars.
     * @default undefined
     */
    public readonly strokeWidth = input<number | undefined>(undefined);

    /**
     * @description Fill color for subtotal steps that anchor to baseline without resetting cumulative count.
     * @default ""
     */
    public readonly subtotalColor = input<string>("");

    /**
     * @description Fill color for final total summary steps.
     * @default ""
     */
    public readonly totalColor = input<string>("");

    /**
     * @description CSS class name applied to the hidden series host element for custom styling hooks.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Custom formatter function for numeric values.
     * @default undefined
     */
    public readonly valueFormatter = input<ChartValueFormatter | undefined>(undefined);

    /**
     * @description Controls overall visibility of the waterfall series.
     * @default true
     */
    public readonly visible = model<boolean>(true);

    /**
     * @description Property key or accessor extracting category / step names.
     * @default "category"
     */
    public readonly xField = input<ChartField | undefined>("category");

    public isDatumVisible(kind: string): boolean {
        this.#visibilityRevision();
        return !this.#hiddenKinds().contains(kind);
    }

    public toggleDatumVisibility(kind: string): boolean {
        const current = this.#hiddenKinds();
        const next = current.contains(kind) ? current.remove(kind) : current.add(kind);
        this.#hiddenKinds.set(next);
        this.#visibilityRevision.update(r => r + 1);
        this.#chartContext?.invalidate(ChartInvalidationReason.Visibility);
        return !next.contains(kind);
    }

    public ngOnInit(): void {
        if (!this.#chartContext) {
            return;
        }

        const registration: ChartWaterfallSeriesRegistration = {
            borderRadius: this.borderRadius,
            connectorColor: this.connectorColor,
            connectorWidth: this.connectorWidth,
            data: this.data,
            datumVisibilityRevision: this.#visibilityRevision.asReadonly(),
            decreaseColor: this.decreaseColor,
            element: this.#elementRef,
            field: this.field,
            fillOpacity: this.fillOpacity,
            id: this.#seriesId,
            increaseColor: this.increaseColor,
            isDatumVisible: (kind: string) => this.isDatumVisible(kind),
            kindField: this.kindField,
            labelTemplate: this.labelTemplate,
            maxBarWidth: this.maxBarWidth,
            maxLabels: this.maxLabels,
            minLabelWidth: this.minLabelWidth,
            name: this.name,
            neutralColor: this.neutralColor,
            showConnectors: this.showConnectors,
            showLabels: this.showLabels,
            startValue: this.startValue,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            subtotalColor: this.subtotalColor,
            toggleDatumVisibility: (kind: string) => this.toggleDatumVisibility(kind),
            totalColor: this.totalColor,
            type: "waterfall",
            userClass: this.userClass,
            valueFormatter: this.valueFormatter,
            visible: this.visible,
            xField: this.xField
        };

        const unregister = this.#chartContext.registerSeries(registration);
        this.#registered = true;
        this.#destroyRef.onDestroy(() => {
            this.#registered = false;
            unregister();
        });
    }
}
