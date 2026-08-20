import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { ChartCrosshairRegistration } from "../context/chart-registration-context";
import type { ChartPointerResolution } from "./chart-pointer-interaction-resolver";
import type {
    ChartCrosshairState,
    ResolvedCrosshairAxisState
} from "./chart-crosshair-state";
import type { ChartPoint } from "../../models/chart.models";
import { formatXValue, formatYValue } from "../utils/chart-formatter";

export class CartesianCrosshairResolver {
    public static resolve(
        scene: CartesianXYChartScene | null,
        registration: ChartCrosshairRegistration | null,
        resolution: ChartPointerResolution | null,
        source: "keyboard" | "pointer" = "pointer"
    ): ChartCrosshairState | null {
        if (!scene || !scene.coordinateSpace || scene.plotRect.width <= 0 || scene.plotRect.height <= 0) {
            return null;
        }

        if (!registration || registration.enabled() === false) {
            return null;
        }

        const plotRect = scene.plotRect;
        const coordinateSpace = scene.coordinateSpace;

        let effectiveMode = registration.mode();
        if (effectiveMode === "auto") {
            effectiveMode = scene.interactionAxis === "y" ? "y" : "x";
        }

        const needX = effectiveMode === "x" || effectiveMode === "xy";
        const needY = effectiveMode === "y" || effectiveMode === "xy";

        const snapMode = source === "keyboard" ? "nearest" : registration.snap();
        const maxSnapDistance = registration.maxSnapDistance() ?? 32;

        let anchor: ChartPoint | null = null;
        let isSnapped = false;

        if (source === "keyboard") {
            if (resolution?.primaryHit?.point) {
                anchor = resolution.primaryHit.point;
                isSnapped = true;
            } else if (resolution?.snappedAnchor) {
                anchor = resolution.snappedAnchor;
                isSnapped = true;
            }
        } else {
            // Pointer mode
            const pointer = resolution?.pointer;
            if (!pointer) {
                return null;
            }

            // Check if pointer is within or close to plot area
            if (
                pointer.x < plotRect.x ||
                pointer.x > plotRect.x + plotRect.width ||
                pointer.y < plotRect.y ||
                pointer.y > plotRect.y + plotRect.height
            ) {
                return null;
            }

            if (snapMode === "nearest") {
                // Find nearest mark or bucket
                let nearestPoint: ChartPoint | null = null;
                let nearestDist = Infinity;

                if (resolution?.snappedAnchor) {
                    const d = Math.hypot(
                        pointer.x - resolution.snappedAnchor.x,
                        pointer.y - resolution.snappedAnchor.y
                    );
                    if (d <= maxSnapDistance) {
                        nearestPoint = resolution.snappedAnchor;
                        nearestDist = d;
                    }
                }

                if (resolution?.nearestAnchor) {
                    const isHoriz = scene.interactionAxis === "y";
                    const distAlongAxis = isHoriz
                        ? Math.abs(pointer.y - resolution.nearestAnchor.y)
                        : Math.abs(pointer.x - resolution.nearestAnchor.x);

                    if (distAlongAxis <= maxSnapDistance && (!nearestPoint || distAlongAxis < nearestDist)) {
                        nearestPoint = resolution.nearestAnchor;
                        nearestDist = distAlongAxis;
                    }
                }

                if (!nearestPoint || nearestDist > maxSnapDistance) {
                    return null;
                }

                anchor = nearestPoint;
                isSnapped = true;
            } else {
                // Pointer snap mode
                anchor = pointer;
                isSnapped = false;
            }
        }

        if (!anchor) {
            return null;
        }

        let resolvedX: ResolvedCrosshairAxisState | undefined;
        let resolvedY: ResolvedCrosshairAxisState | undefined;

        // Resolve X axis state
        if (needX) {
            const xAxisId = registration.xAxisId() ?? scene.primaryXAxisId;
            if (xAxisId) {
                const xRef = { axis: "x" as const, axisId: xAxisId };
                const xSnap = coordinateSpace.get(xRef);
                if (xSnap && xSnap.valid !== false) {
                    let coordX = anchor.x;
                    let valX: unknown = undefined;

                    if (xSnap.resolvedType === "category") {
                        if (isSnapped) {
                            const catGeom = coordinateSpace.resolveCategoryAtPixel(xRef, coordX);
                            if (catGeom) {
                                coordX = catGeom.bandCenter;
                                valX = catGeom.key;
                            }
                        } else {
                            const catGeom = coordinateSpace.resolveCategoryAtPixel(xRef, coordX);
                            if (catGeom) {
                                coordX = catGeom.bandCenter;
                                valX = catGeom.key;
                            }
                        }
                    } else {
                        const continuousCoord = coordinateSpace.resolveContinuousAtPixel(xRef, coordX);
                        if (continuousCoord) {
                            valX = continuousCoord.value;
                        }
                    }

                    if (valX !== undefined && coordX >= plotRect.x && coordX <= plotRect.x + plotRect.width) {
                        const targetAxis = scene.axes.find(a => a.axis === "x" && a.axisId === xAxisId);
                        const formattedValue = formatXValue(
                            valX,
                            0,
                            targetAxis?.formatter,
                            targetAxis?.scaleType as import("../../models/chart-axis.models").ChartXAxisType
                        );

                        resolvedX = {
                            axis: "x",
                            axisId: xAxisId,
                            coordinate: coordX,
                            formattedValue,
                            value: valX
                        };
                    }
                }
            }
        }

        // Resolve Y axis state
        if (needY) {
            const yAxisId = registration.yAxisId() ?? scene.primaryYAxisId;
            if (yAxisId) {
                const yRef = { axis: "y" as const, axisId: yAxisId };
                const ySnap = coordinateSpace.get(yRef);
                if (ySnap && ySnap.valid !== false) {
                    let coordY = anchor.y;
                    let valY: unknown = undefined;

                    if (ySnap.resolvedType === "category") {
                        const catGeom = coordinateSpace.resolveCategoryAtPixel(yRef, coordY);
                        if (catGeom) {
                            coordY = catGeom.bandCenter;
                            valY = catGeom.key;
                        }
                    } else {
                        const continuousCoord = coordinateSpace.resolveContinuousAtPixel(yRef, coordY);
                        if (continuousCoord) {
                            valY = continuousCoord.value;
                        }
                    }

                    if (valY !== undefined && coordY >= plotRect.y && coordY <= plotRect.y + plotRect.height) {
                        const targetAxis = scene.axes.find(a => a.axis === "y" && a.axisId === yAxisId);
                        const formattedValue = formatYValue(valY, 0, targetAxis?.formatter);

                        resolvedY = {
                            axis: "y",
                            axisId: yAxisId,
                            coordinate: coordY,
                            formattedValue,
                            value: valY
                        };
                    }
                }
            }
        }

        if (!resolvedX && !resolvedY) {
            return null;
        }

        return {
            anchor,
            snapped: isSnapped,
            source,
            x: resolvedX,
            y: resolvedY
        };
    }
}
