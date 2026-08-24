import type {
    ChartViewportAxisRef,
    ChartViewportLinkGroup
} from "../../models/chart-viewport.models";
import type { CartesianAxisCoordinateSpace } from "./cartesian-axis-coordinate-space";
import {
    mapDomainWindow,
    mapRelativeWindow,
    type ViewportSemanticMapperOptions
} from "./cartesian-viewport-semantic-mapper";
import {
    areAxisViewportsEqual,
    type InternalAxisViewport,
    type InternalCartesianViewportState
} from "./cartesian-viewport-normalizer";
import { ChartDiagnostics } from "../utils/chart-diagnostics";

export class CartesianViewportLinker {
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

    public static propagateLinks(
        viewportState: InternalCartesianViewportState,
        sourceAxes: readonly ChartViewportAxisRef[],
        coordinateSpace: CartesianAxisCoordinateSpace,
        linkGroups: readonly ChartViewportLinkGroup[] | undefined,
        options?: ViewportSemanticMapperOptions & {
            excludedAxes?: ReadonlySet<string>;
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
        const processedLinkGroups = new Set<string>();

        for (const sourceRef of sourceAxes) {
            const sourceSnap = coordinateSpace.get(sourceRef);
            if (!sourceSnap || !sourceSnap.valid) continue;

            const sourceWin = sourceRef.axis === "x" ? nextX.get(sourceRef.axisId) : nextY.get(sourceRef.axisId);

            for (const group of validGroups) {
                const isMember = group.axes.some(a => a.axis === sourceRef.axis && a.axisId === sourceRef.axisId);
                if (!isMember) continue;

                if (processedLinkGroups.has(group.id)) {
                    // First direct source axis in caller target order is authoritative for this link group
                    continue;
                }
                processedLinkGroups.add(group.id);

                for (const targetRef of group.axes) {
                    if (targetRef.axis === sourceRef.axis && targetRef.axisId === sourceRef.axisId) {
                        continue;
                    }

                    const targetKey = `${targetRef.axis}:${targetRef.axisId}`;
                    if (options?.excludedAxes?.has(targetKey)) {
                        continue;
                    }

                    const targetSnap = coordinateSpace.get(targetRef);
                    if (!targetSnap || !targetSnap.valid) continue;

                    const existingTargetWin = targetRef.axis === "x" ? nextX.get(targetRef.axisId) : nextY.get(targetRef.axisId);
                    let newTargetWin: InternalAxisViewport | undefined;

                    if (group.mode === "domain") {
                        newTargetWin = mapDomainWindow(sourceWin, sourceSnap, targetSnap, options, {
                            diagnosticScope: `group "${group.id}"`,
                            warned
                        });
                    } else if (group.mode === "relative") {
                        newTargetWin = mapRelativeWindow(sourceWin, sourceSnap, targetSnap, options);
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
}
