import {
    Component,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    model,
    OnInit,
    output,
    signal
} from "@angular/core";
import { ImmutableSet } from "@mirei/ts-collections";
import { ChartTreemapLabelTemplateDirective } from "../../directives/chart-treemap-label-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartTreemapSeriesRegistration
} from "../../internal/context/chart-registration-context";
import type { ChartValueFormatter } from "../../models/chart-polar.models";
import type {
    ChartTreemapNodeVisibilityEvent,
    ChartTreemapSort,
    ChartTreemapTile
} from "../../models/chart-treemap.models";
import type { ChartField } from "../../models/chart.models";

let nextTreemapSeriesId = 0;

@Component({
    selector: "mona-chart-treemap-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class ChartTreemapSeriesComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #hiddenNodeIds = signal<ImmutableSet<string>>(ImmutableSet.create());
    readonly #identityMap = new Map<string, { datum: unknown; label: string }>();
    readonly #seriesId = `mona-treemap-series-${++nextTreemapSeriesId}`;
    readonly #visibilityRevision = signal<number>(0);

    /**
     * @description Corner radius in pixels applied to leaf node rectangles.
     * @default 0
     */
    public readonly borderRadius = input<number>(0);

    /**
     * @description Property key or accessor function extracting child nodes from a hierarchical data object.
     * @default "children"
     */
    public readonly childrenField = input<ChartField>("children");

    /**
     * @description Accessor function or property key extracting an explicit fill color for a node.
     * @default undefined
     */
    public readonly colorField = input<ChartField | undefined>(undefined);

    /**
     * @description Explicit array of colors assigned to top-level branches and inherited down subtrees.
     * @default undefined
     */
    public readonly colors = input<readonly string[] | undefined>(undefined);

    /**
     * @description Hierarchical root object or array of root nodes overriding chart-level data.
     * @default undefined
     */
    public readonly data = input<readonly unknown[] | unknown | undefined>(undefined);

    /**
     * @description Opacity of leaf node fills (0 to 1).
     * @default undefined
     */
    public readonly fillOpacity = input<number | undefined>(undefined);

    /**
     * @description Property key or accessor extracting a stable datum identity across data updates.
     * @default undefined
     */
    public readonly keyField = input<ChartField | undefined>(undefined);

    /**
     * @description Property key or accessor extracting the display label for a node.
     * @default "label"
     */
    public readonly labelField = input<ChartField>("label");

    /**
     * @description Formatter callback for node display labels.
     * @default undefined
     */
    public readonly labelFormatter = input<ChartValueFormatter | undefined>(undefined);

    /**
     * @description Custom template for rendering DOM labels.
     */
    public readonly labelTemplate = contentChild(ChartTreemapLabelTemplateDirective);

    /**
     * @description Maximum tree depth to layout and render.
     * @default undefined
     */
    public readonly maxDepth = input<number | undefined>(undefined);

    /**
     * @description Maximum number of DOM label candidates to render (prioritizing parent headers and largest leaf areas).
     * @default 100
     */
    public readonly maxLabels = input<number>(100);

    /**
     * @description Series name used in tooltips and accessibility announcements.
     * @default "Treemap"
     */
    public readonly name = input<string>("Treemap");

    /**
     * @description Inner and outer padding in pixels around all treemap nodes.
     * @default 2
     */
    public readonly padding = input<number>(2);

    /**
     * @description Bottom padding in pixels for parent nodes.
     * @default undefined
     */
    public readonly paddingBottom = input<number | undefined>(undefined);

    /**
     * @description Inner padding in pixels between sibling treemap rectangles.
     * @default undefined
     */
    public readonly paddingInner = input<number | undefined>(undefined);

    /**
     * @description Left padding in pixels for parent nodes.
     * @default undefined
     */
    public readonly paddingLeft = input<number | undefined>(undefined);

    /**
     * @description Outer padding in pixels around parent boundaries.
     * @default undefined
     */
    public readonly paddingOuter = input<number | undefined>(undefined);

    /**
     * @description Right padding in pixels for parent nodes.
     * @default undefined
     */
    public readonly paddingRight = input<number | undefined>(undefined);

    /**
     * @description Top padding in pixels reserved for parent node header labels.
     * @default undefined
     */
    public readonly paddingTop = input<number | undefined>(undefined);

    /**
     * @description Fill opacity applied to non-leaf parent group background rectangles.
     * @default 0.15
     */
    public readonly parentFillOpacity = input<number>(0.15);

    /**
     * @description Whether to reserve header space and display labels for parent grouping nodes.
     * @default true
     */
    public readonly showParentLabels = input<boolean>(true);

    /**
     * @description Whether to display numeric values in default leaf labels.
     * @default true
     */
    public readonly showValues = input<boolean>(true);

    /**
     * @description Sort order for sibling nodes: "descending", "ascending", or "none".
     * @default "descending"
     */
    public readonly sort = input<ChartTreemapSort>("descending");

    /**
     * @description Color of node boundary stroke borders.
     * @default "#ffffff"
     */
    public readonly strokeColor = input<string>("#ffffff");

    /**
     * @description Stroke width in pixels for node boundary borders.
     * @default 1
     */
    public readonly strokeWidth = input<number>(1);

    /**
     * @description D3 treemap tiling algorithm: "squarify", "binary", "dice", "slice", or "slice-dice".
     * @default "squarify"
     */
    public readonly tile = input<ChartTreemapTile>("squarify");

    /**
     * @description Additional CSS classes applied to the series.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Property key or accessor function extracting the numeric value for a leaf node.
     * @default "value"
     */
    public readonly valueField = input<ChartField>("value");

    /**
     * @description Formatter callback for numeric values in labels and tooltips.
     * @default undefined
     */
    public readonly valueFormatter = input<ChartValueFormatter | undefined>(undefined);

    /**
     * @description Two-way bindable visibility of the series.
     * @default true
     */
    public readonly visible = model<boolean>(true);

    /**
     * @description Emits when an individual node or branch's visibility is toggled via the legend.
     */
    public readonly nodeVisibilityChange = output<ChartTreemapNodeVisibilityEvent>();

    #registered = false;

    public constructor() {
        effect(() => {
            this.visible();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Visibility);
            }
        });

        effect(() => {
            this.data();
            this.valueField();
            this.childrenField();
            this.labelField();
            this.keyField();
            this.colorField();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Data);
            }
        });

        effect(() => {
            this.name();
            this.tile();
            this.sort();
            this.padding();
            this.paddingInner();
            this.paddingOuter();
            this.paddingTop();
            this.paddingRight();
            this.paddingBottom();
            this.paddingLeft();
            this.maxDepth();
            this.showParentLabels();
            this.showValues();
            this.maxLabels();
            this.borderRadius();
            this.labelFormatter();
            this.valueFormatter();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Layout);
            }
        });

        effect(() => {
            this.colors();
            this.fillOpacity();
            this.parentFillOpacity();
            this.strokeColor();
            this.strokeWidth();
            this.userClass();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Style);
            }
        });
    }

    public ngOnInit(): void {
        if (!this.#chartContext) {
            return;
        }

        this.#registered = true;

        const registration: ChartTreemapSeriesRegistration = {
            borderRadius: this.borderRadius,
            childrenField: this.childrenField,
            colorField: this.colorField,
            colors: this.colors,
            data: this.data,
            datumVisibilityRevision: this.#visibilityRevision.asReadonly(),
            element: this.#elementRef,
            fillOpacity: this.fillOpacity,
            id: this.#seriesId,
            isDatumVisible: (nodeId: string) => !this.#hiddenNodeIds().contains(nodeId),
            keyField: this.keyField,
            labelField: this.labelField,
            labelFormatter: this.labelFormatter,
            labelTemplate: this.labelTemplate,
            maxDepth: this.maxDepth,
            maxLabels: this.maxLabels,
            name: this.name,
            padding: this.padding,
            paddingBottom: this.paddingBottom,
            paddingInner: this.paddingInner,
            paddingLeft: this.paddingLeft,
            paddingOuter: this.paddingOuter,
            paddingRight: this.paddingRight,
            paddingTop: this.paddingTop,
            parentFillOpacity: this.parentFillOpacity,
            showParentLabels: this.showParentLabels,
            showValues: this.showValues,
            sort: this.sort,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            tile: this.tile,
            toggleDatumVisibility: (nodeId: string) => this.toggleNode(nodeId),
            type: "treemap",
            userClass: this.userClass,
            valueField: this.valueField,
            valueFormatter: this.valueFormatter,
            visible: this.visible
        };

        const unregister = this.#chartContext.registerSeries(registration);
        this.#destroyRef.onDestroy(unregister);
    }

    public toggleNode(nodeId: string): boolean {
        let isNowVisible = false;
        this.#hiddenNodeIds.update(set => {
            if (set.contains(nodeId)) {
                isNowVisible = true;
                return set.remove(nodeId);
            }
            isNowVisible = false;
            return set.add(nodeId);
        });

        this.#visibilityRevision.update(v => v + 1);

        const match = this.#identityMap.get(nodeId);

        this.nodeVisibilityChange.emit({
            datum: match?.datum,
            formattedLabel: match?.label ?? nodeId,
            label: match?.label ?? nodeId,
            nodeId,
            seriesId: this.#seriesId,
            seriesName: this.name(),
            seriesType: "treemap",
            visible: isNowVisible
        });

        this.#chartContext?.invalidate(ChartInvalidationReason.Visibility);
        return isNowVisible;
    }
}
