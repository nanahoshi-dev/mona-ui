import type { ChartPoint } from "../../models/chart.models";
import type { SceneHitTarget } from "../scene/scene-geometry";

export interface InteractionGeometryDistanceResult {
    readonly nearestPoint: ChartPoint;
    readonly primaryDistance: number;
    readonly secondaryDistance: number;
}

/**
 * Authoritative interaction geometry distance calculation.
 * Computes exact distance to point, vertical segment (range / stack), or rectangle bounds.
 */
export function resolveInteractionGeometryDistance(
    hit: SceneHitTarget,
    pointer: ChartPoint,
    dimension: "x" | "y" | "xy"
): InteractionGeometryDistanceResult {
    let nearestPoint: ChartPoint;

    if (hit.point) {
        if (hit.rangeBand) {
            const minY = Math.min(hit.rangeBand.fromPoint.y, hit.rangeBand.toPoint.y);
            const maxY = Math.max(hit.rangeBand.fromPoint.y, hit.rangeBand.toPoint.y);
            const clampedY = Math.max(minY, Math.min(maxY, pointer.y));
            nearestPoint = { x: hit.point.x, y: clampedY };
        } else if (hit.lowPoint && hit.highPoint) {
            const minY = Math.min(hit.lowPoint.y, hit.highPoint.y);
            const maxY = Math.max(hit.lowPoint.y, hit.highPoint.y);
            const clampedY = Math.max(minY, Math.min(maxY, pointer.y));
            nearestPoint = { x: hit.point.x, y: clampedY };
        } else {
            nearestPoint = hit.point;
        }
    } else if (hit.bounds) {
        const bx = hit.bounds.x;
        const by = hit.bounds.y;
        const bw = hit.bounds.width;
        const bh = hit.bounds.height;
        const clampedX = Math.max(bx, Math.min(bx + bw, pointer.x));
        const clampedY = Math.max(by, Math.min(by + bh, pointer.y));
        nearestPoint = { x: clampedX, y: clampedY };
    } else if (hit.visualBounds) {
        const bx = hit.visualBounds.x;
        const by = hit.visualBounds.y;
        const bw = hit.visualBounds.width;
        const bh = hit.visualBounds.height;
        const clampedX = Math.max(bx, Math.min(bx + bw, pointer.x));
        const clampedY = Math.max(by, Math.min(by + bh, pointer.y));
        nearestPoint = { x: clampedX, y: clampedY };
    } else {
        nearestPoint = pointer;
    }

    const dx = nearestPoint.x - pointer.x;
    const dy = nearestPoint.y - pointer.y;

    let primaryDistance = 0;
    let secondaryDistance = 0;

    if (dimension === "x") {
        primaryDistance = Math.abs(dx);
        secondaryDistance = Math.abs(dy);
    } else if (dimension === "y") {
        primaryDistance = Math.abs(dy);
        secondaryDistance = Math.abs(dx);
    } else {
        primaryDistance = Math.sqrt(dx * dx + dy * dy);
        secondaryDistance = 0;
    }

    return { nearestPoint, primaryDistance, secondaryDistance };
}

export interface CartesianInteractionGeometryQuery {
    readonly dimension?: "x" | "y" | "xy";
    readonly maxCandidates?: number;
    readonly pixel: ChartPoint;
    readonly xAxisId?: string;
    readonly yAxisId?: string;
}

import { ChartDensityTracker } from "../layout/chart-density-instrumentation";

function computeTargetBounds(hit: SceneHitTarget): readonly [number, number, number, number] {
    if (hit.point) {
        if (hit.rangeBand) {
            const minY = Math.min(hit.rangeBand.fromPoint.y, hit.rangeBand.toPoint.y);
            const maxY = Math.max(hit.rangeBand.fromPoint.y, hit.rangeBand.toPoint.y);
            return [hit.point.x, minY, hit.point.x, maxY];
        }
        if (hit.lowPoint && hit.highPoint) {
            const minY = Math.min(hit.lowPoint.y, hit.highPoint.y);
            const maxY = Math.max(hit.lowPoint.y, hit.highPoint.y);
            return [hit.point.x, minY, hit.point.x, maxY];
        }
        return [hit.point.x, hit.point.y, hit.point.x, hit.point.y];
    }
    if (hit.bounds) {
        return [hit.bounds.x, hit.bounds.y, hit.bounds.x + hit.bounds.width, hit.bounds.y + hit.bounds.height];
    }
    if (hit.visualBounds) {
        return [
            hit.visualBounds.x,
            hit.visualBounds.y,
            hit.visualBounds.x + hit.visualBounds.width,
            hit.visualBounds.y + hit.visualBounds.height
        ];
    }
    return [0, 0, 0, 0];
}

function computeBoundsLowerBound(
    bounds: readonly [number, number, number, number],
    pointer: ChartPoint,
    dimension: "x" | "y" | "xy"
): number {
    const [minX, minY, maxX, maxY] = bounds;
    const dx = pointer.x < minX ? minX - pointer.x : pointer.x > maxX ? pointer.x - maxX : 0;
    const dy = pointer.y < minY ? minY - pointer.y : pointer.y > maxY ? pointer.y - maxY : 0;

    if (dimension === "x") {
        return dx;
    }
    if (dimension === "y") {
        return dy;
    }
    return Math.sqrt(dx * dx + dy * dy);
}

interface TargetItem {
    readonly bounds: readonly [number, number, number, number];
    readonly midX: number;
    readonly midY: number;
    readonly target: SceneHitTarget;
}

interface BVHNode {
    readonly bounds: readonly [number, number, number, number];
    readonly left?: BVHNode;
    readonly right?: BVHNode;
    readonly targets?: readonly TargetItem[];
}

function buildBVH(items: TargetItem[], depth = 0, preferredDimension?: "x" | "y"): BVHNode {
    if (items.length === 0) {
        return { bounds: [0, 0, 0, 0], targets: [] };
    }

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const item of items) {
        if (item.bounds[0] < minX) minX = item.bounds[0];
        if (item.bounds[1] < minY) minY = item.bounds[1];
        if (item.bounds[2] > maxX) maxX = item.bounds[2];
        if (item.bounds[3] > maxY) maxY = item.bounds[3];
    }

    const bounds: readonly [number, number, number, number] = [minX, minY, maxX, maxY];

    if (items.length <= 16) {
        return { bounds, targets: items };
    }

    const spanX = maxX - minX;
    const spanY = maxY - minY;
    const splitX =
        preferredDimension === "x"
            ? depth % 2 === 0 || spanX >= spanY
            : preferredDimension === "y"
              ? depth % 2 !== 0 && spanX > spanY
              : depth % 2 === 0
                ? spanX >= spanY
                : spanX > spanY;

    if (splitX) {
        items.sort((a, b) => a.midX - b.midX);
    } else {
        items.sort((a, b) => a.midY - b.midY);
    }

    const mid = items.length >> 1;
    const left = buildBVH(items.slice(0, mid), depth + 1, preferredDimension);
    const right = buildBVH(items.slice(mid), depth + 1, preferredDimension);

    return { bounds, left, right };
}

export class CartesianInteractionGeometryIndex {
    readonly #root: BVHNode;
    readonly #rootsByXAxis = new Map<string, BVHNode>();
    readonly #rootsByYAxis = new Map<string, BVHNode>();
    readonly #targets: readonly SceneHitTarget[];

    public constructor(targets: readonly SceneHitTarget[]) {
        this.#targets = targets;
        const allItems: TargetItem[] = new Array(targets.length);
        const itemsByXAxis = new Map<string, TargetItem[]>();
        const itemsByYAxis = new Map<string, TargetItem[]>();

        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const b = computeTargetBounds(target);
            const item: TargetItem = {
                bounds: b,
                midX: (b[0] + b[2]) / 2,
                midY: (b[1] + b[3]) / 2,
                target
            };
            allItems[i] = item;
            if (target.xAxisId) {
                let list = itemsByXAxis.get(target.xAxisId);
                if (!list) {
                    list = [];
                    itemsByXAxis.set(target.xAxisId, list);
                }
                list.push(item);
            }
            if (target.yAxisId) {
                let list = itemsByYAxis.get(target.yAxisId);
                if (!list) {
                    list = [];
                    itemsByYAxis.set(target.yAxisId, list);
                }
                list.push(item);
            }
        }

        this.#root = buildBVH(allItems);
        for (const [axisId, list] of itemsByXAxis.entries()) {
            this.#rootsByXAxis.set(axisId, buildBVH(list, 0, "x"));
        }
        for (const [axisId, list] of itemsByYAxis.entries()) {
            this.#rootsByYAxis.set(axisId, buildBVH(list, 0, "y"));
        }
    }

    public resolveNearest(query: CartesianInteractionGeometryQuery): readonly SceneHitTarget[] {
        const { dimension = "xy", maxCandidates = 1, pixel, xAxisId, yAxisId } = query;
        let root = this.#root;
        if (dimension === "y" && yAxisId && this.#rootsByYAxis.has(yAxisId)) {
            root = this.#rootsByYAxis.get(yAxisId)!;
        } else if (xAxisId && this.#rootsByXAxis.has(xAxisId)) {
            root = this.#rootsByXAxis.get(xAxisId)!;
        } else if (yAxisId && this.#rootsByYAxis.has(yAxisId)) {
            root = this.#rootsByYAxis.get(yAxisId)!;
        }

        if (this.#targets.length === 0) {
            return [];
        }

        const best: { distance: number; hit: SceneHitTarget; secondary: number }[] = [];

        const consider = (hit: SceneHitTarget) => {
            ChartDensityTracker.current?.onOrdinaryTargetEvaluated?.();
            if (xAxisId && hit.xAxisId && hit.xAxisId !== xAxisId) {
                return;
            }
            if (yAxisId && hit.yAxisId && hit.yAxisId !== yAxisId) {
                return;
            }
            const geom = resolveInteractionGeometryDistance(hit, pixel, dimension);
            const candidate = {
                distance: geom.primaryDistance,
                hit,
                secondary: geom.secondaryDistance
            };

            // Insertion sort into best (max length = maxCandidates)
            let insertPos = best.length;
            for (let i = 0; i < best.length; i++) {
                const b = best[i];
                if (Math.abs(candidate.distance - b.distance) > 1e-6) {
                    if (candidate.distance < b.distance) {
                        insertPos = i;
                        break;
                    }
                } else if (Math.abs(candidate.secondary - b.secondary) > 1e-6) {
                    if (candidate.secondary < b.secondary) {
                        insertPos = i;
                        break;
                    }
                } else if (candidate.hit.seriesId !== b.hit.seriesId) {
                    if (candidate.hit.seriesId < b.hit.seriesId) {
                        insertPos = i;
                        break;
                    }
                } else if ((candidate.hit.index ?? 0) < (b.hit.index ?? 0)) {
                    insertPos = i;
                    break;
                }
            }

            if (insertPos < maxCandidates) {
                best.splice(insertPos, 0, candidate);
                if (best.length > maxCandidates) {
                    best.pop();
                }
            }
        };

        const search = (node: BVHNode) => {
            ChartDensityTracker.current?.onOrdinaryGeometryNodeVisited?.();
            const nodeLowerBound = computeBoundsLowerBound(node.bounds, pixel, dimension);
            if (best.length >= maxCandidates) {
                const worstDist = best[best.length - 1].distance;
                if (nodeLowerBound > worstDist + 1e-6) {
                    return;
                }
            }

            if (node.targets) {
                for (const item of node.targets) {
                    consider(item.target);
                }
                return;
            }

            if (node.left && node.right) {
                const dLeft = computeBoundsLowerBound(node.left.bounds, pixel, dimension);
                const dRight = computeBoundsLowerBound(node.right.bounds, pixel, dimension);
                if (dLeft <= dRight) {
                    search(node.left);
                    search(node.right);
                } else {
                    search(node.right);
                    search(node.left);
                }
            } else if (node.left) {
                search(node.left);
            } else if (node.right) {
                search(node.right);
            }
        };

        search(root);

        return best.map(b => b.hit);
    }
}
