import type {
    ChartViewportAxisRef,
    ChartViewportConstraint,
    ChartViewportLinkGroup,
    ChartViewportState,
    ChartViewportWindow
} from "../../models/chart-viewport.models";
import type { CartesianAxisCoordinateSpace } from "./cartesian-axis-coordinate-space";
import { CartesianViewportController, type CartesianViewportTransformIntent } from "./cartesian-viewport-controller";
import { CartesianViewportLinker } from "./cartesian-viewport-linker";
import {
    areAxisViewportsEqual,
    normalizeAxisWindow,
    normalizeViewportState,
    type InternalAxisViewport,
    type InternalCartesianViewportState
} from "./cartesian-viewport-normalizer";

export interface CartesianViewportOperationResult {
    readonly accepted: boolean;
    readonly changed: boolean;
    readonly changedAxes: readonly ChartViewportAxisRef[];
    readonly viewport: InternalCartesianViewportState;
}

export interface CartesianViewportOperationOptions {
    readonly clampToData?: boolean;
    readonly constraints?: readonly ChartViewportConstraint[];
    readonly defaultViewport?: ChartViewportState;
    readonly linkGroups?: readonly ChartViewportLinkGroup[];
    readonly minVisibleCategories?: number;
    readonly warnedSignatures?: Set<string>;
}

export class CartesianViewportOperationCoordinator {
    public static fit(
        currentViewport: InternalCartesianViewportState,
        coordinateSpace: CartesianAxisCoordinateSpace,
        targetAxes?: readonly ChartViewportAxisRef[],
        options?: CartesianViewportOperationOptions
    ): CartesianViewportOperationResult {
        const nextX = new Map<string, InternalAxisViewport>(currentViewport.x);
        const nextY = new Map<string, InternalAxisViewport>(currentViewport.y);
        const changedAxes: ChartViewportAxisRef[] = [];

        if (targetAxes && targetAxes.length > 0) {
            for (const target of targetAxes) {
                const targetMap = target.axis === "x" ? nextX : nextY;
                if (targetMap.has(target.axisId)) {
                    targetMap.delete(target.axisId);
                    changedAxes.push(target);
                }
            }

            if (changedAxes.length > 0) {
                const linkResult = CartesianViewportLinker.propagateLinks(
                    { x: nextX, y: nextY },
                    changedAxes,
                    coordinateSpace,
                    options?.linkGroups,
                    {
                        clampToData: options?.clampToData,
                        constraints: options?.constraints,
                        minVisibleCategories: options?.minVisibleCategories,
                        warnedSignatures: options?.warnedSignatures
                    }
                );
                const changedMap = new Map<string, ChartViewportAxisRef>();
                for (const ax of changedAxes) changedMap.set(`${ax.axis}:${ax.axisId}`, ax);
                for (const ax of linkResult.changedAxes) changedMap.set(`${ax.axis}:${ax.axisId}`, ax);

                return {
                    accepted: true,
                    changed: true,
                    changedAxes: Array.from(changedMap.values()),
                    viewport: linkResult.viewport
                };
            }

            return {
                accepted: true,
                changed: false,
                changedAxes: [],
                viewport: currentViewport
            };
        }

        // Fit all
        for (const axisId of currentViewport.x.keys()) {
            changedAxes.push({ axis: "x", axisId });
        }
        for (const axisId of currentViewport.y.keys()) {
            changedAxes.push({ axis: "y", axisId });
        }

        nextX.clear();
        nextY.clear();

        return {
            accepted: true,
            changed: changedAxes.length > 0,
            changedAxes,
            viewport: { x: nextX, y: nextY }
        };
    }

    public static previewTransform(
        currentViewport: InternalCartesianViewportState,
        coordinateSpace: CartesianAxisCoordinateSpace,
        sourceAxes: readonly ChartViewportAxisRef[],
        intent: CartesianViewportTransformIntent,
        options?: CartesianViewportOperationOptions
    ): { readonly accepted: boolean; readonly changed: boolean } {
        if (!sourceAxes || sourceAxes.length === 0) {
            return { accepted: false, changed: false };
        }
        const validSourceAxes = sourceAxes.filter(ref => {
            const snap = coordinateSpace.get(ref);
            return snap !== undefined && snap.valid !== false;
        });
        if (validSourceAxes.length === 0) {
            return { accepted: false, changed: false };
        }
        const controllerResult = CartesianViewportController.applyTransform(
            currentViewport,
            coordinateSpace,
            validSourceAxes,
            intent,
            {
                clampToData: options?.clampToData,
                constraints: options?.constraints,
                minVisibleCategories: options?.minVisibleCategories
            }
        );
        return {
            accepted: true,
            changed: controllerResult.changed
        };
    }

    public static reset(
        currentViewport: InternalCartesianViewportState,
        coordinateSpace: CartesianAxisCoordinateSpace,
        defaultViewport?: ChartViewportState,
        targetAxes?: readonly ChartViewportAxisRef[],
        options?: CartesianViewportOperationOptions
    ): CartesianViewportOperationResult {
        if (!defaultViewport || !defaultViewport.axes || defaultViewport.axes.length === 0) {
            return this.fit(currentViewport, coordinateSpace, targetAxes, options);
        }

        const normalizedDefault = normalizeViewportState(defaultViewport, coordinateSpace, {
            clampToData: options?.clampToData,
            constraints: options?.constraints,
            minVisibleCategories: options?.minVisibleCategories,
            warnedSignatures: options?.warnedSignatures
        });

        const isFullReset = !targetAxes || targetAxes.length === 0;
        if (isFullReset) {
            const changedAxes: ChartViewportAxisRef[] = [];
            const nextX = new Map<string, InternalAxisViewport>();
            const nextY = new Map<string, InternalAxisViewport>();

            for (const [axisId, snap] of coordinateSpace.x) {
                if (!snap.valid) continue;
                const defWin = normalizedDefault.x.get(axisId);
                const curWin = currentViewport.x.get(axisId);
                if (defWin) nextX.set(axisId, defWin);
                if (!areAxisViewportsEqual(curWin, defWin)) {
                    changedAxes.push({ axis: "x", axisId });
                }
            }

            for (const [axisId, snap] of coordinateSpace.y) {
                if (!snap.valid) continue;
                const defWin = normalizedDefault.y.get(axisId);
                const curWin = currentViewport.y.get(axisId);
                if (defWin) nextY.set(axisId, defWin);
                if (!areAxisViewportsEqual(curWin, defWin)) {
                    changedAxes.push({ axis: "y", axisId });
                }
            }

            return {
                accepted: true,
                changed: changedAxes.length > 0,
                changedAxes,
                viewport: { x: nextX, y: nextY }
            };
        }

        // Targeted reset
        const nextX = new Map<string, InternalAxisViewport>(currentViewport.x);
        const nextY = new Map<string, InternalAxisViewport>(currentViewport.y);
        const changedAxes: ChartViewportAxisRef[] = [];

        for (const target of targetAxes) {
            const defaultWin =
                target.axis === "x" ? normalizedDefault.x.get(target.axisId) : normalizedDefault.y.get(target.axisId);
            const currentWin =
                target.axis === "x" ? currentViewport.x.get(target.axisId) : currentViewport.y.get(target.axisId);

            if (!areAxisViewportsEqual(currentWin, defaultWin)) {
                if (defaultWin) {
                    if (target.axis === "x") nextX.set(target.axisId, defaultWin);
                    else nextY.set(target.axisId, defaultWin);
                } else {
                    if (target.axis === "x") nextX.delete(target.axisId);
                    else nextY.delete(target.axisId);
                }
                changedAxes.push(target);
            }
        }

        if (changedAxes.length === 0) {
            return {
                accepted: true,
                changed: false,
                changedAxes: [],
                viewport: currentViewport
            };
        }

        // Propagate links
        const linkResult = CartesianViewportLinker.propagateLinks(
            { x: nextX, y: nextY },
            changedAxes,
            coordinateSpace,
            options?.linkGroups,
            {
                clampToData: options?.clampToData,
                constraints: options?.constraints,
                minVisibleCategories: options?.minVisibleCategories,
                warnedSignatures: options?.warnedSignatures
            }
        );

        const changedMap = new Map<string, ChartViewportAxisRef>();
        for (const ax of changedAxes) changedMap.set(`${ax.axis}:${ax.axisId}`, ax);
        for (const ax of linkResult.changedAxes) changedMap.set(`${ax.axis}:${ax.axisId}`, ax);

        return {
            accepted: true,
            changed: true,
            changedAxes: Array.from(changedMap.values()),
            viewport: linkResult.viewport
        };
    }

    public static setViewport(
        currentViewport: InternalCartesianViewportState,
        coordinateSpace: CartesianAxisCoordinateSpace,
        viewport: ChartViewportState,
        options?: CartesianViewportOperationOptions
    ): CartesianViewportOperationResult {
        const normalized = normalizeViewportState(viewport, coordinateSpace, {
            clampToData: options?.clampToData,
            constraints: options?.constraints,
            minVisibleCategories: options?.minVisibleCategories,
            warnedSignatures: options?.warnedSignatures
        });

        const changedSourceAxes: ChartViewportAxisRef[] = [];
        const nextX = new Map<string, InternalAxisViewport>();
        const nextY = new Map<string, InternalAxisViewport>();

        for (const [axisId, snap] of coordinateSpace.x) {
            if (!snap.valid) continue;
            const newWin = normalized.x.get(axisId);
            const oldWin = currentViewport.x.get(axisId);
            if (newWin) {
                nextX.set(axisId, newWin);
            }
            if (!areAxisViewportsEqual(oldWin, newWin)) {
                changedSourceAxes.push({ axis: "x", axisId });
            }
        }

        for (const [axisId, snap] of coordinateSpace.y) {
            if (!snap.valid) continue;
            const newWin = normalized.y.get(axisId);
            const oldWin = currentViewport.y.get(axisId);
            if (newWin) {
                nextY.set(axisId, newWin);
            }
            if (!areAxisViewportsEqual(oldWin, newWin)) {
                changedSourceAxes.push({ axis: "y", axisId });
            }
        }

        if (changedSourceAxes.length === 0) {
            return {
                accepted: true,
                changed: false,
                changedAxes: [],
                viewport: currentViewport
            };
        }

        return {
            accepted: true,
            changed: true,
            changedAxes: changedSourceAxes,
            viewport: { x: nextX, y: nextY }
        };
    }

    public static setWindow(
        currentViewport: InternalCartesianViewportState,
        coordinateSpace: CartesianAxisCoordinateSpace,
        windows: ChartViewportWindow | readonly ChartViewportWindow[],
        options?: CartesianViewportOperationOptions
    ): CartesianViewportOperationResult {
        const windowList = Array.isArray(windows) ? windows : [windows];
        if (windowList.length === 0) {
            return {
                accepted: false,
                changed: false,
                changedAxes: [],
                viewport: currentViewport
            };
        }

        const nextX = new Map<string, InternalAxisViewport>(currentViewport.x);
        const nextY = new Map<string, InternalAxisViewport>(currentViewport.y);
        const changedSourceAxes: ChartViewportAxisRef[] = [];
        const explicitAxisSet = new Set<string>();
        let anyAccepted = false;

        for (const win of windowList) {
            if (!win || typeof win !== "object") continue;
            const axis = win.axis;
            const axisId = win.axisId;
            if (axis !== "x" && axis !== "y") continue;

            const snapshot = coordinateSpace.get({ axis, axisId });
            if (!snapshot || !snapshot.valid) continue;

            explicitAxisSet.add(`${axis}:${axisId}`);
            anyAccepted = true;
            const constraint = options?.constraints?.find(c => c.axis === axis && c.axisId === axisId);
            const normalized = normalizeAxisWindow(win, snapshot, constraint, {
                clampToData: options?.clampToData,
                minVisibleCategories: options?.minVisibleCategories,
                warnedSignatures: options?.warnedSignatures
            });

            const existing = axis === "x" ? currentViewport.x.get(axisId) : currentViewport.y.get(axisId);
            if (!areAxisViewportsEqual(existing, normalized)) {
                if (normalized) {
                    if (axis === "x") nextX.set(axisId, normalized);
                    else nextY.set(axisId, normalized);
                } else {
                    if (axis === "x") nextX.delete(axisId);
                    else nextY.delete(axisId);
                }
                changedSourceAxes.push({ axis, axisId });
            }
        }

        if (!anyAccepted) {
            return {
                accepted: false,
                changed: false,
                changedAxes: [],
                viewport: currentViewport
            };
        }

        if (changedSourceAxes.length === 0) {
            return {
                accepted: true,
                changed: false,
                changedAxes: [],
                viewport: currentViewport
            };
        }

        // Propagate links to unsupplied siblings only
        const linkResult = CartesianViewportLinker.propagateLinks(
            { x: nextX, y: nextY },
            changedSourceAxes,
            coordinateSpace,
            options?.linkGroups,
            {
                clampToData: options?.clampToData,
                constraints: options?.constraints,
                excludedAxes: explicitAxisSet,
                minVisibleCategories: options?.minVisibleCategories,
                warnedSignatures: options?.warnedSignatures
            }
        );

        const changedAxesMap = new Map<string, ChartViewportAxisRef>();
        for (const ax of changedSourceAxes) {
            changedAxesMap.set(`${ax.axis}:${ax.axisId}`, ax);
        }
        for (const ax of linkResult.changedAxes) {
            changedAxesMap.set(`${ax.axis}:${ax.axisId}`, ax);
        }

        return {
            accepted: true,
            changed: true,
            changedAxes: Array.from(changedAxesMap.values()),
            viewport: linkResult.viewport
        };
    }

    public static transform(
        currentViewport: InternalCartesianViewportState,
        coordinateSpace: CartesianAxisCoordinateSpace,
        sourceAxes: readonly ChartViewportAxisRef[],
        intent: CartesianViewportTransformIntent,
        options?: CartesianViewportOperationOptions
    ): CartesianViewportOperationResult {
        if (!sourceAxes || sourceAxes.length === 0) {
            return {
                accepted: false,
                changed: false,
                changedAxes: [],
                viewport: currentViewport
            };
        }

        const validSourceAxes = sourceAxes.filter(ref => {
            const snap = coordinateSpace.get(ref);
            return snap !== undefined && snap.valid !== false;
        });

        if (validSourceAxes.length === 0) {
            return {
                accepted: false,
                changed: false,
                changedAxes: [],
                viewport: currentViewport
            };
        }

        const controllerResult = CartesianViewportController.applyTransform(
            currentViewport,
            coordinateSpace,
            validSourceAxes,
            intent,
            {
                clampToData: options?.clampToData,
                constraints: options?.constraints,
                minVisibleCategories: options?.minVisibleCategories
            }
        );

        if (!controllerResult.changed) {
            return {
                accepted: true,
                changed: false,
                changedAxes: [],
                viewport: currentViewport
            };
        }

        // Propagate changes semantically to linked axes
        const linkResult = CartesianViewportLinker.propagateLinks(
            controllerResult.viewport,
            controllerResult.changedAxes,
            coordinateSpace,
            options?.linkGroups,
            {
                clampToData: options?.clampToData,
                constraints: options?.constraints,
                minVisibleCategories: options?.minVisibleCategories,
                warnedSignatures: options?.warnedSignatures
            }
        );

        const changedAxesMap = new Map<string, ChartViewportAxisRef>();
        for (const ax of controllerResult.changedAxes) {
            changedAxesMap.set(`${ax.axis}:${ax.axisId}`, ax);
        }
        for (const ax of linkResult.changedAxes) {
            changedAxesMap.set(`${ax.axis}:${ax.axisId}`, ax);
        }

        const allChangedAxes = Array.from(changedAxesMap.values());

        return {
            accepted: true,
            changed: allChangedAxes.length > 0,
            changedAxes: allChangedAxes,
            viewport: linkResult.viewport
        };
    }
}
