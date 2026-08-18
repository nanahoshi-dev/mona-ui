import { Component, computed, DestroyRef, effect, ElementRef, inject, input, model, OnInit } from "@angular/core";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason, type ChartOhlcSeriesRegistration } from "../../internal/context/chart-registration-context";
import type { ChartAxisFormatter } from "../../models/chart-axis.models";
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
export class MonaOhlcSeriesComponent implements OnInit {
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
     * @description Length in pixels for horizontal open and close tick arms.
     * @default undefined
     */
    public readonly tickLength = input<number | undefined>(undefined);

    /**
     * @description Backward-compatible alias for tickLength.
     * @default undefined
     */
    public readonly tickWidth = input<number | undefined>(undefined);

    protected readonly effectiveTickLength = computed(() => this.tickLength() ?? this.tickWidth());

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
     * @description Whether the series is currently visible.
     * @default true
     */
    public readonly visible = model(true);

    /**
     * @description Optional color override for the vertical high-low stem.
     * @default undefined
     */
    public readonly wickColor = input<string | undefined>(undefined);

    /**
     * @description Stroke width in pixels for the vertical high-low stem.
     * @default 1
     */
    public readonly wickWidth = input(1);

    /**
     * @description Property key or accessor extracting the X-axis coordinate or timestamp for each data item.
     * @default undefined
     */
    public readonly xField = input<ChartField | undefined>(undefined);

    public constructor() {
        effect(() => {
            this.closeField();
            this.data();
            this.highField();
            this.keyField();
            this.lowField();
            this.openField();
            this.xField();
            this.#chartContext?.invalidate(ChartInvalidationReason.Data);
        });

        effect(() => {
            this.bodyWidth();
            this.bodyWidthRatio();
            this.color();
            this.fallingColor();
            this.maxBodyWidth();
            this.name();
            this.neutralColor();
            this.opacity();
            this.risingColor();
            this.effectiveTickLength();
            this.userClass();
            this.valueFormatter();
            this.visible();
            this.wickColor();
            this.wickWidth();
            this.#chartContext?.invalidate(ChartInvalidationReason.Style);
        });
    }

    public ngOnInit(): void {
        const registration: ChartOhlcSeriesRegistration = {
            bodyWidth: this.bodyWidth,
            bodyWidthRatio: this.bodyWidthRatio,
            closeField: this.closeField,
            color: this.color,
            data: this.data,
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
            tickLength: this.effectiveTickLength,
            tickWidth: this.effectiveTickLength,
            type: "ohlc",
            userClass: this.userClass,
            valueFormatter: this.valueFormatter,
            visible: this.visible,
            wickColor: this.wickColor,
            wickWidth: this.wickWidth,
            xField: this.xField
        };

        const unregister = this.#chartContext?.registerSeries(registration);
        this.#destroyRef.onDestroy(() => {
            unregister?.();
        });
    }
}
