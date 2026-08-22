/**
 * Compact node metadata for the normalized-space marker hierarchy (§216).
 * Coordinates live in [0,1]² normalized base-scale space so the structure is
 * reusable across viewport changes (§217).
 */
export interface SpatialHierarchyNode {
    /** [x, y, width, height] in normalized space. */
    readonly bounds: readonly [number, number, number, number];
    childEnd: number;
    childStart: number;
    readonly count: number;
    readonly largestIndex: number;
    readonly representativeIndex: number;
    /** Inclusive start of this leaf's slice in the reordered point array (-1 for internal nodes). */
    sliceStart: number;
}

const rootBounds: readonly [number, number, number, number] = [0, 0, 1, 1];

const maxPointsPerLeaf = 16;
const maxDepth = 14;

/**
 * Quadtree-like hierarchy over normalized marker coordinates.
 * Nodes store compact metadata plus deterministic representatives:
 * point-nearest-node-centroid with lower source-index tie-break (§57),
 * and the largest bubble per relevant node (§58).
 */
export class CartesianSpatialDensityIndex {
    readonly #nodes: SpatialHierarchyNode[] = [];
    readonly #orderedPointIndices: Int32Array;
    readonly #pointCount: number;
    #root = -1;
    readonly #u: Float64Array;
    readonly #v: Float64Array;

    public constructor(u: Float64Array, v: Float64Array, sizes?: Float64Array) {
        this.#u = u;
        this.#v = v;
        this.#pointCount = u.length;
        const root = this.#buildNode(indicesRange(this.#pointCount), sizes, rootBounds as [number, number, number, number], 0);
        // Assign contiguous leaf slices in a pre-order walk.
        const ordered: number[] = [];
        this.#assignSlices(root, ordered);
        this.#orderedPointIndices = Int32Array.from(ordered);
        this.#root = root;
    }

    public get nodeCount(): number {
        return this.#nodes.length;
    }

    public get pointCount(): number {
        return this.#pointCount;
    }

    /**
     * Collects representative source indices for the visible normalized window
     * under a bounded marker budget. Zooming shrinks the window so progressively
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
        const stack: number[] = [this.#root];

        while (stack.length > 0 && emitted < budget) {
            const nodeIndex = stack.pop()!;
            const node = this.#nodes[nodeIndex];
            onNodeVisited?.();
            if (!intersects(node.bounds, window)) {
                continue;
            }

            // Nodes coarser than the viewed extent have representatives that may
            // fall far outside the window; descend instead of emitting them.
            const isLeaf = !(node.childStart >= 0 && node.childEnd > node.childStart);
            const fineEnough =
                node.bounds[2] <= Math.max(window[2], 1e-9) + 1e-9 &&
                node.bounds[3] <= Math.max(window[3], 1e-9) + 1e-9;
            if (!isLeaf && !fineEnough) {
                for (let c = node.childEnd - 1; c >= node.childStart; c--) {
                    stack.push(c);
                }
                continue;
            }

            if (emitted + 1 > budget) {
                break;
            }
            visit(node.representativeIndex);
            emitted++;

            // Preserve the largest bubble representative when distinct (§58).
            if (
                emitted < budget &&
                node.largestIndex !== node.representativeIndex &&
                node.largestIndex >= 0
            ) {
                visit(node.largestIndex);
                emitted++;
            }

            if (!isLeaf) {
                // Descend deeper so remaining budget resolves finer representatives.
                for (let c = node.childEnd - 1; c >= node.childStart; c--) {
                    stack.push(c);
                }
            } else if (node.sliceStart >= 0) {
                // Leaf: emit additional raw points from its slice while budget remains.
                for (let i = node.sliceStart; i < node.sliceStart + node.count && emitted < budget; i++) {
                    const idx = this.#orderedPointIndices[i];
                    if (idx !== node.representativeIndex && idx !== node.largestIndex) {
                        visit(idx);
                        emitted++;
                    }
                }
            }
        }
    }

    /**
     * Exact nearest-neighbor search traversing nodes by increasing
     * lower-bound distance (§220).
     */
    public resolveNearestNormalized(
        u: number,
        v: number,
        onNodeVisited?: () => void
    ): { readonly distanceSq: number; readonly index: number } | null {
        if (this.#root < 0) {
            return null;
        }

        let bestIndex = -1;
        let bestDistanceSq = Number.POSITIVE_INFINITY;
        const queue: Array<{ nodeIndex: number; priority: number }> = [
            { nodeIndex: this.#root, priority: minDistanceSq(this.#nodes[this.#root].bounds, u, v) }
        ];

        while (queue.length > 0) {
            let bestQueueIdx = 0;
            for (let i = 1; i < queue.length; i++) {
                if (queue[i].priority < queue[bestQueueIdx].priority) {
                    bestQueueIdx = i;
                }
            }
            const { nodeIndex, priority } = queue.splice(bestQueueIdx, 1)[0];
            if (priority > bestDistanceSq) {
                break;
            }
            const node = this.#nodes[nodeIndex];
            onNodeVisited?.();

            const consider = (idx: number): void => {
                const du = this.#u[idx] - u;
                const dv = this.#v[idx] - v;
                const d = du * du + dv * dv;
                if (d < bestDistanceSq || (d === bestDistanceSq && idx < bestIndex)) {
                    bestDistanceSq = d;
                    bestIndex = idx;
                }
            };

            consider(node.representativeIndex);

            if (node.childStart >= 0 && node.childEnd > node.childStart) {
                for (let c = node.childStart; c < node.childEnd; c++) {
                    queue.push({ nodeIndex: c, priority: minDistanceSq(this.#nodes[c].bounds, u, v) });
                }
            } else if (node.sliceStart >= 0) {
                for (let i = node.sliceStart; i < node.sliceStart + node.count; i++) {
                    consider(this.#orderedPointIndices[i]);
                }
            }
        }

        return bestIndex >= 0 ? { distanceSq: bestDistanceSq, index: bestIndex } : null;
    }

    /** Rectangular range query returning raw candidate indices (candidate discovery, not final acceptance). */
    public queryRangeNormalized(window: readonly [number, number, number, number], visit: (index: number) => void): void {
        if (this.#root < 0) {
            return;
        }
        const stack: number[] = [this.#root];
        while (stack.length > 0) {
            const nodeIndex = stack.pop()!;
            const node = this.#nodes[nodeIndex];
            if (!intersects(node.bounds, window)) {
                continue;
            }
            if (node.childStart >= 0 && node.childEnd > node.childStart) {
                for (let c = node.childStart; c < node.childEnd; c++) {
                    stack.push(c);
                }
            } else if (node.sliceStart >= 0) {
                for (let i = node.sliceStart; i < node.sliceStart + node.count; i++) {
                    visit(this.#orderedPointIndices[i]);
                }
            }
        }
    }

    #assignSlices(nodeIndex: number, ordered: number[]): void {
        const node = this.#nodes[nodeIndex];
        if (node.childStart >= 0 && node.childEnd > node.childStart) {
            for (let c = node.childStart; c < node.childEnd; c++) {
                this.#assignSlices(c, ordered);
            }
            return;
        }
        // Leaf slice: points were captured in deterministic source order during build.
        node.sliceStart = ordered.length;
        for (const idx of this.#leafPoints.get(nodeIndex) ?? []) {
            ordered.push(idx);
        }
    }

    #buildNode(
        indices: number[],
        sizes: Float64Array | undefined,
        bounds: [number, number, number, number],
        depth: number
    ): number {
        const nodeIndex = this.#nodes.length;
        const [bx, by, bw, bh] = bounds;
        const centroidU = bx + bw / 2;
        const centroidV = by + bh / 2;

        let representativeIndex = indices[0];
        let bestCentroidDistanceSq = Number.POSITIVE_INFINITY;
        let largestIndex = indices[0];
        let largestSize = Number.NEGATIVE_INFINITY;

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
        }

        const node: SpatialHierarchyNode = {
            bounds,
            childEnd: -1,
            childStart: -1,
            count: indices.length,
            largestIndex,
            representativeIndex,
            sliceStart: -1
        };
        this.#nodes.push(node);
        this.#leafPoints.set(nodeIndex, indices);

        if (indices.length <= maxPointsPerLeaf || depth >= maxDepth) {
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
            // Degenerate split (identical coordinates): keep as leaf.
            return nodeIndex;
        }

        node.childStart = this.#nodes.length;
        for (let q = 0; q < 4; q++) {
            if (quadrants[q].length === 0) {
                continue;
            }
            const childBounds: [number, number, number, number] = [
                q % 2 === 0 ? bx : midU,
                q < 2 ? by : midV,
                bw / 2,
                bh / 2
            ];
            this.#buildNode(quadrants[q], sizes, childBounds, depth + 1);
        }
        node.childEnd = this.#nodes.length;
        return nodeIndex;
    }

    readonly #leafPoints = new Map<number, number[]>();
}

function indicesRange(count: number): number[] {
    const out = new Array<number>(count);
    for (let i = 0; i < count; i++) {
        out[i] = i;
    }
    return out;
}

function intersects(a: readonly [number, number, number, number], b: readonly [number, number, number, number]): boolean {
    return !(a[0] + a[2] < b[0] || b[0] + b[2] < a[0] || a[1] + a[3] < b[1] || b[1] + b[3] < a[1]);
}

function minDistanceSq(bounds: readonly [number, number, number, number], u: number, v: number): number {
    const dx = Math.max(bounds[0] - u, 0, u - (bounds[0] + bounds[2]));
    const dy = Math.max(bounds[1] - v, 0, v - (bounds[1] + bounds[3]));
    return dx * dx + dy * dy;
}
