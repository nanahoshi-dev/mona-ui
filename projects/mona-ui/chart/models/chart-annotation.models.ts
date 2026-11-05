import type { ChartPoint, ChartRect } from "./chart.models";

export type ChartAnnotationAxisValue = Date | number | string;

export type ChartOverlayLayer = "overlay" | "underlay";

export type ChartReferenceLineStyle = "dashed" | "dotted" | "solid";

export type ChartReferenceLabelPosition = "center" | "end" | "start";

export type ChartAnnotationMarker = "circle" | "diamond" | "none";

export type ChartAnnotationLabelPlacement = "bottom" | "left" | "right" | "top";

export interface ChartReferenceLineLabelContext<T extends ChartAnnotationAxisValue = ChartAnnotationAxisValue> {
    readonly $implicit: T;
    readonly axis: "x" | "y";
    readonly axisId: string;
    readonly bounds?: undefined;
    readonly coordinate: number;
    readonly formattedFrom?: undefined;
    readonly formattedTo?: undefined;
    readonly formattedValue: string;
    readonly from?: undefined;
    readonly kind: "line";
    readonly to?: undefined;
    readonly value: T;
}

export interface ChartReferenceBandLabelContext<
    TFrom extends ChartAnnotationAxisValue = ChartAnnotationAxisValue,
    TTo extends ChartAnnotationAxisValue = ChartAnnotationAxisValue
> {
    readonly $implicit: { readonly from: TFrom; readonly to: TTo };
    readonly axis: "x" | "y";
    readonly axisId: string;
    readonly bounds: ChartRect;
    readonly coordinate?: undefined;
    readonly formattedFrom: string;
    readonly formattedTo: string;
    readonly formattedValue?: undefined;
    readonly from: TFrom;
    readonly kind: "band";
    readonly to: TTo;
    readonly value?: undefined;
}

export type ChartReferenceLabelTemplateContext = ChartReferenceLineLabelContext | ChartReferenceBandLabelContext;

export interface ChartAnnotationLabelTemplateContext<TData = unknown> {
    readonly $implicit: TData;
    readonly data: TData;
    readonly formattedX: string;
    readonly formattedY: string;
    readonly point: ChartPoint;
    readonly x: ChartAnnotationAxisValue;
    readonly xAxisId: string;
    readonly y: ChartAnnotationAxisValue;
    readonly yAxisId: string;
}
