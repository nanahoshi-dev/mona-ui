import { Component, computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
    AreaSeriesComponent,
    ChartAxisLabelTemplateDirective,
    ChartComponent,
    ChartDataLabelTemplateDirective,
    ChartLegendComponent,
    ChartLegendItemTemplateDirective,
    ChartNoDataTemplateDirective,
    ChartSubtitleTemplateDirective,
    ChartTitleTemplateDirective,
    ChartTooltipComponent,
    ChartTooltipTemplateDirective,
    ChartXAxisComponent,
    ChartYAxisComponent,
    LineSeriesComponent,
    RangeAreaSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type {
    ChartAnimationInput,
    ChartAxisFormatter,
    ChartAxisLabelRotation,
    ChartDataLabelsInput,
    ChartDownsamplingInput,
    ChartNavigationInput,
    ChartValueFormatter
} from "@nanahoshi/mona-ui/chart";
import { SegmentedComponent } from "@nanahoshi/mona-ui/segmented";
import type { SegmentedOption } from "@nanahoshi/mona-ui/segmented";
import { filter, map } from "rxjs";
import { ComponentMetadata } from "../../models/ComponentMetadata";
import { DemoService } from "../../services/demo.service";
import { ComponentConfigFeatureItem, ComponentConfigInputType } from "../../utils/componentConfig";
import { DemoEventLog, DemoPart, DemoPartValues, readPartValues, reconcilePartValues } from "../../utils/demoParts";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { trafficData, type TrafficDataSet } from "./chart-line-area-demo.data";

type SeriesType = "area" | "line" | "rangeArea";

const SERIES_METADATA: Readonly<Record<SeriesType, string>> = {
    area: "AreaSeriesComponent",
    line: "LineSeriesComponent",
    rangeArea: "RangeAreaSeriesComponent"
};

const SERIES_TITLES: Readonly<Record<SeriesType, string>> = {
    area: "Area series",
    line: "Line series",
    rangeArea: "Range area series"
};

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

const VALUE_FORMATTERS: readonly { readonly text: string; readonly value: ChartValueFormatter | undefined }[] = [
    { text: "Locale default", value: undefined },
    { text: "Compact (3.2K)", value: value => compact.format(Number(value)) },
    { text: "Visitors suffix", value: value => `${Number(value).toLocaleString("en")} visitors` }
];

const AXIS_FORMATTERS: readonly { readonly text: string; readonly value: ChartAxisFormatter | undefined }[] = [
    { text: "Locale default", value: undefined },
    { text: "Compact (3.2K)", value: value => (typeof value === "number" ? compact.format(value) : String(value)) },
    { text: "Upper case", value: value => String(value).toUpperCase() }
];

const LABEL_ROTATIONS: readonly { readonly text: string; readonly value: ChartAxisLabelRotation }[] = [
    { text: "0°", value: 0 },
    { text: "Automatic", value: "auto" },
    { text: "-45°", value: -45 },
    { text: "90°", value: 90 }
];

/**
 * The playground of the Line & Area page. It covers every input of the line, area and range area series, both
 * Cartesian axes, the legend, the tooltip and the chart itself, and the templates they take. It shares nothing with
 * the other chart family playgrounds.
 */
@Component({
    selector: "app-chart-line-area-demo",
    imports: [
        AreaSeriesComponent,
        ChartAxisLabelTemplateDirective,
        ChartComponent,
        ChartDataLabelTemplateDirective,
        ChartLegendComponent,
        ChartLegendItemTemplateDirective,
        ChartNoDataTemplateDirective,
        ChartSubtitleTemplateDirective,
        ChartTitleTemplateDirective,
        ChartTooltipComponent,
        ChartTooltipTemplateDirective,
        ChartXAxisComponent,
        ChartYAxisComponent,
        LineSeriesComponent,
        PartsDemoContainerComponent,
        RangeAreaSeriesComponent,
        SegmentedComponent
    ],
    templateUrl: "./chart-line-area-demo.component.html"
})
export class ChartLineAreaDemoComponent {
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
                data: { name: "Data", description: "Animate data changes.", active: true },
                visibility: { name: "Visibility", description: "Animate legend toggles.", active: true }
            }
        },
        navigation: {
            name: "Navigation",
            description: "Pan and zoom the plot with the wheel, drag, pinch and keys. Try it with the daily data.",
            active: false,
            directiveBinding: { hostAttribute: "navigation", buildValue: features => readNavigation(features) },
            subFeatures: {
                zoomAxes: {
                    name: "Zoom axes",
                    description: "Which axes zoom.",
                    type: "dropdown",
                    dropdownDataSource: ["auto", "x", "y", "xy"],
                    dropdownValue: "auto"
                },
                panAxes: {
                    name: "Pan axes",
                    description: "Which axes pan.",
                    type: "dropdown",
                    dropdownDataSource: ["auto", "x", "y", "xy"],
                    dropdownValue: "auto"
                },
                wheelZoom: { name: "Wheel zoom", description: "Zoom with the wheel.", active: true },
                dragPan: { name: "Drag pan", description: "Pan by dragging.", active: true },
                pinchZoom: { name: "Pinch zoom", description: "Zoom with two fingers.", active: true },
                keyboard: {
                    name: "Keyboard",
                    description: "Shift + arrows pan, + and - zoom, 0 resets.",
                    active: true
                },
                clampToData: { name: "Clamp to data", description: "Keep the viewport inside the data.", active: true },
                minVisibleCategories: {
                    name: "Minimum visible categories",
                    description: "The fewest categories a zoom leaves.",
                    type: "number",
                    numericValue: 1,
                    numericMin: 1
                }
            }
        },
        downsampling: {
            name: "Downsampling options",
            description: 'The chart-wide policy for dense series. Off here means [downsampling]="false".',
            active: true,
            directiveBinding: {
                hostAttribute: "downsampling",
                buildValue: features => readDownsampling(features, "downsampling")
            },
            subFeatures: downsamplingSubFeatures()
        },
        titleTemplate: {
            name: "Title template",
            description: "Replaces the title text with your own markup.",
            active: false,
            code: `
                <ng-template monaChartTitleTemplate let-title>
                    <span class="font-semibold">📈 {{ title }}</span>
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
            description: "What the chart shows without data. Pick the empty data set to see it.",
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
            description: "Replaces each legend entry with your own markup.",
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
    readonly #seriesFeatures = this.#features({
        dataLabels: {
            name: "Data labels",
            description: "Writes each value beside its point.",
            active: false,
            directiveBinding: { hostAttribute: "dataLabels", buildValue: features => readDataLabels(features) },
            subFeatures: {
                position: {
                    name: "Position",
                    description: "Where a label goes. Automatic picks a free spot and follows the direction.",
                    type: "dropdown",
                    dropdownDataSource: ["auto", "top", "bottom", "left", "right", "center"],
                    dropdownValue: "auto"
                },
                offset: {
                    name: "Offset",
                    description: "Pixels from the point.",
                    type: "number",
                    numericValue: 6,
                    numericMin: 0
                },
                overflow: {
                    name: "Overflow",
                    description: "What happens at the plot edge.",
                    type: "dropdown",
                    dropdownDataSource: ["hide", "clip"],
                    dropdownValue: "hide"
                },
                allowOverlap: { name: "Allow overlap", description: "Keep labels that collide.", active: false },
                collisionPadding: {
                    name: "Collision padding",
                    description: "Space kept around a label.",
                    type: "number",
                    numericValue: 2,
                    numericMin: 0
                },
                maxLabels: {
                    name: "Maximum labels",
                    description: "The most labels shown.",
                    type: "number",
                    numericValue: 200,
                    numericMin: 0
                },
                color: {
                    name: "Color",
                    description: "Any CSS color. Empty uses the theme.",
                    type: "string",
                    stringValue: ""
                },
                compact: { name: "Compact formatter", description: "Formats labels as 3.2K.", active: false }
            }
        },
        dataLabelTemplate: {
            name: "Data label template",
            description: "Replaces the label text with your own markup. Turn on data labels too.",
            active: false,
            code: `
                <ng-template monaChartDataLabel let-label>
                    <span class="font-semibold">{{ label.formattedValue }}</span>
                </ng-template>`
        },
        downsampling: {
            name: "Downsampling",
            description: "The series' own policy, which wins over the chart's. Off leaves it to the chart.",
            active: false,
            directiveBinding: {
                hostAttribute: "downsampling",
                buildValue: features => readDownsampling(features, "downsampling")
            },
            subFeatures: downsamplingSubFeatures()
        }
    });
    readonly #tooltipFeatures = this.#features({
        tooltipTemplate: {
            name: "Tooltip template",
            description: "Replaces the tooltip content with your own markup.",
            active: false,
            code: `
                <ng-template monaChartTooltipTemplate let-points="points">
                    @for (point of points; track point.seriesId) {
                        <div>{{ point.seriesName }}: {{ point.formattedY }}</div>
                    }
                </ng-template>`
        }
    });

    readonly #xAxisFeatures = this.#features({
        axisLabelTemplate: {
            name: "Axis label template",
            description: "Replaces each tick label with your own markup.",
            active: false,
            code: `
                <ng-template monaChartAxisLabelTemplate let-value let-index="index">
                    <span [class.font-semibold]="index === 0">{{ value }}</span>
                </ng-template>`
        }
    });
    protected readonly animation = computed<ChartAnimationInput>(() => readAnimation(this.#chartFeatures.data()));
    protected readonly chart = computed(() => readPartValues<ChartComponent>(this.#part("chart"), this.values()));
    protected readonly chartFeatures = this.#chartFeatures.data;
    protected readonly data = computed(() => trafficData(this.dataSet()));
    protected readonly dataLabels = computed<ChartDataLabelsInput>(() => readDataLabels(this.#seriesFeatures.data()));
    protected readonly dataSet = signal<TrafficDataSet>("monthly");
    protected readonly dataSetOptions: readonly SegmentedOption<TrafficDataSet>[] = [
        { label: "Months", value: "monthly" },
        { label: "Days", value: "daily" },
        { label: "With gaps", value: "gaps" },
        { label: "Empty", value: "empty" }
    ];
    protected readonly downsampling = computed<ChartDownsamplingInput>(() =>
        readDownsampling(this.#chartFeatures.data(), "downsampling")
    );
    protected readonly eventLog = new DemoEventLog();
    protected readonly legend = computed(() =>
        readPartValues<ChartLegendComponent>(this.#part("legend"), this.values())
    );
    protected readonly legendFeatures = this.#legendFeatures.data;
    protected readonly navigation = computed<ChartNavigationInput>(() => readNavigation(this.#chartFeatures.data()));
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const type = this.seriesType();
        const chartMetadata = metadata["ChartComponent"] ?? emptyMetadata();
        const seriesMetadata = metadata[SERIES_METADATA[type]] ?? emptyMetadata();
        const xAxisMetadata = metadata["ChartXAxisComponent"] ?? emptyMetadata();
        const yAxisMetadata = metadata["ChartYAxisComponent"] ?? emptyMetadata();
        const legendMetadata = metadata["ChartLegendComponent"] ?? emptyMetadata();
        const tooltipMetadata = metadata["ChartTooltipComponent"] ?? emptyMetadata();
        return [
            {
                id: "chart",
                title: "Chart",
                metadata: chartMetadata,
                codeAttributes: ['[data]="data"', 'xField="date"'],
                config: {
                    inputs: deriveInputConfig<ChartComponent>(chartMetadata, chartOverrides(), {
                        resolveAliases: true
                    }),
                    featureHandler: this.#chartFeatures
                }
            },
            {
                id: type,
                title: SERIES_TITLES[type],
                metadata: seriesMetadata,
                codeAttributes: type === "rangeArea" ? ['fromField="low"', 'toField="high"'] : ['field="visitors"'],
                config: {
                    inputs: deriveInputConfig<LineSeriesComponent>(seriesMetadata, seriesOverrides(type), {
                        resolveAliases: true
                    }),
                    featureHandler: this.#seriesFeatures
                }
            },
            {
                id: "xAxis",
                title: "X axis",
                metadata: xAxisMetadata,
                config: {
                    inputs: deriveInputConfig<ChartXAxisComponent>(
                        xAxisMetadata,
                        axisOverrides<ChartXAxisComponent>(),
                        { resolveAliases: true }
                    ),
                    featureHandler: this.#xAxisFeatures
                }
            },
            {
                id: "yAxis",
                title: "Y axis",
                metadata: yAxisMetadata,
                config: {
                    inputs: deriveInputConfig<ChartYAxisComponent>(
                        yAxisMetadata,
                        { ...axisOverrides<ChartYAxisComponent>(), title: { type: "string", value: "Visitors" } },
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
                        { shared: { type: "boolean", value: true }, userClass: undefined },
                        { resolveAliases: true }
                    ),
                    featureHandler: this.#tooltipFeatures
                }
            }
        ];
    });
    /** The panels come from metadata that loads after the page; until then the chart would get no settings. */
    protected readonly ready = computed(() => this.parts().every(part => (part.metadata.inputs ?? []).length > 0));
    protected readonly series = computed(() =>
        readPartValues<LineSeriesComponent>(this.#part(this.seriesType()), this.values())
    );
    protected readonly seriesDownsampling = computed<ChartDownsamplingInput | undefined>(() => {
        const features = this.#seriesFeatures.data();
        return features["downsampling"]?.active ? readDownsampling(features, "downsampling") : undefined;
    });
    /** The area and range area inputs the line series doesn't have, read loosely since one panel serves all three. */
    protected readonly seriesExtras = computed(() => this.series() as unknown as SeriesExtras);

    protected readonly seriesFeatures = this.#seriesFeatures.data;
    protected readonly seriesType = signal<SeriesType>("line");
    protected readonly seriesTypeOptions: readonly SegmentedOption<SeriesType>[] = [
        { label: "Line", value: "line" },
        { label: "Area", value: "area" },
        { label: "Range area", value: "rangeArea" }
    ];
    protected readonly tooltip = computed(() =>
        readPartValues<ChartTooltipComponent>(this.#part("tooltip"), this.values())
    );
    protected readonly tooltipFeatures = this.#tooltipFeatures.data;
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });
    protected readonly xAxis = computed(() => readPartValues<ChartXAxisComponent>(this.#part("xAxis"), this.values()));
    protected readonly xAxisFeatures = this.#xAxisFeatures.data;
    protected readonly yAxis = computed(() => readPartValues<ChartYAxisComponent>(this.#part("yAxis"), this.values()));
    protected onDataSetChange(set: TrafficDataSet | null): void {
        if (set) {
            this.dataSet.set(set);
        }
    }

    protected onSeriesTypeChange(type: SeriesType | null): void {
        if (type) {
            this.seriesType.set(type);
        }
    }

    protected onSeriesVisibleChange(visible: boolean): void {
        const type = this.seriesType();
        this.values.update(values => ({ ...values, [type]: { ...values[type], visible } }));
        this.eventLog.record("visibleChange", visible);
    }

    #features(data: ComponentConfigFeatureItem): FeatureConfigHandler {
        return createFeatureInjector(data, inject(Injector)).get(FeatureConfigHandler);
    }

    #part(id: string): DemoPart | undefined {
        return this.parts().find(part => part.id === id);
    }
}

interface SeriesExtras {
    readonly fillMode: "gradient" | "solid";
    readonly fillOpacity: number | undefined;
    readonly stack: string | undefined;
    readonly stackMode: "normal" | "percent";
}

function emptyMetadata(): ComponentMetadata {
    return { inputs: [], name: "", selector: "" };
}

function chartOverrides(): Partial<ComponentConfigInputType<ChartComponent>> {
    return {
        ariaDescription: { alias: "aria-description", type: "string", value: "" },
        ariaLabel: { alias: "aria-label", type: "string", value: "" },
        subtitle: { type: "string", value: "Unique visitors and sign-ups" },
        title: { type: "string", value: "Website traffic" },
        userClass: undefined
    };
}

function seriesOverrides(type: SeriesType): Partial<ComponentConfigInputType<LineSeriesComponent>> {
    return {
        color: { type: "color", value: "" },
        name: { type: "string", value: type === "rangeArea" ? "Expected range" : "Visitors" },
        seriesKey: undefined,
        userClass: undefined,
        valueFormatter: {
            type: "customDropdown",
            value: VALUE_FORMATTERS,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        },
        xAxisId: undefined,
        yAxisId: undefined
    };
}

function axisOverrides<T extends ChartXAxisComponent | ChartYAxisComponent>(): Partial<ComponentConfigInputType<T>> {
    const overrides: Partial<ComponentConfigInputType<ChartXAxisComponent>> = {
        axisId: undefined,
        formatter: {
            type: "customDropdown",
            value: AXIS_FORMATTERS,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        },
        labelRotation: {
            type: "customDropdown",
            value: LABEL_ROTATIONS,
            textField: "text",
            valueField: "value",
            defaultValue: 0
        }
    };
    return overrides as Partial<ComponentConfigInputType<T>>;
}

function downsamplingSubFeatures(): ComponentConfigFeatureItem {
    return {
        algorithm: {
            name: "Algorithm",
            description: "A preference. The family decides what is safe.",
            type: "dropdown",
            dropdownDataSource: ["auto", "minmax", "lttb", "pixel"],
            dropdownValue: "auto"
        },
        enabled: { name: "Enabled", description: "Reduce dense series at all.", active: true },
        maxPoints: {
            name: "Maximum points",
            description: "A hard cap. Empty leaves it to the plot width.",
            type: "number",
            numericNullable: true,
            numericMin: 2
        },
        samplesPerPixel: {
            name: "Samples per pixel",
            description: "How many points a pixel keeps.",
            type: "number",
            numericValue: 1,
            numericMin: 1
        },
        threshold: {
            name: "Threshold",
            description: "Points before reduction starts. Empty uses the default.",
            type: "number",
            numericNullable: true,
            numericMin: 0
        }
    };
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

function readNavigation(features: ComponentConfigFeatureItem): ChartNavigationInput {
    if (!features["navigation"]?.active) {
        return false;
    }
    const read = (name: string) => subFeature(features, "navigation", name);
    return {
        clampToData: read("clampToData")?.active ?? true,
        dragPan: read("dragPan")?.active ?? true,
        keyboard: read("keyboard")?.active ?? true,
        minVisibleCategories: read("minVisibleCategories")?.numericValue ?? 1,
        panAxes: (read("panAxes")?.dropdownValue as "auto") ?? "auto",
        pinchZoom: read("pinchZoom")?.active ?? true,
        wheelZoom: read("wheelZoom")?.active ?? true,
        zoomAxes: (read("zoomAxes")?.dropdownValue as "auto") ?? "auto"
    };
}

function readDownsampling(features: ComponentConfigFeatureItem, key: string): ChartDownsamplingInput {
    if (!features[key]?.active) {
        return false;
    }
    const read = (name: string) => subFeature(features, key, name);
    const maxPoints = read("maxPoints")?.numericValue;
    const threshold = read("threshold")?.numericValue;
    return {
        algorithm: (read("algorithm")?.dropdownValue as "auto") ?? "auto",
        enabled: read("enabled")?.active ?? true,
        samplesPerPixel: read("samplesPerPixel")?.numericValue ?? 1,
        ...(maxPoints == null ? {} : { maxPoints }),
        ...(threshold == null ? {} : { threshold })
    };
}

function readDataLabels(features: ComponentConfigFeatureItem): ChartDataLabelsInput {
    if (!features["dataLabels"]?.active) {
        return false;
    }
    const read = (name: string) => subFeature(features, "dataLabels", name);
    const color = read("color")?.stringValue;
    return {
        allowOverlap: read("allowOverlap")?.active ?? false,
        collisionPadding: read("collisionPadding")?.numericValue ?? 2,
        maxLabels: read("maxLabels")?.numericValue ?? 200,
        offset: read("offset")?.numericValue ?? 6,
        overflow: (read("overflow")?.dropdownValue as "hide") ?? "hide",
        position: (read("position")?.dropdownValue as "auto") ?? "auto",
        ...(color ? { color } : {}),
        ...(read("compact")?.active ? { formatter: context => compact.format(Number(context.value)) } : {})
    };
}
