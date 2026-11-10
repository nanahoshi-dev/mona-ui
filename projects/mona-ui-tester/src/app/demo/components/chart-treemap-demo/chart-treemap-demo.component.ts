import { PercentPipe } from "@angular/common";
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
    ChartTreemapLabelTemplateDirective,
    TreemapSeriesComponent
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
import { BUDGET_DEPARTMENTS, budgetData, type BudgetDataSet } from "./chart-treemap-demo.data";

const compactDollars = new Intl.NumberFormat("en", {
    currency: "USD",
    maximumFractionDigits: 1,
    notation: "compact",
    style: "currency"
});

/** The budget is in thousands of dollars. */
const VALUE_FORMATTERS: readonly { readonly text: string; readonly value: ChartValueFormatter | undefined }[] = [
    { text: "Locale default", value: undefined },
    { text: "Dollars ($1.8M)", value: value => compactDollars.format(Number(value) * 1000) },
    { text: "Thousands suffix", value: value => `${Number(value).toLocaleString("en")}K` }
];

const CATEGORY_FORMATTERS: readonly { readonly text: string; readonly value: ChartValueFormatter | undefined }[] = [
    { text: "As written", value: undefined },
    { text: "Upper case", value: value => String(value).toUpperCase() },
    { text: "First three letters", value: value => String(value).slice(0, 3) }
];

const PALETTES: readonly { readonly text: string; readonly value: readonly string[] | undefined }[] = [
    { text: "Theme palette", value: undefined },
    { text: "Warm", value: ["#b45309", "#be123c", "#c2410c", "#a16207", "#9d174d"] },
    { text: "Cool", value: ["#1d4ed8", "#0f766e", "#6d28d9", "#0369a1", "#15803d"] }
];

/**
 * The id the series gives a department. With `keyField`, a node's id comes from its key; the playground builds it here
 * only so the Features tab can hide a department before the legend has reported any id.
 */
function departmentNodeId(id: string): string {
    return `k:s:${id}`;
}

/**
 * The playground of the Treemap page. It covers every input of the treemap series, the legend, the tooltip and the
 * chart itself, and the templates they take. It shares nothing with the other chart family playgrounds.
 */
@Component({
    selector: "app-chart-treemap-demo",
    imports: [
        ChartComponent,
        ChartLegendComponent,
        ChartLegendItemTemplateDirective,
        ChartNoDataTemplateDirective,
        ChartSubtitleTemplateDirective,
        ChartTitleTemplateDirective,
        ChartTooltipComponent,
        ChartTooltipTemplateDirective,
        ChartTreemapLabelTemplateDirective,
        PartsDemoContainerComponent,
        PercentPipe,
        SegmentedComponent,
        TreemapSeriesComponent
    ],
    templateUrl: "./chart-treemap-demo.component.html"
})
export class ChartTreemapDemoComponent {
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
                    description: "Animate data changes, such as switching the data set.",
                    active: true
                },
                visibility: { name: "Visibility", description: "Animate hiding and showing departments.", active: true }
            }
        },
        titleTemplate: {
            name: "Title template",
            description: "Replaces the title text with your own markup.",
            active: false,
            code: `
                <ng-template monaChartTitleTemplate let-title>
                    <span class="font-semibold">🗂️ {{ title }}</span>
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
                    <span>No budget yet</span>
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
        hiddenDepartments: {
            name: "Hidden departments",
            description: "The top-level nodes bound to [(hiddenNodeIds)]. The legend writes here too.",
            active: false,
            hasCode: false,
            subFeatures: Object.fromEntries(
                BUDGET_DEPARTMENTS.map(department => [
                    department.id,
                    {
                        name: department.name,
                        description: `Hide ${department.name} and everything in it.`,
                        active: false
                    }
                ])
            )
        },
        labelTemplate: {
            name: "Label template",
            description: "Replaces the text of each label, for parent headers and the smallest rectangles alike.",
            active: false,
            code: `
                <ng-template monaChartTreemapLabelTemplate let-node>
                    <span class="truncate font-semibold">{{ node.formattedLabel }}</span>
                    @if (node.isLeaf || node.isCollapsed) {
                        <span class="truncate text-[11px] opacity-80">{{ (node.percentageOfParent ?? 0) | percent }}</span>
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
                <ng-template monaChartTooltipTemplate let-point>
                    @if (point.hierarchy; as node) {
                        <div>{{ node.formattedPath.join(" / ") }}</div>
                        <div>{{ node.formattedValue }}</div>
                    }
                </ng-template>`
        }
    });

    protected readonly animation = computed<ChartAnimationInput>(() => readAnimation(this.#chartFeatures.data()));
    protected readonly chart = computed(() => readPartValues<ChartComponent>(this.#part("chart"), this.values()));
    protected readonly chartFeatures = this.#chartFeatures.data;
    protected readonly data = computed(() => budgetData(this.dataSet()));
    protected readonly dataSet = signal<BudgetDataSet>("shallow");
    protected readonly dataSetOptions: readonly SegmentedOption<BudgetDataSet>[] = [
        { label: "Teams", value: "shallow" },
        { label: "Cost lines", value: "deep" },
        { label: "Empty", value: "empty" }
    ];
    protected readonly eventLog = new DemoEventLog();
    protected readonly hiddenNodeIds = computed<readonly string[]>(() =>
        readHiddenNodeIds(this.#seriesFeatures.data())
    );
    protected readonly legend = computed(() =>
        readPartValues<ChartLegendComponent>(this.#part("legend"), this.values())
    );
    protected readonly legendFeatures = this.#legendFeatures.data;
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const chartMetadata = metadata["ChartComponent"] ?? emptyMetadata();
        const seriesMetadata = metadata["TreemapSeriesComponent"] ?? emptyMetadata();
        const legendMetadata = metadata["ChartLegendComponent"] ?? emptyMetadata();
        const tooltipMetadata = metadata["ChartTooltipComponent"] ?? emptyMetadata();
        return [
            {
                id: "chart",
                title: "Chart",
                metadata: chartMetadata,
                codeAttributes: ['[data]="budget"'],
                config: {
                    inputs: deriveInputConfig<ChartComponent>(chartMetadata, chartOverrides(), {
                        resolveAliases: true
                    }),
                    featureHandler: this.#chartFeatures
                }
            },
            {
                id: "treemap",
                title: "Treemap series",
                metadata: seriesMetadata,
                codeAttributes: [
                    'childrenField="children"',
                    'field="value"',
                    'keyField="id"',
                    'labelField="name"',
                    '[(hiddenNodeIds)]="hiddenNodeIds"'
                ],
                config: {
                    inputs: deriveInputConfig<TreemapSeriesComponent>(seriesMetadata, seriesOverrides(), {
                        resolveAliases: true
                    }),
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
    protected readonly series = computed(() =>
        readPartValues<TreemapSeriesComponent>(this.#part("treemap"), this.values())
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

    protected onDataSetChange(set: BudgetDataSet | null): void {
        if (set) {
            this.dataSet.set(set);
        }
    }

    protected onHiddenNodeIdsChange(ids: readonly string[]): void {
        this.#seriesFeatures.updateData(withHiddenDepartments(this.#seriesFeatures.data(), ids));
        this.eventLog.record("hiddenNodeIdsChange", ids);
    }

    protected onSeriesVisibleChange(visible: boolean): void {
        this.values.update(values => ({ ...values, treemap: { ...values["treemap"], visible } }));
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
        subtitle: { type: "string", value: "By department and team, in thousands of dollars" },
        title: { type: "string", value: "Annual budget" },
        userClass: undefined
    };
}

function seriesOverrides(): Partial<ComponentConfigInputType<TreemapSeriesComponent>> {
    return {
        categoryFormatter: {
            type: "customDropdown",
            value: CATEGORY_FORMATTERS,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        },
        color: { type: "color", value: "" },
        colors: {
            type: "customDropdown",
            value: PALETTES,
            textField: "text",
            valueField: "value",
            defaultValue: undefined
        },
        labelFormatter: undefined,
        name: { type: "string", value: "Budget" },
        strokeColor: { type: "color", value: "" },
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

function readHiddenNodeIds(features: ComponentConfigFeatureItem): readonly string[] {
    const item = features["hiddenDepartments"];
    if (!item?.active) {
        return [];
    }
    return BUDGET_DEPARTMENTS.filter(department => item.subFeatures?.[department.id]?.active).map(department =>
        departmentNodeId(department.id)
    );
}

/** The features with the departments the series reports as hidden, so the panel follows the legend. */
function withHiddenDepartments(
    features: ComponentConfigFeatureItem,
    ids: readonly string[]
): ComponentConfigFeatureItem {
    const item = features["hiddenDepartments"];
    if (!item) {
        return features;
    }
    const subFeatures: ComponentConfigFeatureItem = Object.fromEntries(
        Object.entries(item.subFeatures ?? {}).map(([key, sub]) => [
            key,
            { ...sub, active: ids.includes(departmentNodeId(key)) }
        ])
    );
    return {
        ...features,
        hiddenDepartments: { ...item, active: ids.length > 0 || (item.active ?? false), subFeatures }
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
