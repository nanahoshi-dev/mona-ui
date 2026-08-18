import {
    Component,
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
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartRadialBarSeriesRegistration
} from "../../internal/context/chart-registration-context";
import { resolveData, resolveValue } from "../../internal/data/chart-value-resolver";
import type { ChartField } from "../../models/chart.models";
import type {
    ChartRadialArcFillMode,
    ChartRadialDatumVisibilityEvent
} from "../../models/chart-radial-arc.models";
import type { ChartValueFormatter } from "../../models/chart-polar.models";

let nextRadialBarSeriesId = 0;

@Component({
    selector: "mona-radial-bar-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class MonaRadialBarSeriesComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #hiddenItemIds = signal<ImmutableSet<string>>(ImmutableSet.create());
    readonly #seriesId = `mona-radial-bar-series-${++nextRadialBarSeriesId}`;
    readonly #visibilityRevision = signal<number>(0);

    /**
     * @description Spacing in pixels between concentric radial rings.
     * @default 4
     */
    public readonly barGap = input<number>(4);

    /**
     * @description Explicit radial thickness in pixels for each bar ring.
     * @default undefined
     */
    public readonly barThickness = input<number | undefined>(undefined);

    /**
     * @description Property key or accessor extracting the category label for each radial ring.
     * @default "category"
     */
    public readonly categoryField = input<ChartField>("category");

    /**
     * @description Formatter callback for ring category labels.
     * @default undefined
     */
    public readonly categoryFormatter = input<ChartValueFormatter | undefined>(undefined);

    /**
     * @description Accessor function or property key extracting an explicit color for each radial ring.
     * @default undefined
     */
    public readonly colorField = input<ChartField | undefined>(undefined);

    /**
     * @description Explicit array of colors used to fill successive radial rings.
     * @default undefined
     */
    public readonly colors = input<readonly string[] | undefined>(undefined);

    /**
     * @description Corner radius in pixels applied to arc endpoints.
     * @default undefined
     */
    public readonly cornerRadius = input<number | undefined>(undefined);

    /**
     * @description Series-specific dataset overriding root chart data.
     * @default undefined
     */
    public readonly data = input<readonly unknown[] | undefined>(undefined);

    /**
     * @description Ending angle in degrees (clockwise from 12 o'clock).
     * @default 360
     */
    public readonly endAngle = input<number>(360);

    /**
     * @description Property key or accessor extracting the numeric value for each radial ring.
     * @default "value"
     */
    public readonly field = input<ChartField>("value");

    /**
     * @description Fill style applied to radial rings ("solid" or radial "gradient").
     * @default "solid"
     */
    public readonly fillMode = input<ChartRadialArcFillMode>("solid");

    /**
     * @description Opacity of bar fills (between 0 and 1).
     * @default undefined
     */
    public readonly fillOpacity = input<number | undefined>(undefined);

    /**
     * @description Inner radius ratio relative to available plot bounds (0 to 1).
     * @default 0.2
     */
    public readonly innerRadiusRatio = input<number>(0.2);

    /**
     * @description Property key or accessor extracting a stable datum identity across updates.
     * @default undefined
     */
    public readonly keyField = input<ChartField | undefined>(undefined);

    /**
     * @description Explicit maximum value for the radial bar progress scale.
     * @default undefined
     */
    public readonly max = input<number | undefined>(undefined);

    /**
     * @description Explicit minimum value for the radial bar progress scale.
     * @default undefined
     */
    public readonly min = input<number | undefined>(undefined);

    /**
     * @description Series name used in tooltips and accessibility announcements.
     * @default "Radial Bar"
     */
    public readonly name = input<string>("Radial Bar");

    /**
     * @description Outer radius ratio relative to available plot bounds (0.1 to 1).
     * @default 0.9
     */
    public readonly outerRadiusRatio = input<number>(0.9);

    /**
     * @description Whether to display background circular track rings.
     * @default true
     */
    public readonly showTrack = input<boolean>(true);

    /**
     * @description Starting angle in degrees (0 is 12 o'clock, clockwise).
     * @default 0
     */
    public readonly startAngle = input<number>(0);

    /**
     * @description Color of bar stroke boundary.
     * @default ""
     */
    public readonly strokeColor = input<string>("");

    /**
     * @description Stroke width in pixels for bar boundaries.
     * @default undefined
     */
    public readonly strokeWidth = input<number | undefined>(undefined);

    /**
     * @description Color of background track rings.
     * @default ""
     */
    public readonly trackColor = input<string>("");

    /**
     * @description Opacity of background track rings.
     * @default undefined
     */
    public readonly trackOpacity = input<number | undefined>(undefined);

    /**
     * @description Additional CSS classes applied to the series.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Formatter callback for bar numeric values.
     * @default undefined
     */
    public readonly valueFormatter = input<ChartValueFormatter | undefined>(undefined);

    /**
     * @description Two-way bindable visibility of the series.
     * @default true
     */
    public readonly visible = model<boolean>(true);

    /**
     * @description Emits when an individual ring's visibility is toggled via the legend.
     */
    public readonly datumVisibilityChange = output<ChartRadialDatumVisibilityEvent>();

    #registered = false;

    public constructor() {
        effect(() => {
            this.visible();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Visibility);
            }
        });

        effect(() => {
            this.name();
            this.data();
            this.field();
            this.categoryField();
            this.keyField();
            this.colorField();

            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Data);
            }
        });

        effect(() => {
            this.min();
            this.max();
            this.startAngle();
            this.endAngle();
            this.innerRadiusRatio();
            this.outerRadiusRatio();
            this.barThickness();
            this.barGap();
            this.cornerRadius();
            this.showTrack();
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
            this.trackColor();
            this.trackOpacity();
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

        const registration: ChartRadialBarSeriesRegistration = {
            barGap: this.barGap,
            barThickness: this.barThickness,
            categoryField: this.categoryField,
            categoryFormatter: this.categoryFormatter,
            colorField: this.colorField,
            colors: this.colors,
            cornerRadius: this.cornerRadius,
            data: this.data,
            datumVisibilityRevision: this.#visibilityRevision.asReadonly(),
            element: this.#elementRef,
            endAngle: this.endAngle,
            field: this.field,
            fillMode: this.fillMode,
            fillOpacity: this.fillOpacity,
            id: this.#seriesId,
            innerRadiusRatio: this.innerRadiusRatio,
            isDatumVisible: (itemId: string) => !this.#hiddenItemIds().contains(itemId),
            keyField: this.keyField,
            max: this.max,
            min: this.min,
            name: this.name,
            outerRadiusRatio: this.outerRadiusRatio,
            showTrack: this.showTrack,
            startAngle: this.startAngle,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            toggleDatumVisibility: (itemId: string) => this.toggleDatum(itemId),
            trackColor: this.trackColor,
            trackOpacity: this.trackOpacity,
            type: "radialBar",
            userClass: this.userClass,
            valueFormatter: this.valueFormatter,
            visible: this.visible
        };

        const unregister = this.#chartContext.registerSeries(registration);
        this.#destroyRef.onDestroy(unregister);
    }

    public toggleDatum(itemId: string): boolean {
        let isNowVisible = false;
        this.#hiddenItemIds.update(set => {
            if (set.contains(itemId)) {
                isNowVisible = true;
                return set.remove(itemId);
            }
            isNowVisible = false;
            return set.add(itemId);
        });

        this.#visibilityRevision.update(v => v + 1);

        const raw = resolveData(this.data(), this.#chartContext?.rootData() ?? []);
        let matchedDatum: unknown;
        let matchedDataIndex = -1;
        let matchedCategory: unknown;

        for (let i = 0; i < raw.length; i++) {
            const datum = raw[i];
            const rawCat = resolveValue(datum, this.categoryField(), i);
            const rawKey = this.keyField() ? resolveValue(datum, this.keyField(), i) : undefined;
            const keyStr = rawKey !== undefined && rawKey !== null ? String(rawKey) : rawCat !== undefined && rawCat !== null ? String(rawCat) : String(i);
            if (keyStr === itemId || `${this.#seriesId}:rb:${keyStr}` === itemId || itemId.endsWith(`:${keyStr}`)) {
                matchedDatum = datum;
                matchedDataIndex = i;
                matchedCategory = rawCat ?? `Item ${i + 1}`;
                break;
            }
        }

        this.datumVisibilityChange.emit({
            category: matchedCategory,
            dataIndex: matchedDataIndex,
            datum: matchedDatum,
            itemId,
            seriesId: this.#seriesId,
            seriesName: this.name(),
            seriesType: "radialBar",
            visible: isNowVisible
        });

        this.#chartContext?.invalidate(ChartInvalidationReason.Visibility);
        return isNowVisible;
    }
}
