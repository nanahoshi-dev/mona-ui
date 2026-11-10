import { Component, computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
    BubbleSeriesComponent,
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
    ScatterSeriesComponent
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
import type { ComponentMetadata } from "../../models/ComponentMetadata";
import { DemoService } from "../../services/demo.service";
import type { ComponentConfigFeatureItem, ComponentConfigInputType } from "../../utils/componentConfig";
import { DemoEventLog, readPartValues, reconcilePartValues } from "../../utils/demoParts";
import type { DemoPart, DemoPartValues } from "../../utils/demoParts";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { carData, type CarDataSet } from "./chart-scatter-demo.data";

type SeriesType = "bubble" | "scatter";

const SERIES_METADATA: Readonly<Record<SeriesType, string>> = {
    bubble: "BubbleSeriesComponent",
    scatter: "ScatterSeriesComponent"
};

const SERIES_TITLES: Readonly<Record<SeriesType, string>> = {
    bubble: "Bubble series",
    scatter: "Scatter series"
};

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

const VALUE_FORMATTERS: readonly { readonly text: string; readonly value: ChartValueFormatter | undefined }[] = [
    { text: "Locale default", value: undefined },
    { text: "L/100 km suffix", value: value => `${Number(value).toFixed(1)} L/100 km` },
    { text: "Miles per gallon", value: value => `${Math.round(235.21 / Number(value))} mpg` }
];

const SIZE_FORMATTERS: readonly { readonly text: string; readonly value: ChartValueFormatter | undefined }[] = [
    { text: "Compact (default)", value: undefined },
    { text: "Kilowatts suffix", value: value => `${Number(value)} kW` },
    { text: "Horsepower", value: value => `${Math.round(Number(value) * 1.341)} hp` }
];

const AXIS_FORMATTERS: readonly { readonly text: string; readonly value: ChartAxisFormatter | undefined }[] = [
    { text: "Locale default", value: undefined },
    { text: "Compact (1.2K)", value: value => (typeof value === "number" ? compact.format(value) : String(value)) },
    { text: "One decimal", value: value => (typeof value === "number" ? value.toFixed(1) : String(value)) }
];

const LABEL_ROTATIONS: readonly { readonly text: string; readonly value: ChartAxisLabelRotation }[] = [
    { text: "0°", value: 0 },
    { text: "Automatic", value: "auto" },
    { text: "-45°", value: -45 },
    { text: "90°", value: 90 }
];

/**
 * The playground of the Scatter & Bubble page. It covers every input of the scatter and bubble series, both Cartesian
 * axes, the legend, the tooltip and the chart itself, and the templates they take. It shares nothing with the other
 * chart family playgrounds.
 */
@Component({
    selector: "app-chart-scatter-demo",
    imports: [
        BubbleSeriesComponent,
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
        PartsDemoContainerComponent,
        ScatterSeriesComponent,
        SegmentedComponent
    ],
    templateUrl: "./chart-scatter-demo.component.html"
})
export class ChartScatterDemoComponent {
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
                    description: "Animate data changes. Switch the data set to see it.",
                    active: true
                },
                visibility: { name: "Visibility", description: "Animate legend toggles.", active: true }
            }
        },
        navigation: {
            name: "Navigation",
            description: "Pan and zoom the plot. With scatter or bubble series, automatic axes move X and Y together.",
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
                zoom: { name: "Zoom", description: "Allow zooming at all.", active: true },
                pan: { name: "Pan", description: "Allow panning at all.", active: true },
                wheelZoom: { name: "Wheel zoom", description: "Zoom with the wheel.", active: true },
                dragPan: { name: "Drag pan", description: "Pan by dragging.", active: true },
                pinchZoom: { name: "Pinch zoom", description: "Zoom with two fingers.", active: true },
                keyboard: {
                    name: "Keyboard",
                    description: "Shift + arrows pan, + and - zoom, 0 resets.",
                    active: true
                },
                clampToData: { name: "Clamp to data", description: "Keep the viewport inside the data.", active: true }
            }
        },
        downsampling: {
            name: "Downsampling options",
            description: 'The chart-wide policy for dense series. Off here means [downsampling]="false".',
            active: true,
            directiveBinding: { hostAttribute: "downsampling", buildValue: features => readDownsampling(features) },
            subFeatures: downsamplingSubFeatures()
        },
        titleTemplate: {
            name: "Title template",
            description: "Replaces the title text with your own markup.",
            active: false,
            code: `
                <ng-template monaChartTitleTemplate let-title>
                    <span class="font-semibold">{{ title }}</span>
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
                    <span>No cars to compare yet</span>
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
            description: "Writes each value beside its marker.",
            active: false,
            directiveBinding: { hostAttribute: "dataLabels", buildValue: features => readDataLabels(features) },
            subFeatures: {
                position: {
                    name: "Position",
                    description: "Where a label goes. Automatic picks a free spot.",
                    type: "dropdown",
                    dropdownDataSource: ["auto", "top", "bottom", "left", "right", "center"],
                    dropdownValue: "auto"
                },
                offset: {
                    name: "Offset",
                    description: "Pixels from the marker.",
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
                weight: {
                    name: "Weight formatter",
                    description: "Labels each marker with its weight instead.",
                    active: false
                }
            }
        },
        dataLabelTemplate: {
            name: "Data label template",
            description: "Replaces the label text with your own markup. Turn on data labels too.",
            active: false,
            code: `
                <ng-template monaChartDataLabel let-label>
                    <span class="font-semibold">{{ label.formattedValue }}</span>
                    @if (label.formattedSize) {
                        <span> · {{ label.formattedSize }}</span>
                    }
                </ng-template>`
        },
        downsampling: {
            name: "Downsampling",
            description: "The series' own policy, which wins over the chart's. Off leaves it to the chart.",
            active: false,
            directiveBinding: { hostAttribute: "downsampling", buildValue: features => readDownsampling(features) },
            subFeatures: downsamplingSubFeatures()
        }
    });
    readonly #tooltipFeatures = this.#features({
        tooltipTemplate: {
            name: "Tooltip template",
            description: "Replaces the tooltip content with your own markup.",
            active: false,
            code: `
                <ng-template monaChartTooltipTemplate let-point>
                    <div>{{ point.seriesName }}</div>
                    <div>{{ point.formattedX }} kg, {{ point.formattedY }}</div>
                    @if (point.formattedSize) {
                        <div>{{ point.formattedSize }}</div>
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
    readonly #yAxisFeatures = this.#features({
        axisLabelTemplate: {
            name: "Axis label template",
            description: "Replaces each tick label with your own markup.",
            active: false,
            code: `
                <ng-template monaChartAxisLabelTemplate let-value>
                    <span class="italic">{{ value }}</span>
                </ng-template>`
        }
    });

    protected readonly animation = computed<ChartAnimationInput>(() => readAnimation(this.#chartFeatures.data()));
    protected readonly bubble = computed(() =>
        readPartValues<BubbleSeriesComponent>(this.#part("bubble"), this.values())
    );
    protected readonly chart = computed(() => readPartValues<ChartComponent>(this.#part("chart"), this.values()));
    protected readonly chartFeatures = this.#chartFeatures.data;
    protected readonly data = computed(() => carData(this.dataSet()));
    protected readonly dataLabels = computed<ChartDataLabelsInput>(() => readDataLabels(this.#seriesFeatures.data()));
    protected readonly dataSet = signal<CarDataSet>("sample");
    protected readonly dataSetOptions: readonly SegmentedOption<CarDataSet>[] = [
        { label: "40 cars", value: "sample" },
        { label: "11,000 cars", value: "dense" },
        { label: "Empty", value: "empty" }
    ];
    protected readonly downsampling = computed<ChartDownsamplingInput>(() =>
        readDownsampling(this.#chartFeatures.data())
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
                codeAttributes: ['[data]="petrolCars"', 'xField="weight"'],
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
                codeAttributes:
                    type === "bubble" ? ['field="consumption"', 'sizeField="power"'] : ['field="consumption"'],
                config: {
                    inputs:
                        type === "bubble"
                            ? deriveInputConfig<BubbleSeriesComponent>(seriesMetadata, bubbleOverrides(), {
                                  resolveAliases: true
                              })
                            : deriveInputConfig<ScatterSeriesComponent>(seriesMetadata, scatterOverrides(), {
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
                    inputs: deriveInputConfig<ChartXAxisComponent>(xAxisMetadata, xAxisOverrides(), {
                        resolveAliases: true
                    }),
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
                        {
                            ...axisOverrides<ChartYAxisComponent>(),
                            title: { type: "string", value: "Fuel use (L/100 km)" }
                        },
                        { resolveAliases: true }
                    ),
                    featureHandler: this.#yAxisFeatures
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
                        { userClass: undefined },
                        { resolveAliases: true }
                    ),
                    featureHandler: this.#tooltipFeatures
                }
            }
        ];
    });
    /** The panels come from metadata that loads after the page; until then the chart would get no settings. */
    protected readonly ready = computed(() => this.parts().every(part => (part.metadata.inputs ?? []).length > 0));
    protected readonly scatter = computed(() =>
        readPartValues<ScatterSeriesComponent>(this.#part("scatter"), this.values())
    );
    protected readonly seriesDownsampling = computed<ChartDownsamplingInput | undefined>(() => {
        const features = this.#seriesFeatures.data();
        return features["downsampling"]?.active ? readDownsampling(features) : undefined;
    });
    protected readonly seriesFeatures = this.#seriesFeatures.data;
    protected readonly seriesType = signal<SeriesType>("scatter");
    protected readonly seriesTypeOptions: readonly SegmentedOption<SeriesType>[] = [
        { label: "Scatter", value: "scatter" },
        { label: "Bubble", value: "bubble" }
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
    protected readonly yAxisFeatures = this.#yAxisFeatures.data;

    protected onDataSetChange(set: CarDataSet | null): void {
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

    /** Called from field initializers, which run in the injection context, so it can inject the injector itself. */
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

function chartOverrides(): Partial<ComponentConfigInputType<ChartComponent>> {
    return {
        ariaDescription: { alias: "aria-description", type: "string", value: "" },
        ariaLabel: { alias: "aria-label", type: "string", value: "" },
        subtitle: { type: "string", value: "Petrol and hybrid cars" },
        title: { type: "string", value: "Fuel use by weight" },
        userClass: undefined
    };
}

function scatterOverrides(): Partial<ComponentConfigInputType<ScatterSeriesComponent>> {
    return {
        color: { type: "color", value: "" },
        fillOpacity: { type: "number", nullable: true, min: 0, max: 1, value: undefined },
        name: { type: "string", value: "Petrol" },
        pointRadius: { type: "number", nullable: true, min: 1, max: 100, value: undefined },
        seriesKey: undefined,
        strokeColor: { type: "color", value: "" },
        strokeWidth: { type: "number", nullable: true, min: 0, value: undefined },
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

function bubbleOverrides(): Partial<ComponentConfigInputType<BubbleSeriesComponent>> {
    return {
        color: { type: "color", value: "" },
        fillOpacity: { type: "number", nullable: true, min: 0, max: 1, value: undefined },
        maxRadius: { type: "number", nullable: true, min: 1, max: 100, value: undefined },
        minRadius: { type: "number", nullable: true, min: 1, max: 100, value: undefined },
        name: { type: "string", value: "Petrol" },
        seriesKey: undefined,
        sizeFormatter: {
            type: "customDropdown",
            value: SIZE_FORMATTERS,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        },
        strokeColor: { type: "color", value: "" },
        strokeWidth: { type: "number", nullable: true, min: 0, value: undefined },
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

/** The X axis takes numbers here, so its `number | Date` bounds get a number control. */
function xAxisOverrides(): Partial<ComponentConfigInputType<ChartXAxisComponent>> {
    return {
        ...axisOverrides<ChartXAxisComponent>(),
        field: undefined,
        max: { type: "number", nullable: true, value: undefined },
        min: { type: "number", nullable: true, value: undefined },
        title: { type: "string", value: "Weight (kg)" }
    };
}

function downsamplingSubFeatures(): ComponentConfigFeatureItem {
    return {
        enabled: { name: "Enabled", description: "Reduce dense series at all.", active: true },
        maxPoints: {
            name: "Maximum points",
            description: "A hard cap on the markers drawn. Empty leaves it to the plot size.",
            type: "number",
            numericNullable: true,
            numericMin: 2
        },
        samplesPerPixel: {
            name: "Samples per pixel",
            description: "Higher keeps more markers in the same space.",
            type: "number",
            numericValue: 1,
            numericMin: 1
        },
        threshold: {
            name: "Threshold",
            description: "Markers in view before reduction starts. Empty uses the default.",
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
        pan: read("pan")?.active ?? true,
        panAxes: (read("panAxes")?.dropdownValue as "auto") ?? "auto",
        pinchZoom: read("pinchZoom")?.active ?? true,
        wheelZoom: read("wheelZoom")?.active ?? true,
        zoom: read("zoom")?.active ?? true,
        zoomAxes: (read("zoomAxes")?.dropdownValue as "auto") ?? "auto"
    };
}

function readDownsampling(features: ComponentConfigFeatureItem): ChartDownsamplingInput {
    if (!features["downsampling"]?.active) {
        return false;
    }
    const read = (name: string) => subFeature(features, "downsampling", name);
    const maxPoints = read("maxPoints")?.numericValue;
    const threshold = read("threshold")?.numericValue;
    return {
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
        ...(read("weight")?.active ? { formatter: context => `${String(context.xValue)} kg` } : {})
    };
}
