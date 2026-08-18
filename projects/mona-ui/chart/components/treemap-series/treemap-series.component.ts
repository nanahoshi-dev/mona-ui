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
import { TreemapIdentity, type RootBranchIdentityInfo } from "../../internal/data/treemap-identity";
import type { ChartValueFormatter } from "../../models/chart-polar.models";
import type {
    ChartTreemapNodeVisibilityEvent,
    ChartTreemapSort,
    ChartTreemapTile
} from "../../models/chart-treemap.models";
import type { ChartField } from "../../models/chart.models";

let nextTreemapSeriesId = 0;

@Component({
    selector: "mona-treemap-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class TreemapSeriesComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #hiddenNodeIds = signal<ImmutableSet<string>>(ImmutableSet.create());
    readonly #identityMap = new Map<string, RootBranchIdentityInfo>();
    readonly #seriesId = `mona-treemap-series-${++nextTreemapSeriesId}`;
    readonly #visibilityRevision = signal<number>(0);

    /**
     * @description Corner radius in pixels applied to leaf node rectangles.
     * @default undefined
     */
    public readonly borderRadius = input<number | undefined>(undefined);

    /**
     * @description Property key or accessor function extracting child nodes from a hierarchical data object.
     * @default "children"
     */
    public readonly childrenField = input<ChartField>("children");

    /**
     * @description Fallback base fill color applied to series or root branches.
     * @default ""
     */
    public readonly color = input<string>("");

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
     * @description Property key or accessor function extracting the numeric value for a leaf node.
     * @default "value"
     */
    public readonly field = input<ChartField>("value");

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
     * @default "name"
     */
    public readonly labelField = input<ChartField>("name");

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
     * @description Maximum tree depth to layout and render. Normalized: finite <= 0 becomes 1, finite > 0 is floored, undefined/NaN/Infinity is unlimited.
     * @default undefined
     */
    public readonly maxDepth = input<number | undefined>(undefined);

    /**
     * @description Maximum number of DOM label candidates to render (prioritizing parent headers and largest leaf areas).
     * @default 100
     */
    public readonly maxLabels = input<number>(100);

    /**
     * @description Minimum pixel height required for a node to display a DOM label (defaults to 16 when showValues is false, 24 when true).
     * @default undefined
     */
    public readonly minLabelHeight = input<number | undefined>(undefined);

    /**
     * @description Minimum pixel width required for a node to display a DOM label (defaults to 30).
     * @default undefined
     */
    public readonly minLabelWidth = input<number | undefined>(undefined);

    /**
     * @description Series name used in tooltips and accessibility announcements.
     * @default "Treemap"
     */
    public readonly name = input<string>("Treemap");

    /**
     * @description Inner padding in pixels between sibling treemap rectangles.
     * @default 2
     */
    public readonly paddingInner = input<number>(2);

    /**
     * @description Outer padding in pixels around parent boundaries.
     * @default 4
     */
    public readonly paddingOuter = input<number>(4);

    /**
     * @description Fill opacity applied to non-leaf parent group background rectangles.
     * @default undefined
     */
    public readonly parentFillOpacity = input<number | undefined>(undefined);

    /**
     * @description Header height in pixels reserved for parent node header labels.
     * @default undefined
     */
    public readonly parentHeaderHeight = input<number | undefined>(undefined);

    /**
     * @description Whether to display DOM labels for leaf and terminal nodes.
     * @default true
     */
    public readonly showLabels = input<boolean>(true);

    /**
     * @description Whether to reserve header space and display labels for parent grouping nodes.
     * @default true
     */
    public readonly showParentLabels = input<boolean>(true);

    /**
     * @description Whether to display numeric values in default leaf labels.
     * @default false
     */
    public readonly showValues = input<boolean>(false);

    /**
     * @description Sort order for sibling nodes: "descending", "ascending", or "none".
     * @default "descending"
     */
    public readonly sort = input<ChartTreemapSort>("descending");

    /**
     * @description Color of node boundary stroke borders.
     * @default ""
     */
    public readonly strokeColor = input<string>("");

    /**
     * @description Stroke width in pixels for node boundary borders.
     * @default undefined
     */
    public readonly strokeWidth = input<number | undefined>(undefined);

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
            const dataVal = this.data();
            const rootDataVal = this.#chartContext?.rootData ? this.#chartContext.rootData() : undefined;
            const effectiveData = dataVal !== undefined ? dataVal : rootDataVal;
            const keyF = this.keyField();
            const labelF = this.labelField();
            const labelFmt = this.labelFormatter();
            const childrenF = this.childrenField();

            const newMap = TreemapIdentity.extractRetainedRootBranchIdentities({
                childrenField: childrenF,
                data: effectiveData,
                keyField: keyF,
                labelField: labelF,
                labelFormatter: labelFmt
            });

            this.#identityMap.clear();
            for (const [k, v] of newMap) {
                this.#identityMap.set(k, v);
            }

            this.#hiddenNodeIds.update(set => {
                let nextSet = set;
                for (const hiddenId of set) {
                    if (!newMap.has(hiddenId)) {
                        nextSet = nextSet.remove(hiddenId);
                    }
                }
                return nextSet;
            });

            this.field();
            this.childrenField();
            this.color();
            this.colorField();

            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Data);
            }
        });

        effect(() => {
            this.name();
            this.tile();
            this.sort();
            this.paddingInner();
            this.paddingOuter();
            this.parentHeaderHeight();
            this.maxDepth();
            this.showLabels();
            this.showParentLabels();
            this.showValues();
            this.maxLabels();
            this.minLabelWidth();
            this.minLabelHeight();
            this.borderRadius();
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
            color: this.color,
            colorField: this.colorField,
            colors: this.colors,
            data: this.data,
            datumVisibilityRevision: this.#visibilityRevision.asReadonly(),
            element: this.#elementRef,
            field: this.field,
            fillOpacity: this.fillOpacity,
            id: this.#seriesId,
            isDatumVisible: (nodeId: string) => !this.#hiddenNodeIds().contains(nodeId),
            keyField: this.keyField,
            labelField: this.labelField,
            labelFormatter: this.labelFormatter,
            labelTemplate: this.labelTemplate,
            maxDepth: this.maxDepth,
            maxLabels: this.maxLabels,
            minLabelHeight: this.minLabelHeight,
            minLabelWidth: this.minLabelWidth,
            name: this.name,
            paddingInner: this.paddingInner,
            paddingOuter: this.paddingOuter,
            parentFillOpacity: this.parentFillOpacity,
            parentHeaderHeight: this.parentHeaderHeight,
            showLabels: this.showLabels,
            showParentLabels: this.showParentLabels,
            showValues: this.showValues,
            sort: this.sort,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            tile: this.tile,
            toggleDatumVisibility: (nodeId: string) => this.toggleNode(nodeId),
            type: "treemap",
            userClass: this.userClass,
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
            dataIndex: match?.dataIndex,
            datum: match?.datum,
            depth: 1,
            formattedLabel: match?.formattedLabel ?? nodeId,
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
