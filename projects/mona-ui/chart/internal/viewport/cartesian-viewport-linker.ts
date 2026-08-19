import type {
    ChartViewportAxisRef,
    ChartViewportConstraint,
    ChartViewportLinkGroup
} from "../../models/chart-viewport.models";
import type { ChartContinuousPositionScale, ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import type { CartesianAxisCoordinateSpace } from "./cartesian-axis-coordinate-space";
import { CartesianViewportConstraints } from "./cartesian-viewport-constraints";
import {
    areAxisViewportsEqual,
    type InternalAxisViewport,
    type InternalCartesianViewportState,
    type InternalCategoryViewport,
    type InternalContinuousViewport
} from "./cartesian-viewport-normalizer";
import { ChartDiagnostics } from "../utils/chart-diagnostics";

export class CartesianViewportLinker {
    public static filterValidLinkGroups(
        linkGroups: readonly ChartViewportLinkGroup[] | undefined,
        warned?: Set<string>
    ): readonly ChartViewportLinkGroup[] {
        if (!linkGroups || linkGroups.length === 0) return [];
        const seenAxes = new Set<string>();
        const validGroups: ChartViewportLinkGroup[] = [];

        for (const group of linkGroups) {
            const uniqueGroupAxes: ChartViewportAxisRef[] = [];
            for (const axis of group.axes) {
                const key = `${axis.axis}:${axis.axisId}`;
                if (seenAxes.has(key)) {
                    if (warned) {
                        ChartDiagnostics.warnOnce(
                            warned,
                            `Axis "${key}" is defined in multiple link groups. Ignoring duplicate membership in group "${group.id}".`,
                            `duplicate-link-group-axis-${key}-${group.id}`
                        );
                    }
                } else {
                    seenAxes.add(key);
                    uniqueGroupAxes.push(axis);
                }
            }
            if (uniqueGroupAxes.length > 1) {
                validGroups.push({
                    ...group,
                    axes: uniqueGroupAxes
                });
            }
        }
        return validGroups;
    }

    public static expandTargetAxesWithLinks(
        primaryTargets: readonly ChartViewportAxisRef[],
        linkGroups: readonly ChartViewportLinkGroup[] | undefined
    ): readonly ChartViewportAxisRef[] {
        if (!linkGroups || linkGroups.length === 0 || primaryTargets.length === 0) {
            return primaryTargets;
        }

        const validGroups = this.filterValidLinkGroups(linkGroups);
        const resultSet = new Map<string, ChartViewportAxisRef>();
        for (const target of primaryTargets) {
            const key = `${target.axis}:${target.axisId}`;
            resultSet.set(key, target);
        }

        for (const target of primaryTargets) {
            for (const group of validGroups) {
                const isMember = group.axes.some(a => a.axis === target.axis && a.axisId === target.axisId);
                if (isMember) {
                    for (const sibling of group.axes) {
                        const key = `${sibling.axis}:${sibling.axisId}`;
                        if (!resultSet.has(key)) {
                            resultSet.set(key, sibling);
                        }
                    }
                }
            }
        }

        return Array.from(resultSet.values());
    }

    public static propagateLinks(
        viewportState: InternalCartesianViewportState,
        sourceAxes: readonly ChartViewportAxisRef[],
        coordinateSpace: CartesianAxisCoordinateSpace,
        linkGroups: readonly ChartViewportLinkGroup[] | undefined,
        options?: {
            clampToData?: boolean;
            constraints?: readonly ChartViewportConstraint[];
            minVisibleCategories?: number;
            warnedSignatures?: Set<string>;
        }
    ): { readonly changedAxes: readonly ChartViewportAxisRef[]; readonly viewport: InternalCartesianViewportState } {
        if (!linkGroups || linkGroups.length === 0 || sourceAxes.length === 0) {
            return { changedAxes: [], viewport: viewportState };
        }

        const warned = options?.warnedSignatures ?? new Set<string>();
        const validGroups = this.filterValidLinkGroups(linkGroups, warned);
        if (validGroups.length === 0) {
            return { changedAxes: [], viewport: viewportState };
        }

        const nextX = new Map<string, InternalAxisViewport>(viewportState.x);
        const nextY = new Map<string, InternalAxisViewport>(viewportState.y);
        const changedAxes: ChartViewportAxisRef[] = [];

        for (const sourceRef of sourceAxes) {
            const sourceSnap = coordinateSpace.get(sourceRef);
            if (!sourceSnap || !sourceSnap.valid) continue;

            const sourceWin = sourceRef.axis === "x" ? nextX.get(sourceRef.axisId) : nextY.get(sourceRef.axisId);

            for (const group of validGroups) {
                const isMember = group.axes.some(a => a.axis === sourceRef.axis && a.axisId === sourceRef.axisId);
                if (!isMember) continue;

                for (const targetRef of group.axes) {
                    if (targetRef.axis === sourceRef.axis && targetRef.axisId === sourceRef.axisId) {
                        continue;
                    }

                    const targetSnap = coordinateSpace.get(targetRef);
                    if (!targetSnap || !targetSnap.valid) continue;

                    const existingTargetWin = targetRef.axis === "x" ? nextX.get(targetRef.axisId) : nextY.get(targetRef.axisId);
                    let newTargetWin: InternalAxisViewport | undefined;

                    if (group.mode === "domain") {
                        newTargetWin = this.#propagateDomainLink(
                            sourceWin,
                            sourceSnap,
                            targetSnap,
                            options,
                            warned,
                            group.id
                        );
                    } else if (group.mode === "relative") {
                        newTargetWin = this.#propagateRelativeLink(
                            sourceWin,
                            sourceSnap,
                            targetSnap,
                            options
                        );
                    }

                    if (!areAxisViewportsEqual(existingTargetWin, newTargetWin)) {
                        if (newTargetWin) {
                            if (targetRef.axis === "x") nextX.set(targetRef.axisId, newTargetWin);
                            else nextY.set(targetRef.axisId, newTargetWin);
                        } else {
                            if (targetRef.axis === "x") nextX.delete(targetRef.axisId);
                            else nextY.delete(targetRef.axisId);
                        }
                        changedAxes.push(targetRef);
                    }
                }
            }
        }

        return {
            changedAxes,
            viewport: { x: nextX, y: nextY }
        };
    }

    static #propagateDomainLink(
        sourceWin: InternalAxisViewport | undefined,
        sourceSnap: import("./cartesian-axis-coordinate-space").CartesianAxisCoordinateSnapshot,
        targetSnap: import("./cartesian-axis-coordinate-space").CartesianAxisCoordinateSnapshot,
        options: { clampToData?: boolean; constraints?: readonly ChartViewportConstraint[]; minVisibleCategories?: number } | undefined,
        warned: Set<string>,
        groupId: string
    ): InternalAxisViewport | undefined {
        if (!sourceWin) {
            return undefined;
        }

        if (sourceSnap.resolvedType === "category" && targetSnap.resolvedType === "category") {
            const sDomain = sourceSnap.baseDomain as readonly string[];
            const tDomain = targetSnap.baseDomain as readonly string[];
            const areEqual = sDomain.length === tDomain.length && sDomain.every((k, i) => k === tDomain[i]);
            if (!areEqual) {
                ChartDiagnostics.warnOnce(
                    warned,
                    `Link group "${groupId}" mode "domain" requires identical category domains.`,
                    `link-domain-category-incompatible-${groupId}`
                );
                return undefined;
            }

            const catWin = sourceWin as InternalCategoryViewport;
            const constraint = options?.constraints?.find(c => c.axis === targetSnap.ref.axis && c.axisId === targetSnap.ref.axisId);
            const [cStart, cEnd] = CartesianViewportConstraints.applyCategoryConstraints(
                catWin.startIndex,
                catWin.endIndexExclusive,
                tDomain.length,
                constraint,
                options?.minVisibleCategories ?? 1,
                options?.clampToData !== false
            );

            if (cStart === 0 && cEnd === tDomain.length) {
                return undefined;
            }

            return {
                axis: targetSnap.ref.axis,
                axisId: targetSnap.ref.axisId,
                endIndexExclusive: cEnd,
                firstVisibleKey: tDomain[cStart] !== undefined ? String(tDomain[cStart]) : undefined,
                kind: "category",
                lastVisibleKey: tDomain[cEnd - 1] !== undefined ? String(tDomain[cEnd - 1]) : undefined,
                startIndex: cStart
            };
        }

        if (sourceSnap.resolvedType !== "category" && targetSnap.resolvedType !== "category") {
            const isSourceDate = sourceSnap.resolvedType === "time" || sourceSnap.resolvedType === "utc";
            const isTargetDate = targetSnap.resolvedType === "time" || targetSnap.resolvedType === "utc";

            if (isSourceDate !== isTargetDate) {
                ChartDiagnostics.warnOnce(
                    warned,
                    `Link group "${groupId}" mode "domain" cannot link temporal and numeric axes.`,
                    `link-domain-type-mismatch-${groupId}`
                );
                return undefined;
            }

            const contWin = sourceWin as InternalContinuousViewport;
            const b0 = targetSnap.baseDomain[0] instanceof Date ? targetSnap.baseDomain[0].getTime() : Number(targetSnap.baseDomain[0]);
            const b1 = targetSnap.baseDomain[1] instanceof Date ? targetSnap.baseDomain[1].getTime() : Number(targetSnap.baseDomain[1]);
            const baseMin = Math.min(b0, b1);
            const baseMax = Math.max(b0, b1);

            const constraint = options?.constraints?.find(c => c.axis === targetSnap.ref.axis && c.axisId === targetSnap.ref.axisId);
            const [cMin, cMax] = CartesianViewportConstraints.applyContinuousConstraints(
                contWin.min,
                contWin.max,
                baseMin,
                baseMax,
                constraint,
                options?.clampToData !== false,
                targetSnap.baseScale,
                targetSnap.resolvedType
            );

            if (Math.abs(cMin - baseMin) < 1e-9 && Math.abs(cMax - baseMax) < 1e-9) {
                return undefined;
            }

            return {
                axis: targetSnap.ref.axis,
                axisId: targetSnap.ref.axisId,
                kind: "continuous",
                max: cMax,
                min: cMin
            };
        }

        ChartDiagnostics.warnOnce(
            warned,
            `Link group "${groupId}" mode "domain" cannot link continuous and category axes.`,
            `link-domain-category-continuous-mismatch-${groupId}`
        );
        return undefined;
    }

    static #propagateRelativeLink(
        sourceWin: InternalAxisViewport | undefined,
        sourceSnap: import("./cartesian-axis-coordinate-space").CartesianAxisCoordinateSnapshot,
        targetSnap: import("./cartesian-axis-coordinate-space").CartesianAxisCoordinateSnapshot,
        options: { clampToData?: boolean; constraints?: readonly ChartViewportConstraint[]; minVisibleCategories?: number } | undefined
    ): InternalAxisViewport | undefined {
        if (!sourceWin) {
            return undefined;
        }

        let u0 = 0;
        let u1 = 1;

        if (sourceSnap.resolvedType === "category") {
            const catWin = sourceWin as InternalCategoryViewport;
            const baseCount = sourceSnap.baseDomain.length;
            if (baseCount > 0) {
                u0 = catWin.startIndex / baseCount;
                u1 = catWin.endIndexExclusive / baseCount;
            }
        } else {
            const contWin = sourceWin as InternalContinuousViewport;
            const pMinVal = sourceSnap.resolvedType === "time" || sourceSnap.resolvedType === "utc" ? new Date(contWin.min) : contWin.min;
            const pMaxVal = sourceSnap.resolvedType === "time" || sourceSnap.resolvedType === "utc" ? new Date(contWin.max) : contWin.max;
            const p0 = sourceSnap.baseScale.map(pMinVal as never);
            const p1 = sourceSnap.baseScale.map(pMaxVal as never);
            const [r0, r1] = sourceSnap.range;
            if (p0 !== undefined && p1 !== undefined && r1 !== r0) {
                u0 = (p0 - r0) / (r1 - r0);
                u1 = (p1 - r0) / (r1 - r0);
            }
        }

        const normMin = Math.max(0, Math.min(u0, u1));
        const normMax = Math.min(1, Math.max(u0, u1));

        if (targetSnap.resolvedType === "category") {
            const baseCount = targetSnap.baseDomain.length;
            if (baseCount === 0) return undefined;
            const startIndex = Math.round(normMin * baseCount);
            const endIndex = Math.round(normMax * baseCount);

            const constraint = options?.constraints?.find(c => c.axis === targetSnap.ref.axis && c.axisId === targetSnap.ref.axisId);
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

            const catDomain = targetSnap.baseDomain as readonly string[];
            return {
                axis: targetSnap.ref.axis,
                axisId: targetSnap.ref.axisId,
                endIndexExclusive: cEnd,
                firstVisibleKey: catDomain[cStart] !== undefined ? String(catDomain[cStart]) : undefined,
                kind: "category",
                lastVisibleKey: catDomain[cEnd - 1] !== undefined ? String(catDomain[cEnd - 1]) : undefined,
                startIndex: cStart
            };
        }

        const [tr0, tr1] = targetSnap.range;
        const tp0 = tr0 + u0 * (tr1 - tr0);
        const tp1 = tr0 + u1 * (tr1 - tr0);

        const continuousScale = targetSnap.baseScale as ChartContinuousPositionScale<number | Date>;
        const inv0 = continuousScale.invert?.(tp0);
        const inv1 = continuousScale.invert?.(tp1);
        if (inv0 === undefined || inv1 === undefined) return undefined;

        const num0 = inv0 instanceof Date ? inv0.getTime() : Number(inv0);
        const num1 = inv1 instanceof Date ? inv1.getTime() : Number(inv1);
        if (!Number.isFinite(num0) || !Number.isFinite(num1) || num0 === num1) return undefined;

        const b0 = targetSnap.baseDomain[0] instanceof Date ? targetSnap.baseDomain[0].getTime() : Number(targetSnap.baseDomain[0]);
        const b1 = targetSnap.baseDomain[1] instanceof Date ? targetSnap.baseDomain[1].getTime() : Number(targetSnap.baseDomain[1]);
        const baseMin = Math.min(b0, b1);
        const baseMax = Math.max(b0, b1);

        const constraint = options?.constraints?.find(c => c.axis === targetSnap.ref.axis && c.axisId === targetSnap.ref.axisId);
        const [cMin, cMax] = CartesianViewportConstraints.applyContinuousConstraints(
            Math.min(num0, num1),
            Math.max(num0, num1),
            baseMin,
            baseMax,
            constraint,
            options?.clampToData !== false,
            targetSnap.baseScale,
            targetSnap.resolvedType
        );

        if (Math.abs(cMin - baseMin) < 1e-9 && Math.abs(cMax - baseMax) < 1e-9) {
            return undefined;
        }

        return {
            axis: targetSnap.ref.axis,
            axisId: targetSnap.ref.axisId,
            kind: "continuous",
            max: cMax,
            min: cMin
        };
    }
}
