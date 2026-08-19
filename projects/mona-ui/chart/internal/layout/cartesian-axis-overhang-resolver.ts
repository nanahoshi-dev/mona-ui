import type { ChartLabelMeasurement } from "../../models/chart-polar.models";
import type { ResolvedCartesianAxisDescriptor } from "./cartesian-axis-registry-resolver";

export interface CartesianAxisOverhang {
    bottom: number;
    left: number;
    right: number;
    top: number;
}

export class CartesianAxisOverhangResolver {
    public static computeOverhang(
        axes: readonly ResolvedCartesianAxisDescriptor[],
        labelMeasurements: ReadonlyMap<string, ChartLabelMeasurement>
    ): CartesianAxisOverhang {
        let maxLeft = 0;
        let maxRight = 0;
        let maxTop = 0;
        let maxBottom = 0;

        for (const axis of axes) {
            if (!axis.visible || axis.labels === false) {
                continue;
            }
            if (axis.dimension === "x") {
                // X axis labels may overhang left and right boundaries by ~ half of label width
                // We check first and last measured label for this axis
                const prefix = `axis:x:${encodeURIComponent(axis.axisId)}:`;
                const matchingMeasurements: ChartLabelMeasurement[] = [];
                for (const [key, m] of labelMeasurements) {
                    if (key.startsWith(prefix)) {
                        matchingMeasurements.push(m);
                    }
                }
                if (matchingMeasurements.length > 0) {
                    const firstWidth = matchingMeasurements[0].width;
                    const lastWidth = matchingMeasurements[matchingMeasurements.length - 1].width;
                    maxLeft = Math.max(maxLeft, Math.ceil(firstWidth / 2));
                    maxRight = Math.max(maxRight, Math.ceil(lastWidth / 2));
                }
            } else {
                // Y axis labels may overhang top and bottom boundaries by ~ half of label height
                const prefix = `axis:y:${encodeURIComponent(axis.axisId)}:`;
                const matchingMeasurements: ChartLabelMeasurement[] = [];
                for (const [key, m] of labelMeasurements) {
                    if (key.startsWith(prefix)) {
                        matchingMeasurements.push(m);
                    }
                }
                if (matchingMeasurements.length > 0) {
                    const topHeight = matchingMeasurements[matchingMeasurements.length - 1].height;
                    const bottomHeight = matchingMeasurements[0].height;
                    maxTop = Math.max(maxTop, Math.ceil(topHeight / 2));
                    maxBottom = Math.max(maxBottom, Math.ceil(bottomHeight / 2));
                }
            }
        }

        return {
            bottom: maxBottom,
            left: maxLeft,
            right: maxRight,
            top: maxTop
        };
    }
}
