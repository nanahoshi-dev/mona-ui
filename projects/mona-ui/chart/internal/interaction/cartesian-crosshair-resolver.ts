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

function resolveNearestMarkSemantic(
    hit: SceneHitTarget,
    scene: CartesianXYChartScene,
    pointer: ChartPoint
): {
    semanticIndexX: number;
    semanticIndexY: number;
    semanticX: unknown;
    semanticY: unknown;
} {
    const isHorizontal = hit.barOrientation === "horizontal" || scene.orientation === "horizontal";
    const dataIndex = hit.index ?? hit.dataIndex ?? 0;

    // 1. Financial series (Candlestick, OHLC)
    if (hit.financial || hit.seriesType === "candlestick" || hit.seriesType === "ohlc") {
        const finClose = hit.close ?? hit.financial?.close ?? hit.yValue;
        const markX = hit.xValue ?? hit.category ?? hit.categoryX;
        return {
            semanticIndexX: dataIndex,
            semanticIndexY: dataIndex,
            semanticX: markX,
            semanticY: finClose
        };
    }

    // 2. Range series (RangeBar, RangeArea)
    if (hit.seriesType === "rangeBar" || hit.seriesType === "rangeArea" || hit.valueKind === "range" || hit.range !== undefined) {
        const fromVal = hit.fromValue ?? hit.range?.fromValue ?? 0;
        const toVal = hit.toValue ?? hit.range?.toValue ?? 0;

        if (isHorizontal) {
            // Horizontal range: category Y, range values X
            const chosenX = Math.abs(pointer.x - (hit.point?.x ?? 0)) < Math.abs(pointer.x - (hit.highPoint?.x ?? 0))
                ? fromVal
                : toVal;
            return {
                semanticIndexX: dataIndex,
                semanticIndexY: dataIndex,
                semanticX: chosenX,
                semanticY: hit.category ?? hit.categoryY ?? hit.yValue
            };
        } else {
            // Vertical range: category X, range values Y
            const yFrom = hit.point?.y ?? 0;
            const yTo = hit.highPoint?.y ?? hit.lowPoint?.y ?? 0;
            const chosenY = Math.abs(pointer.y - yFrom) <= Math.abs(pointer.y - yTo)
                ? fromVal
                : toVal;
            return {
                semanticIndexX: dataIndex,
                semanticIndexY: dataIndex,
                semanticX: hit.category ?? hit.categoryX ?? hit.xValue,
                semanticY: chosenY
            };
        }
    }

    // 3. Scalar Bar series
    if (hit.seriesType === "bar") {
        if (isHorizontal) {
            return {
                semanticIndexX: dataIndex,
                semanticIndexY: dataIndex,
                semanticX: hit.xValue ?? hit.value,
                semanticY: hit.category ?? hit.categoryY ?? hit.yValue
            };
        } else {
            return {
                semanticIndexX: dataIndex,
                semanticIndexY: dataIndex,
                semanticX: hit.category ?? hit.categoryX ?? hit.xValue,
                semanticY: hit.yValue ?? hit.value
            };
        }
    }

    // 4. Point-like marks (Line, Area, Scatter, Bubble)
    return {
        semanticIndexX: dataIndex,
        semanticIndexY: dataIndex,
        semanticX: hit.xValue ?? hit.category ?? hit.categoryX,
        semanticY: hit.yValue ?? hit.value
    };
}

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
            // 1. Try finding matching hit from resolution
            let selectedHit: SceneHitTarget | null = null;
            const candidateHits = [
                ...(resolution?.hitState?.activeHits ?? []),
                ...(resolution?.primaryHit ? [resolution.primaryHit] : [])
            ];

            if (candidateHits.length > 0) {
                // Filter / sort by target axis compatibility
                const compatible = candidateHits.filter(h => {
                    const matchX = !registration.xAxisId() || !h.xAxisId || h.xAxisId === registration.xAxisId();
                    const matchY = !registration.yAxisId() || !h.yAxisId || h.yAxisId === registration.yAxisId();
                    return matchX && matchY;
                });
                selectedHit = compatible[0] ?? candidateHits[0];
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
                const semantics = resolveNearestMarkSemantic(
                    selectedHit,
                    scene,
                    pointer ?? selectedHit.point ?? { x: 0, y: 0 }
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
                const directAnchor = resolution?.snappedAnchor ?? resolution?.nearestAnchor;
                let targetAnchor: ChartPoint | null = null;

                if (directAnchor) {
                    const dist = Math.hypot(pointer.x - directAnchor.x, pointer.y - directAnchor.y);
                    const isHoriz = scene.interactionAxis === "y";
                    const distAlongAxis = isHoriz
                        ? Math.abs(pointer.y - directAnchor.y)
                        : Math.abs(pointer.x - directAnchor.x);
                    if (dist <= maxSnapDistance || distAlongAxis <= maxSnapDistance) {
                        targetAnchor = directAnchor;
                    }
                } else {
                    const map = xAxisId ? scene.interactionBucketsByAxisId?.get(xAxisId) : undefined;
                    const axisBuckets: readonly ChartInteractionBucket[] | undefined = map
                        ? Array.from(map.values())
                        : scene.interactionBuckets;
                    if (axisBuckets && axisBuckets.length > 0) {
                        const nearestBucket = scene.interactionAxis === "y"
                            ? findNearestInteractionBucketByY(axisBuckets, pointer.y)
                            : findNearestInteractionBucketByX(axisBuckets, pointer.x);

                        if (nearestBucket) {
                            const dist = scene.interactionAxis === "y"
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
