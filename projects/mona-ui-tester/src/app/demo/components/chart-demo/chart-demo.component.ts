import { Component, computed, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    ChartAxisLabelTemplateDirective,
    ChartLegendItemTemplateDirective,
    ChartNoDataTemplateDirective,
    ChartTooltipTemplateDirective,
    MonaAreaSeriesComponent,
    MonaBarSeriesComponent,
    MonaChartComponent,
    MonaChartLegendComponent,
    MonaChartTooltipComponent,
    MonaChartXAxisComponent,
    MonaChartYAxisComponent,
    MonaLineSeriesComponent,
    type ChartAreaFillMode,
    type ChartCurve,
    type ChartPointEvent,
    type ChartPointFocusEvent,
    type ChartSeriesVisibilityEvent
} from "@nanahoshi/mona-ui/chart";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { TabComponent, TabContentTemplateDirective, TabsComponent } from "@nanahoshi/mona-ui/tabs";

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

@Component({
    imports: [
        ButtonDirective,
        CheckBoxComponent,
        MonaChartComponent,
        MonaChartXAxisComponent,
        MonaChartYAxisComponent,
        MonaLineSeriesComponent,
        MonaAreaSeriesComponent,
        MonaBarSeriesComponent,
        MonaChartLegendComponent,
        MonaChartTooltipComponent,
        ChartAxisLabelTemplateDirective,
        ChartLegendItemTemplateDirective,
        ChartNoDataTemplateDirective,
        ChartTooltipTemplateDirective,
        TabsComponent,
        TabComponent,
        TabContentTemplateDirective
    ],
    selector: "app-chart-demo",
    templateUrl: "./chart-demo.component.html"
})
export class ChartDemoComponent {
    #logId: number = 0;

    protected readonly activeTab = signal<"custom" | "grouped" | "mixed" | "time">("mixed");
    protected readonly areaFillMode = signal<ChartAreaFillMode>("gradient");
    protected readonly currencyFormatter = (value: unknown): string => {
        return typeof value === "number" ? `$${value.toLocaleString()}` : String(value);
    };
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
    public readonly eventLogs = signal<readonly DemoLogEntry[]>([]);
    protected readonly isDataEmpty = signal<boolean>(false);
    protected readonly legendPosition = signal<"bottom" | "left" | "right" | "top">("bottom");
    protected readonly monthlyData = signal<readonly MonthlyMetric[]>([
        { actual: 4200, forecast: 4000, month: "Jan", target: 4500 },
        { actual: 5100, forecast: 4800, month: "Feb", target: 5000 },
        { actual: 6400, forecast: 5900, month: "Mar", target: 5800 },
        { actual: 5800, forecast: 6100, month: "Apr", target: 6200 },
        { actual: 7200, forecast: 6800, month: "May", target: 6700 },
        { actual: 8100, forecast: 7500, month: "Jun", target: 7600 }
    ]);
    protected readonly niceAxes = signal<boolean>(true);
    protected readonly sharedTooltip = signal<boolean>(true);
    protected readonly showActualArea = signal<boolean>(true);
    protected readonly showForecastLine = signal<boolean>(true);
    protected readonly showPoints = signal<boolean>(true);
    protected readonly showTargetBars = signal<boolean>(true);
    protected readonly timeFormatter = (value: unknown): string => {
        if (value instanceof Date) {
            return `${value.getHours().toString().padStart(2, "0")}:${value.getMinutes().toString().padStart(2, "0")}`;
        }
        return String(value);
    };
    protected readonly useCustomNoData = signal<boolean>(false);
    protected readonly xAxisLine = signal<boolean>(true);
    protected readonly xGridLines = signal<boolean>(false);
    protected readonly yAxisLine = signal<boolean>(true);
    protected readonly yGridLines = signal<boolean>(true);

    public appendDataPoint(): void {
        const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentLength = this.monthlyData().length;
        const monthName = months[currentLength % months.length];
        const target = Math.round(5000 + Math.random() * 4000);
        const actual = Math.round(target * (0.85 + Math.random() * 0.3));
        const forecast = Math.round(target * 0.95);

        this.monthlyData.update(list => [...list, { actual, forecast, month: `${monthName} ${currentLength + 1}`, target }]);
        this.#addLog("dataUpdate", `Appended data point: ${monthName}`);
    }

    public clearLogs(): void {
        this.eventLogs.set([]);
    }

    public onPointClick(event: ChartPointEvent): void {
        this.#addLog(
            "pointClick",
            `Series: "${event.seriesName}" | X: ${event.xValue} | Y: ${event.yValue} | Index: ${event.dataIndex}`
        );
    }

    public onPointFocusChange(event: ChartPointFocusEvent): void {
        this.#addLog(
            "pointFocusChange",
            `Series: "${event.seriesName}" | X: ${event.xValue} | Y: ${event.yValue} | Index: ${event.dataIndex}`
        );
    }

    public onSeriesVisibilityChange(event: ChartSeriesVisibilityEvent): void {
        this.#addLog(
            "seriesVisibilityChange",
            `Series: "${event.seriesName}" | Visible: ${event.visible}`
        );
    }

    public randomizeData(): void {
        this.monthlyData.update(list =>
            list.map(item => ({
                actual: Math.round(3000 + Math.random() * 6000),
                forecast: Math.round(3000 + Math.random() * 6000),
                month: item.month,
                target: Math.round(3000 + Math.random() * 6000)
            }))
        );
        this.#addLog("dataUpdate", "Randomized monthly dataset values");
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
        this.isDataEmpty.set(false);
        this.#addLog("dataUpdate", "Reset dataset to defaults");
    }

    public setTab(tab: "custom" | "grouped" | "mixed" | "time"): void {
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
