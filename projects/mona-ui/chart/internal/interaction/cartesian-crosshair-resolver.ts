import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { ChartCrosshairRegistration } from "../context/chart-registration-context";
import type { ChartPointerResolution } from "./chart-pointer-interaction-resolver";
import type {
    ChartCrosshairState,
    ResolvedCrosshairAxisState
} from "./chart-crosshair-state";
import type { ChartPoint } from "../../models/chart.models";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import { formatCartesianAxisSemanticValue } from "../utils/chart-formatter";
import {
    findNearestInteractionBucketByX,
    findNearestInteractionBucketByY
} from "./chart-interaction-bucket-search";
import { CartesianMarkSemanticResolver } from "./cartesian-mark-semantic-resolver";

export interface CartesianCrosshairResolution {
    readonly activeHitTarget: SceneHitTarget | null;
    readonly activeHits: readonly SceneHitTarget[];
    readonly snapKind: "bucket" | "mark" | "none" | "pointer";
    readonly state: ChartCrosshairState | null;
}

export interface CartesianTargetAxisSelection {
    readonly needX: boolean;
    readonly needY: boolean;
    readonly xAxisId?: string;
    readonly yAxisId?: string;
}

export function isHitCompatibleWithTargetAxes(
    hit: SceneHitTarget,
    scene: CartesianXYChartScene,
    target: CartesianTargetAxisSelection
): boolean {
    const hitXAxisId = hit.xAxisId ?? scene.primaryXAxisId;
    const hitYAxisId = hit.yAxisId ?? scene.primaryYAxisId;
    const matchX = !target.needX || hitXAxisId === target.xAxisId;
    const matchY = !target.needY || hitYAxisId === target.yAxisId;
    return matchX && matchY;
}

export function findNearestCompatibleHitInBucket(
    bucket: ChartInteractionBucket,
    pointer: ChartPoint,
    scene: CartesianXYChartScene,
    target: CartesianTargetAxisSelection
): SceneHitTarget | null {
    if (!bucket.hits || bucket.hits.length === 0) {
        return null;
    }
    const compatible = bucket.hits.filter(h => isHitCompatibleWithTargetAxes(h, scene, target));
    if (compatible.length === 0) {
        return null;
    }
    let bestHit: SceneHitTarget | null = null;
    let minDistance = Number.POSITIVE_INFINITY;
    for (const hit of compatible) {
        let hx = hit.point?.x;
        let hy = hit.point?.y;
        if (hit.seriesType === "rangeArea" && hit.rangeBand) {
            hx = hit.rangeBand.fromPoint.x;
            const minY = Math.min(hit.rangeBand.fromPoint.y, hit.rangeBand.toPoint.y);
            const maxY = Math.max(hit.rangeBand.fromPoint.y, hit.rangeBand.toPoint.y);
            hy = Math.max(minY, Math.min(maxY, pointer.y));
        } else if (hit.visualBounds || hit.bounds) {
            const b = hit.visualBounds ?? hit.bounds!;
            hx = b.x + b.width / 2;
            hy = b.y + b.height / 2;
        }
        hx = hx ?? bucket.anchor.x;
        hy = hy ?? bucket.anchor.y;
        const d = Math.hypot(pointer.x - hx, pointer.y - hy);
        if (d < minDistance) {
            minDistance = d;
            bestHit = hit;
        }
    }
    return bestHit ?? compatible[0] ?? null;
}

function findNearestCompatibleHitAcrossNamespaces(
    scene: CartesianXYChartScene,
    pointer: ChartPoint,
    isHoriz: boolean,
    maxSnapDistance: number,
    targetAxes: CartesianTargetAxisSelection
): { bucket: ChartInteractionBucket; hit: SceneHitTarget } | null {
    const candidateBucketLists: (readonly ChartInteractionBucket[])[] = [];

    if (scene.interactionBucketsByAxisId && scene.interactionBucketsByAxisId.size > 0) {
        for (const [, map] of scene.interactionBucketsByAxisId) {
            candidateBucketLists.push(Array.from(map.values()));
        }
    } else if (scene.interactionBuckets && scene.interactionBuckets.length > 0) {
        candidateBucketLists.push(scene.interactionBuckets);
    }

    let bestHit: SceneHitTarget | null = null;
    let bestBucket: ChartInteractionBucket | null = null;
    let minAxisDist = Number.POSITIVE_INFINITY;
    let minGeomDist = Number.POSITIVE_INFINITY;

    const targetCoord = isHoriz ? pointer.y : pointer.x;

    for (const buckets of candidateBucketLists) {
        if (!buckets || buckets.length === 0) continue;

        // Binary search insertion index
        let low = 0;
        let high = buckets.length - 1;
        while (low <= high) {
            const mid = (low + high) >> 1;
            const midCoord = isHoriz ? buckets[mid].anchor.y : buckets[mid].anchor.x;
            if (midCoord < targetCoord) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        let left = low - 1;
        let right = low;

        while (left >= 0 || right < buckets.length) {
            const distLeft = left >= 0
                ? Math.abs(targetCoord - (isHoriz ? buckets[left].anchor.y : buckets[left].anchor.x))
                : Number.POSITIVE_INFINITY;
            const distRight = right < buckets.length
                ? Math.abs(targetCoord - (isHoriz ? buckets[right].anchor.y : buckets[right].anchor.x))
                : Number.POSITIVE_INFINITY;

            if (distLeft > maxSnapDistance && distRight > maxSnapDistance) {
                break;
            }

            let inspectBucket: ChartInteractionBucket;
            let axisDist: number;
            if (distLeft <= distRight) {
                inspectBucket = buckets[left];
                axisDist = distLeft;
                left--;
            } else {
                inspectBucket = buckets[right];
                axisDist = distRight;
                right++;
            }

            if (axisDist > maxSnapDistance) {
                continue;
            }

            const bucketHit = findNearestCompatibleHitInBucket(inspectBucket, pointer, scene, targetAxes);
            if (bucketHit) {
                const hitPos = bucketHit.point ?? (bucketHit.visualBounds ? {
                    x: bucketHit.visualBounds.x + bucketHit.visualBounds.width / 2,
                    y: bucketHit.visualBounds.y + bucketHit.visualBounds.height / 2
                } : (bucketHit.bounds ? {
                    x: bucketHit.bounds.x + bucketHit.bounds.width / 2,
                    y: bucketHit.bounds.y + bucketHit.bounds.height / 2
                } : inspectBucket.anchor));
                const geomDist = Math.hypot(pointer.x - hitPos.x, pointer.y - hitPos.y);

                if (
                    axisDist < minAxisDist ||
                    (axisDist === minAxisDist && geomDist < minGeomDist)
                ) {
                    minAxisDist = axisDist;
                    minGeomDist = geomDist;
                    bestHit = bucketHit;
                    bestBucket = inspectBucket;
                }

                if (distLeft > minAxisDist && distRight > minAxisDist) {
                    break;
                }
            }
        }
    }

    return bestHit && bestBucket ? { bucket: bestBucket, hit: bestHit } : null;
}

export class CartesianCrosshairResolver {
    public static resolve(
        scene: CartesianXYChartScene | null,
        registration: ChartCrosshairRegistration | null,
        resolution: ChartPointerResolution | null,
        source: "keyboard" | "pointer" = "pointer"
    ): CartesianCrosshairResolution {
        const emptyResult: CartesianCrosshairResolution = {
            activeHits: [],
            activeHitTarget: null,
            snapKind: "none",
            state: null
        };

        if (!scene || !scene.coordinateSpace || scene.plotRect.width <= 0 || scene.plotRect.height <= 0) {
            return emptyResult;
        }

        if (!registration || registration.enabled() === false) {
            return emptyResult;
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
            return emptyResult;
        }

        const pointer = resolution?.pointer;
        if (source === "pointer" && !pointer) {
            return emptyResult;
        }

        if (source === "pointer" && pointer) {
            if (
                pointer.x < plotRect.x ||
                pointer.x > plotRect.x + plotRect.width ||
                pointer.y < plotRect.y ||
                pointer.y > plotRect.y + plotRect.height
            ) {
                return emptyResult;
            }
        }

        let resolvedX: ResolvedCrosshairAxisState | undefined;
        let resolvedY: ResolvedCrosshairAxisState | undefined;
        let isSnapped = false;
        let snapKind: "bucket" | "mark" | "none" | "pointer" = "none";
        let activeHitTarget: SceneHitTarget | null = null;
        let activeHits: readonly SceneHitTarget[] = [];

        const targetXAxis = scene.axes.find(a => a.axis === "x" && a.axisId === xAxisId);
        const targetYAxis = scene.axes.find(a => a.axis === "y" && a.axisId === yAxisId);
        const targetAxes: CartesianTargetAxisSelection = { needX, needY, xAxisId, yAxisId };
        const isHoriz = scene.interactionAxis === "y";

        if (snapMode === "nearest") {
            // 1. Try candidate hits from resolution strictly bound to target axis namespace
            let selectedHit: SceneHitTarget | null = null;
            const candidateHits = [
                ...(resolution?.crosshairCandidates ?? []),
                ...(resolution?.hitState?.activeHits ?? []),
                ...(resolution?.primaryHit ? [resolution.primaryHit] : [])
            ];

            if (candidateHits.length > 0) {
                let minCandDist = Number.POSITIVE_INFINITY;
                for (const h of candidateHits) {
                    if (!isHitCompatibleWithTargetAxes(h, scene, targetAxes)) {
                        continue;
                    }
                    if (source === "pointer" && pointer) {
                        const hitPos = h.point ?? (h.visualBounds ? {
                            x: h.visualBounds.x + h.visualBounds.width / 2,
                            y: h.visualBounds.y + h.visualBounds.height / 2
                        } : (h.bounds ? {
                            x: h.bounds.x + h.bounds.width / 2,
                            y: h.bounds.y + h.bounds.height / 2
                        } : pointer));

                        const dist = Math.hypot(pointer.x - hitPos.x, pointer.y - hitPos.y);
                        const distAlongAxis = isHoriz
                            ? Math.abs(pointer.y - hitPos.y)
                            : Math.abs(pointer.x - hitPos.x);

                        if (dist <= maxSnapDistance || distAlongAxis <= maxSnapDistance) {
                            if (dist < minCandDist) {
                                minCandDist = dist;
                                selectedHit = h;
                            }
                        }
                    } else {
                        selectedHit = h;
                        break;
                    }
                }
            }

            if (selectedHit) {
                snapKind = "mark";
                activeHitTarget = selectedHit;
                activeHits = [selectedHit];
            } else if (source === "pointer" && pointer) {
                // 2. Bucket fallback
                const independentRequested = isHoriz ? needY : needX;

                if (!independentRequested) {
                    // Value-only mode: independent axis is irrelevant, search all available independent bucket namespaces
                    const match = findNearestCompatibleHitAcrossNamespaces(scene, pointer, isHoriz, maxSnapDistance, targetAxes);
                    if (match) {
                        selectedHit = match.hit;
                        snapKind = "mark";
                        activeHitTarget = match.hit;
                        activeHits = match.bucket.hits
                            ? match.bucket.hits.filter(h => isHitCompatibleWithTargetAxes(h, scene, targetAxes))
                            : [match.hit];
                    }
                } else {
                    // Independent axis is requested: constrain to target independent axis ID
                    const interactionAxisId = isHoriz ? yAxisId : xAxisId;
                    const isTargetPrimary = interactionAxisId === (isHoriz ? scene.primaryYAxisId : scene.primaryXAxisId);

                    const map = interactionAxisId ? scene.interactionBucketsByAxisId?.get(interactionAxisId) : undefined;
                    const axisBuckets: readonly ChartInteractionBucket[] | undefined = map
                        ? Array.from(map.values())
                        : (isTargetPrimary ? scene.interactionBuckets : undefined);

                    let nearestBucket: ChartInteractionBucket | null = null;
                    if (axisBuckets && axisBuckets.length > 0) {
                        nearestBucket = isHoriz
                            ? findNearestInteractionBucketByY(axisBuckets, pointer.y)
                            : findNearestInteractionBucketByX(axisBuckets, pointer.x);
                    }

                    if (nearestBucket) {
                        const distAlongAxis = isHoriz
                            ? Math.abs(pointer.y - nearestBucket.anchor.y)
                            : Math.abs(pointer.x - nearestBucket.anchor.x);

                        if (distAlongAxis <= maxSnapDistance) {
                            if (!isHoriz) {
                                // Vertical chart: interaction axis is X
                                if (!needY && needX) {
                                    // Mode="x": independent category bucket snap alone is valid
                                    snapKind = "bucket";
                                    let coordX = nearestBucket.anchor.x;
                                    let valX: unknown = undefined;
                                    if (xSnap?.resolvedType === "category" && xRef) {
                                        const geom = coordinateSpace.resolveCategoryAtPixel(xRef, coordX);
                                        if (geom) {
                                            coordX = geom.bandCenter;
                                            valX = geom.key;
                                        }
                                    } else if (xRef) {
                                        valX = coordinateSpace.resolveContinuousAtPixel(xRef, coordX)?.value;
                                    }

                                    if (valX !== undefined && coordX >= plotRect.x && coordX <= plotRect.x + plotRect.width) {
                                        resolvedX = {
                                            axis: "x",
                                            axisId: xAxisId!,
                                            coordinate: coordX,
                                            formattedValue: formatCartesianAxisSemanticValue({
                                                axisScene: targetXAxis,
                                                index: 0,
                                                value: valX,
                                                xTimeSpanMs: scene.xTimeSpanMs
                                            }),
                                            value: valX
                                        };
                                    }
                                } else {
                                    // Mode="y" or "xy": value-axis requires a compatible mark in bucket
                                    const bucketHit = findNearestCompatibleHitInBucket(nearestBucket, pointer, scene, targetAxes);
                                    if (bucketHit) {
                                        selectedHit = bucketHit;
                                        snapKind = "mark";
                                        activeHitTarget = bucketHit;
                                        activeHits = nearestBucket.hits
                                            ? nearestBucket.hits.filter(h => isHitCompatibleWithTargetAxes(h, scene, targetAxes))
                                            : [bucketHit];
                                    }
                                }
                            } else {
                                // Horizontal chart: interaction axis is Y
                                if (!needX && needY) {
                                    // Mode="y": independent category bucket snap alone is valid
                                    snapKind = "bucket";
                                    let coordY = nearestBucket.anchor.y;
                                    let valY: unknown = undefined;
                                    if (ySnap?.resolvedType === "category" && yRef) {
                                        const geom = coordinateSpace.resolveCategoryAtPixel(yRef, coordY);
                                        if (geom) {
                                            coordY = geom.bandCenter;
                                            valY = geom.key;
                                        }
                                    } else if (yRef) {
                                        valY = coordinateSpace.resolveContinuousAtPixel(yRef, coordY)?.value;
                                    }

                                    if (valY !== undefined && coordY >= plotRect.y && coordY <= plotRect.y + plotRect.height) {
                                        resolvedY = {
                                            axis: "y",
                                            axisId: yAxisId!,
                                            coordinate: coordY,
                                            formattedValue: formatCartesianAxisSemanticValue({
                                                axisScene: targetYAxis,
                                                index: 0,
                                                value: valY,
                                                xTimeSpanMs: scene.xTimeSpanMs
                                            }),
                                            value: valY
                                        };
                                    }
                                } else {
                                    // Mode="x" or "xy": value-axis requires a compatible mark in bucket
                                    const bucketHit = findNearestCompatibleHitInBucket(nearestBucket, pointer, scene, targetAxes);
                                    if (bucketHit) {
                                        selectedHit = bucketHit;
                                        snapKind = "mark";
                                        activeHitTarget = bucketHit;
                                        activeHits = nearestBucket.hits
                                            ? nearestBucket.hits.filter(h => isHitCompatibleWithTargetAxes(h, scene, targetAxes))
                                            : [bucketHit];
                                    }
                                }
                            }
                        }
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
                        const formattedValue = formatCartesianAxisSemanticValue({
                            axisScene: targetXAxis,
                            index: semantics.semanticIndexX,
                            value: valX,
                            xTimeSpanMs: scene.xTimeSpanMs
                        });
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
                        const formattedValue = formatCartesianAxisSemanticValue({
                            axisScene: targetYAxis,
                            index: semantics.semanticIndexY,
                            value: valY,
                            xTimeSpanMs: scene.xTimeSpanMs
                        });
                        resolvedY = {
                            axis: "y",
                            axisId: yAxisId!,
                            coordinate: coordY,
                            formattedValue,
                            value: valY
                        };
                    }
                }
            } else if (snapKind === "bucket") {
                isSnapped = true;
            }
        } else {
            // Pointer snap mode: raw continuous or snapped category centers
            snapKind = "pointer";
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
                        formattedValue: formatCartesianAxisSemanticValue({
                            axisScene: targetXAxis,
                            index: 0,
                            value: valX,
                            xTimeSpanMs: scene.xTimeSpanMs
                        }),
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
                        formattedValue: formatCartesianAxisSemanticValue({
                            axisScene: targetYAxis,
                            index: 0,
                            value: valY,
                            xTimeSpanMs: scene.xTimeSpanMs
                        }),
                        value: valY
                    };
                    if (snappedY) isSnapped = true;
                }
            }
        }

        if (!resolvedX && !resolvedY) {
            return emptyResult;
        }

        const anchor: ChartPoint = {
            x: resolvedX ? resolvedX.coordinate : (pointer?.x ?? plotRect.x),
            y: resolvedY ? resolvedY.coordinate : (pointer?.y ?? plotRect.y)
        };

        const state: ChartCrosshairState = {
            anchor,
            snapped: isSnapped,
            source,
            x: resolvedX,
            y: resolvedY
        };

        return {
            activeHits,
            activeHitTarget,
            snapKind,
            state
        };
    }
}

