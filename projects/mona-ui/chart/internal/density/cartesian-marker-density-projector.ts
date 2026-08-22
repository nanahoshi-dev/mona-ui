import { ChartDensityTracker } from "../layout/chart-density-instrumentation";
import { CartesianSpatialDensityIndex } from "./cartesian-spatial-density-index";

export interface CartesianMarkerDensityProjection {
    readonly algorithm: "full" | "pixel";
    readonly centerVisibleCount: number;
    readonly indices: readonly number[];
    readonly renderCandidateCount: number;
    readonly renderedCount: number;
    readonly sampled: boolean;
    readonly selectedCount: number;
    readonly targetBudget: number;
}

export interface ProjectCartesianMarkerDensityInput {
    readonly centerWindow: readonly [number, number, number, number];
    readonly enabled: boolean;
    readonly maxPoints: number | null;
    readonly maxVisualRadius: number;
    readonly plotHeight: number;
    readonly plotWidth: number;
    readonly samplesPerPixel: number;
    readonly spatialIndex: CartesianSpatialDensityIndex;
    readonly threshold: number;
}

export function normalizeMarkerWindow(
    input: readonly [number, number, number, number]
): readonly [number, number, number, number] {
    const rawX = Number.isFinite(input[0]) ? input[0] : 0;
    const rawY = Number.isFinite(input[1]) ? input[1] : 0;
    const rawWidth = Number.isFinite(input[2]) ? input[2] : 0;
    const rawHeight = Number.isFinite(input[3]) ? input[3] : 0;
    const x = rawWidth < 0 ? rawX + rawWidth : rawX;
    const y = rawHeight < 0 ? rawY + rawHeight : rawY;
    return [x, y, Math.abs(rawWidth), Math.abs(rawHeight)];
}

/**
 * Normalizes orientation and finite values without imposing a [0,1] clipping
 * boundary. Base-normalized marker coordinates can validly be outside the
 * base extent when a viewport or radius halo reaches beyond it.
 *
 * Projects marker source indices using the same radius-aware candidate set for
 * activation, exact collection, and representative sampling.
 */
export function projectCartesianMarkerDensity(
    input: ProjectCartesianMarkerDensityInput
): CartesianMarkerDensityProjection {
    const centerWindow = normalizeMarkerWindow(input.centerWindow);
    const onSpatialNodeVisited = () => ChartDensityTracker.current?.onSpatialNodeVisited?.();
    const onSpatialPointMembershipTested = () => ChartDensityTracker.current?.onSpatialPointMembershipTested?.();
    const centerVisibleCount = input.spatialIndex.countPointsInWindow(
        centerWindow,
        () => onSpatialNodeVisited(),
        onSpatialPointMembershipTested
    );

    const haloU =
        input.plotWidth > 0 ? (Math.max(0, input.maxVisualRadius) / input.plotWidth) * Math.abs(centerWindow[2]) : 0;
    const haloV =
        input.plotHeight > 0 ? (Math.max(0, input.maxVisualRadius) / input.plotHeight) * Math.abs(centerWindow[3]) : 0;
    const centerMaxU = centerWindow[0] + centerWindow[2];
    const centerMaxV = centerWindow[1] + centerWindow[3];
    const candidateMinU = centerWindow[0] - haloU;
    const candidateMinV = centerWindow[1] - haloV;
    const candidateMaxU = centerMaxU + haloU;
    const candidateMaxV = centerMaxV + haloV;
    const renderCandidateWindow: readonly [number, number, number, number] = [
        candidateMinU,
        candidateMinV,
        Math.max(0, candidateMaxU - candidateMinU),
        Math.max(0, candidateMaxV - candidateMinV)
    ];
    const renderCandidateCount = input.spatialIndex.countPointsInWindow(
        renderCandidateWindow,
        () => onSpatialNodeVisited(),
        onSpatialPointMembershipTested
    );

    const exceedsThreshold = renderCandidateCount > input.threshold;
    const exceedsHardCap = input.maxPoints !== null && renderCandidateCount > input.maxPoints;
    const shouldSample = input.enabled && (exceedsThreshold || exceedsHardCap);

    const autoBudget = Math.max(
        64,
        Math.min(
            30_000,
            Math.floor(
                (input.plotWidth / Math.max(2, 8 / Math.max(1, input.samplesPerPixel))) *
                    (input.plotHeight / Math.max(2, 8 / Math.max(1, input.samplesPerPixel)))
            )
        )
    );
    const targetBudget = Math.max(1, Math.min(autoBudget, input.maxPoints ?? Number.POSITIVE_INFINITY));

    if (!shouldSample) {
        const indices =
            input.spatialIndex.collectIndicesInWindow(
                renderCandidateWindow,
                renderCandidateCount,
                onSpatialPointMembershipTested
            ) ?? [];
        ChartDensityTracker.current?.onMarkerCounts?.(
            centerVisibleCount,
            renderCandidateCount,
            indices.length,
            indices.length
        );
        return {
            algorithm: "full",
            centerVisibleCount,
            indices,
            renderCandidateCount,
            renderedCount: indices.length,
            sampled: false,
            selectedCount: indices.length,
            targetBudget
        };
    }

    const indices: number[] = [];
    input.spatialIndex.collectRepresentatives(
        renderCandidateWindow,
        targetBudget,
        index => indices.push(index),
        () => ChartDensityTracker.current?.onSpatialNodeVisited?.()
    );
    indices.sort((a, b) => a - b);
    ChartDensityTracker.current?.onMarkerCounts?.(
        centerVisibleCount,
        renderCandidateCount,
        indices.length,
        indices.length
    );
    return {
        algorithm: "pixel",
        centerVisibleCount,
        indices,
        renderCandidateCount,
        renderedCount: indices.length,
        sampled: true,
        selectedCount: indices.length,
        targetBudget
    };
}
