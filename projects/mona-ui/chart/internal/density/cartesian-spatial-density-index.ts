/**
 * Compact node metadata for the normalized-space marker hierarchy (§216).
 * Coordinates live in normalized base-scale space so the structure is reusable
 * across viewport changes (§217). The base extent maps to [0,1], but radius
 * halos, panned windows, and valid off-domain values may extend beyond it.
 */
export interface SpatialHierarchyNode {
    /** [x, y, width, height] in normalized space. */
    readonly bounds: readonly [number, number, number, number];
    readonly children?: readonly number[];
    readonly count: number;
    readonly largestIndex: number;
    readonly maxSize: number;
    readonly representativeIndex: number;
    readonly sliceCount: number;
    readonly sliceStart: number;
    readonly topmostIndex: number;
}

export interface SpatialDistanceMetric {
    /** Positive means the candidate wins when distance and secondary distance tie. */
    compareEqualDistanceIndices?(candidateIndex: number, currentBestIndex: number): number;
    distanceToPoint(index: number): number;
    lowerBoundDistanceToNode(bounds: readonly [number, number, number, number]): number;
    secondaryDistanceToPoint?(index: number): number;
}

export interface CartesianSpatialDensityBuildStats {
    readonly fallbackNodeCount: number;
    readonly fallbackRowsPartitioned: number;
    readonly fallbackSortInputTotal: number;
    readonly maxChildFanout: number;
    readonly maxFallbackDepth: number;
}

const maxPointsPerLeaf = 16;
const maxDepth = 14;

class DegenerateSizeThresholdIndex {
    readonly #indices: Int32Array;
    readonly #suffixMax: Float64Array;

    public constructor(indices: readonly number[], sizes: Float64Array) {
        this.#indices = Int32Array.from(indices);
        this.#suffixMax = new Float64Array(this.#indices.length);

        let maxSize = Number.NEGATIVE_INFINITY;
        for (let i = this.#indices.length - 1; i >= 0; i--) {
            const size = sizes[this.#indices[i]];
            if (Number.isFinite(size) && size > maxSize) {
                maxSize = size;
            }
            this.#suffixMax[i] = maxSize;
        }
    }

    public findTopmostAtLeast(threshold: number): number | null {
        if (this.#indices.length === 0 || this.#suffixMax[0] < threshold) {
            return null;
        }

        let low = 0;
        let high = this.#suffixMax.length;
        while (low < high) {
            const middle = Math.floor((low + high) / 2);
            if (this.#suffixMax[middle] >= threshold) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        return this.#indices[Math.max(0, low - 1)] ?? null;
    }

    public findTopmostProjectedAtLeast(
        threshold: number,
        project: (size: number) => number,
        epsilon: number
    ): number | null {
        if (this.#indices.length === 0 || !Number.isFinite(threshold)) {
            return null;
        }

        const qualifies = (position: number): boolean => {
            const projected = project(this.#suffixMax[position]);
            return Number.isFinite(projected) && projected >= threshold - epsilon;
        };
        if (!qualifies(0)) {
            return null;
        }

        let low = 0;
        let high = this.#suffixMax.length;
        while (low < high) {
            const middle = Math.floor((low + high) / 2);
            if (qualifies(middle)) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        return this.#indices[Math.max(0, low - 1)] ?? null;
    }
}

interface MutableHierarchyNode extends SpatialHierarchyNode {
    children?: readonly number[];
    degenerate?: boolean;
    sliceCount: number;
    sliceStart: number;
}

/**
 * Quadtree-like hierarchy over normalized marker coordinates.
 * Nodes store compact metadata plus deterministic representatives:
 * point-nearest-node-centroid with lower source-index tie-break (§57),
 * and the largest bubble per relevant node (§58).
 */
export class CartesianSpatialDensityIndex {
    readonly #buildStats: {
        fallbackNodeCount: number;
        fallbackRowsPartitioned: number;
        fallbackSortInputTotal: number;
        maxChildFanout: number;
        maxFallbackDepth: number;
    } = {
        fallbackNodeCount: 0,
        fallbackRowsPartitioned: 0,
        fallbackSortInputTotal: 0,
        maxChildFanout: 0,
        maxFallbackDepth: 0
    };
    readonly #degenerateSizeIndexes = new Map<number, DegenerateSizeThresholdIndex>();
    readonly #largestIndex: number;
    readonly #nodes: MutableHierarchyNode[] = [];
    readonly #orderedPointIndices: Int32Array;
    readonly #pointCount: number;
    readonly #root: number;
    readonly #u: Float64Array;
    readonly #v: Float64Array;
    public constructor(uCoords: Float64Array, vCoords: Float64Array, sizes?: Float64Array) {
        this.#u = uCoords;
        this.#v = vCoords;
        const n = uCoords.length;
        if (n === 0) {
            this.#orderedPointIndices = new Int32Array(0);
            this.#pointCount = 0;
            this.#root = -1;
            this.#largestIndex = -1;
            return;
        }

        const validIndices: number[] = [];
        let minU = Number.POSITIVE_INFINITY;
        let maxU = Number.NEGATIVE_INFINITY;
        let minV = Number.POSITIVE_INFINITY;
        let maxV = Number.NEGATIVE_INFINITY;
        let largestIndex = -1;
        let largestSize = Number.NEGATIVE_INFINITY;

        for (let i = 0; i < n; i++) {
            const u = uCoords[i];
            const v = vCoords[i];
            if (!Number.isFinite(u) || !Number.isFinite(v)) {
                continue;
            }
            if (sizes) {
                const s = sizes[i];
                if (!Number.isFinite(s) || s <= 0) {
                    continue;
                }
                if (s > largestSize || (s === largestSize && (largestIndex < 0 || i < largestIndex))) {
                    largestSize = s;
                    largestIndex = i;
                }
            }
            validIndices.push(i);
            if (u < minU) minU = u;
            if (u > maxU) maxU = u;
            if (v < minV) minV = v;
            if (v > maxV) maxV = v;
        }

        this.#pointCount = validIndices.length;
        if (validIndices.length === 0) {
            this.#orderedPointIndices = new Int32Array(0);
            this.#root = -1;
            this.#largestIndex = -1;
            return;
        }

        this.#largestIndex = largestIndex;

        const spanU = Math.max(0, maxU - minU);
        const spanV = Math.max(0, maxV - minV);
        const paddingU = Math.max(spanU * 0.01, 1e-12);
        const paddingV = Math.max(spanV * 0.01, 1e-12);
        const rootBounds: readonly [number, number, number, number] = [
            minU - paddingU,
            minV - paddingV,
            Math.max(spanU + paddingU * 2, 1e-12),
            Math.max(spanV + paddingV * 2, 1e-12)
        ];

        const leafPointsMap = new Map<number, number[]>();
        this.#root = this.#buildNode(validIndices, sizes, rootBounds, 0, leafPointsMap);

        const ordered = new Int32Array(validIndices.length);
        let cursor = 0;
        for (const [nodeIndex, pts] of leafPointsMap.entries()) {
            this.#nodes[nodeIndex].sliceStart = cursor;
            this.#nodes[nodeIndex].sliceCount = pts.length;
            if (sizes && this.#nodes[nodeIndex].degenerate) {
                this.#degenerateSizeIndexes.set(nodeIndex, new DegenerateSizeThresholdIndex(pts, sizes));
            }
            for (let i = 0; i < pts.length; i++) {
                ordered[cursor++] = pts[i];
            }
        }
        this.#orderedPointIndices = ordered;
    }

    public get nodeCount(): number {
        return this.#nodes.length;
    }

    public get pointCount(): number {
        return this.#pointCount;
    }

    public get rootBounds(): readonly [number, number, number, number] {
        return this.#root >= 0 ? this.#nodes[this.#root].bounds : [0, 0, 0, 0];
    }

    public get buildStats(): CartesianSpatialDensityBuildStats {
        return { ...this.#buildStats };
    }

    #buildBalancedFallbackChildren(
        node: MutableHierarchyNode,
        indices: number[],
        sizes: Float64Array | undefined,
        depth: number,
        leafPointsMap: Map<number, number[]>
    ): void {
        this.#buildStats.fallbackNodeCount++;
        this.#buildStats.fallbackRowsPartitioned += indices.length;
        this.#buildStats.fallbackSortInputTotal += indices.length;
        this.#buildStats.maxFallbackDepth = Math.max(this.#buildStats.maxFallbackDepth, depth);
        const tightBounds = computeTightBounds(indices, this.#u, this.#v);
        const spanU = tightBounds[2];
        const spanV = tightBounds[3];
        const sorted = [...indices].sort((a, b) => {
            const primary = spanU >= spanV ? this.#u[a] - this.#u[b] : this.#v[a] - this.#v[b];
            if (primary !== 0) return primary;
            const secondary = spanU >= spanV ? this.#v[a] - this.#v[b] : this.#u[a] - this.#u[b];
            return secondary !== 0 ? secondary : a - b;
        });
        const midpoint = Math.max(1, Math.min(sorted.length - 1, Math.floor(sorted.length / 2)));
        const left = sorted.slice(0, midpoint);
        const right = sorted.slice(midpoint);
        this.#setChildren(node, [
            this.#buildNode(left, sizes, computeTightBounds(left, this.#u, this.#v), depth + 1, leafPointsMap, true),
            this.#buildNode(right, sizes, computeTightBounds(right, this.#u, this.#v), depth + 1, leafPointsMap, true)
        ]);
    }

    #buildNode(
        indices: number[],
        sizes: Float64Array | undefined,
        bounds: readonly [number, number, number, number],
        depth: number,
        leafPointsMap: Map<number, number[]>,
        fallbackMode = false
    ): number {
        const nodeIndex = this.#nodes.length;
        const [bx, by, bw, bh] = bounds;
        const centroidU = bx + bw / 2;
        const centroidV = by + bh / 2;

        let representativeIndex = indices[0];
        let bestCentroidDistanceSq = Number.POSITIVE_INFINITY;
        let largestIndex = indices[0];
        let largestSize = Number.NEGATIVE_INFINITY;
        let topmostIndex = indices[0];

        for (const idx of indices) {
            const du = this.#u[idx] - centroidU;
            const dv = this.#v[idx] - centroidV;
            const d = du * du + dv * dv;
            if (d < bestCentroidDistanceSq || (d === bestCentroidDistanceSq && idx < representativeIndex)) {
                bestCentroidDistanceSq = d;
                representativeIndex = idx;
            }
            const size = sizes ? sizes[idx] : 0;
            if (size > largestSize || (size === largestSize && idx < largestIndex)) {
                largestSize = size;
                largestIndex = idx;
            }
            if (idx > topmostIndex) {
                topmostIndex = idx;
            }
        }

        const node: MutableHierarchyNode = {
            bounds,
            count: indices.length,
            largestIndex,
            maxSize: Math.max(0, largestSize),
            representativeIndex,
            sliceCount: 0,
            sliceStart: -1,
            topmostIndex
        };
        this.#nodes.push(node);

        const allIdentical = coordinatesEffectivelyIdentical(indices, this.#u, this.#v);
        if (allIdentical || indices.length <= maxPointsPerLeaf) {
            if (allIdentical) {
                node.degenerate = true;
            }
            leafPointsMap.set(nodeIndex, fallbackMode ? [...indices].sort((a, b) => a - b) : indices);
            return nodeIndex;
        }

        if (depth >= maxDepth) {
            this.#buildBalancedFallbackChildren(node, indices, sizes, depth, leafPointsMap);
            return nodeIndex;
        }

        const midU = bx + bw / 2;
        const midV = by + bh / 2;
        const quadrants: number[][] = [[], [], [], []];
        for (const idx of indices) {
            const right = this.#u[idx] >= midU;
            const bottom = this.#v[idx] >= midV;
            quadrants[(right ? 1 : 0) + (bottom ? 2 : 0)].push(idx);
        }
        const occupied = quadrants.filter(q => q.length > 0).length;
        if (occupied <= 1) {
            const allIdentical = coordinatesEffectivelyIdentical(indices, this.#u, this.#v);
            if (allIdentical) {
                node.degenerate = true;
                leafPointsMap.set(nodeIndex, fallbackMode ? [...indices].sort((a, b) => a - b) : indices);
                return nodeIndex;
            }

            const activeQuadrant = quadrants.findIndex(q => q.length > 0);
            const childBounds = computeTightBounds(quadrants[activeQuadrant], this.#u, this.#v);
            const childIdx = this.#buildNode(
                quadrants[activeQuadrant],
                sizes,
                childBounds,
                depth + 1,
                leafPointsMap,
                fallbackMode
            );
            this.#setChildren(node, [childIdx]);
            return nodeIndex;
        }

        const directChildren: number[] = [];
        for (let q = 0; q < 4; q++) {
            if (quadrants[q].length === 0) {
                continue;
            }
            const childBounds: readonly [number, number, number, number] = [
                q % 2 === 0 ? bx : midU,
                q < 2 ? by : midV,
                bw / 2,
                bh / 2
            ];
            const childIdx = this.#buildNode(quadrants[q], sizes, childBounds, depth + 1, leafPointsMap, fallbackMode);
            directChildren.push(childIdx);
        }
        this.#setChildren(node, directChildren);
        return nodeIndex;
    }

    #setChildren(node: MutableHierarchyNode, children: readonly number[]): void {
        node.children = children;
        this.#buildStats.maxChildFanout = Math.max(this.#buildStats.maxChildFanout, children.length);
    }

    /**
     * Collects all actual visible source indices in window if total <= maxCount (SD4-R11).
     */
    public collectIndicesInWindow(
        window: readonly [number, number, number, number],
        maxCount: number,
        onPointMembershipTested?: () => void
    ): readonly number[] | null {
        if (this.#root < 0) {
            return [];
        }
        const results: number[] = [];
        const stack: number[] = [this.#root];
        while (stack.length > 0) {
            const nodeIndex = stack.pop()!;
            const node = this.#nodes[nodeIndex];
            if (!intersects(node.bounds, window)) {
                continue;
            }
            if (node.degenerate) {
                onPointMembershipTested?.();
                if (!containsPoint(window, this.#u[node.representativeIndex], this.#v[node.representativeIndex])) {
                    continue;
                }
                if (results.length + node.count > maxCount) {
                    return null;
                }
                for (let i = node.sliceStart; i < node.sliceStart + node.sliceCount; i++) {
                    results.push(this.#orderedPointIndices[i]);
                }
                continue;
            }
            if (node.children && node.children.length > 0) {
                for (let i = node.children.length - 1; i >= 0; i--) {
                    stack.push(node.children[i]);
                }
            } else if (node.sliceStart >= 0) {
                for (let i = node.sliceStart; i < node.sliceStart + node.sliceCount; i++) {
                    const idx = this.#orderedPointIndices[i];
                    const u = this.#u[idx];
                    const v = this.#v[idx];
                    onPointMembershipTested?.();
                    if (containsPoint(window, u, v)) {
                        results.push(idx);
                        if (results.length > maxCount) {
                            return null;
                        }
                    }
                }
            }
        }
        results.sort((a, b) => a - b);
        return results;
    }

    /**
     * Collects representative source indices for the visible normalized window
     * under a bounded marker budget (SD4-R12). Zooming shrinks the window so progressively
     * deeper representatives emerge (zoom reveals detail).
     */
    public collectRepresentatives(
        window: readonly [number, number, number, number],
        budget: number,
        visit: (sourceIndex: number) => void,
        onNodeVisited?: () => void
    ): void {
        if (this.#root < 0 || budget <= 0) {
            return;
        }
        let emitted = 0;
        const seenIndices = new Set<number>();
        const stack: number[] = [this.#root];

        const isPointInWindow = (idx: number): boolean => {
            const u = this.#u[idx];
            const v = this.#v[idx];
            return containsPoint(window, u, v);
        };

        const emit = (idx: number): boolean => {
            if (emitted >= budget) return false;
            if (!isPointInWindow(idx)) return false;
            if (!seenIndices.has(idx)) {
                seenIndices.add(idx);
                visit(idx);
                emitted++;
                return true;
            }
            return false;
        };

        if (this.#largestIndex >= 0) {
            emit(this.#largestIndex);
        }

        while (stack.length > 0 && emitted < budget) {
            const nodeIndex = stack.pop()!;
            const node = this.#nodes[nodeIndex];
            onNodeVisited?.();
            if (!intersects(node.bounds, window)) {
                continue;
            }

            const isLeaf = !node.children || node.children.length === 0;
            const fineEnough = node.bounds[2] <= window[2] && node.bounds[3] <= window[3];
            if (!isLeaf && !fineEnough) {
                for (let i = node.children!.length - 1; i >= 0; i--) {
                    stack.push(node.children![i]);
                }
                continue;
            }

            if (emitted >= budget) {
                break;
            }
            emit(node.representativeIndex);

            // Preserve the largest bubble representative when distinct (§58).
            if (emitted < budget && node.largestIndex !== node.representativeIndex && node.largestIndex >= 0) {
                emit(node.largestIndex);
            }

            if (!isLeaf) {
                for (let i = node.children!.length - 1; i >= 0; i--) {
                    stack.push(node.children![i]);
                }
            } else if (node.sliceStart >= 0) {
                for (let i = node.sliceStart; i < node.sliceStart + node.sliceCount && emitted < budget; i++) {
                    const idx = this.#orderedPointIndices[i];
                    emit(idx);
                }
            }
        }
    }

    /**
     * Compatibility alias for countPointsInWindow.
     */
    public countInWindow(window: readonly [number, number, number, number]): number {
        return this.countPointsInWindow(window);
    }

    /**
     * Exact count of points in the visible normalized window (§219).
     * Fully contained internal nodes contribute their sub-tree count in O(1)
     * without leaf traversal.
     */
    public countPointsInWindow(
        window: readonly [number, number, number, number],
        onNodeVisited?: () => void,
        onPointMembershipTested?: () => void
    ): number {
        if (this.#root < 0) {
            return 0;
        }
        let total = 0;
        const stack: number[] = [this.#root];

        while (stack.length > 0) {
            const nodeIndex = stack.pop()!;
            const node = this.#nodes[nodeIndex];
            onNodeVisited?.();

            if (!intersects(node.bounds, window)) {
                continue;
            }

            if (contains(window, node.bounds)) {
                total += node.count;
                continue;
            }

            if (node.degenerate) {
                onPointMembershipTested?.();
                if (containsPoint(window, this.#u[node.representativeIndex], this.#v[node.representativeIndex])) {
                    total += node.count;
                }
                continue;
            }

            if (node.children && node.children.length > 0) {
                for (let i = node.children.length - 1; i >= 0; i--) {
                    stack.push(node.children[i]);
                }
            } else if (node.sliceStart >= 0) {
                for (let i = node.sliceStart; i < node.sliceStart + node.sliceCount; i++) {
                    const idx = this.#orderedPointIndices[i];
                    const u = this.#u[idx];
                    const v = this.#v[idx];
                    onPointMembershipTested?.();
                    if (containsPoint(window, u, v)) {
                        total++;
                    }
                }
            }
        }
        return total;
    }

    /** Returns the topmost source mark in a degenerate leaf meeting a size threshold. */
    public findTopmostIndexInDegenerateLeafAtLeast(nodeIndex: number, threshold: number): number | null {
        return this.#degenerateSizeIndexes.get(nodeIndex)?.findTopmostAtLeast(threshold) ?? null;
    }

    /** Returns the topmost source mark meeting a monotone projected-size threshold. */
    public findTopmostIndexInDegenerateLeafProjectedAtLeast(
        nodeIndex: number,
        threshold: number,
        project: (size: number) => number,
        epsilon = 0
    ): number | null {
        return (
            this.#degenerateSizeIndexes.get(nodeIndex)?.findTopmostProjectedAtLeast(threshold, project, epsilon) ?? null
        );
    }

    public getNode(index: number): SpatialHierarchyNode | undefined {
        return this.#nodes[index];
    }

    /**
     * Bounded pointer-neighborhood discovery. Degenerate identical-position
     * leaves expose only their painter-topmost and largest representatives;
     * the provider performs exact current-pixel containment afterward.
     */
    public queryPointerNeighborhood(
        window: readonly [number, number, number, number],
        visit: (index: number) => void,
        onNodeVisited?: () => void,
        onDegenerateLeaf?: (nodeIndex: number, node: SpatialHierarchyNode) => void
    ): void {
        if (this.#root < 0) {
            return;
        }
        const stack: number[] = [this.#root];
        while (stack.length > 0) {
            const nodeIndex = stack.pop()!;
            const node = this.#nodes[nodeIndex];
            onNodeVisited?.();
            if (!intersects(node.bounds, window)) {
                continue;
            }

            if (node.children && node.children.length > 0) {
                for (let i = node.children.length - 1; i >= 0; i--) {
                    stack.push(node.children[i]);
                }
                continue;
            }

            if (node.degenerate) {
                if (onDegenerateLeaf) {
                    onDegenerateLeaf(nodeIndex, node);
                    continue;
                }
                visit(node.topmostIndex);
                if (node.largestIndex !== node.topmostIndex && node.largestIndex >= 0) {
                    visit(node.largestIndex);
                }
                continue;
            }

            if (node.sliceStart >= 0) {
                for (let i = node.sliceStart; i < node.sliceStart + node.sliceCount; i++) {
                    visit(this.#orderedPointIndices[i]);
                }
            }
        }
    }

    /** Rectangular range query returning raw candidate indices (candidate discovery, not final acceptance). */
    public queryRangeNormalized(
        window: readonly [number, number, number, number],
        visit: (index: number) => void,
        onNodeVisited?: () => void
    ): void {
        if (this.#root < 0) {
            return;
        }
        const stack: number[] = [this.#root];
        while (stack.length > 0) {
            const nodeIndex = stack.pop()!;
            const node = this.#nodes[nodeIndex];
            onNodeVisited?.();
            if (!intersects(node.bounds, window)) {
                continue;
            }
            if (node.children && node.children.length > 0) {
                for (const c of node.children) {
                    stack.push(c);
                }
            } else if (node.sliceStart >= 0) {
                for (let i = node.sliceStart; i < node.sliceStart + node.sliceCount; i++) {
                    visit(this.#orderedPointIndices[i]);
                }
            }
        }
    }

    /**
     * Exact nearest-neighbor search traversing nodes by increasing
     * lower-bound distance (§220 / SD3-R06 / SD4-R30).
     */
    public resolveNearestNormalized(
        u: number,
        v: number,
        onNodeVisited?: () => void,
        metric?: SpatialDistanceMetric,
        onFrontierSize?: (size: number) => void
    ): { readonly distanceSq: number; readonly index: number } | null {
        if (this.#root < 0) {
            return null;
        }

        let bestIndex = -1;
        let bestDistance = Number.POSITIVE_INFINITY;
        let bestSecDistance = Number.POSITIVE_INFINITY;
        const rootBounds = this.#nodes[this.#root].bounds;
        const rootPriority = metric ? metric.lowerBoundDistanceToNode(rootBounds) : minDistanceSq(rootBounds, u, v);

        const queue: Array<{ nodeIndex: number; priority: number }> = [
            { nodeIndex: this.#root, priority: rootPriority }
        ];
        onFrontierSize?.(queue.length);

        while (queue.length > 0) {
            let bestQueueIdx = 0;
            for (let i = 1; i < queue.length; i++) {
                if (queue[i].priority < queue[bestQueueIdx].priority) {
                    bestQueueIdx = i;
                }
            }
            const { nodeIndex, priority } = queue.splice(bestQueueIdx, 1)[0];
            onFrontierSize?.(queue.length);
            if (priority > bestDistance) {
                break;
            }
            const node = this.#nodes[nodeIndex];
            onNodeVisited?.();

            const consider = (idx: number): void => {
                let d = 0;
                let secD = 0;
                if (metric) {
                    d = metric.distanceToPoint(idx);
                    secD = metric.secondaryDistanceToPoint ? metric.secondaryDistanceToPoint(idx) : 0;
                } else {
                    const du = this.#u[idx] - u;
                    const dv = this.#v[idx] - v;
                    d = du * du + dv * dv;
                    secD = 0;
                }
                if (
                    d < bestDistance ||
                    (areSpatialDistancesEqual(d, bestDistance) &&
                        (secD < bestSecDistance ||
                            (areSpatialDistancesEqual(secD, bestSecDistance) &&
                                (metric?.compareEqualDistanceIndices
                                    ? metric.compareEqualDistanceIndices(idx, bestIndex) > 0
                                    : idx < bestIndex))))
                ) {
                    bestDistance = d;
                    bestSecDistance = secD;
                    bestIndex = idx;
                }
            };

            consider(node.representativeIndex);

            if (node.degenerate) {
                // Identical-coordinate marker leaves need the caller's tie policy;
                // the representative is intentionally not a universal painter-order choice.
                consider(node.topmostIndex);
                continue;
            }

            if (node.children && node.children.length > 0) {
                for (const c of node.children) {
                    const childBounds = this.#nodes[c].bounds;
                    const childPriority = metric
                        ? metric.lowerBoundDistanceToNode(childBounds)
                        : minDistanceSq(childBounds, u, v);
                    queue.push({ nodeIndex: c, priority: childPriority });
                }
                onFrontierSize?.(queue.length);
            } else if (node.sliceStart >= 0) {
                for (let i = node.sliceStart; i < node.sliceStart + node.sliceCount; i++) {
                    consider(this.#orderedPointIndices[i]);
                }
            }
        }

        return bestIndex >= 0 ? { distanceSq: bestDistance, index: bestIndex } : null;
    }

    /**
     * Finds the highest source-order point that satisfies an exact predicate.
     * Spatial bounds prune impossible subtrees while source-order traversal
     * lets marker interaction stop as soon as the topmost qualifying mark is found.
     */
    public resolveTopmostPointerCandidate(
        window: readonly [number, number, number, number],
        matches: (index: number) => boolean,
        onNodeVisited?: () => void,
        onCandidateVisited?: () => void,
        resolveDegenerate?: (nodeIndex: number, node: SpatialHierarchyNode) => number | null | undefined,
        onFrontierSize?: (size: number) => void
    ): number | null {
        if (this.#root < 0) {
            return null;
        }

        let bestCandidate = -1;
        const pending: number[] = [this.#root];
        onFrontierSize?.(pending.length);
        while (pending.length > 0) {
            let next = 0;
            for (let i = 1; i < pending.length; i++) {
                if (this.#nodes[pending[i]].topmostIndex > this.#nodes[pending[next]].topmostIndex) {
                    next = i;
                }
            }
            const nodeIndex = pending.splice(next, 1)[0];
            const node = this.#nodes[nodeIndex];
            if (node.topmostIndex <= bestCandidate) {
                onFrontierSize?.(pending.length);
                continue;
            }
            onNodeVisited?.();
            if (!intersects(node.bounds, window)) {
                onFrontierSize?.(pending.length);
                continue;
            }

            if (node.children && node.children.length > 0) {
                pending.push(...node.children);
                onFrontierSize?.(pending.length);
                continue;
            }

            let localCandidate: number | null | undefined;
            if (node.degenerate && resolveDegenerate) {
                localCandidate = resolveDegenerate(nodeIndex, node);
            }
            if (localCandidate === undefined) {
                localCandidate = this.findBestMatchingSourceInLeaf(node, matches, bestCandidate, onCandidateVisited);
            }
            if (localCandidate !== null && localCandidate !== undefined) {
                bestCandidate = Math.max(bestCandidate, localCandidate);
            }
            onFrontierSize?.(pending.length);
        }
        return bestCandidate >= 0 ? bestCandidate : null;
    }

    private findBestMatchingSourceInLeaf(
        node: SpatialHierarchyNode,
        matches: (index: number) => boolean,
        lowerBoundExclusive: number,
        onCandidateVisited?: () => void
    ): number | null {
        for (let i = node.sliceStart + node.sliceCount - 1; i >= node.sliceStart; i--) {
            const index = this.#orderedPointIndices[i];
            if (index <= lowerBoundExclusive) {
                break;
            }
            onCandidateVisited?.();
            if (matches(index)) {
                return index;
            }
        }
        return null;
    }
}

function containsPoint(window: readonly [number, number, number, number], u: number, v: number): boolean {
    return u >= window[0] && u <= window[0] + window[2] && v >= window[1] && v <= window[1] + window[3];
}

function areSpatialDistancesEqual(a: number, b: number): boolean {
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return false;
    }
    if (a === b) {
        return true;
    }
    const scale = Math.max(Math.abs(a), Math.abs(b), Number.MIN_VALUE);
    return Math.abs(a - b) <= Number.EPSILON * scale * 8;
}

function intersects(
    a: readonly [number, number, number, number],
    b: readonly [number, number, number, number]
): boolean {
    return !(a[0] + a[2] < b[0] || b[0] + b[2] < a[0] || a[1] + a[3] < b[1] || b[1] + b[3] < a[1]);
}

function contains(
    outer: readonly [number, number, number, number],
    inner: readonly [number, number, number, number]
): boolean {
    return (
        inner[0] >= outer[0] &&
        inner[1] >= outer[1] &&
        inner[0] + inner[2] <= outer[0] + outer[2] &&
        inner[1] + inner[3] <= outer[1] + outer[3]
    );
}

function minDistanceSq(bounds: readonly [number, number, number, number], u: number, v: number): number {
    const dx = Math.max(bounds[0] - u, 0, u - (bounds[0] + bounds[2]));
    const dy = Math.max(bounds[1] - v, 0, v - (bounds[1] + bounds[3]));
    return dx * dx + dy * dy;
}

function coordinatesEffectivelyIdentical(indices: readonly number[], u: Float64Array, v: Float64Array): boolean {
    if (indices.length < 2) {
        return true;
    }
    const first = indices[0];
    const u0 = u[first];
    const v0 = v[first];
    for (let i = 1; i < indices.length; i++) {
        const index = indices[i];
        if (u[index] !== u0 || v[index] !== v0) {
            return false;
        }
    }
    return true;
}

function computeTightBounds(
    indices: readonly number[],
    u: Float64Array,
    v: Float64Array
): readonly [number, number, number, number] {
    let minU = Number.POSITIVE_INFINITY;
    let maxU = Number.NEGATIVE_INFINITY;
    let minV = Number.POSITIVE_INFINITY;
    let maxV = Number.NEGATIVE_INFINITY;
    for (const index of indices) {
        minU = Math.min(minU, u[index]);
        maxU = Math.max(maxU, u[index]);
        minV = Math.min(minV, v[index]);
        maxV = Math.max(maxV, v[index]);
    }

    const spanU = Math.max(0, maxU - minU);
    const spanV = Math.max(0, maxV - minV);
    const magnitudeU = Math.max(1, Math.abs(minU), Math.abs(maxU));
    const magnitudeV = Math.max(1, Math.abs(minV), Math.abs(maxV));
    const paddingU = Math.max(spanU * 0.01, magnitudeU * Number.EPSILON * 8, 1e-15);
    const paddingV = Math.max(spanV * 0.01, magnitudeV * Number.EPSILON * 8, 1e-15);
    return [
        minU - paddingU,
        minV - paddingV,
        Math.max(spanU + paddingU * 2, 1e-15),
        Math.max(spanV + paddingV * 2, 1e-15)
    ];
}
