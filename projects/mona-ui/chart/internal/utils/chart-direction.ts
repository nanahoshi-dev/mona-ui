import type { MonaTextDirection } from "@nanahoshi/mona-ui/i18n";
import type { ChartHeaderAlignment, ChartYAxisPosition, ChartYAxisSide } from "../../models/chart-axis.models";
import type { ChartLegendPosition } from "../../models/chart-series.models";
import { chartDirection } from "./chart-locale";

/** A legend's place in the layout: `start` comes before the plot in the inline direction, `end` after it. */
export type ChartLegendPlacement = "bottom" | "end" | "start" | "top";

/** The physical side of a Y axis in the current layout's direction. An axis with no position goes on the start side. */
export function resolveYAxisSide(position: ChartYAxisPosition | undefined = "start"): ChartYAxisSide {
    if (position === "left" || position === "right") {
        return position;
    }
    return (position === "start") === (chartDirection() === "ltr") ? "left" : "right";
}

/** A legend's place in a flex row that follows the direction, so `left` and `right` stay on their physical side. */
export function resolveLegendPlacement(
    position: ChartLegendPosition,
    direction: MonaTextDirection
): ChartLegendPlacement {
    if (position === "left") {
        return direction === "ltr" ? "start" : "end";
    }
    if (position === "right") {
        return direction === "ltr" ? "end" : "start";
    }
    return position;
}

/** The logical alignment of the header, whose `left` and `right` stay on their physical side. */
export function resolveHeaderAlignment(
    alignment: ChartHeaderAlignment,
    direction: MonaTextDirection
): "center" | "end" | "start" {
    if (alignment === "left") {
        return direction === "ltr" ? "start" : "end";
    }
    if (alignment === "right") {
        return direction === "ltr" ? "end" : "start";
    }
    return alignment;
}
