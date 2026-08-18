import type { ChartCartesianSeriesRegistration } from "../context/chart-registration-context";
import type { CartesianXYOrientation } from "../scene/chart-scene";

export interface CartesianOrientationResolution {
    readonly diagnostics: readonly string[];
    readonly orientation: CartesianXYOrientation;
    readonly valid: boolean;
}

export class CartesianOrientationPolicy {
    public static resolve(
        effectiveSeries: readonly ChartCartesianSeriesRegistration[]
    ): CartesianOrientationResolution {
        const visibleSeries = effectiveSeries.filter(s => s.visible());

        if (visibleSeries.length === 0) {
            const hasHorizontalBarInEffective = effectiveSeries.some(s => {
                if (s.type === "bar" || s.type === "rangeBar") {
                    const orientation = "orientation" in s && s.orientation ? s.orientation() : "vertical";
                    return orientation === "horizontal";
                }
                return false;
            });
            return {
                diagnostics: [],
                orientation: hasHorizontalBarInEffective ? "horizontal" : "vertical",
                valid: true
            };
        }

        const hasHorizontalBar = visibleSeries.some(s => {
            if (s.type === "bar" || s.type === "rangeBar") {
                const orientation = "orientation" in s && s.orientation ? s.orientation() : "vertical";
                return orientation === "horizontal";
            }
            return false;
        });

        if (!hasHorizontalBar) {
            return {
                diagnostics: [],
                orientation: "vertical",
                valid: true
            };
        }

        const diagnostics: string[] = [];

        // Financial series (Candlestick / OHLC) are strictly vertical
        const hasFinancialSeries = visibleSeries.some(s => s.type === "candlestick" || s.type === "ohlc");
        if (hasFinancialSeries) {
            diagnostics.push(
                "[MonaChart] Horizontal Bar/Range Bar series cannot be combined with Candlestick or OHLC series."
            );
            return {
                diagnostics,
                orientation: "horizontal",
                valid: false
            };
        }

        // Check if all visible bar-like series use horizontal orientation
        const hasMixedOrientation = visibleSeries.some(s => {
            if (s.type === "bar" || s.type === "rangeBar") {
                const orientation = "orientation" in s && s.orientation ? s.orientation() : "vertical";
                return orientation !== "horizontal";
            }
            return false;
        });

        if (hasMixedOrientation) {
            diagnostics.push(
                "[MonaChart] All visible Bar and Range Bar series in a chart must use the same orientation."
            );
            return {
                diagnostics,
                orientation: "horizontal",
                valid: false
            };
        }

        return {
            diagnostics: [],
            orientation: "horizontal",
            valid: true
        };
    }
}
