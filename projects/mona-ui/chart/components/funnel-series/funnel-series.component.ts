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
    output
} from "@angular/core";
import { ChartFunnelLabelTemplateDirective } from "../../directives/chart-funnel-label-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartFunnelSeriesRegistration
} from "../../internal/context/chart-registration-context";
import { FunnelIdentity } from "../../internal/data/funnel-identity";
import { resolveNumericValue, resolveValue } from "../../internal/data/chart-value-resolver";
import type {
    ChartFunnelLabelContent,
    ChartFunnelOrientation,
    ChartFunnelStageVisibilityEvent
} from "../../models/chart-funnel.models";
import type { ChartField, ChartValueFormatter } from "../../models/chart.models";
import { chartMessages } from "../../internal/utils/chart-locale";
import { createChartHiddenItems } from "../../internal/utils/chart-hidden-items";

let nextFunnelSeriesId = 0;

interface StageIdentityInfo {
    category: unknown;
    dataIndex: number;
    datum: unknown;
    formattedCategory: string;
}

/**
 * Renders conversion pipeline and sales funnel visualizations using connected trapezoidal stages. Supports vertical and
 * horizontal layouts, custom stage colors, inscribed DOM labels, widening stages (>100% conversion), and dynamic stage
 * visibility toggling.
 */
@Component({
    selector: "mona-funnel-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class FunnelSeriesComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #hidden = createChartHiddenItems<string>(
        () => this.hiddenStageIds,
        () => this.#chartContext?.invalidate(ChartInvalidationReason.Visibility)
    );
    readonly #seriesId = `mona-funnel-series-${++nextFunnelSeriesId}`;
    readonly #stageIdentityMap = new Map<string, StageIdentityInfo>();
    #registered = false;
    /**
     * @description Property key or accessor extracting stage names.
     * @default "category"
     */
    public readonly categoryField = input<ChartField>("category");
    /**
     * @description Optional custom formatter for category names.
     * @default undefined
     */
    public readonly categoryFormatter = input<ChartValueFormatter | undefined>(undefined);
    /**
     * @description Uniform fill color for all funnel stages.
     * @default ""
     */
    public readonly color = input<string>("");
    /**
     * @description Property key extracting discrete colors per datum.
     * @default undefined
     */
    public readonly colorField = input<ChartField | undefined>(undefined);
    /**
     * @description Palette array of colors cycled across stages.
     * @default undefined
     */
    public readonly colors = input<readonly string[] | undefined>(undefined);
    /**
     * @description Array of stage data items overriding chart-level root data.
     * @default undefined
     */
    public readonly data = input<readonly unknown[] | undefined>(undefined);
    /**
     * @description Property key or accessor function extracting numeric values.
     * @default "value"
     */
    public readonly field = input<ChartField>("value");

    /**
     * @description Fill opacity applied to stage trapezoids (0 to 1).
     * @default undefined
     */
    public readonly fillOpacity = input<number | undefined>(undefined);

    /**
     * @description Spacing in pixels between consecutive funnel stages.
     * @default 2
     */
    public readonly gap = input<number>(2);

    /**
     * @description The hidden stage IDs. Bind `[(hiddenStageIds)]` for two-way binding; legend toggles write to it.
     * @default []
     */
    public readonly hiddenStageIds = model<readonly string[]>([]);

    /**
     * @description Unique identifier key field for datums.
     * @default undefined
     */
    public readonly keyField = input<ChartField | undefined>(undefined);

    /**
     * @description Content format for automatic stage labels.
     * @default "category-value"
     */
    public readonly labelContent = input<ChartFunnelLabelContent>("category-value");

    /**
     * @description Custom ng-template directive for stage label rendering.
     * @default undefined
     */
    public readonly labelTemplate = contentChild(ChartFunnelLabelTemplateDirective);

    /**
     * @description Maximum number of visible stage labels rendered simultaneously.
     * @default 100
     */
    public readonly maxLabels = input<number>(100);

    /**
     * @description Minimum stage height required in vertical orientation to render label.
     * @default undefined
     */
    public readonly minLabelHeight = input<number | undefined>(undefined);

    /**
     * @description Minimum stage width required in horizontal orientation to render label.
     * @default undefined
     */
    public readonly minLabelWidth = input<number | undefined>(undefined);

    /**
     * @description Descriptive series name displayed in chart legend and tooltips.
     * @default "Funnel"
     */
    public readonly name = input<string>("Funnel");

    /**
     * @description Layout orientation of the funnel ('vertical' or 'horizontal').
     * @default "vertical"
     */
    public readonly orientation = input<ChartFunnelOrientation>("vertical");

    /**
     * @description Controls whether built-in stage text labels are rendered.
     * @default true
     */
    public readonly showLabels = input<boolean>(true);
    /**
     * @description Emits when a stage's visibility is toggled via legend or API.
     */
    public readonly stageVisibilityChange = output<ChartFunnelStageVisibilityEvent>();
    /**
     * @description Stroke outline color for stage trapezoids.
     * @default ""
     */
    public readonly strokeColor = input<string>("");

    /**
     * @description Stroke width in pixels for stage trapezoids.
     * @default undefined
     */
    public readonly strokeWidth = input<number | undefined>(undefined);

    /**
     * @description CSS class name applied to the hidden series host element.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Custom formatter function for numeric values.
     * @default undefined
     */
    public readonly valueFormatter = input<ChartValueFormatter | undefined>(undefined);

    /**
     * @description Controls overall visibility of the funnel series.
     * @default true
     */
    public readonly visible = model<boolean>(true);

    /**
     * @description Maximum width ratio (0 to 1) for the funnel's widest stage relative to plot area.
     * @default 0.9
     */
    public readonly widthRatio = input<number>(0.9);

    public constructor() {
        effect(() => {
            const rawData = this.data() ?? this.#chartContext?.rootData() ?? [];
            const keyF = this.keyField();
            const fieldF = this.field();
            const catF = this.categoryField();
            const catFmt = this.categoryFormatter();

            const arr: readonly unknown[] = Array.isArray(rawData)
                ? rawData
                : rawData !== undefined && rawData !== null
                  ? [rawData]
                  : [];

            this.#stageIdentityMap.clear();
            const seenKeys = new Set<string>();

            for (let i = 0; i < arr.length; i++) {
                const datum = arr[i];
                const rawVal = resolveNumericValue(datum, fieldF, i);
                if (!FunnelIdentity.isValidFunnelValue(rawVal)) {
                    continue;
                }

                const identity = FunnelIdentity.resolveStageIdentity(datum, i, this.#seriesId, keyF, seenKeys);

                const rawCat = resolveValue(datum, catF, i);
                const formattedCategory = catFmt
                    ? catFmt(rawCat, i)
                    : rawCat !== undefined && rawCat !== null
                      ? String(rawCat)
                      : chartMessages().stageFallbackName(i + 1);

                this.#stageIdentityMap.set(identity.stageId, {
                    category: rawCat,
                    dataIndex: i,
                    datum,
                    formattedCategory
                });
            }

            if (this.#stageIdentityMap.size > 0) {
                this.#hidden.prune(id => this.#stageIdentityMap.has(id));
            }
        });

        effect(() => {
            this.visible();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Visibility);
            }
        });

        effect(() => {
            this.data();
            this.field();
            this.categoryField();
            this.keyField();
            this.categoryFormatter();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Data);
            }
        });

        effect(() => {
            this.gap();
            this.labelContent();
            this.maxLabels();
            this.minLabelHeight();
            this.minLabelWidth();
            this.name();
            this.orientation();
            this.showLabels();
            this.valueFormatter();
            this.widthRatio();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Layout);
            }
        });

        effect(() => {
            this.color();
            this.colorField();
            this.colors();
            this.fillOpacity();
            this.strokeColor();
            this.strokeWidth();
            this.userClass();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Style);
            }
        });
    }

    /** Whether the stage with this id is visible. */
    public isDatumVisible(stageId: string): boolean {
        return !this.#hidden.has(stageId);
    }

    public ngOnInit(): void {
        if (!this.#chartContext) {
            return;
        }

        const registration: ChartFunnelSeriesRegistration = {
            categoryField: this.categoryField,
            categoryFormatter: this.categoryFormatter,
            color: this.color,
            colorField: this.colorField,
            colors: this.colors,
            data: this.data,
            datumVisibilityRevision: this.#hidden.revision,
            element: this.#elementRef,
            field: this.field,
            fillOpacity: this.fillOpacity,
            gap: this.gap,
            id: this.#seriesId,
            isDatumVisible: (id: string) => this.isDatumVisible(id),
            keyField: this.keyField,
            labelContent: this.labelContent,
            labelTemplate: this.labelTemplate,
            maxLabels: this.maxLabels,
            minLabelHeight: this.minLabelHeight,
            minLabelWidth: this.minLabelWidth,
            name: this.name,
            orientation: this.orientation,
            showLabels: this.showLabels,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            toggleDatumVisibility: (id: string) => this.toggleDatumVisibility(id),
            type: "funnel",
            userClass: this.userClass,
            valueFormatter: this.valueFormatter,
            visible: this.visible,
            widthRatio: this.widthRatio
        };

        const unregister = this.#chartContext.registerSeries(registration);
        this.#registered = true;
        this.#destroyRef.onDestroy(() => {
            this.#registered = false;
            unregister();
        });
    }

    /** Shows every stage again. */
    public resetVisibility(): void {
        this.#hidden.reset();
        this.#chartContext?.invalidate(ChartInvalidationReason.Visibility);
    }

    /** Shows or hides the stage with this id. */
    public setDatumVisibility(stageId: string, visible: boolean): void {
        const currentlyVisible = this.isDatumVisible(stageId);
        if (currentlyVisible === visible) {
            return;
        }

        this.#hidden.setVisible(stageId, visible);

        const info = this.#stageIdentityMap.get(stageId);
        this.stageVisibilityChange.emit({
            category: info?.category,
            dataIndex: info?.dataIndex ?? -1,
            datum: info?.datum,
            formattedCategory: info?.formattedCategory ?? stageId,
            seriesId: this.#seriesId,
            seriesName: this.name(),
            seriesType: "funnel",
            stageId,
            visible
        });

        this.#chartContext?.invalidate(ChartInvalidationReason.Visibility);
    }

    /** Shows or hides the stage with this id, and returns whether it's now visible. */
    public toggleDatumVisibility(stageId: string): boolean {
        const next = !this.isDatumVisible(stageId);
        this.setDatumVisibility(stageId, next);
        return next;
    }
}
