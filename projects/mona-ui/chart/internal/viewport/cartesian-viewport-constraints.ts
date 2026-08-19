import type { ChartViewportConstraint } from "../../models/chart-viewport.models";
import type { ChartContinuousPositionScale, ChartPositionScale, ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import { clamp } from "../utils/number-utils";

export class CartesianViewportConstraints {
    public static clampContinuousDomainPreservingSpan(
        min: number,
        max: number,
        baseMin: number,
        baseMax: number,
        baseScale?: ChartPositionScale<unknown>,
        resolvedType?: ResolvedChartCartesianAxisType
    ): [number, number] {
        const span = max - min;
        const baseSpan = baseMax - baseMin;

        if (span >= baseSpan) {
            return [baseMin, baseMax];
        }

        // For nonlinear scales, clamp in base pixel space
        if (
            baseScale &&
            (resolvedType === "log" ||
                resolvedType === "symlog" ||
                resolvedType === "pow" ||
                resolvedType === "sqrt")
        ) {
            const continuousBase = baseScale as ChartContinuousPositionScale<number>;
            const pMin = continuousBase.map(min);
            const pMax = continuousBase.map(max);
            const range = continuousBase.range();

            if (pMin !== undefined && pMax !== undefined) {
                const r0 = Math.min(range[0], range[1]);
                const r1 = Math.max(range[0], range[1]);
                const pSpan = Math.abs(pMax - pMin);
                const pStart = Math.min(pMin, pMax);

                let nextP0 = pStart;
                let nextP1 = pStart + pSpan;

                if (nextP0 < r0) {
                    nextP0 = r0;
                    nextP1 = r0 + pSpan;
                }
                if (nextP1 > r1) {
                    nextP1 = r1;
                    nextP0 = r1 - pSpan;
                }

                const inv0 = continuousBase.invert(nextP0);
                const inv1 = continuousBase.invert(nextP1);
                if (Number.isFinite(inv0) && Number.isFinite(inv1)) {
                    return [Math.min(inv0, inv1), Math.max(inv0, inv1)];
                }
            }
        }

        let clampedMin = min;
        let clampedMax = max;

        if (clampedMin < baseMin) {
            clampedMin = baseMin;
            clampedMax = baseMin + span;
        }
        if (clampedMax > baseMax) {
            clampedMax = baseMax;
            clampedMin = baseMax - span;
        }

        return [clampedMin, clampedMax];
    }

    public static applyContinuousConstraints(
        min: number,
        max: number,
        baseMin: number,
        baseMax: number,
        constraint?: ChartViewportConstraint,
        clampToData: boolean = true,
        baseScale?: ChartPositionScale<unknown>,
        resolvedType?: ResolvedChartCartesianAxisType
    ): [number, number] {
        let curMin = min;
        let curMax = max;

        if (curMin > curMax) {
            const tmp = curMin;
            curMin = curMax;
            curMax = tmp;
        }

        const baseSpan = baseMax - baseMin;

        // Apply minSpan
        if (constraint?.minSpan !== undefined && constraint.minSpan > 0) {
            const span = curMax - curMin;
            if (span < constraint.minSpan) {
                const mid = (curMin + curMax) / 2;
                curMin = mid - constraint.minSpan / 2;
                curMax = mid + constraint.minSpan / 2;
            }
        }

        // Apply maxSpan
        if (constraint?.maxSpan !== undefined && constraint.maxSpan > 0) {
            const span = curMax - curMin;
            if (span > constraint.maxSpan) {
                const mid = (curMin + curMax) / 2;
                curMin = mid - constraint.maxSpan / 2;
                curMax = mid + constraint.maxSpan / 2;
            }
        }

        // Apply maxZoom (relative to baseSpan)
        if (constraint?.maxZoom !== undefined && constraint.maxZoom > 1 && baseSpan > 0) {
            const minAllowedSpan = baseSpan / constraint.maxZoom;
            const span = curMax - curMin;
            if (span < minAllowedSpan) {
                const mid = (curMin + curMax) / 2;
                curMin = mid - minAllowedSpan / 2;
                curMax = mid + minAllowedSpan / 2;
            }
        }

        if (clampToData) {
            return this.clampContinuousDomainPreservingSpan(
                curMin,
                curMax,
                baseMin,
                baseMax,
                baseScale,
                resolvedType
            );
        }

        return [curMin, curMax];
    }

    public static applyCategoryConstraints(
        startIndex: number,
        endIndexExclusive: number,
        baseCount: number,
        constraint?: ChartViewportConstraint,
        defaultMinCategories: number = 1,
        clampToData: boolean = true
    ): [number, number] {
        if (baseCount <= 0) return [0, 0];

        let start = Math.floor(startIndex);
        let end = Math.ceil(endIndexExclusive);

        const minVisible = Math.max(
            1,
            constraint?.minVisibleCategories ?? defaultMinCategories
        );
        const maxVisible = Math.min(
            baseCount,
            constraint?.maxVisibleCategories ?? baseCount
        );

        if (clampToData) {
            start = clamp(start, 0, baseCount - 1);
            end = clamp(end, start + 1, baseCount);
        }

        let span = end - start;
        if (span < minVisible) {
            span = Math.min(minVisible, baseCount);
            if (start + span > baseCount) {
                start = Math.max(0, baseCount - span);
            }
            end = start + span;
        } else if (span > maxVisible) {
            span = maxVisible;
            end = start + span;
        }

        if (clampToData) {
            if (start < 0) {
                start = 0;
                end = Math.min(baseCount, start + span);
            }
            if (end > baseCount) {
                end = baseCount;
                start = Math.max(0, end - span);
            }
        }

        return [start, end];
    }
}
