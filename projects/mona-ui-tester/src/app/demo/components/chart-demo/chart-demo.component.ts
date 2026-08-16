import { Component, computed, inject, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    ChartAxisLabelTemplateDirective,
    ChartCenterTemplateDirective,
    ChartLegendItemTemplateDirective,
    ChartNoDataTemplateDirective,
    ChartSliceLabelTemplateDirective,
    ChartTooltipTemplateDirective,
    MonaAreaSeriesComponent,
    MonaBarSeriesComponent,
    MonaChartComponent,
    MonaChartLegendComponent,
    MonaChartTooltipComponent,
    MonaChartXAxisComponent,
    MonaChartYAxisComponent,
    MonaDonutSeriesComponent,
    MonaLineSeriesComponent,
    MonaPieSeriesComponent,
    type ChartAreaFillMode,
    type ChartCurve,
    type ChartPointEvent,
    type ChartPointFocusEvent,
    type ChartPolarFillMode,
    type ChartPolarLabelContent,
    type ChartPolarLabelPosition,
    type ChartSeriesVisibilityEvent,
    type ChartSliceVisibilityEvent
} from "@nanahoshi/mona-ui/chart";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { TabComponent, TabContentTemplateDirective, TabsComponent } from "@nanahoshi/mona-ui/tabs";
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

@Component({
    imports: [
        ButtonDirective,
        CheckBoxComponent,
        DropdownListComponent,
        MonaChartComponent,
        MonaChartXAxisComponent,
        MonaChartYAxisComponent,
        MonaLineSeriesComponent,
        MonaAreaSeriesComponent,
        MonaBarSeriesComponent,
        MonaPieSeriesComponent,
        MonaDonutSeriesComponent,
        MonaChartLegendComponent,
        MonaChartTooltipComponent,
        ChartAxisLabelTemplateDirective,
        ChartLegendItemTemplateDirective,
        ChartNoDataTemplateDirective,
        ChartTooltipTemplateDirective,
        ChartSliceLabelTemplateDirective,
        ChartCenterTemplateDirective,
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

    protected readonly activeTab = signal<"custom" | "donut" | "grouped" | "mixed" | "pie" | "time">("mixed");
    protected readonly areaFillMode = signal<ChartAreaFillMode>("gradient");
    protected readonly areaFillModeOptions: readonly { label: string; value: ChartAreaFillMode }[] = [
        { label: "Gradient (Fade to 0)", value: "gradient" },
        { label: "Solid Fill", value: "solid" }
    ];
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

    // Polar Data & Controls
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
    protected readonly legendPositionOptions: readonly { label: string; value: "bottom" | "left" | "right" | "top" }[] = [
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

    protected readonly sharedTooltip = signal<boolean>(true);
    protected readonly showArea = signal<boolean>(true);
    protected readonly showAxisTitles = signal<boolean>(false);
    protected readonly showBars = signal<boolean>(true);
    protected readonly showLine = signal<boolean>(true);
    protected readonly showPoints = signal<boolean>(true);
    protected readonly timeFormatter = (value: unknown): string => {
        if (value instanceof Date) {
            return `${value.getHours().toString().padStart(2, "0")}:${value.getMinutes().toString().padStart(2, "0")}`;
        }
        return String(value);
    };
    protected readonly useCustomNoData = signal<boolean>(false);
    protected readonly useIndependentSeriesData = signal<boolean>(false);
    protected readonly xAxisLine = signal<boolean>(true);
    protected readonly xAxisPosition = signal<"bottom" | "top">("bottom");
    protected readonly xGridLines = signal<boolean>(false);
    protected readonly yAxisLine = signal<boolean>(true);
    protected readonly yAxisPosition = signal<"left" | "right">("left");
    protected readonly yGridLines = signal<boolean>(true);

    public changeThemeColor(color: string): void {
        this.#themeService?.setPrimaryColor(color);
        this.#addLog("themeUpdate", `Applied primary theme color: ${color}`);
    }

    public appendDataPoint(): void {
        const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentLength = this.monthlyData().length;
        const monthName = months[currentLength % months.length];
        const minVal = this.includeNegativeValues() ? -4000 : 2000;
        const range = this.includeNegativeValues() ? 12000 : 6000;
        const actual = Math.round(minVal + Math.random() * range);
        const forecast = this.useIndependentSeriesData()
            ? Math.round(minVal + Math.random() * range)
            : actual;
        const target = this.useIndependentSeriesData()
            ? Math.round(minVal + Math.random() * range)
            : actual;

        this.monthlyData.update(list => [
            ...list,
            { actual, forecast, month: `${monthName} ${currentLength + 1}`, target }
        ]);
        this.#addLog("dataUpdate", `Appended data point: ${monthName}`);
    }

    public appendPieSlice(): void {
        const categories = ["Brave", "Vivaldi", "DuckDuckGo", "Arc", "Samsung Internet"];
        const currentCount = this.pieData().length;
        const cat = categories[currentCount % categories.length];
        const val = Math.round(2 + Math.random() * 15);
        this.pieData.update(list => [...list, { category: `${cat} ${currentCount + 1}`, value: val }]);
        this.#addLog("dataUpdate", `Appended pie slice: ${cat}`);
    }

    public appendDonutSlice(): void {
        const categories = ["Vertex AI", "Cloud Functions", "API Gateway", "Cloud Armor", "Pub/Sub"];
        const currentCount = this.donutData().length;
        const cat = categories[currentCount % categories.length];
        const val = Math.round(4000 + Math.random() * 25000);
        this.donutData.update(list => [...list, { category: `${cat} ${currentCount + 1}`, value: val }]);
        this.#addLog("dataUpdate", `Appended donut service: ${cat}`);
    }

    public clearLogs(): void {
        this.eventLogs.set([]);
    }

    public loadProfitLossData(): void {
        this.includeNegativeValues.set(true);
        this.monthlyData.set([
            { actual: 4800, forecast: 4500, month: "Jan", target: 5000 },
            { actual: 2600, forecast: 3000, month: "Feb", target: 2800 },
            { actual: -3200, forecast: -3000, month: "Mar", target: -3500 },
            { actual: -1800, forecast: -1500, month: "Apr", target: -2000 },
            { actual: 3900, forecast: 3600, month: "May", target: 4200 },
            { actual: 6400, forecast: 6100, month: "Jun", target: 6700 }
        ]);
        this.isDataEmpty.set(false);
        this.#addLog("dataUpdate", "Loaded preset dataset with mixed positive and negative values");
    }

    public onAreaFillModeChange(mode: ChartAreaFillMode | null): void {
        if (mode) {
            this.areaFillMode.set(mode);
        }
    }

    public onCurveTypeChange(curve: ChartCurve | null): void {
        if (curve) {
            this.curveType.set(curve);
        }
    }

    public onLabelContentChange(content: ChartPolarLabelContent | null): void {
        if (content) {
            this.pieLabelContent.set(content);
        }
    }

    public onPieLabelPositionChange(pos: ChartPolarLabelPosition | null): void {
        if (pos) {
            this.pieLabelPosition.set(pos);
        }
    }

    public onPieFillModeChange(mode: ChartPolarFillMode | null): void {
        if (mode) {
            this.pieFillMode.set(mode);
            this.#addLog("fillModeUpdate", `Set Pie fill mode: ${mode}`);
        }
    }

    public onDonutLabelPositionChange(pos: ChartPolarLabelPosition | null): void {
        if (pos) {
            this.donutLabelPosition.set(pos);
        }
    }

    public onDonutFillModeChange(mode: ChartPolarFillMode | null): void {
        if (mode) {
            this.donutFillMode.set(mode);
            this.#addLog("fillModeUpdate", `Set Donut fill mode: ${mode}`);
        }
    }

    public loadDensePieData(): void {
        this.pieData.set([
            { category: "Chrome", value: 45 },
            { category: "Safari", value: 20 },
            { category: "Edge", value: 12 },
            { category: "Firefox", value: 8 },
            { category: "Samsung Internet", value: 5 },
            { category: "Opera", value: 4 },
            { category: "Brave", value: 3 },
            { category: "Vivaldi", value: 2 },
            { category: "DuckDuckGo", value: 1 }
        ]);
        this.#addLog("dataUpdate", "Loaded dense 9-slice dataset testing outside leader line collision resolution");
    }

    public onLegendPositionChange(pos: "bottom" | "left" | "right" | "top" | null): void {
        if (pos) {
            this.legendPosition.set(pos);
        }
    }

    public onPointClick(event: ChartPointEvent): void {
        const polarDetails = event.category ? ` | Category: "${event.category}"` : "";
        this.#addLog(
            "pointClick",
            `Series: "${event.seriesName}" (${event.seriesType})${polarDetails} | Value: ${event.yValue} | Index: ${event.dataIndex}`
        );
    }

    public onPointFocusChange(event: ChartPointFocusEvent): void {
        const polarDetails = event.category ? ` | Category: "${event.category}"` : "";
        this.#addLog(
            "pointFocusChange",
            `Series: "${event.seriesName}" (${event.seriesType})${polarDetails} | Value: ${event.yValue} | Index: ${event.dataIndex}`
        );
    }

    public onSeriesVisibilityChange(event: ChartSeriesVisibilityEvent): void {
        this.#addLog(
            "seriesVisibilityChange",
            `Series: "${event.seriesName}" | Visible: ${event.visible}`
        );
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

    public resetData(): void {
        this.monthlyData.set([
            { actual: 4200, forecast: 4000, month: "Jan", target: 4500 },
            { actual: 5100, forecast: 4800, month: "Feb", target: 5000 },
            { actual: 6400, forecast: 5900, month: "Mar", target: 5800 },
            { actual: 5800, forecast: 6100, month: "Apr", target: 6200 },
            { actual: 7200, forecast: 6800, month: "May", target: 6700 },
            { actual: 8100, forecast: 7500, month: "Jun", target: 7600 }
        ]);
        this.useIndependentSeriesData.set(false);
        this.includeNegativeValues.set(false);
        this.isDataEmpty.set(false);
        this.#addLog("dataUpdate", "Reset dataset to defaults");
    }

    public setTab(tab: "custom" | "donut" | "grouped" | "mixed" | "pie" | "time"): void {
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
