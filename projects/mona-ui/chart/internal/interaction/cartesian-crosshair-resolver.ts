import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { ChartCrosshairRegistration } from "../context/chart-registration-context";
import type { ChartPointerResolution } from "./chart-pointer-interaction-resolver";
import type {
    ChartCrosshairState,
    ResolvedCrosshairAxisState
} from "./chart-crosshair-state";
import type { ChartPoint } from "../../models/chart.models";
import type { ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import { formatXValue, formatYValue } from "../utils/chart-formatter";
import {
    findNearestInteractionBucketByX,
    findNearestInteractionBucketByY
} from "./chart-hit-test-engine";
import { CartesianMarkSemanticResolver } from "./cartesian-mark-semantic-resolver";

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
        const rawSnapDist = registration.maxSnapDistance();
        const maxSnapDistance = Number.isFinite(rawSnapDist) && rawSnapDist >= 0 ? rawSnapDist : 32;

        const xAxisId = registration.xAxisId() ?? scene.primaryXAxisId;
        const yAxisId = registration.yAxisId() ?? scene.primaryYAxisId;

        const xRef = xAxisId ? { axis: "x" as const, axisId: xAxisId } : null;
        const yRef = yAxisId ? { axis: "y" as const, axisId: yAxisId } : null;

        const xSnap = xRef ? coordinateSpace.get(xRef) : null;
        const ySnap = yRef ? coordinateSpace.get(yRef) : null;

        const isXValid = Boolean(xSnap && xSnap.valid !== false);
        const isYValid = Boolean(ySnap && ySnap.valid !== false);

        if ((needX && !isXValid) && (needY && !isYValid)) {
            return null;
        }

        const pointer = resolution?.pointer;
        if (source === "pointer" && !pointer) {
            return null;
        }

        if (source === "pointer" && pointer) {
            if (
                pointer.x < plotRect.x ||
                pointer.x > plotRect.x + plotRect.width ||
                pointer.y < plotRect.y ||
                pointer.y > plotRect.y + plotRect.height
            ) {
                return null;
            }
        }

        let resolvedX: ResolvedCrosshairAxisState | undefined;
        let resolvedY: ResolvedCrosshairAxisState | undefined;
        let isSnapped = false;

        const targetXAxis = scene.axes.find(a => a.axis === "x" && a.axisId === xAxisId);
        const targetYAxis = scene.axes.find(a => a.axis === "y" && a.axisId === yAxisId);

        if (snapMode === "nearest") {
            // 1. Try finding matching hit from resolution strictly bound to target axis namespace
            let selectedHit: SceneHitTarget | null = null;
            const candidateHits = [
                ...(resolution?.hitState?.activeHits ?? []),
                ...(resolution?.primaryHit ? [resolution.primaryHit] : [])
            ];

            if (candidateHits.length > 0) {
                const compatible = candidateHits.filter(h => {
                    const hitXAxisId = h.xAxisId ?? scene.primaryXAxisId;
                    const hitYAxisId = h.yAxisId ?? scene.primaryYAxisId;
                    const matchX = !needX || hitXAxisId === xAxisId;
                    const matchY = !needY || hitYAxisId === yAxisId;
                    return matchX && matchY;
                });
                selectedHit = compatible[0] ?? null;
            }

            if (selectedHit && source === "pointer" && pointer) {
                // Validate distance to hit
                const hitPos = selectedHit.point ?? (selectedHit.bounds ? {
                    x: selectedHit.bounds.x + selectedHit.bounds.width / 2,
                    y: selectedHit.bounds.y + selectedHit.bounds.height / 2
                } : pointer);
                const dist = Math.hypot(pointer.x - hitPos.x, pointer.y - hitPos.y);
                if (dist > maxSnapDistance) {
                    // Check if bucket anchor within distance
                    const isHoriz = scene.interactionAxis === "y";
                    const distAlongAxis = isHoriz
                        ? Math.abs(pointer.y - hitPos.y)
                        : Math.abs(pointer.x - hitPos.x);
                    if (distAlongAxis > maxSnapDistance) {
                        selectedHit = null;
                    }
                }
            }

            if (selectedHit) {
                isSnapped = true;
                const semantics = CartesianMarkSemanticResolver.resolve(
                    selectedHit,
                    scene,
                    pointer ?? selectedHit.point ?? { x: 0, y: 0 },
                    xAxisId,
                    yAxisId
                );

                if (needX && isXValid && xRef && xSnap) {
                    let coordX: number | undefined;
                    let valX = semantics.semanticX;

                    if (xSnap.resolvedType === "category") {
                        const geom = coordinateSpace.resolveCategoryByKey(xRef, valX, "viewport");
                        if (geom) {
                            coordX = geom.bandCenter;
                            valX = geom.key;
                        }
                    } else {
                        coordX = coordinateSpace.mapContinuousValue(xRef, valX, "viewport");
                    }

                    if (coordX !== undefined && Number.isFinite(coordX) && coordX >= plotRect.x && coordX <= plotRect.x + plotRect.width) {
                        const formattedValue = formatXValue(
                            valX,
                            semantics.semanticIndexX,
                            targetXAxis?.formatter,
                            targetXAxis?.scaleType as ChartXAxisType,
                            scene.xTimeSpanMs
                        );
                        resolvedX = {
                            axis: "x",
                            axisId: xAxisId!,
                            coordinate: coordX,
                            formattedValue,
                            value: valX
                        };
                    }
                }

                if (needY && isYValid && yRef && ySnap) {
                    let coordY: number | undefined;
                    let valY = semantics.semanticY;

                    if (ySnap.resolvedType === "category") {
                        const geom = coordinateSpace.resolveCategoryByKey(yRef, valY, "viewport");
                        if (geom) {
                            coordY = geom.bandCenter;
                            valY = geom.key;
                        }
                    } else {
                        coordY = coordinateSpace.mapContinuousValue(yRef, valY, "viewport");
                    }

                    if (coordY !== undefined && Number.isFinite(coordY) && coordY >= plotRect.y && coordY <= plotRect.y + plotRect.height) {
                        const formattedValue = formatYValue(
                            valY,
                            semantics.semanticIndexY,
                            targetYAxis?.formatter
                        );
                        resolvedY = {
                            axis: "y",
                            axisId: yAxisId!,
                            coordinate: coordY,
                            formattedValue,
                            value: valY
                        };
                    }
                }
            } else if (source === "pointer" && pointer) {
                const isHoriz = scene.interactionAxis === "y";
                const interactionAxisId = isHoriz ? yAxisId : xAxisId;
                const isTargetPrimary = interactionAxisId === (isHoriz ? scene.primaryYAxisId : scene.primaryXAxisId);

                // Only consume global directAnchor if primary hit is compatible or target is primary
                const primaryCompatible = resolution?.primaryHit ? (
                    (!needX || (resolution.primaryHit.xAxisId ?? scene.primaryXAxisId) === xAxisId) &&
                    (!needY || (resolution.primaryHit.yAxisId ?? scene.primaryYAxisId) === yAxisId)
                ) : isTargetPrimary;

                const directAnchor = primaryCompatible ? (resolution?.snappedAnchor ?? resolution?.nearestAnchor) : null;
                let targetAnchor: ChartPoint | null = null;

                if (directAnchor) {
                    const dist = Math.hypot(pointer.x - directAnchor.x, pointer.y - directAnchor.y);
                    const distAlongAxis = isHoriz
                        ? Math.abs(pointer.y - directAnchor.y)
                        : Math.abs(pointer.x - directAnchor.x);
                    if (dist <= maxSnapDistance || distAlongAxis <= maxSnapDistance) {
                        targetAnchor = directAnchor;
                    }
                }

                if (!targetAnchor) {
                    const map = interactionAxisId ? scene.interactionBucketsByAxisId?.get(interactionAxisId) : undefined;
                    const axisBuckets: readonly ChartInteractionBucket[] | undefined = map
                        ? Array.from(map.values())
                        : (isTargetPrimary ? scene.interactionBuckets : undefined);

                    if (axisBuckets && axisBuckets.length > 0) {
                        const nearestBucket = isHoriz
                            ? findNearestInteractionBucketByY(axisBuckets, pointer.y)
                            : findNearestInteractionBucketByX(axisBuckets, pointer.x);

                        if (nearestBucket) {
                            const dist = isHoriz
                                ? Math.abs(pointer.y - nearestBucket.anchor.y)
                                : Math.abs(pointer.x - nearestBucket.anchor.x);

                            if (dist <= maxSnapDistance) {
                                targetAnchor = nearestBucket.anchor;
                            }
                        }
                    }
                }

                if (targetAnchor) {
                    isSnapped = true;
                    if (needX && isXValid && xRef && xSnap) {
                        let coordX = targetAnchor.x;
                        let valX: unknown = undefined;

                        if (xSnap.resolvedType === "category") {
                            const geom = coordinateSpace.resolveCategoryAtPixel(xRef, coordX);
                            if (geom) {
                                coordX = geom.bandCenter;
                                valX = geom.key;
                            }
                        } else {
                            valX = coordinateSpace.resolveContinuousAtPixel(xRef, coordX)?.value;
                        }

                        if (valX !== undefined && coordX >= plotRect.x && coordX <= plotRect.x + plotRect.width) {
                            resolvedX = {
                                axis: "x",
                                axisId: xAxisId!,
                                coordinate: coordX,
                                formattedValue: formatXValue(
                                    valX,
                                    0,
                                    targetXAxis?.formatter,
                                    targetXAxis?.scaleType as ChartXAxisType,
                                    scene.xTimeSpanMs
                                ),
                                value: valX
                            };
                        }
                    }

                    if (needY && isYValid && yRef && ySnap) {
                        let coordY = targetAnchor.y;
                        let valY: unknown = undefined;

                        if (ySnap.resolvedType === "category") {
                            const geom = coordinateSpace.resolveCategoryAtPixel(yRef, coordY);
                            if (geom) {
                                coordY = geom.bandCenter;
                                valY = geom.key;
                            }
                        } else {
                            valY = coordinateSpace.resolveContinuousAtPixel(yRef, coordY)?.value;
                        }

                        if (valY !== undefined && coordY >= plotRect.y && coordY <= plotRect.y + plotRect.height) {
                            resolvedY = {
                                axis: "y",
                                axisId: yAxisId!,
                                coordinate: coordY,
                                formattedValue: formatYValue(valY, 0, targetYAxis?.formatter),
                                value: valY
                            };
                        }
                    }
                }
            }
        } else {
            // Pointer snap mode: raw continuous or snapped category centers
            const pos = pointer ?? { x: plotRect.x, y: plotRect.y };

            if (needX && isXValid && xRef && xSnap) {
                let coordX = pos.x;
                let valX: unknown = undefined;
                let snappedX = false;

                if (xSnap.resolvedType === "category") {
                    const catGeom = coordinateSpace.resolveCategoryAtPixel(xRef, coordX);
                    if (catGeom) {
                        coordX = catGeom.bandCenter;
                        valX = catGeom.key;
                        snappedX = true;
                    }
                } else {
                    const cont = coordinateSpace.resolveContinuousAtPixel(xRef, coordX);
                    if (cont) {
                        valX = cont.value;
                    }
                }

                if (valX !== undefined && coordX >= plotRect.x && coordX <= plotRect.x + plotRect.width) {
                    resolvedX = {
                        axis: "x",
                        axisId: xAxisId!,
                        coordinate: coordX,
                        formattedValue: formatXValue(
                            valX,
                            0,
                            targetXAxis?.formatter,
                            targetXAxis?.scaleType as ChartXAxisType,
                            scene.xTimeSpanMs
                        ),
                        value: valX
                    };
                    if (snappedX) isSnapped = true;
                }
            }

            if (needY && isYValid && yRef && ySnap) {
                let coordY = pos.y;
                let valY: unknown = undefined;
                let snappedY = false;

                if (ySnap.resolvedType === "category") {
                    const catGeom = coordinateSpace.resolveCategoryAtPixel(yRef, coordY);
                    if (catGeom) {
                        coordY = catGeom.bandCenter;
                        valY = catGeom.key;
                        snappedY = true;
                    }
                } else {
                    const cont = coordinateSpace.resolveContinuousAtPixel(yRef, coordY);
                    if (cont) {
                        valY = cont.value;
                    }
                }

                if (valY !== undefined && coordY >= plotRect.y && coordY <= plotRect.y + plotRect.height) {
                    resolvedY = {
                        axis: "y",
                        axisId: yAxisId!,
                        coordinate: coordY,
                        formattedValue: formatYValue(valY, 0, targetYAxis?.formatter),
                        value: valY
                    };
                    if (snappedY) isSnapped = true;
                }
            }
        }

        if (!resolvedX && !resolvedY) {
            return null;
        }

        const anchor: ChartPoint = {
            x: resolvedX ? resolvedX.coordinate : (pointer?.x ?? plotRect.x),
            y: resolvedY ? resolvedY.coordinate : (pointer?.y ?? plotRect.y)
        };

        return {
            anchor,
            snapped: isSnapped,
            source,
            x: resolvedX,
            y: resolvedY
        };
    }
}
