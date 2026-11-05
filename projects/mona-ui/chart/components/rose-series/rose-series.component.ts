import { Component, DestroyRef, effect, ElementRef, inject, input, model, OnInit, output } from "@angular/core";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartRoseSeriesRegistration
} from "../../internal/context/chart-registration-context";
import { resolveData } from "../../internal/data/chart-value-resolver";
import { extractRetainedRoseIdentities } from "../../internal/data/radial-datum-identity";
import type { ChartField } from "../../models/chart.models";
import type {
    ChartRadialArcFillMode,
    ChartRadialDatumVisibilityEvent,
    ChartRoseScaleMode
} from "../../models/chart-radial-arc.models";
import type { ChartValueFormatter } from "../../models/chart-polar.models";
import { createChartHiddenItems } from "../../internal/utils/chart-hidden-items";

let nextRoseSeriesId = 0;

@Component({
    selector: "mona-rose-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class RoseSeriesComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #hidden = createChartHiddenItems<string>(
        () => this.hiddenItemIds,
        () => this.#chartContext?.invalidate(ChartInvalidationReason.Visibility)
    );
    readonly #identityMap = new Map<string, { category: unknown; dataIndex: number; datum: unknown }>();
    readonly #seriesId = `mona-rose-series-${++nextRoseSeriesId}`;
    #registered = false;

    /**
     * @description Property key or accessor extracting the category label for each rose petal.
     * @default "category"
     */
    public readonly categoryField = input<ChartField>("category");

    /**
     * @description Formatter callback for category labels.
     * @default undefined
     */
    public readonly categoryFormatter = input<ChartValueFormatter | undefined>(undefined);

    /**
     * @description Accessor function or property key extracting an explicit color for each petal.
     * @default undefined
     */
    public readonly colorField = input<ChartField | undefined>(undefined);

    /**
     * @description Explicit array of colors used to fill successive rose petals.
     * @default undefined
     */
    public readonly colors = input<readonly string[] | undefined>(undefined);

    /**
     * @description Corner radius in pixels applied to outer petal corners.
     * @default undefined
     */
    public readonly cornerRadius = input<number | undefined>(undefined);

    /**
     * @description Series-specific dataset overriding root chart data.
     * @default undefined
     */
    public readonly data = input<readonly unknown[] | undefined>(undefined);
    /**
     * @description Emits when an individual petal's visibility is toggled via the legend.
     */
    public readonly datumVisibilityChange = output<ChartRadialDatumVisibilityEvent>();
    /**
     * @description Ending angle in degrees (clockwise from 12 o'clock).
     * @default 360
     */
    public readonly endAngle = input<number>(360);

    /**
     * @description Property key or accessor extracting the numeric petal value.
     * @default "value"
     */
    public readonly field = input<ChartField>("value");

    /**
     * @description Fill style applied to rose petals ("solid" or radial "gradient").
     * @default "solid"
     */
    public readonly fillMode = input<ChartRadialArcFillMode>("solid");

    /**
     * @description Opacity of petal fills (between 0 and 1).
     * @default undefined
     */
    public readonly fillOpacity = input<number | undefined>(undefined);

    /**
     * @description The hidden item IDs. Bind `[(hiddenItemIds)]` for two-way binding; legend toggles write to it.
     * @default []
     */
    public readonly hiddenItemIds = model<readonly string[]>([]);

    /**
     * @description Inner radius ratio relative to available plot bounds (0 to 1).
     * @default 0
     */
    public readonly innerRadiusRatio = input<number>(0);

    /**
     * @description Property key or accessor extracting a stable datum identity across updates.
     * @default undefined
     */
    public readonly keyField = input<ChartField | undefined>(undefined);

    /**
     * @description Series name used in tooltips and accessibility announcements.
     * @default "Rose"
     */
    public readonly name = input<string>("Rose");

    /**
     * @description Outer radius ratio relative to available plot bounds (0.1 to 1).
     * @default 0.9
     */
    public readonly outerRadiusRatio = input<number>(0.9);

    /**
     * @description Angular padding in degrees between adjacent rose petals.
     * @default 2
     */
    public readonly padAngle = input<number>(2);

    /**
     * @description Scale mode for petal radius: "area" (annular area proportional to value) or "radius" (linear radial distance).
     * @default "area"
     */
    public readonly scaleMode = input<ChartRoseScaleMode>("area");

    /**
     * @description Starting angle in degrees (0 is 12 o'clock, clockwise).
     * @default 0
     */
    public readonly startAngle = input<number>(0);

    /**
     * @description Color of petal separator strokes.
     * @default ""
     */
    public readonly strokeColor = input<string>("");

    /**
     * @description Stroke width in pixels for petal boundaries.
     * @default undefined
     */
    public readonly strokeWidth = input<number | undefined>(undefined);

    /**
     * @description Additional CSS classes applied to the series.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Formatter callback for petal numeric values.
     * @default undefined
     */
    public readonly valueFormatter = input<ChartValueFormatter | undefined>(undefined);

    /**
     * @description Two-way bindable visibility of the series.
     * @default true
     */
    public readonly visible = model<boolean>(true);

    public constructor() {
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
            this.colorField();

            // Prune hidden item IDs and maintain canonical identity map
            const raw = resolveData(this.data(), this.#chartContext?.rootData() ?? []);
            const identities = extractRetainedRoseIdentities(raw, this.categoryField(), this.field(), this.keyField());
            const retainedIdSet = new Set(identities.map(id => id.itemId));

            this.#identityMap.clear();
            for (const ident of identities) {
                this.#identityMap.set(ident.itemId, {
                    category: ident.category,
                    dataIndex: ident.dataIndex,
                    datum: ident.datum
                });
            }

            if (retainedIdSet.size > 0) {
                this.#hidden.prune(id => retainedIdSet.has(id));
            }

            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Data);
            }
        });

        effect(() => {
            this.name();
            this.scaleMode();
            this.startAngle();
            this.endAngle();
            this.innerRadiusRatio();
            this.outerRadiusRatio();
            this.padAngle();
            this.cornerRadius();
            this.categoryFormatter();
            this.valueFormatter();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Layout);
            }
        });

        effect(() => {
            this.colors();
            this.fillMode();
            this.fillOpacity();
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

        const registration: ChartRoseSeriesRegistration = {
            categoryField: this.categoryField,
            categoryFormatter: this.categoryFormatter,
            colorField: this.colorField,
            colors: this.colors,
            cornerRadius: this.cornerRadius,
            data: this.data,
            datumVisibilityRevision: this.#hidden.revision,
            element: this.#elementRef,
            endAngle: this.endAngle,
            field: this.field,
            fillMode: this.fillMode,
            fillOpacity: this.fillOpacity,
            id: this.#seriesId,
            innerRadiusRatio: this.innerRadiusRatio,
            isDatumVisible: (itemId: string) => !this.#hidden.has(itemId),
            keyField: this.keyField,
            name: this.name,
            outerRadiusRatio: this.outerRadiusRatio,
            padAngle: this.padAngle,
            scaleMode: this.scaleMode,
            startAngle: this.startAngle,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            toggleDatumVisibility: (itemId: string) => this.toggleDatum(itemId),
            type: "rose",
            userClass: this.userClass,
            valueFormatter: this.valueFormatter,
            visible: this.visible
        };

        const unregister = this.#chartContext.registerSeries(registration);
        this.#destroyRef.onDestroy(unregister);
    }

    public toggleDatum(itemId: string): boolean {
        const isNowVisible = this.#hidden.toggle(itemId);

        const match = this.#identityMap.get(itemId);
        const matchedCategory = match?.category ?? "Item";
        const matchedDataIndex = match?.dataIndex ?? -1;
        const matchedDatum = match?.datum;

        this.datumVisibilityChange.emit({
            category: matchedCategory,
            dataIndex: matchedDataIndex,
            datum: matchedDatum,
            itemId,
            seriesId: this.#seriesId,
            seriesName: this.name(),
            seriesType: "rose",
            visible: isNowVisible
        });

        this.#chartContext?.invalidate(ChartInvalidationReason.Visibility);
        return isNowVisible;
    }
}
