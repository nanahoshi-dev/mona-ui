import type { ChartBarOrientation } from "../../models/chart-bar.models";
import type { ChartRect } from "../../models/chart.models";
import type { ChartCornerRadii } from "../scene/scene-geometry";

export interface DeriveBarRectParams {
    readonly categorySize: number;
    readonly categoryStart: number;
    readonly orientation: ChartBarOrientation;
    readonly valueEnd: number;
    readonly valueStart: number;
}

export interface DeriveBarCornerRadiiParams {
    readonly isPositive: boolean;
    readonly orientation: ChartBarOrientation;
    readonly radius: number;
    readonly stackPosition?: "inner" | "outer" | "single";
}

export class CartesianBarGeometry {
    public static deriveBarRect(params: DeriveBarRectParams): ChartRect {
        const { categorySize, categoryStart, orientation, valueEnd, valueStart } = params;

        if (orientation === "horizontal") {
            const x = Math.min(valueStart, valueEnd);
            const width = Math.max(0, Math.abs(valueEnd - valueStart));
            const y = categoryStart;
            const height = Math.max(0, categorySize);
            return { height, width, x, y };
        }

        // Vertical
        const x = categoryStart;
        const width = Math.max(0, categorySize);
        const y = Math.min(valueStart, valueEnd);
        const height = Math.max(0, Math.abs(valueEnd - valueStart));
        return { height, width, x, y };
    }

    public static deriveCornerRadii(params: DeriveBarCornerRadiiParams): ChartCornerRadii {
        const { isPositive, orientation, radius, stackPosition = "single" } = params;

        if (radius <= 0) {
            return { bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 };
        }

        if (stackPosition === "inner") {
            return { bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 };
        }

        const r = radius;

        if (orientation === "horizontal") {
            if (isPositive) {
                // Positive horizontal bar extends to the right -> round right corners
                return { bottomLeft: 0, bottomRight: r, topLeft: 0, topRight: r };
            }
            // Negative horizontal bar extends to the left -> round left corners
            return { bottomLeft: r, bottomRight: 0, topLeft: r, topRight: 0 };
        }

        // Vertical orientation
        if (isPositive) {
            // Positive vertical bar extends upward -> round top corners
            return { bottomLeft: 0, bottomRight: 0, topLeft: r, topRight: r };
        }
        // Negative vertical bar extends downward -> round bottom corners
        return { bottomLeft: r, bottomRight: r, topLeft: 0, topRight: 0 };
    }
}
