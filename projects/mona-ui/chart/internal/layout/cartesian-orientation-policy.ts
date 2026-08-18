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
        const diagnostics: string[] = [];

        const getOrientation = (s: ChartCartesianSeriesRegistration): "horizontal" | "vertical" => {
            if (s.type === "bar" || s.type === "rangeBar") {
                const raw = "orientation" in s && s.orientation ? s.orientation() : "vertical";
                if (raw === "horizontal" || raw === "vertical") {
                    return raw;
                }
                diagnostics.push(
                    `[MonaChart] Invalid orientation '${String(raw)}'. Falling back to 'vertical'.`
                );
                return "vertical";
            }
            return "vertical";
        };

        const visibleSeries = effectiveSeries.filter(s => s.visible());

        if (visibleSeries.length === 0) {
            const hasHorizontalBarInEffective = effectiveSeries.some(s => {
                if (s.type === "bar" || s.type === "rangeBar") {
                    return getOrientation(s) === "horizontal";
                }
                return false;
            });
            return {
                diagnostics,
                orientation: hasHorizontalBarInEffective ? "horizontal" : "vertical",
                valid: true
            };
        }

        const hasHorizontalBar = visibleSeries.some(s => {
            if (s.type === "bar" || s.type === "rangeBar") {
                return getOrientation(s) === "horizontal";
            }
            return false;
        });

        if (!hasHorizontalBar) {
            return {
                diagnostics,
                orientation: "vertical",
                valid: true
            };
        }

        // Horizontal mode only supports Bar and Range Bar series
        const incompatibleSeries = visibleSeries.filter(s => s.type !== "bar" && s.type !== "rangeBar");
        if (incompatibleSeries.length > 0) {
            const types = Array.from(new Set(incompatibleSeries.map(s => s.type))).join(", ");
            diagnostics.push(
                `[MonaChart] Horizontal Cartesian charts only support Bar and Range Bar series. Incompatible series type(s): ${types}.`
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
                return getOrientation(s) !== "horizontal";
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
            diagnostics,
            orientation: "horizontal",
            valid: true
        };
    }
}
