import type { ChartAxisLabelRotation } from "../../models/chart-axis.models";
import type {} from "../scale/chart-scale";
import type { ResolvedCartesianAxisDescriptor } from "./cartesian-axis-registry-resolver";

export interface ChartRect {
    height: number;
    width: number;
    x: number;
    y: number;
}

export interface AxisLineGeometry {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
}

export interface AxisTickGeometry {
    coordinate: number;
    value: unknown;
    x1: number;
    x2: number;
    y1: number;
    y2: number;
}

export interface AxisLabelGeometry {
    coordinate: number;
    formattedValue: string;
    index: number;
    left: number;
    maxWidth?: number;
    rawText: string;
    top: number;
    transform: string;
    transformOrigin: string;
    value: unknown;
}

export interface AxisTitleGeometry {
    left: number;
    text: string;
    top: number;
    transform?: string;
}

export class CartesianAxisGeometry {
    public static computeBaseline(
        axis: ResolvedCartesianAxisDescriptor,
        plotRect: ChartRect,
        sideOffset: number
    ): AxisLineGeometry {
        switch (axis.position) {
            case "top": {
                const y = plotRect.y - sideOffset;
                return { x1: plotRect.x, y1: y, x2: plotRect.x + plotRect.width, y2: y };
            }
            case "bottom": {
                const y = plotRect.y + plotRect.height + sideOffset;
                return { x1: plotRect.x, y1: y, x2: plotRect.x + plotRect.width, y2: y };
            }
            case "left": {
                const x = plotRect.x - sideOffset;
                return { x1: x, y1: plotRect.y, x2: x, y2: plotRect.y + plotRect.height };
            }
            case "right": {
                const x = plotRect.x + plotRect.width + sideOffset;
                return { x1: x, y1: plotRect.y, x2: x, y2: plotRect.y + plotRect.height };
            }
        }
    }

    public static computeTickMarks(
        axis: ResolvedCartesianAxisDescriptor,
        ticks: readonly { value: unknown; coordinate: number }[],
        plotRect: ChartRect,
        sideOffset: number
    ): readonly AxisTickGeometry[] {
        if (!axis.tickMarks) {
            return [];
        }
        const tickSize = axis.tickSize ?? 6;
        const baseline = this.computeBaseline(axis, plotRect, sideOffset);

        return ticks.map(t => {
            switch (axis.position) {
                case "top":
                    return {
                        coordinate: t.coordinate,
                        value: t.value,
                        x1: t.coordinate,
                        y1: baseline.y1,
                        x2: t.coordinate,
                        y2: baseline.y1 - tickSize
                    };
                case "bottom":
                    return {
                        coordinate: t.coordinate,
                        value: t.value,
                        x1: t.coordinate,
                        y1: baseline.y1,
                        x2: t.coordinate,
                        y2: baseline.y1 + tickSize
                    };
                case "left":
                    return {
                        coordinate: t.coordinate,
                        value: t.value,
                        x1: baseline.x1,
                        y1: t.coordinate,
                        x2: baseline.x1 - tickSize,
                        y2: t.coordinate
                    };
                case "right":
                    return {
                        coordinate: t.coordinate,
                        value: t.value,
                        x1: baseline.x1,
                        y1: t.coordinate,
                        x2: baseline.x1 + tickSize,
                        y2: t.coordinate
                    };
            }
        });
    }

    public static computeLabelTransform(
        position: "bottom" | "left" | "right" | "top",
        rotation: ChartAxisLabelRotation
    ): string {
        const rot = typeof rotation === "number" ? rotation : 0;
        if (position === "bottom") {
            if (rot === 0) return "translateX(-50%)";
            return rot > 0 ? `rotate(${rot}deg)` : `translate(-100%, 0) rotate(${rot}deg)`;
        }
        if (position === "top") {
            if (rot === 0) return "translate(-50%, -100%)";
            return `translate(0, -100%) rotate(${rot}deg)`;
        }
        if (position === "right") {
            if (rot === 0) return "translate(0, -50%)";
            return `translate(0, -50%) rotate(${rot}deg)`;
        }
        // Left
        if (rot === 0) return "translate(-100%, -50%)";
        return `translate(-100%, -50%) rotate(${rot}deg)`;
    }

    public static computeLabelTransformOrigin(
        position: "bottom" | "left" | "right" | "top",
        rotation: ChartAxisLabelRotation
    ): string {
        const rot = typeof rotation === "number" ? rotation : 0;
        if (position === "bottom") {
            return rot > 0 ? "top left" : rot < 0 ? "top right" : "center center";
        }
        if (position === "top") {
            return rot > 0 ? "bottom left" : rot < 0 ? "bottom right" : "center center";
        }
        if (position === "right") {
            return rot === 0 ? "center center" : "left center";
        }
        // Left
        return rot === 0 ? "center center" : "right center";
    }

    public static computeLabelLeft(
        axis: ResolvedCartesianAxisDescriptor,
        coordinate: number,
        plotRect: ChartRect,
        sideOffset: number
    ): number {
        if (axis.dimension === "x") {
            return coordinate;
        }
        const tickMarksOffset = axis.tickMarks ? (axis.tickSize ?? 6) : 0;
        const labelPadding = axis.labelPadding ?? 4;
        return axis.position === "right"
            ? plotRect.x + plotRect.width + sideOffset + tickMarksOffset + labelPadding
            : plotRect.x - sideOffset - tickMarksOffset - labelPadding;
    }

    public static computeLabelTop(
        axis: ResolvedCartesianAxisDescriptor,
        coordinate: number,
        plotRect: ChartRect,
        sideOffset: number
    ): number {
        if (axis.dimension === "y") {
            return coordinate;
        }
        const tickMarksOffset = axis.tickMarks ? (axis.tickSize ?? 6) : 0;
        const labelPadding = axis.labelPadding ?? 4;
        return axis.position === "top"
            ? plotRect.y - sideOffset - tickMarksOffset - labelPadding
            : plotRect.y + plotRect.height + sideOffset + tickMarksOffset + labelPadding;
    }

    public static computeTitleLeft(
        axis: ResolvedCartesianAxisDescriptor,
        plotRect: ChartRect,
        sideOffset: number,
        gutter: number
    ): number {
        if (axis.dimension === "x") {
            return plotRect.x + plotRect.width / 2;
        }
        return axis.position === "right"
            ? plotRect.x + plotRect.width + sideOffset + gutter - 14
            : plotRect.x - sideOffset - gutter + 14;
    }

    public static computeTitleTop(
        axis: ResolvedCartesianAxisDescriptor,
        plotRect: ChartRect,
        sideOffset: number,
        gutter: number
    ): number {
        if (axis.dimension === "y") {
            return plotRect.y + plotRect.height / 2;
        }
        return axis.position === "top"
            ? plotRect.y - sideOffset - gutter + 6
            : plotRect.y + plotRect.height + sideOffset + gutter - 6;
    }
}
