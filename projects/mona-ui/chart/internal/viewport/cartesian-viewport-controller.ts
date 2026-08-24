import type { ChartPoint } from "../../models/chart.models";
import type {
    ChartViewportAxisRef,
    ChartViewportConstraint,
    ChartViewportWindow
} from "../../models/chart-viewport.models";
import type {
    CartesianAxisCoordinateSnapshot,
    CartesianAxisCoordinateSpace
} from "./cartesian-axis-coordinate-space";
import { CartesianViewportConstraints } from "./cartesian-viewport-constraints";
import { resolveCartesianNormalizedBaseMapper } from "./cartesian-normalized-base-mapper";
import {
    areAxisViewportsEqual,
    isFullContinuousViewport,
    type InternalAxisViewport,
    type InternalCartesianViewportState,
    type InternalCategoryViewport,
    type InternalContinuousViewport
} from "./cartesian-viewport-normalizer";

export interface CartesianViewportTransformIntent {
    readonly anchor?: ChartPoint;
    readonly panDeltaPx?: ChartPoint;
    readonly zoomFactor?: number;
}

export interface ViewportControllerOptions {
    readonly clampToData?: boolean;
    readonly constraints?: readonly ChartViewportConstraint[];
    readonly minVisibleCategories?: number;
}

export interface ViewportOperationResult {
    readonly changed: boolean;
    readonly changedAxes: readonly ChartViewportAxisRef[];
    readonly viewport: InternalCartesianViewportState;
}

export class CartesianViewportController {
    static #transformCategoryAxis(
        currentWindow: InternalAxisViewport | undefined,
        snapshot: CartesianAxisCoordinateSnapshot,
        factor: number,
        deltaPx: number,
        anchorPixel: number,
        options?: ViewportControllerOptions
    ): InternalCategoryViewport | undefined {
        const baseCount = Array.isArray(snapshot.baseDomain) ? snapshot.baseDomain.length : 0;
        if (baseCount === 0) return undefined;

        const curStart = currentWindow && currentWindow.kind === "category" ? currentWindow.startIndex : 0;
        const curEnd = currentWindow && currentWindow.kind === "category" ? currentWindow.endIndexExclusive : baseCount;
        const curCount = curEnd - curStart;

        const [r0, r1] = snapshot.range;
        const plotSpan = Math.abs(r1 - r0);
        if (plotSpan === 0) return undefined;

        const minR = Math.min(r0, r1);
        const maxR = Math.max(r0, r1);
        const t = Math.max(0, Math.min(1, (anchorPixel - minR) / (maxR - minR)));

        const anchor = curStart + t * curCount;
        const newCount = curCount / factor;

        let nextStart = anchor - t * newCount;
        let nextEnd = nextStart + newCount;

        if (deltaPx !== 0) {
            const pixelsPerCat = Math.max(1e-4, plotSpan / curCount);
            const catDelta = -deltaPx / pixelsPerCat;
            nextStart += catDelta;
            nextEnd += catDelta;
        }

        const roundedStart = Math.round(nextStart);
        const roundedEnd = Math.round(nextEnd);

        const constraint = options?.constraints?.find(c => c.axis === snapshot.ref.axis && c.axisId === snapshot.ref.axisId);
        const [cStart, cEnd] = CartesianViewportConstraints.applyCategoryConstraints(
            roundedStart,
            roundedEnd,
            baseCount,
            constraint,
            options?.minVisibleCategories ?? 1,
            options?.clampToData !== false
        );

        if (cStart === 0 && cEnd === baseCount) {
            return undefined;
        }

        const catDomain = snapshot.baseDomain as readonly string[];
        return {
            axis: snapshot.ref.axis,
            axisId: snapshot.ref.axisId,
            endIndexExclusive: cEnd,
            firstVisibleKey: catDomain[cStart] !== undefined ? String(catDomain[cStart]) : undefined,
            kind: "category",
            lastVisibleKey: catDomain[cEnd - 1] !== undefined ? String(catDomain[cEnd - 1]) : undefined,
            startIndex: cStart
        };
    }

    static #transformContinuousAxis(
        currentWindow: InternalAxisViewport | undefined,
        snapshot: CartesianAxisCoordinateSnapshot,
        factor: number,
        deltaPx: number,
        anchorPixel: number,
        options?: ViewportControllerOptions
    ): InternalContinuousViewport | undefined {
        const [r0, r1] = snapshot.range;
        const rangeSpan = r1 - r0;
        if (rangeSpan === 0) return undefined;

        const b0 = snapshot.baseDomain[0] instanceof Date ? snapshot.baseDomain[0].getTime() : Number(snapshot.baseDomain[0]);
        const b1 = snapshot.baseDomain[1] instanceof Date ? snapshot.baseDomain[1].getTime() : Number(snapshot.baseDomain[1]);
        const baseMin = Math.min(b0, b1);
        const baseMax = Math.max(b0, b1);

        let curMin = baseMin;
        let curMax = baseMax;
        if (currentWindow && currentWindow.kind === "continuous") {
            curMin = currentWindow.min;
            curMax = currentWindow.max;
        }

        const pMinVal = snapshot.resolvedType === "time" || snapshot.resolvedType === "utc" ? new Date(curMin) : curMin;
        const pMaxVal = snapshot.resolvedType === "time" || snapshot.resolvedType === "utc" ? new Date(curMax) : curMax;

        const mapper = resolveCartesianNormalizedBaseMapper(snapshot);
        if (!mapper) {
            return undefined;
        }
        const u0 = mapper.map(pMinVal);
        const u1 = mapper.map(pMaxVal);
        if (u0 === undefined || u1 === undefined) {
            return undefined;
        }

        // Compute where the visible plot range [r0, r1] maps in the previous plot coordinate space
        const s0 = anchorPixel + (r0 - deltaPx - anchorPixel) / factor;
        const s1 = anchorPixel + (r1 - deltaPx - anchorPixel) / factor;

        const t0 = (s0 - r0) / rangeSpan;
        const t1 = (s1 - r0) / rangeSpan;

        let transformedU0 = u0 + t0 * (u1 - u0);
        let transformedU1 = u0 + t1 * (u1 - u0);
        const constraint = options?.constraints?.find(c => c.axis === snapshot.ref.axis && c.axisId === snapshot.ref.axisId);

        // A pure pan is translated in the authority mapper's normalized space.
        // Clamp that operation in the same space before inversion so repeated
        // over-pan frames reuse the exact boundary representation instead of
        // accumulating one-ULP differences in the semantic endpoint.
        const hasContinuousConstraint =
            constraint?.minSpan !== undefined || constraint?.maxSpan !== undefined || constraint?.maxZoom !== undefined;
        if (factor === 1 && options?.clampToData !== false && !hasContinuousConstraint) {
            const baseDomainU0 = mapper.map(snapshot.baseDomain[0]);
            const baseDomainU1 = mapper.map(snapshot.baseDomain[1]);
            if (baseDomainU0 !== undefined && baseDomainU1 !== undefined) {
                const normalizedMin = Math.min(baseDomainU0, baseDomainU1);
                const normalizedMax = Math.max(baseDomainU0, baseDomainU1);
                const normalizedSpan = Math.abs(u1 - u0);
                let normalizedWindowMin = Math.min(transformedU0, transformedU1);
                let normalizedWindowMax = Math.max(transformedU0, transformedU1);

                if (normalizedSpan < normalizedMax - normalizedMin) {
                    if (normalizedWindowMin < normalizedMin) {
                        normalizedWindowMin = normalizedMin;
                        normalizedWindowMax = normalizedMin + normalizedSpan;
                    }
                    if (normalizedWindowMax > normalizedMax) {
                        normalizedWindowMax = normalizedMax;
                        normalizedWindowMin = normalizedMax - normalizedSpan;
                    }

                    if (transformedU0 <= transformedU1) {
                        transformedU0 = normalizedWindowMin;
                        transformedU1 = normalizedWindowMax;
                    } else {
                        transformedU0 = normalizedWindowMax;
                        transformedU1 = normalizedWindowMin;
                    }
                }
            }
        }

        const inv0 = mapper.invert(transformedU0);
        const inv1 = mapper.invert(transformedU1);
        if (inv0 === undefined || inv1 === undefined) return undefined;

        const num0 = inv0 instanceof Date ? inv0.getTime() : Number(inv0);
        const num1 = inv1 instanceof Date ? inv1.getTime() : Number(inv1);
        if (!Number.isFinite(num0) || !Number.isFinite(num1) || num0 === num1) return undefined;

        const calcMin = Math.min(num0, num1);
        const calcMax = Math.max(num0, num1);

        const [cMin, cMax] = CartesianViewportConstraints.applyContinuousConstraints(
            calcMin,
            calcMax,
            baseMin,
            baseMax,
            constraint,
            options?.clampToData !== false,
            snapshot.baseScale,
            snapshot.resolvedType
        );

        if (isFullContinuousViewport(cMin, cMax, snapshot)) {
            return undefined;
        }

        return {
            axis: snapshot.ref.axis,
            axisId: snapshot.ref.axisId,
            kind: "continuous",
            max: cMax,
            min: cMin
        };
    }

    public static applyTransform(
        currentViewport: InternalCartesianViewportState,
        coordinateSpace: CartesianAxisCoordinateSpace,
        targetAxes: readonly ChartViewportAxisRef[],
        intent: CartesianViewportTransformIntent,
        options?: ViewportControllerOptions
    ): ViewportOperationResult {
        if (targetAxes.length === 0) {
            return { changed: false, changedAxes: [], viewport: currentViewport };
        }

        const factor = intent.zoomFactor ?? 1;
        if (!Number.isFinite(factor) || factor <= 0) {
            return { changed: false, changedAxes: [], viewport: currentViewport };
        }

        const deltaPx = intent.panDeltaPx ?? { x: 0, y: 0 };
        const anchor = intent.anchor ?? { x: 0, y: 0 };

        const nextX = new Map<string, InternalAxisViewport>(currentViewport.x);
        const nextY = new Map<string, InternalAxisViewport>(currentViewport.y);
        const changedAxes: ChartViewportAxisRef[] = [];

        for (const axisRef of targetAxes) {
            const snapshot = coordinateSpace.get(axisRef);
            if (!snapshot || !snapshot.valid) continue;

            const existingWindow = axisRef.axis === "x" ? currentViewport.x.get(axisRef.axisId) : currentViewport.y.get(axisRef.axisId);
            const anchorPixel = axisRef.axis === "x" ? anchor.x : anchor.y;
            const delta = axisRef.axis === "x" ? deltaPx.x : deltaPx.y;

            let nextWindow: InternalAxisViewport | undefined;

            if (snapshot.resolvedType === "category") {
                nextWindow = this.#transformCategoryAxis(
                    existingWindow,
                    snapshot,
                    factor,
                    delta,
                    anchorPixel,
                    options
                );
            } else {
                nextWindow = this.#transformContinuousAxis(
                    existingWindow,
                    snapshot,
                    factor,
                    delta,
                    anchorPixel,
                    options
                );
            }

            if (!areAxisViewportsEqual(existingWindow, nextWindow)) {
                if (nextWindow) {
                    if (axisRef.axis === "x") nextX.set(axisRef.axisId, nextWindow);
                    else nextY.set(axisRef.axisId, nextWindow);
                } else {
                    if (axisRef.axis === "x") nextX.delete(axisRef.axisId);
                    else nextY.delete(axisRef.axisId);
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

    public static fit(
        currentViewport: InternalCartesianViewportState,
        targetAxes?: readonly ChartViewportAxisRef[]
    ): ViewportOperationResult {
        const nextX = new Map<string, InternalAxisViewport>(currentViewport.x);
        const nextY = new Map<string, InternalAxisViewport>(currentViewport.y);
        const changedAxes: ChartViewportAxisRef[] = [];

        if (!targetAxes || targetAxes.length === 0) {
            for (const [id] of currentViewport.x) changedAxes.push({ axis: "x", axisId: id });
            for (const [id] of currentViewport.y) changedAxes.push({ axis: "y", axisId: id });
            return {
                changed: changedAxes.length > 0,
                changedAxes,
                viewport: { x: new Map(), y: new Map() }
            };
        }

        for (const ref of targetAxes) {
            if (ref.axis === "x" && nextX.has(ref.axisId)) {
                nextX.delete(ref.axisId);
                changedAxes.push(ref);
            } else if (ref.axis === "y" && nextY.has(ref.axisId)) {
                nextY.delete(ref.axisId);
                changedAxes.push(ref);
            }
        }

        return {
            changed: changedAxes.length > 0,
            changedAxes,
            viewport: { x: nextX, y: nextY }
        };
    }

    public static pan(
        currentViewport: InternalCartesianViewportState,
        coordinateSpace: CartesianAxisCoordinateSpace,
        targetAxes: readonly ChartViewportAxisRef[],
        deltaPx: ChartPoint,
        options?: ViewportControllerOptions
    ): ViewportOperationResult {
        return this.applyTransform(
            currentViewport,
            coordinateSpace,
            targetAxes,
            { panDeltaPx: deltaPx, zoomFactor: 1 },
            options
        );
    }

    public static reset(
        currentViewport: InternalCartesianViewportState,
        defaultViewport?: InternalCartesianViewportState,
        targetAxes?: readonly ChartViewportAxisRef[]
    ): ViewportOperationResult {
        if (!defaultViewport) {
            return this.fit(currentViewport, targetAxes);
        }

        const nextX = new Map<string, InternalAxisViewport>(currentViewport.x);
        const nextY = new Map<string, InternalAxisViewport>(currentViewport.y);
        const changedAxes: ChartViewportAxisRef[] = [];

        const restoreAxis = (ref: ChartViewportAxisRef) => {
            const defWin = ref.axis === "x" ? defaultViewport.x.get(ref.axisId) : defaultViewport.y.get(ref.axisId);
            const curWin = ref.axis === "x" ? nextX.get(ref.axisId) : nextY.get(ref.axisId);
            if (defWin) {
                if (!areAxisViewportsEqual(curWin, defWin)) {
                    if (ref.axis === "x") nextX.set(ref.axisId, defWin);
                    else nextY.set(ref.axisId, defWin);
                    changedAxes.push(ref);
                }
            } else if (curWin) {
                if (ref.axis === "x") nextX.delete(ref.axisId);
                else nextY.delete(ref.axisId);
                changedAxes.push(ref);
            }
        };

        if (!targetAxes || targetAxes.length === 0) {
            const allAxes = new Set<string>();
            for (const id of currentViewport.x.keys()) allAxes.add(`x:${id}`);
            for (const id of defaultViewport.x.keys()) allAxes.add(`x:${id}`);
            for (const id of currentViewport.y.keys()) allAxes.add(`y:${id}`);
            for (const id of defaultViewport.y.keys()) allAxes.add(`y:${id}`);
            for (const item of allAxes) {
                const [dim, axisId] = item.split(":");
                restoreAxis({ axis: dim as "x" | "y", axisId });
            }
        } else {
            for (const ref of targetAxes) {
                restoreAxis(ref);
            }
        }

        return {
            changed: changedAxes.length > 0,
            changedAxes,
            viewport: { x: nextX, y: nextY }
        };
    }

    public static setWindow(
        currentViewport: InternalCartesianViewportState,
        coordinateSpace: CartesianAxisCoordinateSpace,
        windowOrWindows: ChartViewportWindow | readonly ChartViewportWindow[],
        options?: ViewportControllerOptions
    ): ViewportOperationResult {
        const windows = Array.isArray(windowOrWindows) ? windowOrWindows : [windowOrWindows];
        const nextX = new Map<string, InternalAxisViewport>(currentViewport.x);
        const nextY = new Map<string, InternalAxisViewport>(currentViewport.y);
        const changedAxes: ChartViewportAxisRef[] = [];

        for (const win of windows) {
            const axisRef: ChartViewportAxisRef = { axis: win.axis, axisId: win.axisId };
            const snapshot = coordinateSpace.get(axisRef);
            if (!snapshot || !snapshot.valid) continue;

            const existingWindow = win.axis === "x" ? currentViewport.x.get(win.axisId) : currentViewport.y.get(win.axisId);
            let nextWin: InternalAxisViewport | undefined;

            switch (win.kind) {
                case "category": {
                    if (snapshot.resolvedType !== "category") {
                        continue;
                    }
                    const baseCount = Array.isArray(snapshot.baseDomain) ? snapshot.baseDomain.length : 0;
                    if (baseCount === 0) continue;
                    let startIndex = Math.floor(Number(win.startIndex));
                    let endIndex = Math.ceil(Number(win.endIndexExclusive));
                    if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex) || startIndex >= endIndex) {
                        continue;
                    }
                    startIndex = Math.max(0, Math.min(startIndex, baseCount - 1));
                    endIndex = Math.max(startIndex + 1, Math.min(endIndex, baseCount));

                    const catDomain = snapshot.baseDomain as readonly string[];
                    const firstVisibleKey = catDomain[startIndex] !== undefined ? String(catDomain[startIndex]) : undefined;
                    const lastVisibleKey = catDomain[endIndex - 1] !== undefined ? String(catDomain[endIndex - 1]) : undefined;

                    if (startIndex === 0 && endIndex === baseCount) {
                        nextWin = undefined;
                    } else {
                        nextWin = {
                            axis: win.axis,
                            axisId: win.axisId,
                            endIndexExclusive: endIndex,
                            firstVisibleKey,
                            kind: "category",
                            lastVisibleKey,
                            startIndex
                        };
                    }
                    break;
                }
                case "continuous": {
                    if (snapshot.resolvedType === "category") {
                        continue;
                    }
                    const minVal = win.min instanceof Date ? win.min.getTime() : Number(win.min);
                    const maxVal = win.max instanceof Date ? win.max.getTime() : Number(win.max);
                    if (!Number.isFinite(minVal) || !Number.isFinite(maxVal) || minVal >= maxVal) {
                        continue;
                    }

                    if (snapshot.resolvedType === "log") {
                        const bMin = Number(snapshot.baseDomain[0]);
                        const bMax = Number(snapshot.baseDomain[1]);
                        if (bMin > 0 && (minVal <= 0 || maxVal <= 0)) continue;
                        if (bMax < 0 && (minVal >= 0 || maxVal >= 0)) continue;
                    }

                    let finalMin = minVal;
                    let finalMax = maxVal;

                    if (options?.clampToData !== false && Array.isArray(snapshot.baseDomain) && snapshot.baseDomain.length >= 2) {
                        const bMin = snapshot.baseDomain[0] instanceof Date ? snapshot.baseDomain[0].getTime() : Number(snapshot.baseDomain[0]);
                        const bMax = snapshot.baseDomain[1] instanceof Date ? snapshot.baseDomain[1].getTime() : Number(snapshot.baseDomain[1]);
                        if (Number.isFinite(bMin) && Number.isFinite(bMax)) {
                            const span = finalMax - finalMin;
                            const baseSpan = bMax - bMin;
                            if (span >= baseSpan) {
                                finalMin = bMin;
                                finalMax = bMax;
                            } else {
                                if (finalMin < bMin) {
                                    finalMin = bMin;
                                    finalMax = bMin + span;
                                }
                                if (finalMax > bMax) {
                                    finalMax = bMax;
                                    finalMin = bMax - span;
                                }
                            }
                        }
                    }

                    if (Array.isArray(snapshot.baseDomain) && snapshot.baseDomain.length >= 2) {
                        if (isFullContinuousViewport(finalMin, finalMax, snapshot)) {
                            nextWin = undefined;
                        } else {
                            nextWin = {
                                axis: win.axis,
                                axisId: win.axisId,
                                kind: "continuous",
                                max: finalMax,
                                min: finalMin
                            };
                        }
                    } else {
                        nextWin = {
                            axis: win.axis,
                            axisId: win.axisId,
                            kind: "continuous",
                            max: finalMax,
                            min: finalMin
                        };
                    }
                    break;
                }
            }

            if (!areAxisViewportsEqual(existingWindow, nextWin)) {
                if (nextWin) {
                    if (win.axis === "x") nextX.set(win.axisId, nextWin);
                    else nextY.set(win.axisId, nextWin);
                } else {
                    if (win.axis === "x") nextX.delete(win.axisId);
                    else nextY.delete(win.axisId);
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

    public static zoom(
        currentViewport: InternalCartesianViewportState,
        coordinateSpace: CartesianAxisCoordinateSpace,
        targetAxes: readonly ChartViewportAxisRef[],
        factor: number,
        anchor: ChartPoint,
        options?: ViewportControllerOptions
    ): ViewportOperationResult {
        return this.applyTransform(
            currentViewport,
            coordinateSpace,
            targetAxes,
            { anchor, panDeltaPx: { x: 0, y: 0 }, zoomFactor: factor },
            options
        );
    }
}
