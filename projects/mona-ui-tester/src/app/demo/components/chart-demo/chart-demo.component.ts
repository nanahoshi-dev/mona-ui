import { Component, computed, inject, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    ChartAxisLabelTemplateDirective,
    ChartCenterTemplateDirective,
    ChartFunnelLabelTemplateDirective,
    ChartGaugeCenterTemplateDirective,
    ChartLegendItemTemplateDirective,
    ChartNoDataTemplateDirective,
    ChartSliceLabelTemplateDirective,
    ChartSubtitleTemplateDirective,
    ChartTitleTemplateDirective,
    ChartTooltipTemplateDirective,
    ChartTreemapLabelTemplateDirective,
    ChartWaterfallLabelTemplateDirective,
    AreaSeriesComponent,
    BarSeriesComponent,
    BubbleSeriesComponent,
    CandlestickSeriesComponent,
    ChartAngularAxisComponent,
    ChartComponent,
    ChartLegendComponent,
    ChartRadialAxisComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    DonutSeriesComponent,
    FunnelSeriesComponent,
    GaugeSeriesComponent,
    HeatmapSeriesComponent,
    LineSeriesComponent,
    OhlcSeriesComponent,
    PieSeriesComponent,
    PolarSeriesComponent,
    RadarSeriesComponent,
    RadialBarSeriesComponent,
    RangeAreaSeriesComponent,
    RangeBarSeriesComponent,
    RoseSeriesComponent,
    ScatterSeriesComponent,
    TreemapSeriesComponent,
    WaterfallSeriesComponent,
    type ChartAreaFillMode,
    type ChartAxisLabelRotation,
    type ChartBarOrientation,
    type ChartCurve,
    type ChartFinancialFillMode,
    type ChartFunnelLabelContent,
    type ChartFunnelOrientation,
    type ChartFunnelStageVisibilityEvent,
    type ChartGaugeIndicator,
    type ChartHeaderAlignment,
    type ChartHeatmapColorMode,
    type ChartPointEvent,
    type ChartPointFocusEvent,
    type ChartPolarFillMode,
    type ChartPolarLabelContent,
    type ChartPolarLabelPosition,
    type ChartRadialArcFillMode,
    type ChartRadialCurve,
    type ChartRadialFillMode,
    type ChartRadialGridShape,
    type ChartRoseScaleMode,
    type ChartSeriesVisibilityEvent,
    type ChartSliceVisibilityEvent,
    type ChartTreemapLabelTemplateContext,
    type ChartTreemapNodeVisibilityEvent,
    type ChartTreemapSort,
    type ChartTreemapTile
} from "@nanahoshi/mona-ui/chart";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import { TabComponent, TabContentTemplateDirective, TabsComponent } from "@nanahoshi/mona-ui/tabs";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { ThemeService } from "@nanahoshi/mona-ui/theme";

interface DemoLogEntry {
    readonly details: string;
    readonly eventType: string;
    readonly id: number;
    readonly timestamp: string;
}

interface MonthlyMetric {
    readonly actual: number;
    readonly forecast: number;
    readonly month: string;
    readonly target: number;
}

interface TimePointMetric {
    readonly cpu: number;
    readonly memory: number;
    readonly timestamp: Date;
}

interface MarketShareDatum {
    readonly category: string;
    readonly color?: string;
    readonly value: number;
}

interface SkillMetric {
    readonly mage: number;
    readonly metric: string;
    readonly rogue: number;
    readonly warrior: number;
}

interface SignalDataPoint {
    readonly angle: number;
    readonly gain: number | null;
    readonly noise: number | null;
}

interface ScatterDataPoint {
    readonly height: number;
    readonly id?: string;
    readonly weight: number;
    readonly wingspan: number;
}

interface BubbleDataPoint {
    readonly country: string;
    readonly gdp: number;
    readonly id?: string;
    readonly lifeExp: number;
    readonly population: number;
}

@Component({
    imports: [
        ButtonDirective,
        CheckBoxComponent,
        DropdownListComponent,
        TextBoxComponent,
        NumericTextBoxComponent,
        ChartComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ChartAngularAxisComponent,
        ChartRadialAxisComponent,
        LineSeriesComponent,
        AreaSeriesComponent,
        BarSeriesComponent,
        PieSeriesComponent,
        DonutSeriesComponent,
        RadarSeriesComponent,
        PolarSeriesComponent,
        ScatterSeriesComponent,
        BubbleSeriesComponent,
        CandlestickSeriesComponent,
        OhlcSeriesComponent,
        RangeBarSeriesComponent,
        RangeAreaSeriesComponent,
        HeatmapSeriesComponent,
        RadialBarSeriesComponent,
        RoseSeriesComponent,
        GaugeSeriesComponent,
        ChartGaugeCenterTemplateDirective,
        TreemapSeriesComponent,
        ChartTreemapLabelTemplateDirective,
        FunnelSeriesComponent,
        ChartFunnelLabelTemplateDirective,
        WaterfallSeriesComponent,
        ChartWaterfallLabelTemplateDirective,
        ChartLegendComponent,
        ChartTooltipComponent,
        ChartAxisLabelTemplateDirective,
        ChartLegendItemTemplateDirective,
        ChartNoDataTemplateDirective,
        ChartTooltipTemplateDirective,
        ChartSliceLabelTemplateDirective,
        ChartCenterTemplateDirective,
        ChartTitleTemplateDirective,
        ChartSubtitleTemplateDirective,
        TabsComponent,
        TabComponent,
        TabContentTemplateDirective
    ],
    selector: "app-chart-demo",
    templateUrl: "./chart-demo.component.html"
})
export class ChartDemoComponent {
    readonly #themeService = inject(ThemeService, { optional: true });
    #logId: number = 0;

    protected readonly activeTab = signal<
        | "bubble"
        | "candlestick"
        | "custom"
        | "donut"
        | "funnel"
        | "gauge"
        | "grouped"
        | "heatmap"
        | "horizontal"
        | "mixed"
        | "ohlc"
        | "percent-area"
        | "percent-bar"
        | "pie"
        | "polar"
        | "radar"
        | "radial-bar"
        | "range-area"
        | "range-bar"
        | "rose"
        | "scatter"
        | "stacked-area"
        | "stacked-bar"
        | "time"
        | "treemap"
        | "waterfall"
    >("mixed");
    protected readonly animationEnabled = signal<boolean>(true);

    // Chart Title & Subtitle Controls
    protected readonly chartTitle = signal<string>("Quarterly Revenue & Targets");
    protected readonly chartSubtitle = signal<string>("Comparison across regional performance metrics");
    protected readonly chartTitleAlign = signal<ChartHeaderAlignment>("left");
    protected readonly titleAlignOptions: readonly { label: string; value: ChartHeaderAlignment }[] = [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" }
    ];
    protected readonly useCustomTitleTemplate = signal<boolean>(false);

    // Bar Orientation Controls
    protected readonly barOrientation = signal<ChartBarOrientation>("vertical");
    protected readonly barOrientationOptions: readonly { label: string; value: ChartBarOrientation }[] = [
        { label: "Vertical", value: "vertical" },
        { label: "Horizontal", value: "horizontal" }
    ];

    // Axis Presentation Controls
    protected readonly xAxisLabels = signal<boolean>(true);
    protected readonly yAxisLabels = signal<boolean>(true);
    protected readonly xAxisLabelRotation = signal<ChartAxisLabelRotation>(0);
    protected readonly yAxisLabelRotation = signal<ChartAxisLabelRotation>(0);
    protected readonly labelRotationOptions: readonly { label: string; value: ChartAxisLabelRotation }[] = [
        { label: "0° (Horizontal)", value: 0 },
        { label: "45° Angle", value: 45 },
        { label: "90° (Vertical)", value: 90 },
        { label: "-45° Angle", value: -45 },
        { label: "-90° (Vertical)", value: -90 },
        { label: "Auto Rotation / Thinning", value: "auto" }
    ];
    protected readonly xAxisTickMarks = signal<boolean>(false);
    protected readonly yAxisTickMarks = signal<boolean>(false);
    protected readonly xAxisTickSize = signal<number>(6);
    protected readonly yAxisTickSize = signal<number>(6);
    protected readonly xAxisLabelMaxWidth = signal<number | undefined>(undefined);
    protected readonly xAxisLabelPadding = signal<number>(4);
    protected readonly yAxisLabelPadding = signal<number>(6);

    // Candlestick & OHLC Chart Data & Controls
    protected readonly candlestickData = signal<
        readonly { close: number; date: string; high: number; low: number; open: number }[]
    >([
        { close: 104, date: "2026-03-01", high: 108, low: 98, open: 100 },
        { close: 102, date: "2026-03-02", high: 107, low: 100, open: 105 },
        { close: 112, date: "2026-03-03", high: 115, low: 101, open: 102 },
        { close: 110, date: "2026-03-04", high: 116, low: 108, open: 112 },
        { close: 118, date: "2026-03-05", high: 122, low: 109, open: 110 },
        { close: 118, date: "2026-03-06", high: 121, low: 114, open: 118 },
        { close: 114, date: "2026-03-07", high: 120, low: 112, open: 119 },
        { close: 125, date: "2026-03-08", high: 128, low: 113, open: 114 }
    ]);
    protected readonly candlestickFillMode = signal<ChartFinancialFillMode>("filled");
    protected readonly candlestickWickWidth = signal<number>(1);
    protected readonly candlestickBodyWidthRatio = signal<number>(0.7);

    protected readonly ohlcData = signal<
        readonly { close: number; date: string; high: number; low: number; open: number }[]
    >([
        { close: 1850, date: "2026-03-01", high: 1880, low: 1820, open: 1830 },
        { close: 1820, date: "2026-03-02", high: 1860, low: 1810, open: 1850 },
        { close: 1910, date: "2026-03-03", high: 1930, low: 1815, open: 1820 },
        { close: 1890, date: "2026-03-04", high: 1920, low: 1870, open: 1905 },
        { close: 1960, date: "2026-03-05", high: 1980, low: 1880, open: 1890 },
        { close: 1960, date: "2026-03-06", high: 1990, low: 1940, open: 1960 },
        { close: 1920, date: "2026-03-07", high: 1970, low: 1910, open: 1965 },
        { close: 2010, date: "2026-03-08", high: 2040, low: 1915, open: 1920 }
    ]);
    protected readonly ohlcWickWidth = signal<number>(1);

    // Heatmap Chart Data & Controls
    protected readonly heatmapDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    protected readonly heatmapTimes = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];
    protected readonly heatmapData = signal<readonly { day: string; time: string; value: number }[]>([
        { day: "Mon", time: "00:00", value: 12 },
        { day: "Mon", time: "04:00", value: 5 },
        { day: "Mon", time: "08:00", value: 45 },
        { day: "Mon", time: "12:00", value: 85 },
        { day: "Mon", time: "16:00", value: 92 },
        { day: "Mon", time: "20:00", value: 64 },

        { day: "Tue", time: "00:00", value: 8 },
        { day: "Tue", time: "04:00", value: 3 },
        { day: "Tue", time: "08:00", value: 52 },
        { day: "Tue", time: "12:00", value: 88 },
        { day: "Tue", time: "16:00", value: 95 },
        { day: "Tue", time: "20:00", value: 70 },

        { day: "Wed", time: "00:00", value: 15 },
        { day: "Wed", time: "04:00", value: 7 },
        { day: "Wed", time: "08:00", value: 60 },
        { day: "Wed", time: "12:00", value: 96 },
        { day: "Wed", time: "16:00", value: 100 },
        { day: "Wed", time: "20:00", value: 75 },

        { day: "Thu", time: "00:00", value: 10 },
        { day: "Thu", time: "04:00", value: 4 },
        { day: "Thu", time: "08:00", value: 48 },
        { day: "Thu", time: "12:00", value: 82 },
        { day: "Thu", time: "16:00", value: 90 },
        { day: "Thu", time: "20:00", value: 68 },

        { day: "Fri", time: "00:00", value: 18 },
        { day: "Fri", time: "04:00", value: 9 },
        { day: "Fri", time: "08:00", value: 40 },
        { day: "Fri", time: "12:00", value: 76 },
        { day: "Fri", time: "16:00", value: 84 },
        { day: "Fri", time: "20:00", value: 80 },

        { day: "Sat", time: "00:00", value: 30 },
        { day: "Sat", time: "04:00", value: 15 },
        { day: "Sat", time: "08:00", value: 22 },
        { day: "Sat", time: "12:00", value: 50 },
        { day: "Sat", time: "16:00", value: 62 },
        { day: "Sat", time: "20:00", value: 55 },

        { day: "Sun", time: "00:00", value: 25 },
        { day: "Sun", time: "04:00", value: 12 },
        { day: "Sun", time: "08:00", value: 18 },
        { day: "Sun", time: "12:00", value: 42 },
        { day: "Sun", time: "16:00", value: 58 },
        { day: "Sun", time: "20:00", value: 48 }
    ]);
    protected readonly heatmapColorMode = signal<ChartHeatmapColorMode>("sequential");
    protected readonly heatmapBorderRadius = signal<number>(4);
    protected readonly heatmapCellGap = signal<number>(2);
    protected readonly heatmapShowValues = signal<boolean>(false);
    protected readonly heatmapColorPreset = signal<"blue" | "emerald" | "sunset">("emerald");

    protected readonly heatmapColors = computed<readonly string[] | undefined>(() => {
        const preset = this.heatmapColorPreset();
        if (preset === "emerald") {
            return ["#ecfdf5", "#a7f3d0", "#34d399", "#059669", "#064e3b"];
        }
        if (preset === "sunset") {
            return ["#fef3c7", "#f97316", "#dc2626", "#7f1d1d"];
        }
        return undefined; // fallback to theme palette
    });

    // Range Chart Data & Controls
    protected readonly rangeBarData = signal<readonly { high: number; low: number; month: string }[]>([
        { high: 28, low: 14, month: "Jan" },
        { high: 32, low: 16, month: "Feb" },
        { high: 38, low: 22, month: "Mar" },
        { high: 45, low: 28, month: "Apr" },
        { high: 52, low: 35, month: "May" },
        { high: 58, low: 42, month: "Jun" }
    ]);
    protected readonly rangeBarRadius = signal<number>(6);
    protected readonly rangeBarMaxBarWidth = signal<number>(36);
    protected readonly rangeBarOpacity = signal<number>(0.85);

    protected readonly rangeAreaData = signal<readonly { actual: number; high: number; low: number; month: string }[]>([
        { actual: 38, high: 48, low: 28, month: "Jan" },
        { actual: 44, high: 56, low: 32, month: "Feb" },
        { actual: 52, high: 65, low: 40, month: "Mar" },
        { actual: 61, high: 74, low: 48, month: "Apr" },
        { actual: 70, high: 85, low: 55, month: "May" },
        { actual: 78, high: 92, low: 64, month: "Jun" }
    ]);
    protected readonly rangeAreaOpacity = signal<number>(0.25);
    protected readonly rangeAreaShowPoints = signal<boolean>(true);
    protected readonly rangeAreaCurve = signal<ChartCurve>("monotone-x");
    protected readonly areaFillMode = signal<ChartAreaFillMode>("gradient");
    protected readonly areaFillModeOptions: readonly { label: string; value: ChartAreaFillMode }[] = [
        { label: "Gradient (Fade to 0)", value: "gradient" },
        { label: "Solid Fill", value: "solid" }
    ];
    protected readonly stackedBarData = signal<
        readonly { month: string; online: number; partner: number; retail: number }[]
    >([
        { month: "Jan", online: 1200, partner: 600, retail: 2400 },
        { month: "Feb", online: 1800, partner: 800, retail: 2100 },
        { month: "Mar", online: 2200, partner: 1100, retail: 2900 },
        { month: "Apr", online: 2600, partner: 1300, retail: 2700 },
        { month: "May", online: 3100, partner: 1600, retail: 3400 },
        { month: "Jun", online: 3800, partner: 1900, retail: 3200 }
    ]);
    protected readonly stackedAreaData = signal<
        readonly { direct: number; organic: number; referral: number; year: number }[]
    >([
        { direct: 240, organic: 520, referral: 180, year: 2019 },
        { direct: 310, organic: 680, referral: 240, year: 2020 },
        { direct: 420, organic: 890, referral: 310, year: 2021 },
        { direct: 560, organic: 1150, referral: 430, year: 2022 },
        { direct: 720, organic: 1480, referral: 590, year: 2023 },
        { direct: 910, organic: 1820, referral: 780, year: 2024 }
    ]);
    protected readonly currencyFormatter = (value: unknown): string => {
        if (typeof value === "number") {
            const formatted = Math.abs(value).toLocaleString();
            return value < 0 ? `-$${formatted}` : `$${formatted}`;
        }
        return String(value);
    };
    protected readonly curveOptions: readonly { label: string; value: ChartCurve }[] = [
        { label: "Linear", value: "linear" },
        { label: "Monotone X (Smooth)", value: "monotone-x" },
        { label: "Natural (Spline)", value: "natural" },
        { label: "Step After", value: "step-after" }
    ];
    protected readonly curveType = signal<ChartCurve>("monotone-x");
    protected readonly dateData = signal<readonly TimePointMetric[]>([
        { cpu: 32, memory: 48, timestamp: new Date(2026, 0, 1, 8, 0) },
        { cpu: 45, memory: 52, timestamp: new Date(2026, 0, 1, 9, 0) },
        { cpu: 78, memory: 65, timestamp: new Date(2026, 0, 1, 10, 0) },
        { cpu: 56, memory: 60, timestamp: new Date(2026, 0, 1, 11, 0) },
        { cpu: 89, memory: 75, timestamp: new Date(2026, 0, 1, 12, 0) },
        { cpu: 64, memory: 68, timestamp: new Date(2026, 0, 1, 13, 0) },
        { cpu: 42, memory: 55, timestamp: new Date(2026, 0, 1, 14, 0) }
    ]);
    protected readonly displayedMonthlyData = computed(() => {
        return this.isDataEmpty() ? [] : this.monthlyData();
    });

    // Polar Sector (Pie & Donut) Data & Controls
    protected readonly donutCornerRadius = signal<number>(4);
    protected readonly donutData = signal<readonly MarketShareDatum[]>([
        { category: "Compute Engine", value: 45000 },
        { category: "Cloud Storage", value: 28000 },
        { category: "Cloud SQL & Spanner", value: 22000 },
        { category: "Kubernetes Engine", value: 35000 },
        { category: "BigQuery Analytics", value: 19000 },
        { category: "Networking & CDN", value: 11000 }
    ]);
    protected readonly donutFillMode = signal<ChartPolarFillMode>("solid");
    protected readonly donutInnerRadiusRatio = signal<number>(0.62);
    protected readonly donutLabelPosition = signal<ChartPolarLabelPosition>("outside");
    protected readonly donutOuterRatio = signal<number>(0.9);
    protected readonly donutPadAngle = signal<number>(2);
    protected readonly donutShowLabels = signal<boolean>(false);
    protected readonly donutUseCenterSummary = signal<boolean>(true);

    public readonly eventLogs = signal<readonly DemoLogEntry[]>([]);
    protected readonly fillModeOptions: readonly { label: string; value: ChartPolarFillMode }[] = [
        { label: "Solid", value: "solid" },
        { label: "Gradient (Center to Arc)", value: "gradient" }
    ];
    protected readonly includeNegativeValues = signal<boolean>(false);
    protected readonly isDataEmpty = signal<boolean>(false);
    protected readonly labelPositionOptions: readonly { label: string; value: ChartPolarLabelPosition }[] = [
        { label: "Outside (Leader Lines)", value: "outside" },
        { label: "Inside (Slice Center)", value: "inside" }
    ];
    protected readonly legendPosition = signal<"bottom" | "left" | "right" | "top">("bottom");
    protected readonly legendPositionOptions: readonly { label: string; value: "bottom" | "left" | "right" | "top" }[] =
        [
            { label: "Bottom", value: "bottom" },
            { label: "Top", value: "top" },
            { label: "Left", value: "left" },
            { label: "Right", value: "right" }
        ];
    protected readonly monthlyData = signal<readonly MonthlyMetric[]>([
        { actual: 4200, forecast: 4000, month: "Jan", target: 4500 },
        { actual: 5100, forecast: 4800, month: "Feb", target: 5000 },
        { actual: 6400, forecast: 5900, month: "Mar", target: 5800 },
        { actual: 5800, forecast: 6100, month: "Apr", target: 6200 },
        { actual: 7200, forecast: 6800, month: "May", target: 6700 },
        { actual: 8100, forecast: 7500, month: "Jun", target: 7600 }
    ]);
    protected readonly niceAxes = signal<boolean>(true);

    // Pie series controls
    protected readonly pieCornerRadius = signal<number>(0);
    protected readonly pieData = signal<readonly MarketShareDatum[]>([
        { category: "Chrome", value: 65 },
        { category: "Safari", value: 18 },
        { category: "Edge", value: 8 },
        { category: "Firefox", value: 5 },
        { category: "Opera", value: 3 },
        { category: "Other", value: 1 }
    ]);
    protected readonly pieEndAngle = signal<number>(360);
    protected readonly pieFillMode = signal<ChartPolarFillMode>("solid");
    protected readonly pieLabelContent = signal<ChartPolarLabelContent>("percentage");
    protected readonly pieLabelContentOptions: readonly { label: string; value: ChartPolarLabelContent }[] = [
        { label: "Percentage (e.g. 65%)", value: "percentage" },
        { label: "Category (e.g. Chrome)", value: "category" },
        { label: "Value (e.g. 65)", value: "value" },
        { label: "Category & Percentage", value: "category-percentage" }
    ];
    protected readonly pieLabelPosition = signal<ChartPolarLabelPosition>("outside");
    protected readonly pieOuterRatio = signal<number>(0.9);
    protected readonly piePadAngle = signal<number>(1);
    protected readonly pieShowLabels = signal<boolean>(true);
    protected readonly pieStartAngle = signal<number>(0);
    protected readonly pieUseCustomLabelTemplate = signal<boolean>(false);

    // Radar Series Data & Controls
    protected readonly radarData = signal<readonly SkillMetric[]>([
        { mage: 30, metric: "Strength", rogue: 65, warrior: 95 },
        { mage: 98, metric: "Intelligence", rogue: 70, warrior: 35 },
        { mage: 55, metric: "Agility", rogue: 95, warrior: 60 },
        { mage: 40, metric: "Defense", rogue: 50, warrior: 90 },
        { mage: 100, metric: "Mana", rogue: 45, warrior: 20 },
        { mage: 60, metric: "Stealth", rogue: 98, warrior: 15 }
    ]);
    protected readonly radarFillMode = signal<ChartRadialFillMode>("gradient");
    protected readonly radialFillModeOptions: readonly { label: string; value: ChartRadialFillMode }[] = [
        { label: "Gradient (Center to Max)", value: "gradient" },
        { label: "Solid Wash", value: "solid" },
        { label: "None (Outline Only)", value: "none" }
    ];
    protected readonly radialCurveOptions: readonly { label: string; value: ChartRadialCurve }[] = [
        { label: "Linear", value: "linear" },
        { label: "Smooth (Catmull-Rom)", value: "smooth" }
    ];
    protected readonly radialGridShapeOptions: readonly { label: string; value: ChartRadialGridShape }[] = [
        { label: "Auto (Default)", value: "auto" },
        { label: "Polygon", value: "polygon" },
        { label: "Circle", value: "circle" }
    ];
    protected readonly radarCurve = signal<ChartRadialCurve>("linear");
    protected readonly radarShowPoints = signal<boolean>(true);
    protected readonly radarGridShape = signal<ChartRadialGridShape>("auto");
    protected readonly radarRotation = signal<number>(0);
    protected readonly radarShowWarrior = signal<boolean>(true);
    protected readonly radarShowMage = signal<boolean>(true);
    protected readonly radarShowRogue = signal<boolean>(true);

    // Continuous Polar Data & Controls
    protected readonly polarData = signal<readonly SignalDataPoint[]>([
        { angle: 0, gain: 85, noise: 20 },
        { angle: 30, gain: 70, noise: 25 },
        { angle: 60, gain: 45, noise: 30 },
        { angle: 90, gain: 20, noise: 35 },
        { angle: 120, gain: 30, noise: 25 },
        { angle: 150, gain: 60, noise: 20 },
        { angle: 180, gain: 90, noise: 15 },
        { angle: 210, gain: 65, noise: 20 },
        { angle: 240, gain: 35, noise: 25 },
        { angle: 270, gain: 15, noise: 30 },
        { angle: 300, gain: 40, noise: 25 },
        { angle: 330, gain: 75, noise: 20 }
    ]);
    protected readonly continuousPolarFillMode = signal<ChartRadialFillMode>("gradient");
    protected readonly continuousPolarCurve = signal<ChartRadialCurve>("smooth");
    protected readonly continuousPolarConnectNulls = signal<boolean>(false);
    protected readonly continuousPolarShowPoints = signal<boolean>(true);
    protected readonly continuousPolarGridShape = signal<ChartRadialGridShape>("circle");
    protected readonly continuousPolarTickCount = signal<number>(12);

    // Scatter Plot Data & Controls
    protected readonly scatterData = signal<readonly ScatterDataPoint[]>([
        { height: 165, id: "p1", weight: 60, wingspan: 168 },
        { height: 170, id: "p2", weight: 68, wingspan: 172 },
        { height: 172, id: "p3", weight: 65, wingspan: 175 },
        { height: 175, id: "p4", weight: 72, wingspan: 180 },
        { height: 178, id: "p5", weight: 78, wingspan: 182 },
        { height: 180, id: "p6", weight: 75, wingspan: 185 },
        { height: 182, id: "p7", weight: 82, wingspan: 188 },
        { height: 185, id: "p8", weight: 88, wingspan: 192 },
        { height: 188, id: "p9", weight: 90, wingspan: 194 },
        { height: 192, id: "p10", weight: 96, wingspan: 200 }
    ]);
    protected readonly scatterPointRadius = signal<number>(6);
    protected readonly scatterFillOpacity = signal<number>(0.85);
    protected readonly showScatterWeight = signal<boolean>(true);
    protected readonly showScatterWingspan = signal<boolean>(true);

    // Bubble Chart Data & Controls
    protected readonly bubbleData = signal<readonly BubbleDataPoint[]>([
        { country: "Japan", gdp: 39000, id: "jp", lifeExp: 84.6, population: 125 },
        { country: "United States", gdp: 70000, id: "us", lifeExp: 77.3, population: 335 },
        { country: "Germany", gdp: 51000, id: "de", lifeExp: 81.0, population: 84 },
        { country: "Brazil", gdp: 8900, id: "br", lifeExp: 75.9, population: 215 },
        { country: "India", gdp: 2400, id: "in", lifeExp: 70.4, population: 1420 },
        { country: "Nigeria", gdp: 2100, id: "ng", lifeExp: 54.0, population: 218 },
        { country: "Australia", gdp: 56000, id: "au", lifeExp: 83.2, population: 26 },
        { country: "South Korea", gdp: 35000, id: "kr", lifeExp: 83.5, population: 52 },
        { country: "Canada", gdp: 52000, id: "ca", lifeExp: 82.5, population: 39 },
        { country: "France", gdp: 44000, id: "fr", lifeExp: 82.7, population: 68 }
    ]);
    protected readonly bubbleMinRadius = signal<number>(5);
    protected readonly bubbleMaxRadius = signal<number>(30);
    protected readonly bubbleFillOpacity = signal<number>(0.6);
    protected readonly bubbleSizeFormatter = (value: unknown): string =>
        typeof value === "number" ? `${value.toLocaleString()}M` : String(value);

    protected readonly radialBarData = signal<{ category: string; color?: string; value: number }[]>([
        { category: "Disk Usage", color: "#3b82f6", value: 78 },
        { category: "Memory", color: "#10b981", value: 62 },
        { category: "CPU Load", color: "#f59e0b", value: 45 },
        { category: "Network I/O", color: "#ec4899", value: 89 }
    ]);
    protected readonly radialBarFillMode = signal<ChartRadialArcFillMode>("solid");
    protected readonly radialBarThickness = signal<number>(20);
    protected readonly radialBarGap = signal<number>(6);
    protected readonly radialBarCornerRadius = signal<number>(6);
    protected readonly radialBarStartAngle = signal<number>(0);
    protected readonly radialBarEndAngle = signal<number>(360);
    protected readonly radialBarShowTracks = signal<boolean>(true);

    protected readonly roseData = signal<{ direction: string; value: number }[]>([
        { direction: "N", value: 45 },
        { direction: "NE", value: 85 },
        { direction: "E", value: 65 },
        { direction: "SE", value: 30 },
        { direction: "S", value: 95 },
        { direction: "SW", value: 55 },
        { direction: "W", value: 75 },
        { direction: "NW", value: 40 }
    ]);
    protected readonly roseScaleMode = signal<ChartRoseScaleMode>("area");
    protected readonly roseFillMode = signal<ChartRadialArcFillMode>("solid");
    protected readonly rosePadAngle = signal<number>(2);
    protected readonly roseCornerRadius = signal<number>(4);

    protected readonly gaugeValue = signal<number>(76);
    protected readonly gaugeMin = signal<number>(0);
    protected readonly gaugeMax = signal<number>(100);
    protected readonly gaugeIndicator = signal<ChartGaugeIndicator>("both");
    protected readonly gaugeStartAngle = signal<number>(-120);
    protected readonly gaugeEndAngle = signal<number>(120);
    protected readonly gaugeInnerRadiusRatio = signal<number>(0.72);
    protected readonly gaugeThickness = signal<number>(24);
    protected readonly gaugeNeedleWidth = signal<number>(3);
    protected readonly gaugeShowValue = signal<boolean>(true);
    protected readonly gaugeCustomTemplate = signal<boolean>(false);

    // Treemap Controls & Data
    protected readonly treemapData = signal<readonly unknown[]>([
        {
            name: "Frontend",
            children: [
                { name: "Angular", value: 120 },
                { name: "React", value: 110 },
                { name: "Vue", value: 75 },
                { name: "Svelte", value: 45 }
            ]
        },
        {
            name: "Backend",
            children: [
                { name: "Node.js", value: 95 },
                { name: "Go", value: 130 },
                { name: "Rust", value: 115 },
                { name: "Java", value: 140 }
            ]
        },
        {
            name: "Database",
            children: [
                { name: "PostgreSQL", value: 110 },
                { name: "Redis", value: 65 },
                { name: "MongoDB", value: 55 },
                { name: "DuckDB", value: 40 }
            ]
        },
        {
            name: "DevOps",
            children: [
                { name: "Kubernetes", value: 150 },
                { name: "Docker", value: 90 },
                { name: "Terraform", value: 70 },
                { name: "AWS", value: 130 }
            ]
        }
    ]);

    protected readonly treemapTile = signal<ChartTreemapTile>("squarify");
    protected readonly treemapSort = signal<ChartTreemapSort>("descending");
    protected readonly treemapShowParentLabels = signal<boolean>(true);
    protected readonly treemapShowValues = signal<boolean>(true);
    protected readonly treemapBorderRadius = signal<number>(4);
    protected readonly treemapStrokeWidth = signal<number>(1);
    protected readonly treemapStrokeColor = signal<string>("#ffffff");
    protected readonly treemapParentFillOpacity = signal<number>(0.15);
    protected readonly treemapPaddingInner = signal<number>(2);
    protected readonly treemapPaddingOuter = signal<number>(4);
    protected readonly treemapParentHeaderHeight = signal<number>(22);
    protected readonly treemapMaxDepth = signal<number | undefined>(undefined);
    protected readonly treemapUseCustomTemplate = signal<boolean>(false);

    protected readonly treemapTileOptions: readonly { label: string; value: ChartTreemapTile }[] = [
        { label: "Squarify (Golden Ratio)", value: "squarify" },
        { label: "Binary (Recursive)", value: "binary" },
        { label: "Dice (Horizontal)", value: "dice" },
        { label: "Slice (Vertical)", value: "slice" },
        { label: "Slice-Dice (Alternating)", value: "slice-dice" }
    ];

    protected readonly treemapSortOptions: readonly { label: string; value: ChartTreemapSort }[] = [
        { label: "Descending", value: "descending" },
        { label: "Ascending", value: "ascending" },
        { label: "None (Preserve Order)", value: "none" }
    ];

    public onTreemapTileChange(tile: unknown): void {
        const val = typeof tile === "string" ? tile : (tile as { value?: string })?.value;
        if (val) {
            this.treemapTile.set(val as ChartTreemapTile);
            this.#addLog("settingChange", `Treemap Tile Algorithm: ${val}`);
        }
    }

    public onTreemapSortChange(sort: unknown): void {
        const val = typeof sort === "string" ? sort : (sort as { value?: string })?.value;
        if (val) {
            this.treemapSort.set(val as ChartTreemapSort);
            this.#addLog("settingChange", `Treemap Sibling Sort: ${val}`);
        }
    }

    // Funnel Controls & Data
    protected readonly funnelData = signal<readonly { stage: string; value: number }[]>([
        { stage: "Website Visits", value: 12500 },
        { stage: "Product Views", value: 7200 },
        { stage: "Add to Cart", value: 3400 },
        { stage: "Checkout Started", value: 1600 },
        { stage: "Purchases", value: 850 }
    ]);
    protected readonly funnelOrientation = signal<ChartFunnelOrientation>("vertical");
    protected readonly funnelGap = signal<number>(4);
    protected readonly funnelWidthRatio = signal<number>(0.85);
    protected readonly funnelLabelContent = signal<ChartFunnelLabelContent>("category-value-conversion");
    protected readonly funnelShowLabels = signal<boolean>(true);
    protected readonly funnelUseCustomTemplate = signal<boolean>(false);

    protected readonly funnelOrientationOptions: readonly { label: string; value: ChartFunnelOrientation }[] = [
        { label: "Vertical (Top down)", value: "vertical" },
        { label: "Horizontal (Left to right)", value: "horizontal" }
    ];

    protected readonly funnelLabelContentOptions: readonly { label: string; value: ChartFunnelLabelContent }[] = [
        { label: "Category & Value & Conversion", value: "category-value-conversion" },
        { label: "Category & Value", value: "category-value" },
        { label: "Category Only", value: "category" },
        { label: "Value Only", value: "value" }
    ];

    public onFunnelOrientationChange(val: unknown): void {
        const v = typeof val === "string" ? val : (val as { value?: string })?.value;
        if (v) {
            this.funnelOrientation.set(v as ChartFunnelOrientation);
            this.#addLog("settingChange", `Funnel Orientation: ${v}`);
        }
    }

    public onFunnelLabelContentChange(val: unknown): void {
        const v = typeof val === "string" ? val : (val as { value?: string })?.value;
        if (v) {
            this.funnelLabelContent.set(v as ChartFunnelLabelContent);
            this.#addLog("settingChange", `Funnel Label Content: ${v}`);
        }
    }

    public onFunnelStageVisibilityChange(event: ChartFunnelStageVisibilityEvent): void {
        this.#addLog("stageVisibilityChange", `Stage "${event.formattedCategory}" visibility: ${event.visible}`);
    }

    public randomizeFunnelData(): void {
        let val = Math.floor(10000 + Math.random() * 5000);
        const stages = ["Website Visits", "Product Views", "Add to Cart", "Checkout Started", "Purchases"];
        const next = stages.map(stage => {
            const stageVal = val;
            val = Math.max(10, Math.floor(val * (0.35 + Math.random() * 0.35)));
            return { stage, value: stageVal };
        });
        this.funnelData.set(next);
        this.#addLog("dataUpdate", "Randomized Funnel stages");
    }

    // Waterfall Controls & Data
    protected readonly waterfallData = signal<readonly { category: string; kind?: "change" | "subtotal" | "total"; value?: number }[]>([
        { category: "Opening Balance", kind: "total", value: 45000 },
        { category: "Product Sales", kind: "change", value: 32000 },
        { category: "Subscriptions", kind: "change", value: 15000 },
        { category: "Gross Revenue", kind: "subtotal" },
        { category: "Salaries", kind: "change", value: -22000 },
        { category: "Infrastructure", kind: "change", value: -5500 },
        { category: "Marketing", kind: "change", value: -7000 },
        { category: "Operating Profit", kind: "subtotal" },
        { category: "Taxes", kind: "change", value: -4500 },
        { category: "Net Closing Balance", kind: "total" }
    ]);
    protected readonly waterfallShowConnectors = signal<boolean>(true);
    protected readonly waterfallShowLabels = signal<boolean>(true);
    protected readonly waterfallUseCustomTemplate = signal<boolean>(false);
    protected readonly waterfallBorderRadius = signal<number>(4);

    public randomizeWaterfallData(): void {
        const initial = Math.floor(30000 + Math.random() * 25000);
        const sales = Math.floor(20000 + Math.random() * 20000);
        const sub = Math.floor(10000 + Math.random() * 10000);
        const salaries = -Math.floor(15000 + Math.random() * 10000);
        const infra = -Math.floor(3000 + Math.random() * 5000);
        const marketing = -Math.floor(4000 + Math.random() * 6000);
        const tax = -Math.floor(2000 + Math.random() * 4000);

        this.waterfallData.set([
            { category: "Opening Balance", kind: "total", value: initial },
            { category: "Product Sales", kind: "change", value: sales },
            { category: "Subscriptions", kind: "change", value: sub },
            { category: "Gross Revenue", kind: "subtotal" },
            { category: "Salaries", kind: "change", value: salaries },
            { category: "Infrastructure", kind: "change", value: infra },
            { category: "Marketing", kind: "change", value: marketing },
            { category: "Operating Profit", kind: "subtotal" },
            { category: "Taxes", kind: "change", value: tax },
            { category: "Net Closing Balance", kind: "total" }
        ]);
        this.#addLog("dataUpdate", "Randomized Waterfall cashflow");
    }

    protected readonly sharedTooltip = signal<boolean>(false);
    protected readonly showArea = signal<boolean>(true);
    protected readonly showAxisTitles = signal<boolean>(false);
    protected readonly showBars = signal<boolean>(true);
    protected readonly showLine = signal<boolean>(true);
    protected readonly showPoints = signal<boolean>(true);
    protected readonly timeFormatter = (value: unknown): string =>
        value instanceof Date
            ? `${value.getHours().toString().padStart(2, "0")}:${value.getMinutes().toString().padStart(2, "0")}`
            : String(value);
    protected readonly percentFormatter = (value: unknown): string =>
        typeof value === "number" ? `${value}%` : String(value);
    protected readonly heightFormatter = (value: unknown): string =>
        typeof value === "number" ? `${value} cm` : String(value);
    protected readonly weightFormatter = (value: unknown): string =>
        typeof value === "number" ? `${value} kg` : String(value);
    protected readonly lifeExpFormatter = (value: unknown): string =>
        typeof value === "number" ? `${value} yrs` : String(value);
    protected readonly useCustomNoData = signal<boolean>(false);
    protected readonly useIndependentSeriesData = signal<boolean>(false);
    protected readonly xAxisLine = signal<boolean>(true);
    protected readonly xAxisPosition = signal<"bottom" | "top">("bottom");
    protected readonly xGridLines = signal<boolean>(false);
    protected readonly yAxisLine = signal<boolean>(true);
    protected readonly yAxisPosition = signal<"left" | "right">("left");
    protected readonly yGridLines = signal<boolean>(true);

    public clearLogs(): void {
        this.eventLogs.set([]);
    }

    public onAreaFillModeChange(mode: unknown): void {
        if (mode === "gradient" || mode === "solid") {
            this.areaFillMode.set(mode);
            this.#addLog("settingChange", `Area Fill Mode: ${mode}`);
        }
    }

    public onRadarFillModeChange(mode: unknown): void {
        if (mode === "gradient" || mode === "solid" || mode === "none") {
            this.radarFillMode.set(mode);
            this.#addLog("settingChange", `Radar Fill Mode: ${mode}`);
        }
    }

    public onRadarCurveChange(curve: unknown): void {
        if (curve === "linear" || curve === "smooth") {
            this.radarCurve.set(curve);
            this.#addLog("settingChange", `Radar Curve: ${curve}`);
        }
    }

    public onRadarGridShapeChange(shape: unknown): void {
        if (shape === "auto" || shape === "polygon" || shape === "circle") {
            this.radarGridShape.set(shape);
            this.#addLog("settingChange", `Radar Grid Shape: ${shape}`);
        }
    }

    public onContinuousPolarFillModeChange(mode: unknown): void {
        if (mode === "gradient" || mode === "solid" || mode === "none") {
            this.continuousPolarFillMode.set(mode);
            this.#addLog("settingChange", `Polar Fill Mode: ${mode}`);
        }
    }

    public onContinuousPolarCurveChange(curve: unknown): void {
        if (curve === "linear" || curve === "smooth") {
            this.continuousPolarCurve.set(curve);
            this.#addLog("settingChange", `Polar Curve: ${curve}`);
        }
    }

    public onContinuousPolarGridShapeChange(shape: unknown): void {
        if (shape === "auto" || shape === "polygon" || shape === "circle") {
            this.continuousPolarGridShape.set(shape);
            this.#addLog("settingChange", `Polar Grid Shape: ${shape}`);
        }
    }

    public onCurveTypeChange(curve: unknown): void {
        if (typeof curve === "string") {
            this.curveType.set(curve as ChartCurve);
            this.#addLog("settingChange", `Line Curve: ${curve}`);
        }
    }

    public onDonutFillModeChange(mode: unknown): void {
        if (mode === "solid" || mode === "gradient") {
            this.donutFillMode.set(mode);
            this.#addLog("settingChange", `Donut Fill Mode: ${mode}`);
        }
    }

    public onDonutLabelPositionChange(pos: unknown): void {
        if (pos === "outside" || pos === "inside") {
            this.donutLabelPosition.set(pos);
            this.#addLog("settingChange", `Donut Label Position: ${pos}`);
        }
    }

    public onLabelContentChange(content: unknown): void {
        this.onPieLabelContentChange(content);
    }

    public onLegendPositionChange(pos: unknown): void {
        if (pos === "bottom" || pos === "top" || pos === "left" || pos === "right") {
            this.legendPosition.set(pos);
            this.#addLog("settingChange", `Legend Position: ${pos}`);
        }
    }

    public onPieFillModeChange(mode: unknown): void {
        if (mode === "solid" || mode === "gradient") {
            this.pieFillMode.set(mode);
            this.#addLog("settingChange", `Pie Fill Mode: ${mode}`);
        }
    }

    public onPieLabelContentChange(content: unknown): void {
        if (typeof content === "string") {
            this.pieLabelContent.set(content as ChartPolarLabelContent);
            this.#addLog("settingChange", `Pie Label Content: ${content}`);
        }
    }

    public onPieLabelPositionChange(pos: unknown): void {
        if (pos === "outside" || pos === "inside") {
            this.pieLabelPosition.set(pos);
            this.#addLog("settingChange", `Pie Label Position: ${pos}`);
        }
    }

    public onPointClick(event: ChartPointEvent): void {
        const polarDetails =
            event.percentage !== undefined
                ? ` | (${(event.percentage * 100).toFixed(1)}%)`
                : event.yCategory !== undefined
                  ? ` | Cell: [${event.formattedXValue ?? event.category}, ${event.formattedYCategory ?? event.yCategory}]`
                  : event.category
                    ? ` | Category: "${event.category}"`
                    : "";
        const valueDisplay = Array.isArray(event.value)
            ? `[${event.value.join(", ")}]`
            : event.value !== undefined
              ? String(event.value)
              : event.yValue !== undefined
                ? String(event.yValue)
                : "undefined";
        this.#addLog(
            "pointClick",
            `Series: "${event.seriesName}" (${event.seriesType})${polarDetails} | Value: ${valueDisplay} | Index: ${event.dataIndex}`
        );
    }

    public onPointFocusChange(event: ChartPointFocusEvent): void {
        const polarDetails =
            event.yCategory !== undefined
                ? ` | Cell: [${event.formattedXValue ?? event.category}, ${event.formattedYCategory ?? event.yCategory}]`
                : event.category
                  ? ` | Category: "${event.category}"`
                  : "";
        const valueDisplay = Array.isArray(event.value)
            ? `[${event.value.join(", ")}]`
            : event.value !== undefined
              ? String(event.value)
              : event.yValue !== undefined
                ? String(event.yValue)
                : "undefined";
        this.#addLog(
            "pointFocusChange",
            `Series: "${event.seriesName}" (${event.seriesType})${polarDetails} | Value: ${valueDisplay} | Index: ${event.dataIndex}`
        );
    }

    public onSeriesVisibilityChange(event: ChartSeriesVisibilityEvent): void {
        this.#addLog("seriesVisibilityChange", `Series: "${event.seriesName}" | Visible: ${event.visible}`);
    }

    public onSliceVisibilityChange(event: ChartSliceVisibilityEvent): void {
        this.#addLog(
            "sliceVisibilityChange",
            `Slice: "${event.category}" | DataIndex: ${event.dataIndex} | Visible: ${event.visible}`
        );
    }

    public randomizeData(): void {
        this.useIndependentSeriesData.set(false);
        const minVal = this.includeNegativeValues() ? -4000 : 2000;
        const range = this.includeNegativeValues() ? 12000 : 6000;
        this.monthlyData.update(list =>
            list.map(item => {
                const actual = Math.round(minVal + Math.random() * range);
                return {
                    actual,
                    forecast: actual,
                    month: item.month,
                    target: actual
                };
            })
        );
        this.#addLog("dataUpdate", "Randomized monthly dataset (same data across all series)");
    }

    public randomizeDonutData(): void {
        this.donutData.update(list =>
            list.map(item => ({
                ...item,
                value: Math.max(5000, Math.round(5000 + Math.random() * 50000))
            }))
        );
        this.#addLog("dataUpdate", "Randomized donut cloud revenue dataset");
    }

    public randomizeIndividually(): void {
        this.useIndependentSeriesData.set(true);
        const minVal = this.includeNegativeValues() ? -4000 : 2000;
        const range = this.includeNegativeValues() ? 12000 : 6000;
        this.monthlyData.update(list =>
            list.map(item => ({
                actual: Math.round(minVal + Math.random() * range),
                forecast: Math.round(minVal + Math.random() * range),
                month: item.month,
                target: Math.round(minVal + Math.random() * range)
            }))
        );
        this.#addLog("dataUpdate", "Randomized monthly dataset (individual data for each series)");
    }

    public randomizePieData(): void {
        this.pieData.update(list =>
            list.map(item => ({
                ...item,
                value: Math.max(2, Math.round(5 + Math.random() * 80))
            }))
        );
        this.#addLog("dataUpdate", "Randomized pie chart slice values");
    }

    public randomizeRadarData(): void {
        this.radarData.update(list =>
            list.map(item => ({
                mage: Math.round(20 + Math.random() * 80),
                metric: item.metric,
                rogue: Math.round(20 + Math.random() * 80),
                warrior: Math.round(20 + Math.random() * 80)
            }))
        );
        this.#addLog("dataUpdate", "Randomized radar skill matrix");
    }

    public appendDataPoint(): void {
        const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currLen = this.monthlyData().length;
        const nextMonth = months[currLen % months.length];
        const val = Math.round(3000 + Math.random() * 6000);
        this.monthlyData.update(list => [
            ...list,
            { actual: val, forecast: val - 200, month: `${nextMonth}*`, target: val + 500 }
        ]);
        this.#addLog("dataUpdate", `Appended data point for ${nextMonth}`);
    }

    public appendDonutSlice(): void {
        const services = ["Cloud Functions", "Cloud Spanner", "Vertex AI", "Cloud Run", "Memorystore"];
        const currLen = this.donutData().length;
        const nextService = services[currLen % services.length];
        const val = Math.round(5000 + Math.random() * 25000);
        this.donutData.update(list => [...list, { category: nextService, value: val }]);
        this.#addLog("dataUpdate", `Appended donut service "${nextService}" ($${val.toLocaleString()})`);
    }

    public appendPieSlice(): void {
        const browsers = ["Brave", "Vivaldi", "Tor", "Samsung Internet", "UC Browser"];
        const currLen = this.pieData().length;
        const nextBrowser = browsers[currLen % browsers.length];
        const val = Math.round(2 + Math.random() * 10);
        this.pieData.update(list => [...list, { category: nextBrowser, value: val }]);
        this.#addLog("dataUpdate", `Appended pie slice "${nextBrowser}" (${val}%)`);
    }

    public loadDensePieData(): void {
        this.pieData.set([
            { category: "Chrome", value: 62 },
            { category: "Safari", value: 16 },
            { category: "Edge", value: 7 },
            { category: "Firefox", value: 4 },
            { category: "Opera", value: 3 },
            { category: "Brave", value: 3 },
            { category: "Vivaldi", value: 2 },
            { category: "Tor", value: 1 },
            { category: "Other", value: 2 }
        ]);
        this.#addLog("dataUpdate", "Loaded dense browser market share dataset (9 slices)");
    }

    public loadProfitLossData(): void {
        this.monthlyData.set([
            { actual: 3500, forecast: 4000, month: "Jan", target: 4500 },
            { actual: -1200, forecast: 2000, month: "Feb", target: 3000 },
            { actual: 5400, forecast: 4800, month: "Mar", target: 5000 },
            { actual: -2800, forecast: -1000, month: "Apr", target: 2000 },
            { actual: 6100, forecast: 5500, month: "May", target: 6000 },
            { actual: 4800, forecast: 4500, month: "Jun", target: 5000 }
        ]);
        this.includeNegativeValues.set(true);
        this.#addLog("dataUpdate", "Loaded dataset with negative profit/loss values");
    }

    public randomizePolarData(): void {
        this.polarData.update(list =>
            list.map(item => ({
                angle: item.angle,
                gain: Math.round(10 + Math.random() * 90),
                noise: Math.round(5 + Math.random() * 30)
            }))
        );
        this.#addLog("dataUpdate", "Randomized continuous polar radiation pattern");
    }

    public randomizeScatterData(): void {
        this.scatterData.update(list =>
            list.map(item => ({
                height: item.height,
                id: item.id,
                weight: Math.round(55 + Math.random() * 45),
                wingspan: Math.round(item.height - 5 + Math.random() * 15)
            }))
        );
        this.#addLog("dataUpdate", "Randomized scatter plot biometric distribution");
    }

    public randomizeBubbleData(): void {
        this.bubbleData.update(list =>
            list.map(item => ({
                country: item.country,
                gdp: Math.round(1500 + Math.random() * 75000),
                id: item.id,
                lifeExp: Number((50 + Math.random() * 35).toFixed(1)),
                population: Math.round(10 + Math.random() * 1400)
            }))
        );
        this.#addLog("dataUpdate", "Randomized bubble global socioeconomic dataset");
    }

    public randomizeRangeBarData(): void {
        this.rangeBarData.update(list =>
            list.map(item => {
                const low = Math.round(10 + Math.random() * 20);
                const high = Math.round(low + 10 + Math.random() * 30);
                return { high, low, month: item.month };
            })
        );
        this.#addLog("dataUpdate", "Randomized temperature range bars dataset");
    }

    public randomizeRangeAreaData(): void {
        this.rangeAreaData.update(list =>
            list.map(item => {
                const low = Math.round(20 + Math.random() * 30);
                const high = Math.round(low + 20 + Math.random() * 40);
                const actual = Math.round(low + (high - low) * (0.3 + Math.random() * 0.4));
                return { actual, high, low, month: item.month };
            })
        );
        this.#addLog("dataUpdate", "Randomized range area confidence band dataset");
    }

    public randomizeCandlestickData(): void {
        this.candlestickData.update(list =>
            list.map(item => {
                const open = Math.round(90 + Math.random() * 40);
                const close = Math.round(90 + Math.random() * 40);
                const high = Math.round(Math.max(open, close) + Math.random() * 15);
                const low = Math.round(Math.min(open, close) - Math.random() * 15);
                return { close, date: item.date, high, low, open };
            })
        );
        this.#addLog("dataUpdate", "Randomized candlestick daily OHLC session dataset");
    }

    public randomizeOhlcData(): void {
        this.ohlcData.update(list =>
            list.map(item => {
                const open = Math.round(1800 + Math.random() * 300);
                const close = Math.round(1800 + Math.random() * 300);
                const high = Math.round(Math.max(open, close) + Math.random() * 80);
                const low = Math.round(Math.min(open, close) - Math.random() * 80);
                return { close, date: item.date, high, low, open };
            })
        );
        this.#addLog("dataUpdate", "Randomized OHLC tick and spine session dataset");
    }

    public randomizeHeatmapData(): void {
        this.heatmapData.update(list =>
            list.map(item => ({
                day: item.day,
                time: item.time,
                value: Math.round(Math.random() * 100)
            }))
        );
        this.#addLog("dataUpdate", "Randomized heatmap 2D server activity matrix");
    }

    public randomizeRadialBarData(): void {
        this.radialBarData.update(list =>
            list.map(item => ({
                ...item,
                value: Math.round(20 + Math.random() * 80)
            }))
        );
        this.#addLog("dataUpdate", "Randomized Radial Bar ring values");
    }

    public randomizeRoseData(): void {
        this.roseData.update(list =>
            list.map(item => ({
                ...item,
                value: Math.round(15 + Math.random() * 85)
            }))
        );
        this.#addLog("dataUpdate", "Randomized Rose wind petal speeds");
    }

    public randomizeGaugeValue(): void {
        const val = Math.round(Math.random() * 100);
        this.gaugeValue.set(val);
        this.#addLog("dataUpdate", `Updated Gauge value to ${val}`);
    }

    public randomizeTreemapData(): void {
        this.treemapData.update(roots =>
            (roots as { name: string; children: { name: string; value: number }[] }[]).map(root => ({
                ...root,
                children: root.children.map(c => ({
                    ...c,
                    value: Math.round(20 + Math.random() * 150)
                }))
            }))
        );
        this.#addLog("dataUpdate", "Randomized Treemap leaf values");
    }

    public onTreemapNodeVisibilityChange(event: ChartTreemapNodeVisibilityEvent): void {
        this.#addLog(
            "nodeVisibilityChange",
            `Treemap node "${event.formattedLabel ?? event.nodeId}" visibility -> ${event.visible}`
        );
    }

    public resetData(): void {
        this.monthlyData.set([
            { actual: 4200, forecast: 4000, month: "Jan", target: 4500 },
            { actual: 5100, forecast: 4800, month: "Feb", target: 5000 },
            { actual: 6400, forecast: 5900, month: "Mar", target: 5800 },
            { actual: 5800, forecast: 6100, month: "Apr", target: 6200 },
            { actual: 7200, forecast: 6800, month: "May", target: 6700 },
            { actual: 8100, forecast: 7500, month: "Jun", target: 7600 }
        ]);
        this.candlestickData.set([
            { close: 104, date: "2026-03-01", high: 108, low: 98, open: 100 },
            { close: 112, date: "2026-03-02", high: 115, low: 102, open: 105 },
            { close: 108, date: "2026-03-03", high: 114, low: 106, open: 111 },
            { close: 118, date: "2026-03-04", high: 120, low: 107, open: 109 },
            { close: 115, date: "2026-03-05", high: 122, low: 113, open: 119 },
            { close: 125, date: "2026-03-06", high: 128, low: 114, open: 116 }
        ]);
        this.radialBarData.set([
            { category: "CPU Usage", color: "#3b82f6", value: 78 },
            { category: "Memory Allocation", color: "#10b981", value: 62 },
            { category: "Disk IOPS", color: "#f59e0b", value: 88 },
            { category: "Network Throughput", color: "#8b5cf6", value: 45 }
        ]);
        this.roseData.set([
            { direction: "N", value: 45 },
            { direction: "NE", value: 85 },
            { direction: "E", value: 65 },
            { direction: "SE", value: 30 },
            { direction: "S", value: 95 },
            { direction: "SW", value: 55 },
            { direction: "W", value: 75 },
            { direction: "NW", value: 40 }
        ]);
        this.treemapData.set([
            {
                name: "Frontend",
                children: [
                    { name: "Angular", value: 120 },
                    { name: "React", value: 110 },
                    { name: "Vue", value: 75 },
                    { name: "Svelte", value: 45 }
                ]
            },
            {
                name: "Backend",
                children: [
                    { name: "Node.js", value: 95 },
                    { name: "Go", value: 130 },
                    { name: "Rust", value: 115 },
                    { name: "Java", value: 140 }
                ]
            },
            {
                name: "Database",
                children: [
                    { name: "PostgreSQL", value: 110 },
                    { name: "Redis", value: 65 },
                    { name: "MongoDB", value: 55 },
                    { name: "DuckDB", value: 40 }
                ]
            },
            {
                name: "DevOps",
                children: [
                    { name: "Kubernetes", value: 150 },
                    { name: "Docker", value: 90 },
                    { name: "Terraform", value: 70 },
                    { name: "AWS", value: 130 }
                ]
            }
        ]);
        this.gaugeValue.set(76);
        this.useIndependentSeriesData.set(false);
        this.includeNegativeValues.set(false);
        this.isDataEmpty.set(false);
        this.#addLog("dataUpdate", "Reset dataset to defaults");
    }

    public onBarOrientationChange(val: unknown): void {
        const v = typeof val === "string" ? val : (val as { value?: string })?.value;
        if (v === "vertical" || v === "horizontal") {
            this.barOrientation.set(v);
            this.#addLog("settingChange", `Bar Orientation: ${v}`);
        }
    }

    public onTitleAlignChange(val: unknown): void {
        const v = typeof val === "string" ? val : (val as { value?: string })?.value;
        if (v === "left" || v === "center" || v === "right") {
            this.chartTitleAlign.set(v);
            this.#addLog("settingChange", `Chart Title Alignment: ${v}`);
        }
    }

    public onXAxisLabelRotationChange(val: unknown): void {
        const v = typeof val === "number" || typeof val === "string" ? val : (val as { value?: ChartAxisLabelRotation })?.value;
        if (v !== undefined) {
            this.xAxisLabelRotation.set(v as ChartAxisLabelRotation);
            this.#addLog("settingChange", `X-Axis Label Rotation: ${v}`);
        }
    }

    public onYAxisLabelRotationChange(val: unknown): void {
        const v = typeof val === "number" || typeof val === "string" ? val : (val as { value?: ChartAxisLabelRotation })?.value;
        if (v !== undefined) {
            this.yAxisLabelRotation.set(v as ChartAxisLabelRotation);
            this.#addLog("settingChange", `Y-Axis Label Rotation: ${v}`);
        }
    }

    public setTab(
        tab:
            | "bubble"
            | "candlestick"
            | "custom"
            | "donut"
            | "funnel"
            | "gauge"
            | "grouped"
            | "heatmap"
            | "horizontal"
            | "mixed"
            | "ohlc"
            | "percent-area"
            | "percent-bar"
            | "pie"
            | "polar"
            | "radar"
            | "radial-bar"
            | "range-area"
            | "range-bar"
            | "rose"
            | "scatter"
            | "stacked-area"
            | "stacked-bar"
            | "time"
            | "treemap"
            | "waterfall"
    ): void {
        this.activeTab.set(tab);
    }

    #addLog(eventType: string, details: string): void {
        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;
        const newEntry: DemoLogEntry = {
            details,
            eventType,
            id: ++this.#logId,
            timestamp
        };
        this.eventLogs.update(logs => [newEntry, ...logs.slice(0, 49)]);
    }
}
