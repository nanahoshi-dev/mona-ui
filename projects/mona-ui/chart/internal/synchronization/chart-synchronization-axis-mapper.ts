import type { ChartSynchronizationAxisMapping } from "../../models/chart-synchronization.models";
import type { ChartViewportAxisRef, ChartViewportConstraint } from "../../models/chart-viewport.models";
import {
    mapContinuousRelativeWindow,
    mapCategoryRelativeWindow,
    type ViewportSemanticMapperOptions
} from "../viewport/cartesian-viewport-semantic-mapper";
import { CartesianViewportConstraints } from "../viewport/cartesian-viewport-constraints";
import { normalizeAxisWindow, type InternalAxisViewport, type InternalCartesianViewportState } from "../viewport/cartesian-viewport-normalizer";
import type { CartesianAxisCoordinateSnapshot, CartesianAxisCoordinateSpace } from "../viewport/cartesian-axis-coordinate-space";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import type {
    ChartSynchronizationAxisWindow,
    ChartSynchronizationViewportMessage
} from "./chart-synchronization-types";
import type { NormalizedChartSynchronizationOptions } from "./chart-synchronization-options";

export interface ResolvedIncomingAxis {
    readonly targetRef: ChartViewportAxisRef;
    readonly viewport: InternalAxisViewport | undefined;
}

const temporalTypes = new Set(["time", "utc"]);
const numericTypes = new Set(["linear", "log", "symlog", "pow", "sqrt"]);

function axisTargetsDimension(axes: NormalizedChartSynchronizationOptions["viewport"]["axes"], dimension: "x" | "y"): boolean {
    if (axes === "auto" || axes === "xy") return true;
    if (axes === "x") return dimension === "x";
    if (axes === "y") return dimension === "y";
    return Array.isArray(axes) && axes.some(a => a.axis === dimension);
}

export class ChartSynchronizationAxisMapper {
    public static resolveTargetAxisRef(
        sourceRef: ChartViewportAxisRef,
        coordinateSpace: CartesianAxisCoordinateSpace,
        options: NormalizedChartSynchronizationOptions,
        primaryAxisIds: { readonly x: string; readonly y: string },
        warned: Set<string>
    ): ChartViewportAxisRef | null {
        const explicit = options.axisMappings?.find(
            m => m.source.axis === sourceRef.axis && m.source.axisId === sourceRef.axisId
        );
        if (explicit) {
            const snap = coordinateSpace.get(explicit.target);
            if (!snap || !snap.valid) {
                ChartDiagnostics.warnOnce(
                    warned,
                    `Synchronization mapping target "${explicit.target.axis}:${explicit.target.axisId}" is not a valid axis. Ignoring mapped axis.`,
                    `sync-mapping-invalid-target-${explicit.target.axis}-${explicit.target.axisId}`
                );
                return null;
            }
            return explicit.target;
        }

        const sameIdSnap = coordinateSpace.get(sourceRef);
        if (sameIdSnap && sameIdSnap.valid) {
            return sourceRef;
        }

        const isSourcePrimary = primaryAxisIds[sourceRef.axis] === sourceRef.axisId;
        if (isSourcePrimary && axisTargetsDimension(options.viewport.axes, sourceRef.axis)) {
            const primaryId = sourceRef.axis === "x"
                ? firstValidAxisId(coordinateSpace, "x")
                : firstValidAxisId(coordinateSpace, "y");
            if (primaryId !== null) {
                return { axis: sourceRef.axis, axisId: primaryId };
            }
        }

        return null;
    }

    public static mapIncomingAxes(
        message: ChartSynchronizationViewportMessage,
        coordinateSpace: CartesianAxisCoordinateSpace,
        options: NormalizedChartSynchronizationOptions,
        recipientState: InternalCartesianViewportState,
        primaryAxisIds: { readonly x: string; readonly y: string },
        mapperOptions: ViewportSemanticMapperOptions,
        warned: Set<string>
    ): { changedAxes: ChartViewportAxisRef[]; viewport: InternalCartesianViewportState } {
        const nextX = new Map(recipientState.x);
        const nextY = new Map(recipientState.y);
        const changedAxes: ChartViewportAxisRef[] = [];

        for (const incoming of message.axes) {
            const targetRef = this.resolveTargetAxisRef(incoming.sourceRef, coordinateSpace, options, primaryAxisIds, warned);
            if (!targetRef) {
                continue;
            }

            const targetSnap = coordinateSpace.get(targetRef);
            if (!targetSnap || !targetSnap.valid) {
                continue;
            }

            let mapped: InternalAxisViewport | undefined;

            if (options.viewport.mode === "relative") {
                const normalized = incoming.normalizedWindow;
                if (!normalized) {
                    continue;
                }
                const u0 = Math.min(normalized[0], normalized[1]);
                const u1 = Math.max(normalized[0], normalized[1]);
                if (targetSnap.resolvedType === "category") {
                    mapped = mapCategoryRelativeWindow({ u0, u1 }, targetSnap, mapperOptions);
                } else {
                    mapped = mapContinuousRelativeWindow({ u0, u1 }, targetSnap, mapperOptions);
                }
            } else {
                mapped = this.#mapDomainIncoming(incoming, targetSnap, targetRef, mapperOptions, warned);
            }

            const existing = targetRef.axis === "x" ? nextX.get(targetRef.axisId) : nextY.get(targetRef.axisId);
            const equal = existing === mapped
                || (existing !== undefined
                    && mapped !== undefined
                    && existing.kind === mapped.kind
                    && existing.axisId === mapped.axisId
                    && (existing.kind === "continuous"
                        ? Math.abs(existing.min - (mapped as typeof existing).min) < 1e-9
                          && Math.abs(existing.max - (mapped as typeof existing).max) < 1e-9
                        : existing.startIndex === (mapped as typeof existing).startIndex
                          && existing.endIndexExclusive === (mapped as typeof existing).endIndexExclusive));
            if (equal) {
                continue;
            }

            if (targetRef.axis === "x") {
                if (mapped) nextX.set(targetRef.axisId, mapped);
                else nextX.delete(targetRef.axisId);
            } else {
                if (mapped) nextY.set(targetRef.axisId, mapped);
                else nextY.delete(targetRef.axisId);
            }
            changedAxes.push(targetRef);
        }

        return { changedAxes, viewport: { x: nextX, y: nextY } };
    }

    static #mapDomainIncoming(
        incoming: ChartSynchronizationAxisWindow,
        targetSnap: CartesianAxisCoordinateSnapshot,
        targetRef: ChartViewportAxisRef,
        mapperOptions: ViewportSemanticMapperOptions,
        warned: Set<string>
    ): InternalAxisViewport | undefined {
        const isTemporal = temporalTypes.has(incoming.sourceType);
        const isNumeric = numericTypes.has(incoming.sourceType);
        const targetIsCategory = targetSnap.resolvedType === "category";

        if (incoming.sourceType === "category" || targetIsCategory) {
            if (incoming.sourceType !== "category" || !targetIsCategory) {
                ChartDiagnostics.warnOnce(
                    warned,
                    `Synchronization mode "domain" cannot map ${incoming.sourceType} to ${targetSnap.resolvedType} axes. Axis "${incoming.sourceRef.axis}:${incoming.sourceRef.axisId}" ignored.`,
                    `sync-domain-incompatible-${incoming.sourceType}-${targetSnap.resolvedType}`
                );
                return undefined;
            }
            return this.#mapCategoryKeysToTarget(incoming, targetSnap, targetRef, mapperOptions, warned);
        }

        if (isTemporal !== temporalTypes.has(targetSnap.resolvedType)) {
            ChartDiagnostics.warnOnce(
                warned,
                `Synchronization mode "domain" cannot map temporal and numeric axes. Axis "${incoming.sourceRef.axis}:${incoming.sourceRef.axisId}" ignored.`,
                `sync-domain-type-mismatch-${incoming.sourceRef.axis}-${incoming.sourceRef.axisId}`
            );
            return undefined;
        }

        if (!isNumeric && !isTemporal) {
            return undefined;
        }

        if (!incoming.window || incoming.window.kind !== "continuous") {
            return undefined;
        }

        return normalizeAxisWindow(
            {
                axis: targetRef.axis,
                axisId: targetRef.axisId,
                kind: "continuous",
                max: incoming.window.max,
                min: incoming.window.min
            },
            targetSnap,
            findConstraint(mapperOptions, targetRef),
            mapperOptions
        );
    }

    static #mapCategoryKeysToTarget(
        incoming: ChartSynchronizationAxisWindow,
        targetSnap: CartesianAxisCoordinateSnapshot,
        targetRef: ChartViewportAxisRef,
        mapperOptions: ViewportSemanticMapperOptions,
        warned: Set<string>
    ): InternalAxisViewport | undefined {
        if (!incoming.window || incoming.window.kind !== "category") {
            return undefined;
        }
        const keys = incoming.visibleCategoryKeys;
        if (!keys || keys.length === 0) {
            return undefined;
        }

        const targetDomain = targetSnap.baseDomain as readonly string[];
        const indexByKey = new Map<string, number>();
        for (let i = 0; i < targetDomain.length; i++) {
            indexByKey.set(String(targetDomain[i]), i);
        }

        const startIndex = indexByKey.get(keys[0]);
        const lastIndex = indexByKey.get(keys[keys.length - 1]);
        if (startIndex === undefined || lastIndex === undefined) {
            ChartDiagnostics.warnOnce(
                warned,
                `Synchronized category window references keys missing from the target base domain. Axis "${targetRef.axis}:${targetRef.axisId}" ignored.`,
                `sync-category-key-missing-${targetRef.axis}-${targetRef.axisId}`
            );
            return undefined;
        }

        const rawStart = Math.min(startIndex, lastIndex);
        const rawEndExclusive = Math.max(startIndex, lastIndex) + 1;

        const constraint = findConstraint(mapperOptions, targetRef);
        const [cStart, cEnd] = CartesianViewportConstraints.applyCategoryConstraints(
            rawStart,
            rawEndExclusive,
            targetDomain.length,
            constraint,
            mapperOptions.minVisibleCategories ?? 1,
            mapperOptions.clampToData !== false
        );

        if (cStart === 0 && cEnd === targetDomain.length) {
            return undefined;
        }

        return {
            axis: targetRef.axis,
            axisId: targetRef.axisId,
            endIndexExclusive: cEnd,
            firstVisibleKey: String(targetDomain[cStart]),
            kind: "category",
            lastVisibleKey: String(targetDomain[cEnd - 1]),
            startIndex: cStart
        };
    }
}

function findConstraint(
    options: ViewportSemanticMapperOptions | undefined,
    ref: ChartViewportAxisRef
): import("../../models/chart-viewport.models").ChartViewportConstraint | undefined {
    return options?.constraints?.find(c => c.axis === ref.axis && c.axisId === ref.axisId);
}

function firstValidAxisId(coordinateSpace: CartesianAxisCoordinateSpace, axis: "x" | "y"): string | null {
    const map = axis === "x" ? coordinateSpace.x : coordinateSpace.y;
    for (const [id, snap] of map) {
        if (snap.valid) {
            return id;
        }
    }
    return null;
}
