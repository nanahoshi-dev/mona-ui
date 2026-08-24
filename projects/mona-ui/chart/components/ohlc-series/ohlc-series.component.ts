import { Component, computed, contentChild, DestroyRef, effect, ElementRef, inject, input, model, OnInit } from "@angular/core";
import { ChartDataLabelTemplateDirective } from "../../directives/chart-data-label-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartOhlcSeriesRegistration
} from "../../internal/context/chart-registration-context";
import type { ChartAxisFormatter } from "../../models/chart-axis.models";
import type { ChartDataLabelsInput } from "../../models/chart-data-label.models";
import type { ChartField } from "../../models/chart.models";

let nextSeriesId = 0;

@Component({
    selector: "mona-ohlc-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class OhlcSeriesComponent implements OnInit {
    protected readonly effectiveTickLength = computed(() => this.tickLength() ?? this.tickWidth());
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #id = `mona-ohlc-series-${++nextSeriesId}`;

    /**
     * @description Explicit total width in pixels for open/close tick arms.
     * @default undefined
     */
    public readonly bodyWidth = input<number | undefined>(undefined);

    /**
     * @description Ratio of available category slot or mark spacing allocated to open/close tick arms (0.0 to 1.0).
     * @default 0.7
     */
    public readonly bodyWidthRatio = input(0.7);

    /**
     * @description Property key or accessor extracting the closing price for each data item.
     */
    public readonly closeField = input.required<ChartField>();

    /**
     * @description Optional color override applied uniformly across all OHLC ticks and stems.
     * @default undefined
     */
    public readonly color = input<string | undefined>(undefined);

    /**
     * @description Series-specific dataset overriding the root chart data.
     * @default undefined
     */
    public readonly data = input<readonly unknown[] | undefined>(undefined);
    public readonly dataLabelTemplate = contentChild(ChartDataLabelTemplateDirective);
    /**
     * @description Data label display options or boolean flag enabling default labels.
     * @default false
     */
    public readonly dataLabels = input<ChartDataLabelsInput>(false);
    /**
     * @description Color for falling / bearish bars (close < open).
     * @default ""
     */
    public readonly fallingColor = input("");

    /**
     * @description Property key or accessor extracting the highest price for each data item.
     */
    public readonly highField = input.required<ChartField>();

    /**
     * @description Property key or accessor extracting a stable datum identity across updates.
     * @default undefined
     */
    public readonly keyField = input<ChartField | undefined>(undefined);

    /**
     * @description Property key or accessor extracting the lowest price for each data item.
     */
    public readonly lowField = input.required<ChartField>();

    /**
     * @description Maximum total tick width in pixels.
     * @default 32
     */
    public readonly maxBodyWidth = input(32);

    /**
     * @description Name of the series displayed in legends, tooltips, and live region announcements.
     * @default "OHLC"
     */
    public readonly name = input("OHLC");

    /**
     * @description Color for neutral / flat bars (close === open).
     * @default ""
     */
    public readonly neutralColor = input("");

    /**
     * @description Overall opacity multiplier applied to OHLC stems and tick arms.
     * @default undefined
     */
    public readonly opacity = input<number | undefined>(undefined);

    /**
     * @description Property key or accessor extracting the opening price for each data item.
     */
    public readonly openField = input.required<ChartField>();

    /**
     * @description Color for rising / bullish bars (close > open).
     * @default ""
     */
    public readonly risingColor = input("");

    /**
     * @description Optional stable key identifying this series for mark identity and selection across updates.
     * @default undefined
     */
    public readonly seriesKey = input<string | undefined>(undefined);

    /**
     * @description Length in pixels for horizontal open and close tick arms.
     * @default undefined
     */
    public readonly tickLength = input<number | undefined>(undefined);

    /**
     * @description Backward-compatible alias for tickLength.
     * @default undefined
     */
    public readonly tickWidth = input<number | undefined>(undefined);
    /**
     * @description Additional CSS classes applied to the series host element.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Formatter callback transforming financial numeric values into custom display strings.
     * @default undefined
     */
    public readonly valueFormatter = input<ChartAxisFormatter | undefined>(undefined);

    /**
     * @description Whether the series is currently visible on the chart and in calculations.
     * @default true
     */
    public readonly visible = model(true);

    /**
     * @description Explicit stroke color for the central vertical stem.
     * @default ""
     */
    public readonly wickColor = input("");

    /**
     * @description Pixel stroke width for OHLC stems and tick arms.
     * @default 1
     */
    public readonly wickWidth = input(1);

    /**
     * @description Optional ID of the Cartesian X axis this series binds to. When omitted, the primary X axis is used.
     * @default undefined
     */
    public readonly xAxisId = input<string | undefined>(undefined);

    /**
     * @description Property key or accessor extracting the X coordinate, overriding the root chart X field.
     * @default undefined
     */
    public readonly xField = input<ChartField | undefined>(undefined);

    /**
     * @description Optional ID of the Cartesian Y axis this series binds to. When omitted, the primary Y axis is used.
     * @default undefined
     */
    public readonly yAxisId = input<string | undefined>(undefined);

    #registered = false;

    public constructor() {
        effect(() => {
            this.closeField();
            this.data();
            this.highField();
            this.keyField();
            this.lowField();
            this.openField();
            this.seriesKey();
            this.xField();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Data);
            }
        });

        effect(() => {
            this.visible();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Visibility);
            }
        });

        effect(() => {
            this.bodyWidth();
            this.bodyWidthRatio();
            this.maxBodyWidth();
            this.name();
            this.effectiveTickLength();
            this.valueFormatter();
            this.wickWidth();
            this.xAxisId();
            this.yAxisId();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Layout);
            }
        });

        effect(() => {
            this.color();
            this.fallingColor();
            this.neutralColor();
            this.opacity();
            this.risingColor();
            this.userClass();
            this.wickColor();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Style);
            }
        });

        effect(() => {
            this.dataLabels();
            this.dataLabelTemplate();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Interaction);
            }
        });
    }

    public ngOnInit(): void {
        const registration: ChartOhlcSeriesRegistration = {
            bodyWidth: this.bodyWidth,
            bodyWidthRatio: this.bodyWidthRatio,
            closeField: this.closeField,
            color: this.color,
            data: this.data,
            dataLabels: this.dataLabels,
            dataLabelTemplate: this.dataLabelTemplate,
            element: this.#elementRef,
            fallingColor: this.fallingColor,
            highField: this.highField,
            id: this.#id,
            keyField: this.keyField,
            lowField: this.lowField,
            maxBodyWidth: this.maxBodyWidth,
            name: this.name,
            neutralColor: this.neutralColor,
            opacity: this.opacity,
            openField: this.openField,
            risingColor: this.risingColor,
            seriesKey: this.seriesKey,
            tickLength: this.effectiveTickLength,
            tickWidth: this.effectiveTickLength,
            type: "ohlc",
            userClass: this.userClass,
            valueFormatter: this.valueFormatter,
            visible: this.visible,
            wickColor: this.wickColor,
            wickWidth: this.wickWidth,
            xAxisId: this.xAxisId,
            xField: this.xField,
            yAxisId: this.yAxisId
        };

        const unregister = this.#chartContext?.registerSeries(registration);
        this.#registered = true;
        this.#destroyRef.onDestroy(() => {
            unregister?.();
        });
    }
}
