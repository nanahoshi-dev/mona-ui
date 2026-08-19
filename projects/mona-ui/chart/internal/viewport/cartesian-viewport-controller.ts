import type { ChartPoint } from "../../models/chart.models";
import type {
    ChartViewportAxisRef,
    ChartViewportConstraint,
    ChartViewportWindow
} from "../../models/chart-viewport.models";
import type {
    ChartContinuousPositionScale
} from "../scale/chart-scale";
import type {
    CartesianAxisCoordinateSnapshot,
    CartesianAxisCoordinateSpace
} from "./cartesian-axis-coordinate-space";
import { CartesianViewportConstraints } from "./cartesian-viewport-constraints";
import {
    areAxisViewportsEqual,
    type InternalAxisViewport,
    type InternalCartesianViewportState,
    type InternalCategoryViewport,
    type InternalContinuousViewport
} from "./cartesian-viewport-normalizer";

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
    public static zoom(
        currentViewport: InternalCartesianViewportState,
        coordinateSpace: CartesianAxisCoordinateSpace,
        targetAxes: readonly ChartViewportAxisRef[],
        factor: number,
        anchor: ChartPoint,
        options?: ViewportControllerOptions
    ): ViewportOperationResult {
        if (!Number.isFinite(factor) || factor <= 0 || targetAxes.length === 0) {
            return { changed: false, changedAxes: [], viewport: currentViewport };
        }

        const nextX = new Map<string, InternalAxisViewport>(currentViewport.x);
        const nextY = new Map<string, InternalAxisViewport>(currentViewport.y);
        const changedAxes: ChartViewportAxisRef[] = [];

        for (const axisRef of targetAxes) {
            const snapshot = coordinateSpace.get(axisRef);
            if (!snapshot || !snapshot.valid) continue;

            const existingWindow = axisRef.axis === "x" ? currentViewport.x.get(axisRef.axisId) : currentViewport.y.get(axisRef.axisId);
            const anchorPixel = axisRef.axis === "x" ? anchor.x : anchor.y;

            if (snapshot.resolvedType === "category") {
                const nextWindow = this.#zoomCategoryAxis(
                    existingWindow,
                    snapshot,
                    factor,
                    anchorPixel,
                    options
                );
                if (nextWindow && !areAxisViewportsEqual(existingWindow, nextWindow)) {
                    if (axisRef.axis === "x") nextX.set(axisRef.axisId, nextWindow);
                    else nextY.set(axisRef.axisId, nextWindow);
                    changedAxes.push(axisRef);
                }
            } else {
                const nextWindow = this.#zoomContinuousAxis(
                    existingWindow,
                    snapshot,
                    factor,
                    anchorPixel,
                    options
                );
                if (nextWindow && !areAxisViewportsEqual(existingWindow, nextWindow)) {
                    if (axisRef.axis === "x") nextX.set(axisRef.axisId, nextWindow);
                    else nextY.set(axisRef.axisId, nextWindow);
                    changedAxes.push(axisRef);
                }
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
        if (targetAxes.length === 0) {
            return { changed: false, changedAxes: [], viewport: currentViewport };
        }

        const nextX = new Map<string, InternalAxisViewport>(currentViewport.x);
        const nextY = new Map<string, InternalAxisViewport>(currentViewport.y);
        const changedAxes: ChartViewportAxisRef[] = [];

        for (const axisRef of targetAxes) {
            const snapshot = coordinateSpace.get(axisRef);
            if (!snapshot || !snapshot.valid) continue;

            const existingWindow = axisRef.axis === "x" ? currentViewport.x.get(axisRef.axisId) : currentViewport.y.get(axisRef.axisId);
            const delta = axisRef.axis === "x" ? deltaPx.x : deltaPx.y;

            if (snapshot.resolvedType === "category") {
                const nextWindow = this.#panCategoryAxis(
                    existingWindow,
                    snapshot,
                    delta,
                    options
                );
                if (nextWindow && !areAxisViewportsEqual(existingWindow, nextWindow)) {
                    if (axisRef.axis === "x") nextX.set(axisRef.axisId, nextWindow);
                    else nextY.set(axisRef.axisId, nextWindow);
                    changedAxes.push(axisRef);
                }
            } else {
                const nextWindow = this.#panContinuousAxis(
                    existingWindow,
                    snapshot,
                    delta,
                    options
                );
                if (nextWindow && !areAxisViewportsEqual(existingWindow, nextWindow)) {
                    if (axisRef.axis === "x") nextX.set(axisRef.axisId, nextWindow);
                    else nextY.set(axisRef.axisId, nextWindow);
                    changedAxes.push(axisRef);
                }
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
            let nextWin: InternalAxisViewport;

            if (win.type === "category") {
                nextWin = {
                    axis: win.axis,
                    axisId: win.axisId,
                    endIndexExclusive: win.endIndexExclusive,
                    kind: "category",
                    startIndex: win.startIndex
                };
            } else if (win.type === "continuous-date") {
                nextWin = {
                    axis: win.axis,
                    axisId: win.axisId,
                    kind: "continuous",
                    max: win.max instanceof Date ? win.max.getTime() : Number(win.max),
                    min: win.min instanceof Date ? win.min.getTime() : Number(win.min)
                };
            } else {
                nextWin = {
                    axis: win.axis,
                    axisId: win.axisId,
                    kind: "continuous",
                    max: Number(win.max),
                    min: Number(win.min)
                };
            }

            if (!areAxisViewportsEqual(existingWindow, nextWin)) {
                if (win.axis === "x") nextX.set(win.axisId, nextWin);
                else nextY.set(win.axisId, nextWin);
                changedAxes.push(axisRef);
            }
        }

        return {
            changed: changedAxes.length > 0,
            changedAxes,
            viewport: { x: nextX, y: nextY }
        };
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

    static #zoomContinuousAxis(
        currentWindow: InternalAxisViewport | undefined,
        snapshot: CartesianAxisCoordinateSnapshot,
        factor: number,
        anchorPixel: number,
        options?: ViewportControllerOptions
    ): InternalContinuousViewport | undefined {
        const scale = snapshot.viewportScale as ChartContinuousPositionScale<number | Date>;
        const [r0, r1] = snapshot.range;

        // Calculate source range points
        const source0 = anchorPixel + (r0 - anchorPixel) / factor;
        const source1 = anchorPixel + (r1 - anchorPixel) / factor;

        const inv0 = scale.invert(source0);
        const inv1 = scale.invert(source1);
        if (inv0 === undefined || inv1 === undefined) return undefined;

        let num0 = inv0 instanceof Date ? inv0.getTime() : Number(inv0);
        let num1 = inv1 instanceof Date ? inv1.getTime() : Number(inv1);
        if (!Number.isFinite(num0) || !Number.isFinite(num1) || num0 === num1) return undefined;

        if (num0 > num1) {
            const tmp = num0;
            num0 = num1;
            num1 = tmp;
        }

        const b0 = snapshot.baseDomain[0] instanceof Date ? snapshot.baseDomain[0].getTime() : Number(snapshot.baseDomain[0]);
        const b1 = snapshot.baseDomain[1] instanceof Date ? snapshot.baseDomain[1].getTime() : Number(snapshot.baseDomain[1]);
        const baseMin = Math.min(b0, b1);
        const baseMax = Math.max(b0, b1);

        const constraint = options?.constraints?.find(c => c.axis === snapshot.ref.axis && c.axisId === snapshot.ref.axisId);
        const [cMin, cMax] = CartesianViewportConstraints.applyContinuousConstraints(
            num0,
            num1,
            baseMin,
            baseMax,
            constraint,
            options?.clampToData !== false,
            snapshot.baseScale,
            snapshot.resolvedType
        );

        return {
            axis: snapshot.ref.axis,
            axisId: snapshot.ref.axisId,
            kind: "continuous",
            max: cMax,
            min: cMin
        };
    }

    static #panContinuousAxis(
        currentWindow: InternalAxisViewport | undefined,
        snapshot: CartesianAxisCoordinateSnapshot,
        deltaPx: number,
        options?: ViewportControllerOptions
    ): InternalContinuousViewport | undefined {
        const scale = snapshot.viewportScale as ChartContinuousPositionScale<number | Date>;
        const [r0, r1] = snapshot.range;

        const source0 = r0 - deltaPx;
        const source1 = r1 - deltaPx;

        const inv0 = scale.invert(source0);
        const inv1 = scale.invert(source1);
        if (inv0 === undefined || inv1 === undefined) return undefined;

        let num0 = inv0 instanceof Date ? inv0.getTime() : Number(inv0);
        let num1 = inv1 instanceof Date ? inv1.getTime() : Number(inv1);
        if (!Number.isFinite(num0) || !Number.isFinite(num1) || num0 === num1) return undefined;

        if (num0 > num1) {
            const tmp = num0;
            num0 = num1;
            num1 = tmp;
        }

        const b0 = snapshot.baseDomain[0] instanceof Date ? snapshot.baseDomain[0].getTime() : Number(snapshot.baseDomain[0]);
        const b1 = snapshot.baseDomain[1] instanceof Date ? snapshot.baseDomain[1].getTime() : Number(snapshot.baseDomain[1]);
        const baseMin = Math.min(b0, b1);
        const baseMax = Math.max(b0, b1);

        const constraint = options?.constraints?.find(c => c.axis === snapshot.ref.axis && c.axisId === snapshot.ref.axisId);
        const [cMin, cMax] = CartesianViewportConstraints.applyContinuousConstraints(
            num0,
            num1,
            baseMin,
            baseMax,
            constraint,
            options?.clampToData !== false,
            snapshot.baseScale,
            snapshot.resolvedType
        );

        return {
            axis: snapshot.ref.axis,
            axisId: snapshot.ref.axisId,
            kind: "continuous",
            max: cMax,
            min: cMin
        };
    }

    static #zoomCategoryAxis(
        currentWindow: InternalAxisViewport | undefined,
        snapshot: CartesianAxisCoordinateSnapshot,
        factor: number,
        anchorPixel: number,
        options?: ViewportControllerOptions
    ): InternalCategoryViewport | undefined {
        const baseCount = Array.isArray(snapshot.baseDomain) ? snapshot.baseDomain.length : 0;
        if (baseCount === 0) return undefined;

        const curStart = currentWindow && currentWindow.kind === "category" ? currentWindow.startIndex : 0;
        const curEnd = currentWindow && currentWindow.kind === "category" ? currentWindow.endIndexExclusive : baseCount;
        const curCount = curEnd - curStart;

        const r0 = Math.min(snapshot.range[0], snapshot.range[1]);
        const r1 = Math.max(snapshot.range[0], snapshot.range[1]);
        const plotSpan = Math.max(1, r1 - r0);
        const t = Math.max(0, Math.min(1, (anchorPixel - r0) / plotSpan));

        const anchor = curStart + t * curCount;
        const newCount = curCount / factor;
        let newStart = Math.round(anchor - t * newCount);
        let newEnd = newStart + Math.round(newCount);

        const constraint = options?.constraints?.find(c => c.axis === snapshot.ref.axis && c.axisId === snapshot.ref.axisId);
        const [cStart, cEnd] = CartesianViewportConstraints.applyCategoryConstraints(
            newStart,
            newEnd,
            baseCount,
            constraint,
            options?.minVisibleCategories ?? 1,
            options?.clampToData !== false
        );

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

    static #panCategoryAxis(
        currentWindow: InternalAxisViewport | undefined,
        snapshot: CartesianAxisCoordinateSnapshot,
        deltaPx: number,
        options?: ViewportControllerOptions
    ): InternalCategoryViewport | undefined {
        const baseCount = Array.isArray(snapshot.baseDomain) ? snapshot.baseDomain.length : 0;
        if (baseCount === 0) return undefined;

        const curStart = currentWindow && currentWindow.kind === "category" ? currentWindow.startIndex : 0;
        const curEnd = currentWindow && currentWindow.kind === "category" ? currentWindow.endIndexExclusive : baseCount;
        const curCount = curEnd - curStart;

        const plotSpan = Math.abs(snapshot.range[1] - snapshot.range[0]);
        const pixelsPerCat = Math.max(1, plotSpan / curCount);
        const catDelta = Math.round(-deltaPx / pixelsPerCat);

        const newStart = curStart + catDelta;
        const newEnd = newStart + curCount;

        const constraint = options?.constraints?.find(c => c.axis === snapshot.ref.axis && c.axisId === snapshot.ref.axisId);
        const [cStart, cEnd] = CartesianViewportConstraints.applyCategoryConstraints(
            newStart,
            newEnd,
            baseCount,
            constraint,
            options?.minVisibleCategories ?? 1,
            options?.clampToData !== false
        );

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
}
