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
import { ChartSliceLabelTemplateDirective } from "../../directives/chart-slice-label-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartPieSeriesRegistration
} from "../../internal/context/chart-registration-context";
import { resolveData, resolveValue } from "../../internal/data/chart-value-resolver";
import type {
    ChartPolarFillMode,
    ChartPolarLabelContent,
    ChartPolarLabelPosition,
    ChartSliceVisibilityEvent,
    ChartValueFormatter
} from "../../models/chart-polar.models";
import type { ChartField } from "../../models/chart.models";

let nextPieSeriesId = 0;

@Component({
    selector: "mona-pie-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class PieSeriesComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #hiddenIndices = signal<ImmutableSet<number>>(ImmutableSet.create());
    readonly #seriesId = `mona-pie-series-${++nextPieSeriesId}`;
    readonly #visibilityRevision = signal<number>(0);

    protected readonly sliceLabelTemplate = contentChild(ChartSliceLabelTemplateDirective);

    /**
     * @description Property key or accessor extracting the category label for each slice.
     * @default "category"
     */
    public readonly categoryField = input<ChartField>("category");

    /**
     * @description Formatter callback for slice category labels.
     * @default undefined
     */
    public readonly categoryFormatter = input<ChartValueFormatter | undefined>(undefined);

    /**
     * @description Accessor function or property key extracting an explicit color for each slice.
     * @default undefined
     */
    public readonly colorField = input<ChartField | undefined>(undefined);

    /**
     * @description Explicit array of colors used to fill successive slices.
     * @default undefined
     */
    public readonly colors = input<readonly string[] | undefined>(undefined);

    /**
     * @description Corner radius in pixels applied to slice arc boundaries.
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
     * @description Property key or accessor extracting the numeric slice value.
     * @default "value"
     */
    public readonly field = input<ChartField>("value");

    /**
     * @description Fill style applied to slices ("solid" or radial "gradient" from center to arc).
     * @default "solid"
     */
    public readonly fillMode = input<ChartPolarFillMode>("solid");

    /**
     * @description Opacity of slice fills (between 0 and 1).
     * @default undefined
     */
    public readonly fillOpacity = input<number | undefined>(undefined);

    /**
     * @description Property key or accessor extracting a stable datum identity across updates.
     * @default undefined
     */
    public readonly keyField = input<ChartField | undefined>(undefined);

    /**
     * @description Content to display in default slice data labels.
     * @default "percentage"
     */
    public readonly labelContent = input<ChartPolarLabelContent>("percentage");

    /**
     * @description Placement position for slice data labels ("outside" with leader lines or "inside" slice bounds).
     * @default "outside"
     */
    public readonly labelPosition = input<ChartPolarLabelPosition>("outside");

    /**
     * @description Minimum slice arc angle in degrees required to render an inside data label.
     * @default 12
     */
    public readonly minLabelAngle = input<number>(12);

    /**
     * @description Series name used in tooltips and accessibility announcements.
     * @default "Pie"
     */
    public readonly name = input<string>("Pie");

    /**
     * @description Outer radius ratio relative to available plot bounds (0.1 to 1).
     * @default 0.9
     */
    public readonly outerRadiusRatio = input<number>(0.9);

    /**
     * @description Angular padding in degrees between adjacent slices.
     * @default 0
     */
    public readonly padAngle = input<number>(0);

    /**
     * @description Whether to display inside slice data labels.
     * @default false
     */
    public readonly showLabels = input<boolean>(false);

    /**
     * @description Emits when an individual slice's visibility is toggled via the legend.
     */
    public readonly sliceVisibilityChange = output<ChartSliceVisibilityEvent>();

    /**
     * @description Starting angle in degrees (0 is 12 o'clock, clockwise).
     * @default 0
     */
    public readonly startAngle = input<number>(0);

    /**
     * @description Color of slice separator strokes.
     * @default ""
     */
    public readonly strokeColor = input<string>("");

    /**
     * @description Stroke width in pixels for slice separators.
     * @default undefined
     */
    public readonly strokeWidth = input<number | undefined>(undefined);

    /**
     * @description Additional CSS classes applied to the series.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Formatter callback for slice numeric values.
     * @default undefined
     */
    public readonly valueFormatter = input<ChartValueFormatter | undefined>(undefined);

    /**
     * @description Two-way bindable visibility of the series.
     * @default true
     */
    public readonly visible = model<boolean>(true);

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
            this.categoryFormatter();
            this.valueFormatter();
            this.colors();
            this.colorField();
            this.keyField();

            // Prune hidden indices that no longer exist
            const raw = resolveData(this.data(), this.#chartContext?.rootData() ?? []);
            const maxLen = raw.length;
            this.#hiddenIndices.update(set => set.where((idx: number) => idx < maxLen).toImmutableSet());

            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Data);
            }
        });

        effect(() => {
            this.outerRadiusRatio();
            this.startAngle();
            this.endAngle();
            this.padAngle();
            this.cornerRadius();
            this.showLabels();
            this.labelContent();
            this.labelPosition();
            this.minLabelAngle();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Layout);
            }
        });

        effect(() => {
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

        const registration: ChartPieSeriesRegistration = {
            categoryField: this.categoryField,
            categoryFormatter: this.categoryFormatter,
            colorField: this.colorField,
            colors: this.colors,
            cornerRadius: this.cornerRadius,
            data: this.data,
            element: this.#elementRef,
            endAngle: this.endAngle,
            field: this.field,
            fillMode: this.fillMode,
            fillOpacity: this.fillOpacity,
            id: this.#seriesId,
            isSliceVisible: (idx: number) => !this.#hiddenIndices().contains(idx),
            keyField: this.keyField,
            labelContent: this.labelContent,
            labelPosition: this.labelPosition,
            minLabelAngle: this.minLabelAngle,
            name: this.name,
            outerRadiusRatio: this.outerRadiusRatio,
            padAngle: this.padAngle,
            showLabels: this.showLabels,
            sliceLabelTemplate: this.sliceLabelTemplate,
            startAngle: this.startAngle,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            toggleSliceVisibility: (idx: number) => this.toggleSlice(idx),
            type: "pie",
            userClass: this.userClass,
            valueFormatter: this.valueFormatter,
            visibilityRevision: this.#visibilityRevision.asReadonly(),
            visible: this.visible
        };

        const unregister = this.#chartContext.registerSeries(registration);
        this.#destroyRef.onDestroy(unregister);
    }

    public toggleSlice(dataIndex: number): boolean {
        let isNowVisible = false;
        this.#hiddenIndices.update(set => {
            if (set.contains(dataIndex)) {
                isNowVisible = true;
                return set.remove(dataIndex);
            }
            isNowVisible = false;
            return set.add(dataIndex);
        });

        this.#visibilityRevision.update(v => v + 1);

        const raw = resolveData(this.data(), this.#chartContext?.rootData() ?? []);
        const datum = raw[dataIndex];
        const category = datum
            ? (resolveValue(datum, this.categoryField(), dataIndex) ?? `Item ${dataIndex + 1}`)
            : undefined;

        this.sliceVisibilityChange.emit({
            category,
            dataIndex,
            datum,
            seriesId: this.#seriesId,
            seriesName: this.name(),
            seriesType: "pie",
            visible: isNowVisible
        });

        this.#chartContext?.invalidate(ChartInvalidationReason.Visibility);
        return isNowVisible;
    }
}
