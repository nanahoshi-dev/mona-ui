import { Component, computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
    ChartComponent,
    ChartLegendComponent,
    ChartLegendItemTemplateDirective,
    ChartNoDataTemplateDirective,
    ChartSubtitleTemplateDirective,
    ChartTitleTemplateDirective,
    ChartTooltipComponent,
    ChartTooltipTemplateDirective,
    ChartXAxisComponent,
    ChartYAxisComponent,
    HeatmapSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type {
    ChartAnimationInput,
    ChartAxisFormatter,
    ChartHeatmapColorMode,
    ChartValueFormatter
} from "@nanahoshi/mona-ui/chart";
import { SegmentedComponent } from "@nanahoshi/mona-ui/segmented";
import type { SegmentedOption } from "@nanahoshi/mona-ui/segmented";
import { filter, map } from "rxjs";
import type { ComponentMetadata } from "../../models/ComponentMetadata";
import { DemoService } from "../../services/demo.service";
import type { ComponentConfigFeatureItem, ComponentConfigInputType } from "../../utils/componentConfig";
import { DemoEventLog, readPartValues, reconcilePartValues } from "../../utils/demoParts";
import type { DemoPart, DemoPartValues } from "../../utils/demoParts";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { DAYS, HOURS, hourlyData, type HourlyDataSet } from "./chart-heatmap-demo.data";

type RampId = "diverging" | "theme" | "viridis" | "warm";

interface RampPreset {
    readonly colors: readonly string[] | undefined;
    readonly mode: ChartHeatmapColorMode;
}

const BLUES: readonly string[] = ["#eff6ff", "#93c5fd", "#1d4ed8"];
const VIRIDIS: readonly string[] = ["#440154", "#3b528b", "#21918c", "#5ec962", "#fde725"];
const WARM: readonly string[] = ["#fff7bc", "#fec44f", "#d95f0e", "#7f2704"];
const RED_BLUE: readonly string[] = ["#2166ac", "#f7f7f7", "#b2182b"];
const PURPLE_GREEN: readonly string[] = ["#762a83", "#f7f7f7", "#1b7837"];

/** The color stops the series panel offers. Two or more stops suit a sequential scale, exactly three a diverging one. */
const COLOR_STOPS: readonly { readonly text: string; readonly value: readonly string[] | undefined }[] = [
    { text: "Theme (from color)", value: undefined },
    { text: "Blues, 3 stops", value: BLUES },
    { text: "Viridis, 5 stops", value: VIRIDIS },
    { text: "Warm, 4 stops", value: WARM },
    { text: "Red to blue, 3 stops", value: RED_BLUE },
    { text: "Purple to green, 3 stops", value: PURPLE_GREEN }
];

/** The ramps the toolbar sets in one step: the color stops and the mode that suits them. */
const RAMPS: Readonly<Record<RampId, RampPreset>> = {
    diverging: { colors: RED_BLUE, mode: "diverging" },
    theme: { colors: undefined, mode: "sequential" },
    viridis: { colors: VIRIDIS, mode: "sequential" },
    warm: { colors: WARM, mode: "sequential" }
};

const RAMP_IDS: readonly RampId[] = ["theme", "viridis", "warm", "diverging"];

const VALUE_FORMATTERS: readonly { readonly text: string; readonly value: ChartValueFormatter | undefined }[] = [
    { text: "Locale default", value: undefined },
    { text: "Visits suffix", value: value => `${Number(value).toLocaleString("en")} visits` },
    {
        text: "Signed percent",
        value: value => {
            const number = Number(value);
            return `${number > 0 ? "+" : ""}${number}%`;
        }
    }
];

const DAY_NAMES: Readonly<Record<string, string>> = {
    Fri: "Friday",
    Holiday: "Holiday",
    Mon: "Monday",
    Sat: "Saturday",
    Sun: "Sunday",
    Thu: "Thursday",
    Tue: "Tuesday",
    Wed: "Wednesday"
};

const X_AXIS_FORMATTERS: readonly { readonly text: string; readonly value: ChartAxisFormatter | undefined }[] = [
    { text: "As in the data", value: undefined },
    {
        text: "12-hour clock",
        value: value => {
            const hour = Number.parseInt(String(value), 10);
            return Number.isNaN(hour) ? String(value) : `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`;
        }
    },
    { text: "Hour only", value: value => String(value).slice(0, 2) }
];

const Y_AXIS_FORMATTERS: readonly { readonly text: string; readonly value: ChartAxisFormatter | undefined }[] = [
    { text: "As in the data", value: undefined },
    { text: "Full day name", value: value => DAY_NAMES[String(value)] ?? String(value) },
    { text: "First letter", value: value => String(value).charAt(0) }
];

const X_CATEGORIES: readonly { readonly text: string; readonly value: readonly unknown[] | undefined }[] = [
    { text: "Order of the data", value: undefined },
    { text: "Reversed", value: [...HOURS].reverse() },
    { text: "Business hours first", value: HOURS.slice(8, 18) }
];

const Y_CATEGORIES: readonly { readonly text: string; readonly value: readonly unknown[] | undefined }[] = [
    { text: "Order of the data", value: undefined },
    { text: "Sunday first", value: ["Sun", ...DAYS.slice(0, 6)] },
    { text: "Weekend first", value: ["Sat", "Sun"] },
    { text: "With an empty Holiday row", value: [...DAYS, "Holiday"] }
];

/**
 * The playground of the Heatmap page. It covers every input of the heatmap series, the axes, the legend, the tooltip
 * and the chart that apply to a heatmap, and the templates they take. It shares nothing with the other chart family
 * playgrounds.
 */
@Component({
    selector: "app-chart-heatmap-demo",
    imports: [
        ChartComponent,
        ChartLegendComponent,
        ChartLegendItemTemplateDirective,
        ChartNoDataTemplateDirective,
        ChartSubtitleTemplateDirective,
        ChartTitleTemplateDirective,
        ChartTooltipComponent,
        ChartTooltipTemplateDirective,
        ChartXAxisComponent,
        ChartYAxisComponent,
        HeatmapSeriesComponent,
        PartsDemoContainerComponent,
        SegmentedComponent
    ],
    templateUrl: "./chart-heatmap-demo.component.html"
})
export class ChartHeatmapDemoComponent {
    readonly #chartFeatures = this.#features({
        animation: {
            name: "Animation options",
            description: 'Binds an options object to animation instead of true. Off here means [animation]="false".',
            active: true,
            directiveBinding: { hostAttribute: "animation", buildValue: features => readAnimation(features) },
            subFeatures: {
                duration: {
                    name: "Duration",
                    description: "Milliseconds.",
                    type: "number",
                    numericValue: 300,
                    numericMin: 0
                },
                easing: {
                    name: "Easing",
                    description: "The timing function.",
                    type: "dropdown",
                    dropdownDataSource: ["ease-out", "ease-in", "ease-in-out", "linear"],
                    dropdownValue: "ease-out"
                },
                initial: { name: "Initial", description: "Animate the first render.", active: true },
                data: {
                    name: "Data",
                    description:
                        "Animate data changes. Cells change color when the grid stays the same, and cross-fade when it doesn't.",
                    active: true
                },
                visibility: { name: "Visibility", description: "Animate showing and hiding the series.", active: true }
            }
        },
        titleTemplate: {
            name: "Title template",
            description: "Replaces the title text with your own markup.",
            active: false,
            code: `
                <ng-template monaChartTitleTemplate let-title>
                    <span class="font-semibold">🔥 {{ title }}</span>
                </ng-template>`
        },
        subtitleTemplate: {
            name: "Subtitle template",
            description: "Replaces the subtitle text with your own markup.",
            active: false,
            code: `
                <ng-template monaChartSubtitleTemplate let-subtitle>
                    <em>{{ subtitle }}</em>
                </ng-template>`
        },
        noDataTemplate: {
            name: "No data template",
            description:
                "What the chart shows without data, or with the series hidden. Pick the empty data set to see it.",
            active: false,
            code: `
                <ng-template monaChartNoDataTemplate>
                    <span>Nothing to show yet</span>
                </ng-template>`
        }
    });
    readonly #legendFeatures = this.#features({
        legendItemTemplate: {
            name: "Legend item template",
            description:
                "Replaces the series entry with your own markup. It shows in series mode, or while there is no color scale.",
            active: false,
            code: `
                <ng-template monaChartLegendItemTemplate let-item>
                    <span [style.color]="item.color">{{ item.name }}</span>
                </ng-template>`
        }
    });
    readonly #metadata = toSignal(
        inject(DemoService).metadata$.pipe(
            filter(metadata => !!metadata),
            map(metadata => metadata ?? {})
        ),
        { initialValue: {} as Record<string, ComponentMetadata> }
    );
    readonly #tooltipFeatures = this.#features({
        tooltipTemplate: {
            name: "Tooltip template",
            description: "Replaces the tooltip content with your own markup.",
            active: false,
            code: `
                <ng-template monaChartTooltipTemplate let-point>
                    <div>{{ point.formattedYCategory }} {{ point.formattedXValue }}: {{ point.formattedY }}</div>
                </ng-template>`
        }
    });

    protected readonly animation = computed<ChartAnimationInput>(() => readAnimation(this.#chartFeatures.data()));
    protected readonly chart = computed(() => readPartValues<ChartComponent>(this.#part("chart"), this.values()));
    protected readonly chartFeatures = this.#chartFeatures.data;
    protected readonly data = computed(() => hourlyData(this.dataSet()));
    protected readonly dataSet = signal<HourlyDataSet>("activity");
    protected readonly dataSetOptions: readonly SegmentedOption<HourlyDataSet>[] = [
        { label: "Activity", value: "activity" },
        { label: "Change", value: "change" },
        { label: "With gaps", value: "gaps" },
        { label: "Empty", value: "empty" }
    ];
    protected readonly eventLog = new DemoEventLog();
    protected readonly legend = computed(() =>
        readPartValues<ChartLegendComponent>(this.#part("legend"), this.values())
    );
    protected readonly legendFeatures = this.#legendFeatures.data;
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const chartMetadata = metadata["ChartComponent"] ?? emptyMetadata();
        const seriesMetadata = metadata["HeatmapSeriesComponent"] ?? emptyMetadata();
        const xAxisMetadata = metadata["ChartXAxisComponent"] ?? emptyMetadata();
        const yAxisMetadata = metadata["ChartYAxisComponent"] ?? emptyMetadata();
        const legendMetadata = metadata["ChartLegendComponent"] ?? emptyMetadata();
        const tooltipMetadata = metadata["ChartTooltipComponent"] ?? emptyMetadata();
        return [
            {
                id: "chart",
                title: "Chart",
                metadata: chartMetadata,
                codeAttributes: ['[data]="data"', 'xField="hour"'],
                config: {
                    inputs: deriveInputConfig<ChartComponent>(chartMetadata, chartOverrides(), {
                        resolveAliases: true
                    }),
                    featureHandler: this.#chartFeatures
                }
            },
            {
                id: "heatmap",
                title: "Heatmap series",
                metadata: seriesMetadata,
                codeAttributes: ['field="value"', 'yField="day"'],
                config: {
                    inputs: deriveInputConfig<HeatmapSeriesComponent>(seriesMetadata, seriesOverrides(), {
                        resolveAliases: true
                    })
                }
            },
            {
                id: "xAxis",
                title: "X axis",
                metadata: xAxisMetadata,
                config: {
                    inputs: deriveInputConfig<ChartXAxisComponent>(
                        xAxisMetadata,
                        {
                            ...axisOverrides<ChartXAxisComponent>(),
                            formatter: customDropdown(X_AXIS_FORMATTERS, undefined),
                            title: { type: "string", value: "Hour of day" }
                        },
                        { resolveAliases: true }
                    )
                }
            },
            {
                id: "yAxis",
                title: "Y axis",
                metadata: yAxisMetadata,
                config: {
                    inputs: deriveInputConfig<ChartYAxisComponent>(
                        yAxisMetadata,
                        {
                            ...axisOverrides<ChartYAxisComponent>(),
                            formatter: customDropdown(Y_AXIS_FORMATTERS, undefined)
                        },
                        { resolveAliases: true }
                    )
                }
            },
            {
                id: "legend",
                title: "Legend",
                metadata: legendMetadata,
                config: {
                    inputs: deriveInputConfig<ChartLegendComponent>(
                        legendMetadata,
                        { userClass: undefined },
                        { resolveAliases: true }
                    ),
                    featureHandler: this.#legendFeatures
                }
            },
            {
                id: "tooltip",
                title: "Tooltip",
                metadata: tooltipMetadata,
                config: {
                    inputs: deriveInputConfig<ChartTooltipComponent>(
                        tooltipMetadata,
                        // A heatmap tooltip always shows one cell, so `shared` has no effect here.
                        { shared: undefined, userClass: undefined },
                        { resolveAliases: true }
                    ),
                    featureHandler: this.#tooltipFeatures
                }
            }
        ];
    });
    protected readonly ramp = computed<RampId | null>(() => {
        const series = this.series();
        return RAMP_IDS.find(id => RAMPS[id].colors === series.colors && RAMPS[id].mode === series.colorMode) ?? null;
    });
    protected readonly rampOptions: readonly SegmentedOption<RampId>[] = [
        { label: "Theme", value: "theme" },
        { label: "Viridis", value: "viridis" },
        { label: "Warm", value: "warm" },
        { label: "Diverging", value: "diverging" }
    ];
    /** The panels come from metadata that loads after the page; until then the chart would get no settings. */
    protected readonly ready = computed(() => this.parts().every(part => (part.metadata.inputs ?? []).length > 0));
    protected readonly series = computed(() =>
        readPartValues<HeatmapSeriesComponent>(this.#part("heatmap"), this.values())
    );
    protected readonly tooltip = computed(() =>
        readPartValues<ChartTooltipComponent>(this.#part("tooltip"), this.values())
    );
    protected readonly tooltipFeatures = this.#tooltipFeatures.data;
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });
    protected readonly xAxis = computed(() => readPartValues<ChartXAxisComponent>(this.#part("xAxis"), this.values()));
    protected readonly yAxis = computed(() => readPartValues<ChartYAxisComponent>(this.#part("yAxis"), this.values()));

    protected onDataSetChange(set: HourlyDataSet | null): void {
        if (set) {
            this.dataSet.set(set);
        }
    }

    protected onRampChange(id: RampId | null): void {
        if (!id) {
            return;
        }
        const { colors, mode } = RAMPS[id];
        this.values.update(values => ({ ...values, heatmap: { ...values["heatmap"], colorMode: mode, colors } }));
    }

    protected onSeriesVisibleChange(visible: boolean): void {
        this.values.update(values => ({ ...values, heatmap: { ...values["heatmap"], visible } }));
        this.eventLog.record("visibleChange", visible);
    }

    /** Runs from the field initializers, so it can still inject. */
    #features(data: ComponentConfigFeatureItem): FeatureConfigHandler {
        return createFeatureInjector(data, inject(Injector)).get(FeatureConfigHandler);
    }

    #part(id: string): DemoPart | undefined {
        return this.parts().find(part => part.id === id);
    }
}

function emptyMetadata(): ComponentMetadata {
    return { inputs: [], name: "", selector: "" };
}

function customDropdown<T>(options: readonly { readonly text: string; readonly value: T }[], defaultValue: T) {
    return { type: "customDropdown" as const, value: options, textField: "text", valueField: "value", defaultValue };
}

function chartOverrides(): Partial<ComponentConfigInputType<ChartComponent>> {
    return {
        ariaDescription: { alias: "aria-description", type: "string", value: "" },
        ariaLabel: { alias: "aria-label", type: "string", value: "" },
        subtitle: { type: "string", value: "Average visits per hour, by weekday" },
        title: { type: "string", value: "When visitors arrive" },
        userClass: undefined
    };
}

function seriesOverrides(): Partial<ComponentConfigInputType<HeatmapSeriesComponent>> {
    return {
        color: { type: "color", value: "" },
        colors: customDropdown(COLOR_STOPS, undefined),
        name: { type: "string", value: "Visits" },
        strokeColor: { type: "color", value: "" },
        userClass: undefined,
        valueFormatter: customDropdown(VALUE_FORMATTERS, undefined),
        xCategories: customDropdown(X_CATEGORIES, undefined),
        yCategories: customDropdown(Y_CATEGORIES, undefined)
    };
}

/**
 * Hides the axis inputs a heatmap ignores: its axes are always category axes, laid out by the heatmap, so the scale,
 * range, tick count and label rotation inputs don't apply.
 */
function axisOverrides<T extends ChartXAxisComponent | ChartYAxisComponent>(): Partial<ComponentConfigInputType<T>> {
    const overrides: Partial<ComponentConfigInputType<ChartYAxisComponent>> = {
        axisId: undefined,
        exponent: undefined,
        labelMaxWidth: undefined,
        labelRotation: undefined,
        logBase: undefined,
        max: undefined,
        min: undefined,
        nice: undefined,
        symlogConstant: undefined,
        tickCount: undefined,
        type: undefined
    };
    return overrides as Partial<ComponentConfigInputType<T>>;
}

function subFeature(features: ComponentConfigFeatureItem, key: string, name: string) {
    return features[key]?.subFeatures?.[name];
}

function readAnimation(features: ComponentConfigFeatureItem): ChartAnimationInput {
    if (!features["animation"]?.active) {
        return false;
    }
    return {
        data: subFeature(features, "animation", "data")?.active ?? true,
        duration: subFeature(features, "animation", "duration")?.numericValue ?? 300,
        easing: (subFeature(features, "animation", "easing")?.dropdownValue as "ease-out") ?? "ease-out",
        initial: subFeature(features, "animation", "initial")?.active ?? true,
        visibility: subFeature(features, "animation", "visibility")?.active ?? true
    };
}
