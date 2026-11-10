import { Component, computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
    CandlestickSeriesComponent,
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
    OhlcSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type {
    ChartAnimationInput,
    ChartAxisFormatter,
    ChartAxisLabelRotation,
    ChartDataLabelsInput,
    ChartDownsamplingInput,
    ChartNavigationInput,
    ChartXAxisType
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
import { priceData, type PriceDataSet } from "./chart-financial-demo.data";

type SeriesType = "candlestick" | "ohlc";

const SERIES_METADATA: Readonly<Record<SeriesType, string>> = {
    candlestick: "CandlestickSeriesComponent",
    ohlc: "OhlcSeriesComponent"
};

const SERIES_TITLES: Readonly<Record<SeriesType, string>> = {
    candlestick: "Candlestick series",
    ohlc: "OHLC series"
};

const X_AXIS_TYPES: readonly ChartXAxisType[] = [
    "auto",
    "category",
    "linear",
    "log",
    "symlog",
    "pow",
    "sqrt",
    "time",
    "utc"
];

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const twoDecimals = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const shortDate = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" });

const VALUE_FORMATTERS: readonly { readonly text: string; readonly value: ChartAxisFormatter | undefined }[] = [
    { text: "Locale default", value: undefined },
    { text: "US dollars ($182.40)", value: value => usd.format(Number(value)) },
    { text: "Two decimals (182.40)", value: value => twoDecimals.format(Number(value)) }
];

const X_AXIS_FORMATTERS: readonly { readonly text: string; readonly value: ChartAxisFormatter | undefined }[] = [
    { text: "Locale default", value: undefined },
    { text: "Short date (Jan 5)", value: value => (value instanceof Date ? shortDate.format(value) : String(value)) },
    {
        text: "Upper case",
        value: value => (value instanceof Date ? shortDate.format(value) : String(value)).toUpperCase()
    }
];

const Y_AXIS_FORMATTERS: readonly { readonly text: string; readonly value: ChartAxisFormatter | undefined }[] = [
    { text: "Locale default", value: undefined },
    { text: "US dollars ($182.40)", value: value => (typeof value === "number" ? usd.format(value) : String(value)) },
    {
        text: "Whole dollars ($182)",
        value: value => (typeof value === "number" ? `$${Math.round(value)}` : String(value))
    }
];

const LABEL_ROTATIONS: readonly { readonly text: string; readonly value: ChartAxisLabelRotation }[] = [
    { text: "0°", value: 0 },
    { text: "Automatic", value: "auto" },
    { text: "-45°", value: -45 },
    { text: "90°", value: 90 }
];

/**
 * The playground of the Financial page. It covers every input of the candlestick and OHLC series, both Cartesian axes,
 * the legend, the tooltip and the chart itself, and the templates they take. It shares nothing with the other chart
 * family playgrounds.
 */
@Component({
    selector: "app-chart-financial-demo",
    imports: [
        CandlestickSeriesComponent,
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
        OhlcSeriesComponent,
        PartsDemoContainerComponent,
        SegmentedComponent
    ],
    templateUrl: "./chart-financial-demo.component.html"
})
export class ChartFinancialDemoComponent {
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
            description: "Pan and zoom the plot with the wheel, drag, pinch and keys. Try it with the half-year data.",
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
                    description: "The fewest categories a zoom leaves, on a category X axis.",
                    type: "number",
                    numericValue: 1,
                    numericMin: 1
                }
            }
        },
        downsampling: {
            name: "Downsampling options",
            description:
                'The chart-wide policy for dense series. Candlestick and OHLC series are never reduced, so it only matters for other series in the chart. Off here means [downsampling]="false".',
            active: true,
            directiveBinding: { hostAttribute: "downsampling", buildValue: features => readDownsampling(features) },
            subFeatures: {
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
            }
        },
        titleTemplate: {
            name: "Title template",
            description: "Replaces the title text with your own markup.",
            active: false,
            code: `
                <ng-template monaChartTitleTemplate let-title>
                    <span class="font-semibold">💹 {{ title }}</span>
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
                    <span>No trades yet</span>
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
            description: "Writes each closing price beside its mark. Use the month data, where the marks have room.",
            active: false,
            directiveBinding: { hostAttribute: "dataLabels", buildValue: features => readDataLabels(features) },
            subFeatures: {
                position: {
                    name: "Position",
                    description: "Where a label goes. Automatic tries ahead of the mark, behind it, above and below.",
                    type: "dropdown",
                    dropdownDataSource: ["auto", "top", "bottom", "left", "right"],
                    dropdownValue: "auto"
                },
                offset: {
                    name: "Offset",
                    description: "Pixels from the mark.",
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
                currency: { name: "Currency formatter", description: "Formats labels as $182.40.", active: false }
            }
        },
        dataLabelTemplate: {
            name: "Data label template",
            description: "Replaces the label text with your own markup. Turn on data labels too.",
            active: false,
            code: `
                <ng-template monaChartDataLabel let-label>
                    <span class="font-semibold">{{ label.formattedClose }}</span>
                </ng-template>`
        }
    });
    readonly #tooltipFeatures = this.#features({
        tooltipTemplate: {
            name: "Tooltip template",
            description: "Replaces the tooltip content with your own markup.",
            active: false,
            code: `
                <ng-template monaChartTooltipTemplate let-point="point">
                    <div class="font-medium">{{ point.formattedX }}</div>
                    <div>O {{ point.formattedOpen }} H {{ point.formattedHigh }}</div>
                    <div>L {{ point.formattedLow }} C {{ point.formattedClose }}</div>
                    <div>{{ point.formattedChange }} ({{ point.formattedChangePercentage }})</div>
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
    protected readonly candlestick = computed(() =>
        readPartValues<CandlestickSeriesComponent>(this.#part("candlestick"), this.values())
    );
    protected readonly chart = computed(() => readPartValues<ChartComponent>(this.#part("chart"), this.values()));
    protected readonly chartFeatures = this.#chartFeatures.data;
    protected readonly data = computed(() => priceData(this.dataSet()));
    protected readonly dataLabels = computed<ChartDataLabelsInput>(() => readDataLabels(this.#seriesFeatures.data()));
    protected readonly dataSet = signal<PriceDataSet>("month");
    protected readonly dataSetOptions: readonly SegmentedOption<PriceDataSet>[] = [
        { label: "Month", value: "month" },
        { label: "Half year", value: "halfYear" },
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
    protected readonly ohlc = computed(() => readPartValues<OhlcSeriesComponent>(this.#part("ohlc"), this.values()));
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
                codeAttributes: ['[data]="prices"', 'xField="date"'],
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
                codeAttributes: ['openField="open"', 'highField="high"', 'lowField="low"', 'closeField="close"'],
                config: {
                    inputs: seriesInputs(type, seriesMetadata),
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
                        {
                            ...axisOverrides<ChartXAxisComponent>(X_AXIS_FORMATTERS),
                            type: { type: "dropdown", value: [...X_AXIS_TYPES], defaultValue: "time" }
                        },
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
                        {
                            ...axisOverrides<ChartYAxisComponent>(Y_AXIS_FORMATTERS),
                            title: { type: "string", value: "Price (USD)" }
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
    protected readonly seriesFeatures = this.#seriesFeatures.data;
    protected readonly seriesType = signal<SeriesType>("candlestick");
    protected readonly seriesTypeOptions: readonly SegmentedOption<SeriesType>[] = [
        { label: "Candlestick", value: "candlestick" },
        { label: "OHLC", value: "ohlc" }
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

    protected onDataSetChange(set: PriceDataSet | null): void {
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

function emptyMetadata(): ComponentMetadata {
    return { inputs: [], name: "", selector: "" };
}

function chartOverrides(): Partial<ComponentConfigInputType<ChartComponent>> {
    return {
        ariaDescription: { alias: "aria-description", type: "string", value: "" },
        ariaLabel: { alias: "aria-label", type: "string", value: "" },
        subtitle: { type: "string", value: "Daily open, high, low and close" },
        title: { type: "string", value: "ACME share price" },
        userClass: undefined
    };
}

/**
 * The series panel. `opacity` is left out because it is deprecated in favor of `fillOpacity`, and the OHLC series'
 * `tickWidth` because it is the older name of `tickLength`.
 */
function seriesInputs(
    type: SeriesType,
    metadata: ComponentMetadata
): ComponentConfigInputType<CandlestickSeriesComponent> | ComponentConfigInputType<OhlcSeriesComponent> {
    if (type === "candlestick") {
        return deriveInputConfig<CandlestickSeriesComponent>(
            metadata,
            {
                ...seriesOverrides<CandlestickSeriesComponent>(),
                fillMode: { type: "dropdown", value: ["hollow", "filled"], defaultValue: "hollow" }
            },
            { resolveAliases: true }
        );
    }
    return deriveInputConfig<OhlcSeriesComponent>(
        metadata,
        { ...seriesOverrides<OhlcSeriesComponent>(), tickWidth: undefined },
        { resolveAliases: true }
    );
}

function seriesOverrides<T extends CandlestickSeriesComponent | OhlcSeriesComponent>(): Partial<
    ComponentConfigInputType<T>
> {
    const overrides: Partial<ComponentConfigInputType<CandlestickSeriesComponent>> = {
        bodyWidthRatio: { type: "number", value: 0.7, min: 0.05, max: 1 },
        color: { type: "color", value: "" },
        fallingColor: { type: "color", value: "" },
        maxBodyWidth: { type: "number", value: 32, min: 2 },
        name: { type: "string", value: "ACME" },
        neutralColor: { type: "color", value: "" },
        opacity: undefined,
        risingColor: { type: "color", value: "" },
        seriesKey: undefined,
        userClass: undefined,
        valueFormatter: {
            type: "customDropdown",
            value: VALUE_FORMATTERS,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        },
        wickColor: { type: "color", value: "" },
        wickWidth: { type: "number", nullable: true, min: 0, value: undefined },
        xAxisId: undefined,
        yAxisId: undefined
    };
    return overrides as Partial<ComponentConfigInputType<T>>;
}

function axisOverrides<T extends ChartXAxisComponent | ChartYAxisComponent>(
    formatters: readonly { readonly text: string; readonly value: ChartAxisFormatter | undefined }[]
): Partial<ComponentConfigInputType<T>> {
    const overrides: Partial<ComponentConfigInputType<ChartXAxisComponent>> = {
        axisId: undefined,
        formatter: {
            type: "customDropdown",
            value: formatters,
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

function readDownsampling(features: ComponentConfigFeatureItem): ChartDownsamplingInput {
    if (!features["downsampling"]?.active) {
        return false;
    }
    const read = (name: string) => subFeature(features, "downsampling", name);
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
        ...(read("currency")?.active
            ? { formatter: context => usd.format(Number(context.close ?? context.value)) }
            : {})
    };
}
