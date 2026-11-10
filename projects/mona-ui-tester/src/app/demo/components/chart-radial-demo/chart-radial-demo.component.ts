import { Component, computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    ChartAngularAxisComponent,
    ChartAxisLabelTemplateDirective,
    ChartComponent,
    ChartGaugeCenterTemplateDirective,
    ChartLegendComponent,
    ChartLegendItemTemplateDirective,
    ChartNoDataTemplateDirective,
    ChartRadialAxisComponent,
    ChartSubtitleTemplateDirective,
    ChartTitleTemplateDirective,
    ChartTooltipComponent,
    ChartTooltipTemplateDirective,
    GaugeSeriesComponent,
    RadialBarSeriesComponent,
    RoseSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartAnimationInput, ChartAxisFormatter, ChartValueFormatter } from "@nanahoshi/mona-ui/chart";
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
import { DIRECTION_NAMES, radialData } from "./chart-radial-demo.data";
import type { RadialDataSet, RadialSeriesType } from "./chart-radial-demo.data";

const NO_IDS: readonly string[] = [];

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

const CATEGORY_FORMATTERS: readonly { readonly text: string; readonly value: ChartValueFormatter | undefined }[] = [
    { text: "As is", value: undefined },
    { text: "Upper case", value: value => String(value).toUpperCase() },
    { text: "Numbered (1. Sales)", value: (value, index) => `${index + 1}. ${String(value)}` }
];

const COLOR_SETS: readonly { readonly text: string; readonly value: readonly string[] | undefined }[] = [
    { text: "Theme palette", value: undefined },
    { text: "Explicit colors", value: ["#2563eb", "#db2777", "#059669", "#d97706", "#7c3aed"] },
    {
        text: "Reversed palette (CSS variables)",
        value: ["--color-chart-5", "--color-chart-4", "--color-chart-3", "--color-chart-2", "--color-chart-1"]
    }
];

const ANGULAR_FORMATTERS: readonly { readonly text: string; readonly value: ChartAxisFormatter | undefined }[] = [
    { text: "Category as is", value: undefined },
    { text: "Full names (North)", value: value => DIRECTION_NAMES[String(value)] ?? String(value) },
    { text: "Lower case", value: value => String(value).toLowerCase() }
];

const RADIAL_FORMATTERS: readonly { readonly text: string; readonly value: ChartAxisFormatter | undefined }[] = [
    { text: "Locale default", value: undefined },
    { text: "Hours (40 h)", value: value => `${String(value)} h` },
    { text: "Compact (1.2K)", value: value => compact.format(Number(value)) }
];

const SERIES_METADATA: Readonly<Record<RadialSeriesType, string>> = {
    gauge: "GaugeSeriesComponent",
    radialBar: "RadialBarSeriesComponent",
    rose: "RoseSeriesComponent"
};

/**
 * The playground of the Radial page. It covers every input of the radial bar, rose and gauge series, the angular and
 * radial axes the rose uses, the legend, the tooltip and the chart itself, and the templates they take. It shares
 * nothing with the other chart family playgrounds.
 */
@Component({
    selector: "app-chart-radial-demo",
    imports: [
        ButtonDirective,
        ChartAngularAxisComponent,
        ChartAxisLabelTemplateDirective,
        ChartComponent,
        ChartGaugeCenterTemplateDirective,
        ChartLegendComponent,
        ChartLegendItemTemplateDirective,
        ChartNoDataTemplateDirective,
        ChartRadialAxisComponent,
        ChartSubtitleTemplateDirective,
        ChartTitleTemplateDirective,
        ChartTooltipComponent,
        ChartTooltipTemplateDirective,
        GaugeSeriesComponent,
        PartsDemoContainerComponent,
        RadialBarSeriesComponent,
        RoseSeriesComponent,
        SegmentedComponent
    ],
    templateUrl: "./chart-radial-demo.component.html"
})
export class ChartRadialDemoComponent {
    readonly #angularAxisFeatures = this.#features({
        axisLabelTemplate: {
            name: "Axis label template",
            description: "Replaces each category label with your own markup.",
            active: false,
            code: `
                <ng-template monaChartAxisLabelTemplate let-value let-index="index">
                    <span [class.font-semibold]="index === 0">{{ value }}</span>
                </ng-template>`
        }
    });
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
        titleTemplate: {
            name: "Title template",
            description: "Replaces the title text with your own markup.",
            active: false,
            code: `
                <ng-template monaChartTitleTemplate let-title>
                    <span class="font-semibold">◔ {{ title }}</span>
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
    readonly #gaugeFeatures = this.#features({
        centerTemplate: {
            name: "Center template",
            description: "Replaces the value in the middle of the gauge. It wins over showValue.",
            active: false,
            code: `
                <ng-template
                    monaChartGaugeCenterTemplate
                    let-formattedMax="formattedMax"
                    let-formattedValue="formattedValue"
                    let-isClamped="isClamped">
                    <span class="text-2xl font-semibold">{{ formattedValue }}</span>
                    <span class="text-xs">of {{ formattedMax }}</span>
                    @if (isClamped) {
                        <span class="text-xs">Off the scale</span>
                    }
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
    readonly #radialAxisFeatures = this.#features({
        axisLabelTemplate: {
            name: "Axis label template",
            description: "Replaces each value label with your own markup.",
            active: false,
            code: `
                <ng-template monaChartAxisLabelTemplate let-value>
                    <span class="italic">{{ value }}</span>
                </ng-template>`
        }
    });
    readonly #tooltipFeatures = this.#features({
        tooltipTemplate: {
            name: "Tooltip template",
            description: "Replaces the tooltip content with your own markup.",
            active: false,
            code: `
                <ng-template monaChartTooltipTemplate let-point>
                    <div>{{ point.formattedCategory ?? point.seriesName }}: {{ point.formattedY }}</div>
                </ng-template>`
        }
    });

    protected readonly angularAxis = computed(() =>
        readPartValues<ChartAngularAxisComponent>(this.#part("angularAxis"), this.values())
    );
    protected readonly angularAxisFeatures = this.#angularAxisFeatures.data;
    protected readonly animation = computed<ChartAnimationInput>(() => readAnimation(this.#chartFeatures.data()));
    protected readonly chart = computed(() => readPartValues<ChartComponent>(this.#part("chart"), this.values()));
    protected readonly chartFeatures = this.#chartFeatures.data;
    protected readonly data = computed(() => radialData(this.seriesType(), this.dataSet()));
    protected readonly dataSet = signal<RadialDataSet>("typical");
    protected readonly dataSetOptions = computed<readonly SegmentedOption<RadialDataSet>[]>(() => [
        { label: "Typical", value: "typical" },
        { label: "Missing values", value: "missing" },
        ...(this.seriesType() === "rose" ? [] : [{ label: "Out of range", value: "outOfRange" as const }]),
        { label: "Empty", value: "empty" }
    ]);
    protected readonly eventLog = new DemoEventLog();
    protected readonly gauge = computed(() => readPartValues<GaugeSeriesComponent>(this.#part("gauge"), this.values()));
    protected readonly gaugeFeatures = this.#gaugeFeatures.data;
    /** The ids the radial bar or rose hides, kept in the part's values so the legend and the reset button agree. */
    protected readonly hiddenItemIds = computed<readonly string[]>(() => {
        const ids = this.values()[this.seriesType()]?.["hiddenItemIds"];
        return Array.isArray(ids) ? (ids as readonly string[]) : NO_IDS;
    });
    protected readonly hiddenItemsText = computed(() => {
        const ids = this.hiddenItemIds();
        return ids.length > 0 ? ids.join(", ") : "None";
    });
    protected readonly legend = computed(() =>
        readPartValues<ChartLegendComponent>(this.#part("legend"), this.values())
    );
    protected readonly legendFeatures = this.#legendFeatures.data;
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const type = this.seriesType();
        const read = (name: string): ComponentMetadata => metadata[name] ?? emptyMetadata();
        const chartMetadata = read("ChartComponent");
        const legendMetadata = read("ChartLegendComponent");
        const tooltipMetadata = read("ChartTooltipComponent");
        const axisParts: DemoPart[] = [];
        if (type === "rose") {
            const angularMetadata = read("ChartAngularAxisComponent");
            const radialMetadata = read("ChartRadialAxisComponent");
            axisParts.push(
                {
                    id: "angularAxis",
                    title: "Angular axis",
                    metadata: angularMetadata,
                    config: {
                        inputs: deriveInputConfig<ChartAngularAxisComponent>(
                            angularMetadata,
                            {
                                formatter: {
                                    type: "customDropdown",
                                    value: ANGULAR_FORMATTERS,
                                    textField: "text",
                                    valueField: "value",
                                    defaultValue: undefined
                                },
                                tickCount: undefined,
                                userClass: undefined
                            },
                            { resolveAliases: true }
                        ),
                        featureHandler: this.#angularAxisFeatures
                    }
                },
                {
                    id: "radialAxis",
                    title: "Radial axis",
                    metadata: radialMetadata,
                    config: {
                        inputs: deriveInputConfig<ChartRadialAxisComponent>(
                            radialMetadata,
                            {
                                formatter: {
                                    type: "customDropdown",
                                    value: RADIAL_FORMATTERS,
                                    textField: "text",
                                    valueField: "value",
                                    defaultValue: undefined
                                },
                                gridShape: undefined,
                                userClass: undefined
                            },
                            { resolveAliases: true }
                        ),
                        featureHandler: this.#radialAxisFeatures
                    }
                }
            );
        }
        return [
            {
                id: "chart",
                title: "Chart",
                metadata: chartMetadata,
                codeAttributes: ['[data]="data"'],
                config: {
                    inputs: deriveInputConfig<ChartComponent>(chartMetadata, chartOverrides(), {
                        resolveAliases: true
                    }),
                    featureHandler: this.#chartFeatures
                }
            },
            this.#seriesPart(type, read(SERIES_METADATA[type])),
            ...axisParts,
            {
                id: "legend",
                title: "Legend",
                metadata: legendMetadata,
                config: {
                    inputs: deriveInputConfig<ChartLegendComponent>(
                        legendMetadata,
                        { mode: undefined, userClass: undefined },
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
                        { shared: undefined, userClass: undefined },
                        { resolveAliases: true }
                    ),
                    featureHandler: this.#tooltipFeatures
                }
            }
        ];
    });
    protected readonly radialAxis = computed(() =>
        readPartValues<ChartRadialAxisComponent>(this.#part("radialAxis"), this.values())
    );
    protected readonly radialAxisFeatures = this.#radialAxisFeatures.data;
    protected readonly radialBar = computed(() =>
        readPartValues<RadialBarSeriesComponent>(this.#part("radialBar"), this.values())
    );
    /** The panels come from metadata that loads after the page; until then the chart would get no settings. */
    protected readonly ready = computed(() => this.parts().every(part => (part.metadata.inputs ?? []).length > 0));
    protected readonly rose = computed(() => readPartValues<RoseSeriesComponent>(this.#part("rose"), this.values()));
    protected readonly seriesType = signal<RadialSeriesType>("radialBar");
    protected readonly seriesTypeOptions: readonly SegmentedOption<RadialSeriesType>[] = [
        { label: "Radial bar", value: "radialBar" },
        { label: "Rose", value: "rose" },
        { label: "Gauge", value: "gauge" }
    ];
    protected readonly tooltip = computed(() =>
        readPartValues<ChartTooltipComponent>(this.#part("tooltip"), this.values())
    );
    protected readonly tooltipFeatures = this.#tooltipFeatures.data;
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });

    protected onDataSetChange(set: RadialDataSet | null): void {
        if (set) {
            this.dataSet.set(set);
        }
    }

    protected onHiddenItemIdsChange(hiddenItemIds: readonly string[]): void {
        this.#setSeriesValue("hiddenItemIds", hiddenItemIds);
        this.eventLog.record("hiddenItemIdsChange", hiddenItemIds);
    }

    protected onSeriesTypeChange(type: RadialSeriesType | null): void {
        if (!type) {
            return;
        }
        if (type === "rose" && this.dataSet() === "outOfRange") {
            this.dataSet.set("typical");
        }
        this.seriesType.set(type);
    }

    protected onSeriesVisibleChange(visible: boolean): void {
        this.#setSeriesValue("visible", visible);
        this.eventLog.record("visibleChange", visible);
    }

    /** Writes the binding from outside, which the series doesn't echo back through hiddenItemIdsChange. */
    protected onShowAllItems(): void {
        this.#setSeriesValue("hiddenItemIds", NO_IDS);
    }

    #features(data: ComponentConfigFeatureItem): FeatureConfigHandler {
        return createFeatureInjector(data, inject(Injector)).get(FeatureConfigHandler);
    }

    #part(id: string): DemoPart | undefined {
        return this.parts().find(part => part.id === id);
    }

    #seriesPart(type: RadialSeriesType, metadata: ComponentMetadata): DemoPart {
        switch (type) {
            case "gauge":
                return {
                    id: type,
                    title: "Gauge series",
                    metadata,
                    codeAttributes: ['field="load"'],
                    config: {
                        inputs: deriveInputConfig<GaugeSeriesComponent>(metadata, gaugeOverrides(), {
                            resolveAliases: true
                        }),
                        featureHandler: this.#gaugeFeatures
                    }
                };
            case "radialBar":
                return {
                    id: type,
                    title: "Radial bar series",
                    metadata,
                    codeAttributes: ['categoryField="team"', 'field="progress"', '[(hiddenItemIds)]="hiddenTeams"'],
                    config: {
                        inputs: deriveInputConfig<RadialBarSeriesComponent>(metadata, radialBarOverrides(), {
                            resolveAliases: true
                        })
                    }
                };
            case "rose":
                return {
                    id: type,
                    title: "Rose series",
                    metadata,
                    codeAttributes: [
                        'categoryField="direction"',
                        'field="hours"',
                        '[(hiddenItemIds)]="hiddenDirections"'
                    ],
                    config: {
                        inputs: deriveInputConfig<RoseSeriesComponent>(metadata, roseOverrides(), {
                            resolveAliases: true
                        })
                    }
                };
        }
    }

    #setSeriesValue(name: string, value: unknown): void {
        const type = this.seriesType();
        this.values.update(values => ({ ...values, [type]: { ...values[type], [name]: value } }));
    }
}

function emptyMetadata(): ComponentMetadata {
    return { inputs: [], name: "", selector: "" };
}

function valueFormatters(
    suffix: string,
    sample: string
): readonly { readonly text: string; readonly value: ChartValueFormatter | undefined }[] {
    return [
        { text: "Locale default", value: undefined },
        { text: `With unit (${sample})`, value: value => `${Number(value).toLocaleString("en")}${suffix}` },
        { text: "One decimal (82.0)", value: value => Number(value).toFixed(1) }
    ];
}

function chartOverrides(): Partial<ComponentConfigInputType<ChartComponent>> {
    return {
        ariaDescription: { alias: "aria-description", type: "string", value: "" },
        ariaLabel: { alias: "aria-label", type: "string", value: "" },
        subtitle: { type: "string", value: "Sample data" },
        title: { type: "string", value: "Operations overview" },
        userClass: undefined
    };
}

function radialBarOverrides(): Partial<ComponentConfigInputType<RadialBarSeriesComponent>> {
    return {
        categoryFormatter: {
            type: "customDropdown",
            value: CATEGORY_FORMATTERS,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        },
        colors: {
            type: "customDropdown",
            value: COLOR_SETS,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        },
        innerRadiusRatio: { type: "number", value: 0.2, min: 0, max: 0.99 },
        max: { type: "number", nullable: true, value: 100 },
        name: { type: "string", value: "Goal progress" },
        outerRadiusRatio: { type: "number", value: 0.9, min: 0.05, max: 1 },
        strokeColor: { type: "color", value: "" },
        trackColor: { type: "color", value: "" },
        userClass: undefined,
        valueFormatter: {
            type: "customDropdown",
            value: valueFormatters("%", "82%"),
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        }
    };
}

function roseOverrides(): Partial<ComponentConfigInputType<RoseSeriesComponent>> {
    return {
        categoryFormatter: {
            type: "customDropdown",
            value: CATEGORY_FORMATTERS,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        },
        colors: {
            type: "customDropdown",
            value: COLOR_SETS,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        },
        innerRadiusRatio: { type: "number", value: 0, min: 0, max: 0.99 },
        name: { type: "string", value: "Wind" },
        outerRadiusRatio: { type: "number", value: 0.9, min: 0.05, max: 1 },
        strokeColor: { type: "color", value: "" },
        userClass: undefined,
        valueFormatter: {
            type: "customDropdown",
            value: valueFormatters(" h", "42 h"),
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        }
    };
}

function gaugeOverrides(): Partial<ComponentConfigInputType<GaugeSeriesComponent>> {
    return {
        color: { type: "color", value: "" },
        innerRadiusRatio: { type: "number", value: 0.72, min: 0, max: 0.99 },
        name: { type: "string", value: "CPU load" },
        needleColor: { type: "color", value: "" },
        needleLengthRatio: { type: "number", value: 0.78, min: 0.1, max: 1 },
        outerRadiusRatio: { type: "number", value: 0.9, min: 0.05, max: 1 },
        trackColor: { type: "color", value: "" },
        userClass: undefined,
        valueFormatter: {
            type: "customDropdown",
            value: valueFormatters("%", "72%"),
            textField: "text",
            valueField: "value",
            defaultValue: undefined
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
