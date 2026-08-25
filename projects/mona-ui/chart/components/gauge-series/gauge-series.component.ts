import { Component, contentChild, DestroyRef, effect, ElementRef, inject, input, model, OnInit } from "@angular/core";
import { ChartGaugeCenterTemplateDirective } from "../../directives/chart-gauge-center-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartGaugeSeriesRegistration
} from "../../internal/context/chart-registration-context";
import type { ChartField } from "../../models/chart.models";
import type { ChartGaugeIndicator, ChartRadialArcFillMode } from "../../models/chart-radial-arc.models";
import type { ChartValueFormatter } from "../../models/chart-polar.models";

let nextGaugeSeriesId = 0;

@Component({
    selector: "mona-gauge-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class GaugeSeriesComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #seriesId = `mona-gauge-series-${++nextGaugeSeriesId}`;
    #registered = false;
    protected readonly centerTemplate = contentChild(ChartGaugeCenterTemplateDirective);
    /**
     * @description Primary color of the gauge value arc.
     * @default ""
     */
    public readonly color = input<string>("");
    /**
     * @description Corner radius in pixels applied to gauge arc endpoints.
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
     * @default 120
     */
    public readonly endAngle = input<number>(120);
    /**
     * @description Property key or accessor extracting the numeric gauge value when direct value is not set.
     * @default "value"
     */
    public readonly field = input<ChartField>("value");
    /**
     * @description Fill style applied to gauge value arc ("solid" or radial "gradient").
     * @default "solid"
     */
    public readonly fillMode = input<ChartRadialArcFillMode>("solid");
    /**
     * @description Opacity of gauge value arc fill (between 0 and 1).
     * @default undefined
     */
    public readonly fillOpacity = input<number | undefined>(undefined);
    /**
     * @description Radius in pixels of the needle center hub circle.
     * @default 5
     */
    public readonly hubRadius = input<number>(5);
    /**
     * @description Indicator mode: "arc" (progress arc), "needle" (pointer needle), or "both".
     * @default "arc"
     */
    public readonly indicator = input<ChartGaugeIndicator>("arc");
    /**
     * @description Inner radius ratio relative to outer radius (0 to 1).
     * @default 0.72
     */
    public readonly innerRadiusRatio = input<number>(0.72);
    /**
     * @description Property key or accessor extracting a stable datum identity across updates.
     * @default undefined
     */
    public readonly keyField = input<ChartField | undefined>(undefined);
    /**
     * @description Maximum domain value.
     * @default 100
     */
    public readonly max = input<number>(100);
    /**
     * @description Minimum domain value.
     * @default 0
     */
    public readonly min = input<number>(0);
    /**
     * @description Series name used in tooltips and accessibility announcements.
     * @default "Gauge"
     */
    public readonly name = input<string>("Gauge");
    /**
     * @description Color of the needle and center hub.
     * @default ""
     */
    public readonly needleColor = input<string>("");
    /**
     * @description Length of the needle pointer as a fraction of outer radius (0.1 to 1).
     * @default 0.78
     */
    public readonly needleLengthRatio = input<number>(0.78);
    /**
     * @description Stroke width in pixels for the needle pointer.
     * @default 2
     */
    public readonly needleWidth = input<number>(2);
    /**
     * @description Outer radius ratio relative to available plot bounds (0.1 to 1).
     * @default 0.9
     */
    public readonly outerRadiusRatio = input<number>(0.9);
    /**
     * @description Whether to display the formatted value in the center of the gauge.
     * @default true
     */
    public readonly showValue = input<boolean>(true);
    /**
     * @description Starting angle in degrees (0 is 12 o'clock, clockwise).
     * @default -120
     */
    public readonly startAngle = input<number>(-120);
    /**
     * @description Color of background track arc.
     * @default ""
     */
    public readonly trackColor = input<string>("");
    /**
     * @description Opacity of background track arc.
     * @default undefined
     */
    public readonly trackOpacity = input<number | undefined>(undefined);
    /**
     * @description Additional CSS classes applied to the series.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });
    /**
     * @description Direct scalar value for the gauge. When defined, takes precedence over data/field.
     * @default undefined
     */
    public readonly value = input<number | undefined>(undefined);
    /**
     * @description Formatter callback for gauge numeric values.
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
            this.value();
            this.data();
            this.field();
            this.keyField();

            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Data);
            }
        });

        effect(() => {
            this.name();
            this.min();
            this.max();
            this.startAngle();
            this.endAngle();
            this.innerRadiusRatio();
            this.outerRadiusRatio();
            this.cornerRadius();
            this.indicator();
            this.needleWidth();
            this.needleLengthRatio();
            this.hubRadius();
            this.showValue();
            this.valueFormatter();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Layout);
            }
        });

        effect(() => {
            this.color();
            this.fillMode();
            this.fillOpacity();
            this.trackColor();
            this.trackOpacity();
            this.needleColor();
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

        const registration: ChartGaugeSeriesRegistration = {
            centerTemplate: this.centerTemplate,
            color: this.color,
            cornerRadius: this.cornerRadius,
            data: this.data,
            element: this.#elementRef,
            endAngle: this.endAngle,
            field: this.field,
            fillMode: this.fillMode,
            fillOpacity: this.fillOpacity,
            hubRadius: this.hubRadius,
            id: this.#seriesId,
            indicator: this.indicator,
            innerRadiusRatio: this.innerRadiusRatio,
            keyField: this.keyField,
            max: this.max,
            min: this.min,
            name: this.name,
            needleColor: this.needleColor,
            needleLengthRatio: this.needleLengthRatio,
            needleWidth: this.needleWidth,
            outerRadiusRatio: this.outerRadiusRatio,
            showValue: this.showValue,
            startAngle: this.startAngle,
            trackColor: this.trackColor,
            trackOpacity: this.trackOpacity,
            type: "gauge",
            userClass: this.userClass,
            value: this.value,
            valueFormatter: this.valueFormatter,
            visible: this.visible
        };

        const unregister = this.#chartContext.registerSeries(registration);
        this.#destroyRef.onDestroy(unregister);
    }
}
