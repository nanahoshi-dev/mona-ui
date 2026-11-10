import { Component, computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
    ChartComponent,
    ChartFunnelLabelTemplateDirective,
    ChartLegendComponent,
    ChartLegendItemTemplateDirective,
    ChartNoDataTemplateDirective,
    ChartSubtitleTemplateDirective,
    ChartTitleTemplateDirective,
    ChartTooltipComponent,
    ChartTooltipTemplateDirective,
    FunnelSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartAnimationInput, ChartField, ChartValueFormatter } from "@nanahoshi/mona-ui/chart";
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
import {
    funnelData,
    hiddenStagePresets,
    NO_HIDDEN_STAGES,
    type FunnelDataSet,
    type HiddenStagePreset
} from "./chart-funnel-demo.data";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

const VALUE_FORMATTERS: readonly { readonly text: string; readonly value: ChartValueFormatter | undefined }[] = [
    { text: "Locale default", value: undefined },
    { text: "Compact (4.8K)", value: value => compact.format(Number(value)) },
    { text: "Users suffix", value: value => `${Number(value).toLocaleString("en")} users` }
];

const CATEGORY_FORMATTERS: readonly { readonly text: string; readonly value: ChartValueFormatter | undefined }[] = [
    { text: "As written", value: undefined },
    { text: "Numbered (1. Visited)", value: (value, index) => `${index + 1}. ${String(value)}` },
    { text: "Upper case", value: value => String(value).toUpperCase() }
];

const COLOR_FIELDS: readonly { readonly text: string; readonly value: ChartField | undefined }[] = [
    { text: "None", value: undefined },
    { text: "The color property", value: "color" }
];

const PALETTES: readonly { readonly text: string; readonly value: readonly string[] | undefined }[] = [
    { text: "Theme palette", value: undefined },
    { text: "Blues", value: ["#1e3a8a", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"] },
    { text: "Warm", value: ["#9f1239", "#be123c", "#c2410c", "#d97706", "#ca8a04"] }
];

/**
 * The playground of the Funnel page. It covers every input of the funnel series, the legend, the tooltip and the
 * chart itself, and the templates they take. Funnels ignore axes, so it has none. It shares nothing with the other
 * chart family playgrounds.
 */
@Component({
    selector: "app-chart-funnel-demo",
    imports: [
        ChartComponent,
        ChartFunnelLabelTemplateDirective,
        ChartLegendComponent,
        ChartLegendItemTemplateDirective,
        ChartNoDataTemplateDirective,
        ChartSubtitleTemplateDirective,
        ChartTitleTemplateDirective,
        ChartTooltipComponent,
        ChartTooltipTemplateDirective,
        FunnelSeriesComponent,
        PartsDemoContainerComponent,
        SegmentedComponent
    ],
    templateUrl: "./chart-funnel-demo.component.html"
})
export class ChartFunnelDemoComponent {
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
                visibility: {
                    name: "Visibility",
                    description: "Animate stages the legend hides or shows.",
                    active: true
                }
            }
        },
        titleTemplate: {
            name: "Title template",
            description: "Replaces the title text with your own markup.",
            active: false,
            code: `
                <ng-template monaChartTitleTemplate let-title>
                    <span class="font-semibold">🔻 {{ title }}</span>
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
            description: "What the chart shows with nothing to draw. Pick the empty data set, or hide every stage.",
            active: false,
            code: `
                <ng-template monaChartNoDataTemplate>
                    <span>No one has entered the funnel yet</span>
                </ng-template>`
        }
    });
    readonly #legendFeatures = this.#features({
        legendItemTemplate: {
            name: "Legend item template",
            description: "Replaces each stage's legend entry with your own markup.",
            active: false,
            code: `
                <ng-template monaChartLegendItemTemplate let-item>
                    <span [class.line-through]="!item.visible">{{ item.name }}</span>
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
        labelTemplate: {
            name: "Stage label template",
            description: "Replaces the text of each stage label. Labels still need showLabels and enough room.",
            active: false,
            code: `
                <ng-template monaChartFunnelLabelTemplate let-stage>
                    <span class="font-semibold">{{ stage.formattedCategory }}</span>
                    @if (stage.formattedConversionRate) {
                        <span>{{ stage.formattedConversionRate }} of previous</span>
                    }
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
                    <div>{{ point.formattedCategory }}: {{ point.funnel?.formattedValue }}</div>
                    @if (point.funnel?.formattedOverallConversionRate) {
                        <div>{{ point.funnel?.formattedOverallConversionRate }} of the first stage</div>
                    }
                </ng-template>`
        }
    });

    protected readonly animation = computed<ChartAnimationInput>(() => readAnimation(this.#chartFeatures.data()));
    protected readonly chart = computed(() => readPartValues<ChartComponent>(this.#part("chart"), this.values()));
    protected readonly chartFeatures = this.#chartFeatures.data;
    protected readonly data = computed(() => funnelData(this.dataSet()));
    protected readonly dataSet = signal<FunnelDataSet>("signup");
    protected readonly dataSetOptions: readonly SegmentedOption<FunnelDataSet>[] = [
        { label: "Sign-up", value: "signup" },
        { label: "Sales", value: "sales" },
        { label: "Widening stage", value: "referral" },
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
        const seriesMetadata = metadata["FunnelSeriesComponent"] ?? emptyMetadata();
        const legendMetadata = metadata["ChartLegendComponent"] ?? emptyMetadata();
        const tooltipMetadata = metadata["ChartTooltipComponent"] ?? emptyMetadata();
        return [
            {
                id: "chart",
                title: "Chart",
                metadata: chartMetadata,
                codeAttributes: ['[data]="stages"'],
                config: {
                    inputs: deriveInputConfig<ChartComponent>(chartMetadata, chartOverrides(), {
                        resolveAliases: true
                    }),
                    featureHandler: this.#chartFeatures
                }
            },
            {
                id: "funnel",
                title: "Funnel series",
                metadata: seriesMetadata,
                codeAttributes: [
                    'categoryField="stage"',
                    'field="users"',
                    'keyField="id"',
                    '[(hiddenStageIds)]="hiddenStageIds"'
                ],
                config: {
                    inputs: deriveInputConfig<FunnelSeriesComponent>(
                        seriesMetadata,
                        seriesOverrides(hiddenStagePresets(this.dataSet())),
                        { resolveAliases: true }
                    ),
                    featureHandler: this.#seriesFeatures
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
                            shared: { type: "boolean", value: false, note: "A funnel tooltip always shows one stage." },
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
        readPartValues<FunnelSeriesComponent>(this.#part("funnel"), this.values())
    );
    protected readonly seriesFeatures = this.#seriesFeatures.data;
    protected readonly tooltip = computed(() =>
        readPartValues<ChartTooltipComponent>(this.#part("tooltip"), this.values())
    );
    protected readonly tooltipFeatures = this.#tooltipFeatures.data;
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });

    protected onDataSetChange(set: FunnelDataSet | null): void {
        if (set) {
            this.dataSet.set(set);
        }
    }

    protected onHiddenStageIdsChange(hiddenStageIds: readonly string[]): void {
        this.values.update(values => ({ ...values, funnel: { ...values["funnel"], hiddenStageIds } }));
        this.eventLog.record("hiddenStageIdsChange", hiddenStageIds);
    }

    protected onSeriesVisibleChange(visible: boolean): void {
        this.values.update(values => ({ ...values, funnel: { ...values["funnel"], visible } }));
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
        subtitle: { type: "string", value: "Users who reached each stage this quarter" },
        title: { type: "string", value: "Conversion funnel" },
        userClass: undefined
    };
}

function seriesOverrides(
    presets: readonly HiddenStagePreset[]
): Partial<ComponentConfigInputType<FunnelSeriesComponent>> {
    return {
        categoryFormatter: {
            type: "customDropdown",
            value: CATEGORY_FORMATTERS,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        },
        color: { type: "color", value: "" },
        colorField: {
            type: "customDropdown",
            value: COLOR_FIELDS,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        },
        colors: {
            type: "customDropdown",
            value: PALETTES,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        },
        gap: { type: "number", value: 2, min: 0 },
        hiddenStageIds: {
            type: "customDropdown",
            value: presets,
            textField: "text",
            valueField: "value",
            defaultValue: NO_HIDDEN_STAGES,
            placeholder: "Set by the legend"
        },
        name: { type: "string", value: "Conversion" },
        strokeColor: { type: "color", value: "" },
        userClass: undefined,
        valueFormatter: {
            type: "customDropdown",
            value: VALUE_FORMATTERS,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        },
        widthRatio: { type: "number", value: 0.9, min: 0.1, max: 1 }
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
