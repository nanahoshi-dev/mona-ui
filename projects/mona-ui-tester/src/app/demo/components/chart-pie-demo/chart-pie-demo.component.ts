import { PercentPipe } from "@angular/common";
import { Component, computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
    ChartCenterTemplateDirective,
    ChartComponent,
    ChartLegendComponent,
    ChartLegendItemTemplateDirective,
    ChartNoDataTemplateDirective,
    ChartSliceLabelTemplateDirective,
    ChartSubtitleTemplateDirective,
    ChartTitleTemplateDirective,
    ChartTooltipComponent,
    ChartTooltipTemplateDirective,
    DonutSeriesComponent,
    PieSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartAnimationInput, ChartValueFormatter } from "@nanahoshi/mona-ui/chart";
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
import { channelData, type ChannelDataSet } from "./chart-pie-demo.data";

type SeriesType = "donut" | "pie";

const SERIES_METADATA: Readonly<Record<SeriesType, string>> = {
    donut: "DonutSeriesComponent",
    pie: "PieSeriesComponent"
};

const SERIES_TITLES: Readonly<Record<SeriesType, string>> = {
    donut: "Donut series",
    pie: "Pie series"
};

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

const VALUE_FORMATTERS: readonly { readonly text: string; readonly value: ChartValueFormatter | undefined }[] = [
    { text: "Locale default", value: undefined },
    { text: "Compact (4.8K)", value: value => compact.format(Number(value)) },
    { text: "Sessions suffix", value: value => `${Number(value).toLocaleString("en")} sessions` }
];

const CATEGORY_FORMATTERS: readonly { readonly text: string; readonly value: ChartValueFormatter | undefined }[] = [
    { text: "As is", value: undefined },
    { text: "Upper case", value: value => String(value).toUpperCase() },
    { text: "Numbered", value: (value, index) => `${index + 1}. ${String(value)}` }
];

const COLOR_PRESETS: readonly { readonly text: string; readonly value: readonly string[] | undefined }[] = [
    { text: "Theme palette", value: undefined },
    { text: "Categorical", value: ["#2563eb", "#d97706", "#059669", "#db2777", "#7c3aed"] },
    { text: "Blues", value: ["#1e3a8a", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa"] },
    { text: "CSS variables", value: ["var(--color-chart-1)", "--color-chart-3", "--color-chart-5"] }
];

const NO_HIDDEN_INDICES: readonly number[] = [];

const HIDDEN_INDEX_PRESETS: readonly { readonly text: string; readonly value: readonly number[] }[] = [
    { text: "None", value: NO_HIDDEN_INDICES },
    { text: "First slice", value: [0] },
    { text: "Second and fourth", value: [1, 3] }
];

/**
 * The playground of the Pie & Donut page. It covers every input of the pie and donut series, the legend, the tooltip
 * and the chart itself, and the templates they take. Pie and donut series don't use axes, so it has none. It shares
 * nothing with the other chart family playgrounds.
 */
@Component({
    selector: "app-chart-pie-demo",
    imports: [
        ChartCenterTemplateDirective,
        ChartComponent,
        ChartLegendComponent,
        ChartLegendItemTemplateDirective,
        ChartNoDataTemplateDirective,
        ChartSliceLabelTemplateDirective,
        ChartSubtitleTemplateDirective,
        ChartTitleTemplateDirective,
        ChartTooltipComponent,
        ChartTooltipTemplateDirective,
        DonutSeriesComponent,
        PartsDemoContainerComponent,
        PercentPipe,
        PieSeriesComponent,
        SegmentedComponent
    ],
    templateUrl: "./chart-pie-demo.component.html"
})
export class ChartPieDemoComponent {
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
                visibility: { name: "Visibility", description: "Animate slices hidden from the legend.", active: true }
            }
        },
        titleTemplate: {
            name: "Title template",
            description: "Replaces the title text with your own markup.",
            active: false,
            code: `
                <ng-template monaChartTitleTemplate let-title>
                    <span class="font-semibold">🥧 {{ title }}</span>
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
            description: "What the chart shows without a positive value. Pick the empty data set to see it.",
            active: false,
            code: `
                <ng-template monaChartNoDataTemplate>
                    <span>No sessions yet</span>
                </ng-template>`
        }
    });
    readonly #donutFeatures = this.#features({
        ...sliceFeatures(),
        centerTemplate: {
            name: "Center template",
            description: "Fills the hole with your own markup. Hide slices from the legend to watch the total change.",
            active: true,
            code: `
                <ng-template monaChartCenterTemplate let-formattedTotal="formattedTotal" let-count="visibleSliceCount">
                    <span class="text-xs">{{ count }} channels</span>
                    <span class="text-lg font-semibold">{{ formattedTotal }}</span>
                </ng-template>`
        }
    });
    readonly #legendFeatures = this.#features({
        legendItemTemplate: {
            name: "Legend item template",
            description: "Replaces each legend entry with your own markup. A slice's entry has its share of the total.",
            active: false,
            code: `
                <ng-template monaChartLegendItemTemplate let-item>
                    <span>{{ item.name }} · {{ item.percentage | percent: "1.0-1" }}</span>
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
    readonly #pieFeatures = this.#features(sliceFeatures());
    readonly #tooltipFeatures = this.#features({
        tooltipTemplate: {
            name: "Tooltip template",
            description: "Replaces the tooltip content with your own markup.",
            active: false,
            code: `
                <ng-template monaChartTooltipTemplate let-point="point">
                    <div>{{ point.formattedCategory }}: {{ point.formattedY }} ({{ point.formattedPercentage }})</div>
                </ng-template>`
        }
    });

    protected readonly animation = computed<ChartAnimationInput>(() => readAnimation(this.#chartFeatures.data()));
    protected readonly chart = computed(() => readPartValues<ChartComponent>(this.#part("chart"), this.values()));
    protected readonly chartFeatures = this.#chartFeatures.data;
    /** The property `colorField` reads while the Color field feature is on. */
    protected readonly colorField = computed(() => (this.seriesFeatures()["colorField"]?.active ? "color" : undefined));
    protected readonly data = computed(() => channelData(this.dataSet()));
    protected readonly dataSet = signal<ChannelDataSet>("channels");
    protected readonly dataSetOptions: readonly SegmentedOption<ChannelDataSet>[] = [
        { label: "Channels", value: "channels" },
        { label: "Long tail", value: "many" },
        { label: "With zeros", value: "zeros" },
        { label: "Empty", value: "empty" }
    ];
    protected readonly eventLog = new DemoEventLog();
    protected readonly legend = computed(() =>
        readPartValues<ChartLegendComponent>(this.#part("legend"), this.values())
    );
    protected readonly legendFeatures = this.#legendFeatures.data;
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const type = this.seriesType();
        const chartMetadata = metadata["ChartComponent"] ?? emptyMetadata();
        const seriesMetadata = metadata[SERIES_METADATA[type]] ?? emptyMetadata();
        const legendMetadata = metadata["ChartLegendComponent"] ?? emptyMetadata();
        const tooltipMetadata = metadata["ChartTooltipComponent"] ?? emptyMetadata();
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
            {
                id: type,
                title: SERIES_TITLES[type],
                metadata: seriesMetadata,
                codeAttributes: [
                    'field="sessions"',
                    'categoryField="channel"',
                    'keyField="channel"',
                    '[(hiddenIndices)]="hiddenIndices"'
                ],
                config: {
                    inputs: deriveInputConfig<DonutSeriesComponent>(seriesMetadata, seriesOverrides(type), {
                        resolveAliases: true
                    }),
                    featureHandler: type === "donut" ? this.#donutFeatures : this.#pieFeatures
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
                        {
                            shared: {
                                type: "boolean",
                                value: false,
                                note: "Pie and donut tooltips always show one slice, so this has no effect here."
                            },
                            userClass: undefined
                        },
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
        readPartValues<DonutSeriesComponent>(this.#part(this.seriesType()), this.values())
    );
    protected readonly seriesFeatures = computed(() =>
        this.seriesType() === "donut" ? this.#donutFeatures.data() : this.#pieFeatures.data()
    );
    protected readonly seriesType = signal<SeriesType>("pie");
    protected readonly seriesTypeOptions: readonly SegmentedOption<SeriesType>[] = [
        { label: "Pie", value: "pie" },
        { label: "Donut", value: "donut" }
    ];
    protected readonly tooltip = computed(() =>
        readPartValues<ChartTooltipComponent>(this.#part("tooltip"), this.values())
    );
    protected readonly tooltipFeatures = this.#tooltipFeatures.data;
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });

    protected onDataSetChange(set: ChannelDataSet | null): void {
        if (set) {
            this.dataSet.set(set);
        }
    }

    /**
     * Writes the legend's change back to the panel. A list that matches a preset takes the preset itself, so the
     * dropdown shows it; any other list leaves the dropdown on its placeholder.
     */
    protected onHiddenIndicesChange(indices: readonly number[]): void {
        const type = this.seriesType();
        const hiddenIndices = HIDDEN_INDEX_PRESETS.find(preset => sameIndices(preset.value, indices))?.value ?? indices;
        this.values.update(values => ({ ...values, [type]: { ...values[type], hiddenIndices } }));
        this.eventLog.record("hiddenIndicesChange", indices);
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
        subtitle: { type: "string", value: "Last 30 days" },
        title: { type: "string", value: "Sessions by channel" },
        userClass: undefined
    };
}

function seriesOverrides(type: SeriesType): Partial<ComponentConfigInputType<DonutSeriesComponent>> {
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
            value: COLOR_PRESETS,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        },
        cornerRadius: { type: "number", nullable: true, value: undefined, min: 0 },
        endAngle: { type: "number", value: 360, min: -360, max: 720 },
        fillOpacity: { type: "number", nullable: true, value: undefined, min: 0, max: 1 },
        hiddenIndices: {
            type: "customDropdown",
            value: HIDDEN_INDEX_PRESETS,
            textField: "text",
            valueField: "value",
            defaultValue: NO_HIDDEN_INDICES,
            placeholder: "Set by the legend"
        },
        ...(type === "donut" ? { innerRadiusRatio: { type: "number" as const, value: 0.6, min: 0, max: 0.95 } } : {}),
        minLabelAngle: { type: "number", value: 12, min: 0, max: 360 },
        name: { type: "string", value: "Sessions" },
        outerRadiusRatio: { type: "number", value: 0.9, min: 0.1, max: 1 },
        padAngle: { type: "number", value: 0, min: 0 },
        startAngle: { type: "number", value: 0, min: -360, max: 720 },
        strokeColor: { type: "color", value: "" },
        strokeWidth: { type: "number", nullable: true, value: undefined, min: 0 },
        userClass: undefined,
        valueFormatter: {
            type: "customDropdown",
            value: VALUE_FORMATTERS,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        }
    };
}

/** The features the pie and the donut share: the slice label template and the color field. */
function sliceFeatures(): ComponentConfigFeatureItem {
    return {
        sliceLabelTemplate: {
            name: "Slice label template",
            description: "Replaces the text of each slice label with your own markup. Turn on Show labels too.",
            active: false,
            code: `
                <ng-template monaChartSliceLabelTemplate let-slice>
                    <span class="font-semibold">{{ slice.formattedCategory }}</span>
                    <span>{{ slice.formattedValue }}</span>
                </ng-template>`
        },
        colorField: {
            name: "Color field",
            description: "Takes each slice's color from the row's color property. It wins over colors.",
            active: false,
            directiveBinding: { hostAttribute: "colorField", buildValue: () => "color" }
        }
    };
}

function sameIndices(left: readonly number[], right: readonly number[]): boolean {
    if (left.length !== right.length) {
        return false;
    }
    const sorted = [...right].sort((a, b) => a - b);
    return [...left].sort((a, b) => a - b).every((index, position) => index === sorted[position]);
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
