import { Component, computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
    ChartAngularAxisComponent,
    ChartAxisLabelTemplateDirective,
    ChartComponent,
    ChartLegendComponent,
    ChartLegendItemTemplateDirective,
    ChartNoDataTemplateDirective,
    ChartRadialAxisComponent,
    ChartSubtitleTemplateDirective,
    ChartTitleTemplateDirective,
    ChartTooltipComponent,
    ChartTooltipTemplateDirective,
    PolarSeriesComponent,
    RadarSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type {
    ChartAnimationInput,
    ChartAxisFormatter,
    ChartRadialFillMode,
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
import { scoreData, windData, type RadialDataSet } from "./chart-radar-demo.data";

type SeriesType = "polar" | "radar";

const SERIES_METADATA: Readonly<Record<SeriesType, string>> = {
    polar: "PolarSeriesComponent",
    radar: "RadarSeriesComponent"
};

const SERIES_TITLES: Readonly<Record<SeriesType, string>> = {
    polar: "Polar series",
    radar: "Radar series"
};

const CHART_TEXT: Readonly<Record<SeriesType, { readonly subtitle: string; readonly title: string }>> = {
    polar: { subtitle: "Average wind and gusts by bearing, in km/h", title: "Wind rose" },
    radar: { subtitle: "Scores out of 100, this release against the target", title: "Product health" }
};

const FILL_MODES: ChartRadialFillMode[] = ["none", "solid", "gradient"];

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

const SCORE_FORMATTERS: readonly { readonly text: string; readonly value: ChartValueFormatter | undefined }[] = [
    { text: "Locale default", value: undefined },
    { text: "Out of 100", value: value => `${Number(value)} / 100` },
    { text: "Points suffix", value: value => `${Number(value)} pts` }
];

const WIND_FORMATTERS: readonly { readonly text: string; readonly value: ChartValueFormatter | undefined }[] = [
    { text: "Locale default", value: undefined },
    { text: "km/h", value: value => `${Number(value).toLocaleString("en")} km/h` },
    { text: "Knots", value: value => `${(Number(value) / 1.852).toFixed(1)} kn` }
];

const ANGULAR_FORMATTERS: readonly { readonly text: string; readonly value: ChartAxisFormatter | undefined }[] = [
    { text: "Locale default", value: undefined },
    { text: "Compass points / initials", value: value => shortAngularLabel(value) },
    { text: "Upper case", value: value => String(value).toUpperCase() }
];

const RADIAL_FORMATTERS: readonly { readonly text: string; readonly value: ChartAxisFormatter | undefined }[] = [
    { text: "Locale default", value: undefined },
    { text: "Compact (1.2K)", value: value => (typeof value === "number" ? compact.format(value) : String(value)) },
    { text: "Percent sign", value: value => `${String(value)}%` }
];

/**
 * The playground of the Radar & Polar page. It covers every input of the radar and polar series, the angular and
 * radial axes, the legend, the tooltip and the chart itself, and the templates they take. It shares nothing with the
 * other chart family playgrounds.
 */
@Component({
    selector: "app-chart-radar-demo",
    imports: [
        ChartAngularAxisComponent,
        ChartAxisLabelTemplateDirective,
        ChartComponent,
        ChartLegendComponent,
        ChartLegendItemTemplateDirective,
        ChartNoDataTemplateDirective,
        ChartRadialAxisComponent,
        ChartSubtitleTemplateDirective,
        ChartTitleTemplateDirective,
        ChartTooltipComponent,
        ChartTooltipTemplateDirective,
        PartsDemoContainerComponent,
        PolarSeriesComponent,
        RadarSeriesComponent,
        SegmentedComponent
    ],
    templateUrl: "./chart-radar-demo.component.html"
})
export class ChartRadarDemoComponent {
    readonly #angularAxisFeatures = this.#features({
        axisLabelTemplate: {
            name: "Axis label template",
            description: "Replaces each spoke or degree label with your own markup. It receives the raw value.",
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
                    <span class="font-semibold">🧭 {{ title }}</span>
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
    readonly #radialAxisFeatures = this.#features({
        axisLabelTemplate: {
            name: "Axis label template",
            description: "Replaces each ring label with your own markup. It receives the raw value.",
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
                <ng-template monaChartTooltipTemplate let-points="points">
                    @for (point of points; track point.seriesId) {
                        <div>{{ point.formattedX }} · {{ point.seriesName }}: {{ point.formattedY }}</div>
                    }
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
    protected readonly dataSet = signal<RadialDataSet>("basic");
    protected readonly dataSetOptions = computed<readonly SegmentedOption<RadialDataSet>[]>(() => [
        { label: "Basic", value: "basic" },
        { label: this.seriesType() === "radar" ? "More spokes" : "Every 5°", value: "many" },
        { label: "With gaps", value: "gaps" },
        { label: "Empty", value: "empty" }
    ]);
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
        const angularMetadata = metadata["ChartAngularAxisComponent"] ?? emptyMetadata();
        const radialMetadata = metadata["ChartRadialAxisComponent"] ?? emptyMetadata();
        const legendMetadata = metadata["ChartLegendComponent"] ?? emptyMetadata();
        const tooltipMetadata = metadata["ChartTooltipComponent"] ?? emptyMetadata();
        return [
            {
                id: "chart",
                title: "Chart",
                metadata: chartMetadata,
                codeAttributes: ['[data]="data"'],
                config: {
                    inputs: deriveInputConfig<ChartComponent>(chartMetadata, chartOverrides(type), {
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
                    type === "radar"
                        ? ['categoryField="metric"', 'field="current"']
                        : ['categoryField="bearing"', 'field="wind"'],
                config: {
                    inputs: deriveInputConfig<RadarSeriesComponent>(seriesMetadata, seriesOverrides(type), {
                        resolveAliases: true
                    })
                }
            },
            {
                id: "angularAxis",
                title: "Angular axis",
                metadata: angularMetadata,
                config: {
                    inputs: deriveInputConfig<ChartAngularAxisComponent>(angularMetadata, angularAxisOverrides(), {
                        resolveAliases: true
                    }),
                    featureHandler: this.#angularAxisFeatures
                }
            },
            {
                id: "radialAxis",
                title: "Radial axis",
                metadata: radialMetadata,
                config: {
                    inputs: deriveInputConfig<ChartRadialAxisComponent>(radialMetadata, radialAxisOverrides(), {
                        resolveAliases: true
                    }),
                    featureHandler: this.#radialAxisFeatures
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
    protected readonly polarData = computed(() => windData(this.dataSet()));
    protected readonly radarData = computed(() => scoreData(this.dataSet()));
    protected readonly radialAxis = computed(() =>
        readPartValues<ChartRadialAxisComponent>(this.#part("radialAxis"), this.values())
    );
    protected readonly radialAxisFeatures = this.#radialAxisFeatures.data;
    /** Whether the second series, which the panel doesn't cover, is shown. The legend toggles it. */
    /** The panels come from metadata that loads after the page; until then the chart would get no settings. */
    protected readonly ready = computed(() => this.parts().every(part => (part.metadata.inputs ?? []).length > 0));
    protected readonly secondVisible = signal(true);
    /** The radar and polar series take the same inputs, so one typed reading serves both panels. */
    protected readonly series = computed(() =>
        readPartValues<RadarSeriesComponent>(this.#part(this.seriesType()), this.values())
    );
    protected readonly seriesType = signal<SeriesType>("radar");
    protected readonly seriesTypeOptions: readonly SegmentedOption<SeriesType>[] = [
        { label: "Radar", value: "radar" },
        { label: "Polar", value: "polar" }
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

    protected onSecondVisibleChange(visible: boolean): void {
        this.secondVisible.set(visible);
        this.eventLog.record("visibleChange (second series)", visible);
    }

    protected onSeriesTypeChange(type: SeriesType | null): void {
        if (type) {
            this.seriesType.set(type);
            this.secondVisible.set(true);
            // The chart panel keeps what the user set, so swap in the titles that describe the new data.
            this.values.update(values => ({ ...values, chart: { ...values["chart"], ...CHART_TEXT[type] } }));
        }
    }

    protected onSeriesVisibleChange(visible: boolean): void {
        const type = this.seriesType();
        this.values.update(values => ({ ...values, [type]: { ...values[type], visible } }));
        this.eventLog.record("visibleChange", visible);
    }

    #features(data: ComponentConfigFeatureItem): FeatureConfigHandler {
        // Called from field initializers, so it still runs in the injection context.
        return createFeatureInjector(data, inject(Injector)).get(FeatureConfigHandler);
    }

    #part(id: string): DemoPart | undefined {
        return this.parts().find(part => part.id === id);
    }
}

function emptyMetadata(): ComponentMetadata {
    return { inputs: [], name: "", selector: "" };
}

/** A compass point for a bearing, or the initials of a spoke name. */
function shortAngularLabel(value: unknown): string {
    if (typeof value === "number") {
        return COMPASS[Math.round((((value % 360) + 360) % 360) / 45) % COMPASS.length];
    }
    return String(value).slice(0, 3);
}

function chartOverrides(type: SeriesType): Partial<ComponentConfigInputType<ChartComponent>> {
    return {
        ariaDescription: { alias: "aria-description", type: "string", value: "" },
        ariaLabel: { alias: "aria-label", type: "string", value: "" },
        subtitle: { type: "string", value: CHART_TEXT[type].subtitle },
        title: { type: "string", value: CHART_TEXT[type].title },
        userClass: undefined
    };
}

function seriesOverrides(type: SeriesType): Partial<ComponentConfigInputType<RadarSeriesComponent>> {
    return {
        color: { type: "color", value: "" },
        fillMode: { type: "dropdown", value: FILL_MODES, defaultValue: type === "radar" ? "solid" : "gradient" },
        fillOpacity: { type: "number", nullable: true, min: 0, max: 1, value: undefined },
        name: { type: "string", value: type === "radar" ? "This release" : "Average wind" },
        pointRadius: { type: "number", nullable: true, min: 0, value: undefined },
        strokeWidth: { type: "number", nullable: true, min: 0, value: undefined },
        userClass: undefined,
        valueFormatter: {
            type: "customDropdown",
            value: type === "radar" ? SCORE_FORMATTERS : WIND_FORMATTERS,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        }
    };
}

function angularAxisOverrides(): Partial<ComponentConfigInputType<ChartAngularAxisComponent>> {
    return {
        formatter: {
            type: "customDropdown",
            value: ANGULAR_FORMATTERS,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        },
        labelOffset: { type: "number", min: 0, value: 10 },
        rotation: { type: "number", min: -360, max: 360, value: 0 },
        tickCount: {
            type: "number",
            nullable: true,
            min: 2,
            max: 72,
            value: undefined,
            note: "Polar only. Radar draws a spoke per category."
        },
        userClass: undefined
    };
}

function radialAxisOverrides(): Partial<ComponentConfigInputType<ChartRadialAxisComponent>> {
    return {
        formatter: {
            type: "customDropdown",
            value: RADIAL_FORMATTERS,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        },
        labelAngle: { type: "number", min: -360, max: 360, value: 0 },
        labelOffset: { type: "number", min: 0, value: 6 },
        tickCount: { type: "number", nullable: true, min: 1, max: 20, value: 5 },
        userClass: undefined
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
