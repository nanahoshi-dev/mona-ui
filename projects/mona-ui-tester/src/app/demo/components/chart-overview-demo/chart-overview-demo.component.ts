import { Component, computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
    ChartAnnotationComponent,
    ChartAnnotationLabelTemplateDirective,
    ChartBrushComponent,
    ChartComponent,
    ChartCrosshairComponent,
    ChartCrosshairLabelTemplateDirective,
    ChartLegendComponent,
    ChartNoDataTemplateDirective,
    ChartReferenceBandComponent,
    ChartReferenceLabelTemplateDirective,
    ChartReferenceLineComponent,
    ChartSelectionComponent,
    ChartSubtitleTemplateDirective,
    ChartTitleTemplateDirective,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    LineSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartAnimationInput, ChartAxisFormatter, ChartNavigationInput } from "@nanahoshi/mona-ui/chart";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { filter, map } from "rxjs";
import { ComponentMetadata } from "../../models/ComponentMetadata";
import { DemoService } from "../../services/demo.service";
import { ComponentConfigFeatureItem, ComponentConfigInputType } from "../../utils/componentConfig";
import { DemoEventLog, DemoPart, DemoPartValues, readPartValues, reconcilePartValues } from "../../utils/demoParts";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { FINANCE, parseAxisValue, type FinancePoint } from "./chart-overview-demo.data";

/** The parts this playground can add to its chart, beyond the axes, series, legend and tooltip it always has. */
type OptionalPart = "annotation" | "brush" | "crosshair" | "referenceBand" | "referenceLine" | "selection";

interface PartDefinition {
    readonly metadata: string;
    readonly title: string;
}

const OPTIONAL_PARTS: Readonly<Record<OptionalPart, PartDefinition>> = {
    crosshair: { metadata: "ChartCrosshairComponent", title: "Crosshair" },
    referenceLine: { metadata: "ChartReferenceLineComponent", title: "Reference line" },
    referenceBand: { metadata: "ChartReferenceBandComponent", title: "Reference band" },
    annotation: { metadata: "ChartAnnotationComponent", title: "Annotation" },
    selection: { metadata: "ChartSelectionComponent", title: "Selection" },
    brush: { metadata: "ChartBrushComponent", title: "Brush" }
};

/**
 * The optional parts, read as one shape for their panel config. Each part's own inputs are bound in the template,
 * so the panel only needs the names they share.
 */
type OverlayComponent = ChartAnnotationComponent &
    ChartBrushComponent &
    ChartCrosshairComponent &
    ChartReferenceBandComponent &
    ChartReferenceLineComponent &
    ChartSelectionComponent;

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

const AXIS_FORMATTERS: readonly { readonly text: string; readonly value: ChartAxisFormatter | undefined }[] = [
    { text: "Locale default", value: undefined },
    { text: "Compact (5.2K)", value: value => (typeof value === "number" ? compact.format(value) : String(value)) },
    { text: "Dollars", value: value => (typeof value === "number" ? `$${value.toLocaleString("en")}` : String(value)) }
];

const AXIS_VALUE_NOTE = "A number for the Y axis, or a month such as Jun for the X axis.";

/**
 * The playground of the Chart Overview page. It covers the chart itself and the parts every Cartesian chart shares:
 * axes, legend, tooltip, crosshair, reference line and band, annotation, selection and brush. Series inputs belong to
 * the family pages, so the two lines here use fixed settings. It shares nothing with the family playgrounds.
 */
@Component({
    selector: "app-chart-overview-demo",
    imports: [
        ChartAnnotationComponent,
        ChartAnnotationLabelTemplateDirective,
        ChartBrushComponent,
        ChartComponent,
        ChartCrosshairComponent,
        ChartCrosshairLabelTemplateDirective,
        ChartLegendComponent,
        ChartNoDataTemplateDirective,
        ChartReferenceBandComponent,
        ChartReferenceLabelTemplateDirective,
        ChartReferenceLineComponent,
        ChartSelectionComponent,
        ChartSubtitleTemplateDirective,
        ChartTitleTemplateDirective,
        ChartTooltipComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        CheckBoxComponent,
        LineSeriesComponent,
        PartsDemoContainerComponent
    ],
    templateUrl: "./chart-overview-demo.component.html"
})
export class ChartOverviewDemoComponent {
    readonly #annotationFeatures = this.#features({
        annotationLabelTemplate: {
            name: "Annotation label template",
            description: "Replaces the callout with your own markup. Its data comes from the annotation's data input.",
            active: false,
            code: `
                <ng-template monaChartAnnotationLabel let-data="data" let-formattedY="formattedY">
                    <span>{{ $any(data).note }}: {{ formattedY }}</span>
                </ng-template>`
        }
    });

    readonly #chartFeatures = this.#features({
        animation: {
            name: "Animation options",
            description: 'Binds an options object to animation. Off here means [animation]="false".',
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
            description: "Pan and zoom with the wheel, drag, pinch and keys.",
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
                dragPan: {
                    name: "Drag pan",
                    description: "Pan by dragging. Turn the brush off, or use Shift-drag for it.",
                    active: true
                },
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
                    numericValue: 2,
                    numericMin: 1
                }
            }
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
            description: "What the chart shows without data. Turn on Empty data to see it.",
            active: false,
            code: `
                <ng-template monaChartNoDataTemplate>
                    <span>Nothing to show yet</span>
                </ng-template>`
        }
    });
    readonly #crosshairFeatures = this.#features({
        crosshairLabelTemplate: {
            name: "Crosshair label template",
            description: "Replaces the axis badges with your own markup.",
            active: false,
            code: `
                <ng-template monaChartCrosshairLabel let-value let-formatted="formattedValue">
                    <span class="rounded bg-foreground px-1 text-xs text-background">{{ formatted }}</span>
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
    readonly #referenceLineFeatures = this.#features({
        referenceLabelTemplate: {
            name: "Reference label template",
            description: "Replaces the label text with your own markup.",
            active: false,
            code: `
                <ng-template monaChartReferenceLabel let-formatted="formattedValue">
                    <strong>Target {{ formatted }}</strong>
                </ng-template>`
        }
    });
    protected readonly animation = computed<ChartAnimationInput>(() => readAnimation(this.#chartFeatures.data()));
    protected readonly annotation = computed(() =>
        readPartValues<ChartAnnotationComponent>(this.#part("annotation"), this.values())
    );
    protected readonly annotationData = FINANCE[6];
    protected readonly annotationFeatures = this.#annotationFeatures.data;
    protected readonly band = computed(() =>
        readPartValues<ChartReferenceBandComponent>(this.#part("referenceBand"), this.values())
    );
    protected readonly brush = computed(() => readPartValues<ChartBrushComponent>(this.#part("brush"), this.values()));
    protected readonly chart = computed(() => readPartValues<ChartComponent>(this.#part("chart"), this.values()));
    protected readonly chartFeatures = this.#chartFeatures.data;
    protected readonly crosshair = computed(() =>
        readPartValues<ChartCrosshairComponent>(this.#part("crosshair"), this.values())
    );
    protected readonly crosshairFeatures = this.#crosshairFeatures.data;
    protected readonly data = computed<readonly FinancePoint[]>(() => (this.empty() ? [] : FINANCE));
    protected readonly empty = signal(false);
    protected readonly enabled = signal<ReadonlySet<OptionalPart>>(
        new Set<OptionalPart>(["crosshair", "referenceLine", "referenceBand", "annotation", "selection", "brush"])
    );
    protected readonly eventLog = new DemoEventLog();
    protected readonly legend = computed(() =>
        readPartValues<ChartLegendComponent>(this.#part("legend"), this.values())
    );
    protected readonly line = computed(() =>
        readPartValues<ChartReferenceLineComponent>(this.#part("referenceLine"), this.values())
    );
    protected readonly navigation = computed<ChartNavigationInput>(() => readNavigation(this.#chartFeatures.data()));
    protected readonly optionalParts = (Object.keys(OPTIONAL_PARTS) as OptionalPart[]).map(id => ({
        id,
        title: OPTIONAL_PARTS[id].title
    }));
    protected readonly parseAxisValue = parseAxisValue;
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const read = (name: string): ComponentMetadata => metadata[name] ?? { inputs: [], name: "", selector: "" };
        const options = { resolveAliases: true };
        const always: DemoPart[] = [
            {
                id: "chart",
                title: "Chart",
                metadata: read("ChartComponent"),
                codeAttributes: ['[data]="data"', 'xField="month"'],
                config: {
                    inputs: deriveInputConfig<ChartComponent>(read("ChartComponent"), chartOverrides(), options),
                    featureHandler: this.#chartFeatures
                }
            },
            {
                id: "xAxis",
                title: "X axis",
                metadata: read("ChartXAxisComponent"),
                config: {
                    inputs: deriveInputConfig<ChartXAxisComponent>(
                        read("ChartXAxisComponent"),
                        axisOverrides(),
                        options
                    )
                }
            },
            {
                id: "yAxis",
                title: "Y axis",
                metadata: read("ChartYAxisComponent"),
                config: {
                    inputs: deriveInputConfig<ChartYAxisComponent>(
                        read("ChartYAxisComponent"),
                        { ...axisOverrides<ChartYAxisComponent>(), title: { type: "string", value: "USD" } },
                        options
                    )
                }
            },
            {
                id: "legend",
                title: "Legend",
                metadata: read("ChartLegendComponent"),
                config: {
                    inputs: deriveInputConfig<ChartLegendComponent>(
                        read("ChartLegendComponent"),
                        { userClass: undefined },
                        options
                    )
                }
            },
            {
                id: "tooltip",
                title: "Tooltip",
                metadata: read("ChartTooltipComponent"),
                config: {
                    inputs: deriveInputConfig<ChartTooltipComponent>(
                        read("ChartTooltipComponent"),
                        { shared: { type: "boolean", value: true }, userClass: undefined },
                        options
                    )
                }
            }
        ];
        const enabled = this.enabled();
        const optional = (Object.keys(OPTIONAL_PARTS) as OptionalPart[])
            .filter(id => enabled.has(id))
            .map((id): DemoPart => {
                const partMetadata = read(OPTIONAL_PARTS[id].metadata);
                return {
                    id,
                    title: OPTIONAL_PARTS[id].title,
                    metadata: partMetadata,
                    config: {
                        inputs: deriveInputConfig<OverlayComponent>(partMetadata, optionalOverrides(id), options),
                        featureHandler: this.#optionalFeatures(id)
                    }
                };
            });
        return [...always, ...optional];
    });
    /** The panels come from metadata that loads after the page; until then the chart would get no settings. */
    protected readonly ready = computed(() => this.parts().every(part => (part.metadata.inputs ?? []).length > 0));
    protected readonly referenceLineFeatures = this.#referenceLineFeatures.data;
    protected readonly selectedMarkIds = signal<readonly string[]>([]);
    protected readonly selection = computed(() =>
        readPartValues<ChartSelectionComponent>(this.#part("selection"), this.values())
    );
    protected readonly tooltip = computed(() =>
        readPartValues<ChartTooltipComponent>(this.#part("tooltip"), this.values())
    );
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });
    protected readonly xAxis = computed(() => readPartValues<ChartXAxisComponent>(this.#part("xAxis"), this.values()));
    protected readonly yAxis = computed(() => readPartValues<ChartYAxisComponent>(this.#part("yAxis"), this.values()));

    protected isEnabled(id: OptionalPart): boolean {
        return this.enabled().has(id);
    }

    protected onSelectedMarkIdsChange(ids: readonly string[]): void {
        this.selectedMarkIds.set(ids);
        this.eventLog.record("selectedMarkIdsChange", ids);
    }

    protected togglePart(id: OptionalPart, on: boolean): void {
        this.enabled.update(current => {
            const next = new Set(current);
            if (on) {
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    }

    #features(data: ComponentConfigFeatureItem): FeatureConfigHandler {
        return createFeatureInjector(data, inject(Injector)).get(FeatureConfigHandler);
    }

    #optionalFeatures(id: OptionalPart): FeatureConfigHandler | undefined {
        switch (id) {
            case "crosshair":
                return this.#crosshairFeatures;
            case "referenceLine":
                return this.#referenceLineFeatures;
            case "annotation":
                return this.#annotationFeatures;
            default:
                return undefined;
        }
    }

    #part(id: string): DemoPart | undefined {
        return this.parts().find(part => part.id === id);
    }
}

function chartOverrides(): Partial<ComponentConfigInputType<ChartComponent>> {
    return {
        ariaDescription: { alias: "aria-description", type: "string", value: "" },
        ariaLabel: { alias: "aria-label", type: "string", value: "" },
        subtitle: { type: "string", value: "Revenue and cost by month" },
        title: { type: "string", value: "Operating results" },
        userClass: undefined
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
        }
    };
    return overrides as Partial<ComponentConfigInputType<T>>;
}

function optionalOverrides(id: OptionalPart): Partial<ComponentConfigInputType<OverlayComponent>> {
    // The parts' inputs share names with different types, so the overrides are checked per part, not as one shape.
    return optionalOverrideEntries(id) as Partial<ComponentConfigInputType<OverlayComponent>>;
}

function optionalOverrideEntries(id: OptionalPart): Record<string, unknown> {
    const shared = { userClass: undefined, axisId: undefined, xAxisId: undefined, yAxisId: undefined };
    switch (id) {
        case "referenceLine":
            return {
                ...shared,
                axis: { type: "dropdown", value: ["y", "x"], defaultValue: "y" },
                color: { type: "color", value: "" },
                label: { type: "string", value: "Target" },
                value: { type: "string", value: "8000", note: AXIS_VALUE_NOTE }
            };
        case "referenceBand":
            return {
                ...shared,
                axis: { type: "dropdown", value: ["x", "y"], defaultValue: "x" },
                borderColor: { type: "color", value: "" },
                fillColor: { type: "color", value: "" },
                from: { type: "string", value: "Jun", note: AXIS_VALUE_NOTE },
                label: { type: "string", value: "Summer" },
                to: { type: "string", value: "Aug", note: AXIS_VALUE_NOTE }
            };
        case "annotation":
            return {
                ...shared,
                color: { type: "color", value: "" },
                data: undefined,
                label: { type: "string", value: "Summer launch" },
                x: { type: "string", value: "Jul", note: "A month on the X axis." },
                y: { type: "string", value: String(FINANCE[6].revenue), note: "A number on the Y axis." }
            };
        case "selection":
            return {
                ...shared,
                color: { type: "color", value: "" },
                defaultSelectedMarkIds: undefined,
                mode: { type: "dropdown", value: ["single", "multiple"], defaultValue: "multiple" },
                selectedMarkIds: undefined
            };
        case "brush":
            return { ...shared, borderColor: { type: "color", value: "" }, fillColor: { type: "color", value: "" } };
        case "crosshair":
            return { ...shared, color: { type: "color", value: "" } };
    }
}

function subFeature(features: ComponentConfigFeatureItem, key: string, name: string) {
    return features[key]?.subFeatures?.[name];
}

function readAnimation(features: ComponentConfigFeatureItem): ChartAnimationInput {
    if (!features["animation"]?.active) {
        return false;
    }
    const read = (name: string) => subFeature(features, "animation", name);
    return {
        data: read("data")?.active ?? true,
        duration: read("duration")?.numericValue ?? 300,
        easing: (read("easing")?.dropdownValue as "ease-out") ?? "ease-out",
        initial: read("initial")?.active ?? true,
        visibility: read("visibility")?.active ?? true
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
        minVisibleCategories: read("minVisibleCategories")?.numericValue ?? 2,
        panAxes: (read("panAxes")?.dropdownValue as "auto") ?? "auto",
        pinchZoom: read("pinchZoom")?.active ?? true,
        wheelZoom: read("wheelZoom")?.active ?? true,
        zoomAxes: (read("zoomAxes")?.dropdownValue as "auto") ?? "auto"
    };
}
