import type { ChartSynchronizationAxisMapping } from "../../models/chart-synchronization.models";
import type { ChartViewportAxisRef } from "../../models/chart-viewport.models";
import {
    mapContinuousRelativeWindow,
    mapCategoryRelativeWindow,
    type ViewportSemanticMapperOptions
} from "../viewport/cartesian-viewport-semantic-mapper";
import { CartesianViewportConstraints } from "../viewport/cartesian-viewport-constraints";
import {
    areAxisViewportsEqual,
    normalizeAxisWindow,
    type InternalAxisViewport,
    type InternalCartesianViewportState
} from "../viewport/cartesian-viewport-normalizer";
import type {
    CartesianAxisCoordinateSnapshot,
    CartesianAxisCoordinateSpace
} from "../viewport/cartesian-axis-coordinate-space";
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

export function axisTargetsDimension(
    axes: NormalizedChartSynchronizationOptions["viewport"]["axes"],
    dimension: "x" | "y"
): boolean {
    if (axes === "auto" || axes === "xy") return true;
    if (axes === "x") return dimension === "x";
    if (axes === "y") return dimension === "y";
    return Array.isArray(axes) && axes.some(a => a.axis === dimension);
}

export class ChartSynchronizationAxisMapper {
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
        if (startIndex === undefined) {
            ChartDiagnostics.warnOnce(
                warned,
                `Synchronized category window references keys missing from the target base domain. Axis "${targetRef.axis}:${targetRef.axisId}" ignored.`,
                `sync-category-key-missing-${targetRef.axis}-${targetRef.axisId}`
            );
            return undefined;
        }

        for (let i = 0; i < keys.length; i++) {
            const targetIdx = indexByKey.get(keys[i]);
            if (targetIdx === undefined || targetIdx !== startIndex + i) {
                ChartDiagnostics.warnOnce(
                    warned,
                    `Synchronized category key sequence does not match the target domain sequence. Axis "${targetRef.axis}:${targetRef.axisId}" ignored.`,
                    `sync-category-sequence-mismatch-${targetRef.axis}-${targetRef.axisId}`
                );
                return undefined;
            }
        }

        const rawStart = startIndex;
        const rawEndExclusive = startIndex + keys.length;

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

    static #mapDomainIncoming(
        incoming: ChartSynchronizationAxisWindow,
        targetSnap: CartesianAxisCoordinateSnapshot,
        targetRef: ChartViewportAxisRef,
        mapperOptions: ViewportSemanticMapperOptions,
        warned: Set<string>
    ): InternalAxisViewport | undefined {
        if (incoming.window === null) {
            return undefined;
        }

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

        if (incoming.window.kind !== "continuous") {
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

    public static mapIncomingAxes(
        message: ChartSynchronizationViewportMessage,
        coordinateSpace: CartesianAxisCoordinateSpace,
        options: NormalizedChartSynchronizationOptions,
        recipientState: InternalCartesianViewportState,
        primaryAxisIds: { readonly x?: string; readonly y?: string } | undefined,
        mapperOptions: ViewportSemanticMapperOptions,
        warned: Set<string>
    ): { changedAxes: ChartViewportAxisRef[]; viewport: InternalCartesianViewportState } {
        const nextX = new Map(recipientState.x);
        const nextY = new Map(recipientState.y);
        const changedAxes: ChartViewportAxisRef[] = [];

        for (const incoming of message.axes) {
            if (!axisTargetsDimension(options.viewport.axes, incoming.sourceRef.axis)) {
                continue;
            }
            const isPrimary =
                incoming.sourceIsPrimary ??
                (primaryAxisIds ? primaryAxisIds[incoming.sourceRef.axis] === incoming.sourceRef.axisId : false);
            const targetRef = this.resolveMappedAxisIdentity(
                incoming.sourceRef,
                isPrimary,
                coordinateSpace,
                options.axisMappings,
                warned,
                primaryAxisIds
            );
            if (!targetRef || !axisTargetsDimension(options.viewport.axes, targetRef.axis)) {
                continue;
            }

            const targetSnap = coordinateSpace.get(targetRef);
            if (!targetSnap || !targetSnap.valid) {
                continue;
            }

            let mapped: InternalAxisViewport | undefined;

            if (options.viewport.mode === "relative") {
                if (incoming.window === null) {
                    mapped = undefined;
                } else {
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
                }
            } else {
                mapped = this.#mapDomainIncoming(incoming, targetSnap, targetRef, mapperOptions, warned);
            }

            const existing = targetRef.axis === "x" ? nextX.get(targetRef.axisId) : nextY.get(targetRef.axisId);
            if (areAxisViewportsEqual(existing, mapped)) {
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

    /**
     * Resolves axis identity mapping channel-neutrally (WP1 / SD2-R01).
     * Channel filtering (viewport.axes vs crosshair.axes) is owned by callers.
     */
    public static resolveMappedAxisIdentity(
        sourceRef: ChartViewportAxisRef,
        sourceIsPrimary: boolean,
        coordinateSpace: CartesianAxisCoordinateSpace,
        axisMappings: readonly ChartSynchronizationAxisMapping[] | undefined,
        warned: Set<string>,
        primaryAxisIds?: { readonly x?: string; readonly y?: string }
    ): ChartViewportAxisRef | null {
        const explicit = axisMappings?.find(
            m => m.source.axis === sourceRef.axis && m.source.axisId === sourceRef.axisId
        );
        if (explicit) {
            if (explicit.source.axis !== explicit.target.axis) {
                ChartDiagnostics.warnOnce(
                    warned,
                    `Cross-dimension synchronization mapping from "${explicit.source.axis}:${explicit.source.axisId}" to "${explicit.target.axis}:${explicit.target.axisId}" is not supported. Ignoring mapped axis.`,
                    `sync-mapping-cross-dim-${explicit.source.axis}-${explicit.target.axis}`
                );
                return null;
            }
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

        if (sourceIsPrimary) {
            const configuredPrimaryId = sourceRef.axis === "x" ? primaryAxisIds?.x : primaryAxisIds?.y;
            const primaryId =
                configuredPrimaryId && coordinateSpace.get({ axis: sourceRef.axis, axisId: configuredPrimaryId })?.valid
                    ? configuredPrimaryId
                    : firstValidAxisId(coordinateSpace, sourceRef.axis);
            if (primaryId !== null && primaryId !== undefined) {
                return { axis: sourceRef.axis, axisId: primaryId };
            }
        }

        return null;
    }

    public static resolveTargetAxisRef(
        sourceRef: ChartViewportAxisRef,
        sourceIsPrimary: boolean,
        coordinateSpace: CartesianAxisCoordinateSpace,
        options: NormalizedChartSynchronizationOptions,
        warned: Set<string>,
        primaryAxisIds?: { readonly x?: string; readonly y?: string }
    ): ChartViewportAxisRef | null {
        if (!axisTargetsDimension(options.viewport.axes, sourceRef.axis)) {
            return null;
        }
        const targetRef = this.resolveMappedAxisIdentity(
            sourceRef,
            sourceIsPrimary,
            coordinateSpace,
            options.axisMappings,
            warned,
            primaryAxisIds
        );
        if (!targetRef || !axisTargetsDimension(options.viewport.axes, targetRef.axis)) {
            return null;
        }
        return targetRef;
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
