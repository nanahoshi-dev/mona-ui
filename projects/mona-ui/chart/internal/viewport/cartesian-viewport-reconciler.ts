import type { ChartViewportAxisRef, ChartViewportConstraint } from "../../models/chart-viewport.models";
import type { CartesianAxisCoordinateSpace } from "./cartesian-axis-coordinate-space";
import { CartesianViewportConstraints } from "./cartesian-viewport-constraints";
import {
    areAxisViewportsEqual,
    isFullContinuousViewport,
    type InternalAxisViewport,
    type InternalCartesianViewportState,
    type InternalCategoryViewport,
    type InternalContinuousViewport
} from "./cartesian-viewport-normalizer";

export interface ViewportReconciliationResult {
    readonly changed: boolean;
    readonly changedAxes: readonly ChartViewportAxisRef[];
    readonly viewport: InternalCartesianViewportState;
}

export class CartesianViewportReconciler {
    public static reconcile(
        currentViewport: InternalCartesianViewportState,
        coordinateSpace: CartesianAxisCoordinateSpace,
        options?: {
            clampToData?: boolean;
            constraints?: readonly ChartViewportConstraint[];
            minVisibleCategories?: number;
        }
    ): ViewportReconciliationResult {
        const nextX = new Map<string, InternalAxisViewport>(currentViewport.x);
        const nextY = new Map<string, InternalAxisViewport>(currentViewport.y);
        const changedAxes: ChartViewportAxisRef[] = [];

        // Reconcile X axes
        for (const [axisId, win] of currentViewport.x) {
            const snap = coordinateSpace.x.get(axisId);
            const axisRef: ChartViewportAxisRef = { axis: "x", axisId };

            if (!snap || !snap.valid) {
                nextX.delete(axisId);
                changedAxes.push(axisRef);
                continue;
            }

            const reconciledWin = this.#reconcileAxis(win, snap, options);
            if (!areAxisViewportsEqual(win, reconciledWin)) {
                if (reconciledWin) {
                    nextX.set(axisId, reconciledWin);
                } else {
                    nextX.delete(axisId);
                }
                changedAxes.push(axisRef);
            }
        }

        // Reconcile Y axes
        for (const [axisId, win] of currentViewport.y) {
            const snap = coordinateSpace.y.get(axisId);
            const axisRef: ChartViewportAxisRef = { axis: "y", axisId };

            if (!snap || !snap.valid) {
                nextY.delete(axisId);
                changedAxes.push(axisRef);
                continue;
            }

            const reconciledWin = this.#reconcileAxis(win, snap, options);
            if (!areAxisViewportsEqual(win, reconciledWin)) {
                if (reconciledWin) {
                    nextY.set(axisId, reconciledWin);
                } else {
                    nextY.delete(axisId);
                }
                changedAxes.push(axisRef);
            }
        }

        return {
            changed: changedAxes.length > 0,
            changedAxes,
            viewport: { x: nextX, y: nextY }
        };
    }

    static #reconcileAxis(
        win: InternalAxisViewport,
        snap: import("./cartesian-axis-coordinate-space").CartesianAxisCoordinateSnapshot,
        options?: {
            clampToData?: boolean;
            constraints?: readonly ChartViewportConstraint[];
            minVisibleCategories?: number;
        }
    ): InternalAxisViewport | undefined {
        const isCategory = snap.resolvedType === "category";

        if (isCategory) {
            if (win.kind !== "category") {
                return undefined;
            }

            const catDomain = snap.baseDomain as readonly string[];
            const baseCount = catDomain.length;
            if (baseCount === 0) return undefined;

            let startIndex = win.startIndex;
            let endIndex = win.endIndexExclusive;

            // Key-based tracking if keys were recorded
            if (win.firstVisibleKey !== undefined && win.lastVisibleKey !== undefined) {
                const firstIdx = catDomain.indexOf(win.firstVisibleKey);
                const lastIdx = catDomain.indexOf(win.lastVisibleKey);

                if (firstIdx !== -1 && lastIdx !== -1 && firstIdx <= lastIdx) {
                    startIndex = firstIdx;
                    endIndex = lastIdx + 1;
                } else if (firstIdx !== -1) {
                    const span = win.endIndexExclusive - win.startIndex;
                    startIndex = firstIdx;
                    endIndex = Math.min(baseCount, startIndex + span);
                }
            }

            const constraint = options?.constraints?.find(c => c.axis === snap.ref.axis && c.axisId === snap.ref.axisId);
            const [cStart, cEnd] = CartesianViewportConstraints.applyCategoryConstraints(
                startIndex,
                endIndex,
                baseCount,
                constraint,
                options?.minVisibleCategories ?? 1,
                options?.clampToData !== false
            );

            if (cStart === 0 && cEnd === baseCount) {
                return undefined;
            }

            return {
                axis: snap.ref.axis,
                axisId: snap.ref.axisId,
                endIndexExclusive: cEnd,
                firstVisibleKey: catDomain[cStart] !== undefined ? String(catDomain[cStart]) : undefined,
                kind: "category",
                lastVisibleKey: catDomain[cEnd - 1] !== undefined ? String(catDomain[cEnd - 1]) : undefined,
                startIndex: cStart
            };
        }

        // Continuous
        if (win.kind !== "continuous") {
            return undefined;
        }

        const b0 = snap.baseDomain[0] instanceof Date ? snap.baseDomain[0].getTime() : Number(snap.baseDomain[0]);
        const b1 = snap.baseDomain[1] instanceof Date ? snap.baseDomain[1].getTime() : Number(snap.baseDomain[1]);
        const baseMin = Math.min(b0, b1);
        const baseMax = Math.max(b0, b1);

        // Check log sign legality
        if (snap.resolvedType === "log") {
            if (baseMin > 0 && (win.min <= 0 || win.max <= 0)) {
                return undefined;
            }
            if (baseMax < 0 && (win.min >= 0 || win.max >= 0)) {
                return undefined;
            }
        }

        const constraint = options?.constraints?.find(c => c.axis === snap.ref.axis && c.axisId === snap.ref.axisId);
        const [cMin, cMax] = CartesianViewportConstraints.applyContinuousConstraints(
            win.min,
            win.max,
            baseMin,
            baseMax,
            constraint,
            options?.clampToData !== false,
            snap.baseScale,
            snap.resolvedType
        );

        if (isFullContinuousViewport(cMin, cMax, snap)) {
            return undefined;
        }

        return {
            axis: snap.ref.axis,
            axisId: snap.ref.axisId,
            kind: "continuous",
            max: cMax,
            min: cMin
        };
    }
}
