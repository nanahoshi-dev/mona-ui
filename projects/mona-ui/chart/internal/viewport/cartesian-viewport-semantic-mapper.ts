import type { ChartViewportConstraint } from "../../models/chart-viewport.models";
import type { ChartContinuousPositionScale } from "../scale/chart-scale";
import { CartesianViewportConstraints } from "./cartesian-viewport-constraints";
import type { CartesianAxisCoordinateSnapshot } from "./cartesian-axis-coordinate-space";
import type { InternalAxisViewport, InternalCategoryViewport, InternalContinuousViewport } from "./cartesian-viewport-normalizer";
import { ChartDiagnostics } from "../utils/chart-diagnostics";

export interface ViewportSemanticMapperOptions {
    clampToData?: boolean;
    constraints?: readonly ChartViewportConstraint[];
    minVisibleCategories?: number;
}

export interface ViewportSemanticMapperContext {
    readonly warned: Set<string>;
    readonly diagnosticScope: string;
}

function findConstraint(
    options: ViewportSemanticMapperOptions | undefined,
    snap: CartesianAxisCoordinateSnapshot
): ChartViewportConstraint | undefined {
    return options?.constraints?.find(c => c.axis === snap.ref.axis && c.axisId === snap.ref.axisId);
}

function toBaseNumber(value: unknown): number {
    return value instanceof Date ? value.getTime() : Number(value);
}

function baseExtent(snap: CartesianAxisCoordinateSnapshot): { readonly baseMax: number; readonly baseMin: number } {
    const b0 = toBaseNumber(snap.baseDomain[0]);
    const b1 = toBaseNumber(snap.baseDomain[1]);
    return { baseMax: Math.max(b0, b1), baseMin: Math.min(b0, b1) };
}

export function mapCategoryDomainWindow(
    sourceWin: InternalAxisViewport | undefined,
    sourceSnap: CartesianAxisCoordinateSnapshot,
    targetSnap: CartesianAxisCoordinateSnapshot,
    options: ViewportSemanticMapperOptions | undefined,
    context: ViewportSemanticMapperContext
): InternalAxisViewport | undefined {
    if (!sourceWin) {
        return undefined;
    }

    const sourceDomain = sourceSnap.baseDomain as readonly string[];
    const targetDomain = targetSnap.baseDomain as readonly string[];
    const areEqual =
        sourceDomain.length === targetDomain.length && sourceDomain.every((k, i) => k === targetDomain[i]);
    if (!areEqual) {
        ChartDiagnostics.warnOnce(
            context.warned,
            `Link "${context.diagnosticScope}" mode "domain" requires identical category domains.`,
            `link-domain-category-incompatible-${context.diagnosticScope}`
        );
        return undefined;
    }

    const catWin = sourceWin as InternalCategoryViewport;
    const constraint = findConstraint(options, targetSnap);
    const [cStart, cEnd] = CartesianViewportConstraints.applyCategoryConstraints(
        catWin.startIndex,
        catWin.endIndexExclusive,
        targetDomain.length,
        constraint,
        options?.minVisibleCategories ?? 1,
        options?.clampToData !== false
    );

    if (cStart === 0 && cEnd === targetDomain.length) {
        return undefined;
    }

    return {
        axis: targetSnap.ref.axis,
        axisId: targetSnap.ref.axisId,
        endIndexExclusive: cEnd,
        firstVisibleKey: targetDomain[cStart] !== undefined ? String(targetDomain[cStart]) : undefined,
        kind: "category",
        lastVisibleKey: targetDomain[cEnd - 1] !== undefined ? String(targetDomain[cEnd - 1]) : undefined,
        startIndex: cStart
    };
}

export function mapContinuousDomainWindow(
    sourceWin: InternalAxisViewport | undefined,
    sourceSnap: CartesianAxisCoordinateSnapshot,
    targetSnap: CartesianAxisCoordinateSnapshot,
    options: ViewportSemanticMapperOptions | undefined,
    context: ViewportSemanticMapperContext
): InternalAxisViewport | undefined {
    if (!sourceWin) {
        return undefined;
    }

    const isSourceDate = sourceSnap.resolvedType === "time" || sourceSnap.resolvedType === "utc";
    const isTargetDate = targetSnap.resolvedType === "time" || targetSnap.resolvedType === "utc";

    if (isSourceDate !== isTargetDate) {
        ChartDiagnostics.warnOnce(
            context.warned,
            `Link "${context.diagnosticScope}" mode "domain" cannot link temporal and numeric axes.`,
            `link-domain-type-mismatch-${context.diagnosticScope}`
        );
        return undefined;
    }

    const contWin = sourceWin as InternalContinuousViewport;
    const { baseMax, baseMin } = baseExtent(targetSnap);

    const constraint = findConstraint(options, targetSnap);
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

export function computeSourceNormalizedWindow(
    sourceWin: InternalAxisViewport,
    sourceSnap: CartesianAxisCoordinateSnapshot
): { readonly u0: number; readonly u1: number } {
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

    return {
        u0: Math.max(0, Math.min(u0, u1)),
        u1: Math.min(1, Math.max(u0, u1))
    };
}

export function mapCategoryRelativeWindow(
    normalized: { readonly u0: number; readonly u1: number },
    targetSnap: CartesianAxisCoordinateSnapshot,
    options: ViewportSemanticMapperOptions | undefined
): InternalAxisViewport | undefined {
    const baseCount = targetSnap.baseDomain.length;
    if (baseCount === 0) {
        return undefined;
    }
    const startIndex = Math.round(normalized.u0 * baseCount);
    const endIndex = Math.round(normalized.u1 * baseCount);

    const constraint = findConstraint(options, targetSnap);
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

export function mapContinuousRelativeWindow(
    normalized: { readonly u0: number; readonly u1: number },
    targetSnap: CartesianAxisCoordinateSnapshot,
    options: ViewportSemanticMapperOptions | undefined
): InternalAxisViewport | undefined {
    const [tr0, tr1] = targetSnap.range;
    const tp0 = tr0 + normalized.u0 * (tr1 - tr0);
    const tp1 = tr0 + normalized.u1 * (tr1 - tr0);

    const continuousScale = targetSnap.baseScale as ChartContinuousPositionScale<number | Date>;
    const inv0 = continuousScale.invert?.(tp0);
    const inv1 = continuousScale.invert?.(tp1);
    if (inv0 === undefined || inv1 === undefined) {
        return undefined;
    }

    const num0 = inv0 instanceof Date ? inv0.getTime() : Number(inv0);
    const num1 = inv1 instanceof Date ? inv1.getTime() : Number(inv1);
    if (!Number.isFinite(num0) || !Number.isFinite(num1) || num0 === num1) {
        return undefined;
    }

    const { baseMax, baseMin } = baseExtent(targetSnap);

    const constraint = findConstraint(options, targetSnap);
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

export function isCategorySnapshot(snap: CartesianAxisCoordinateSnapshot): boolean {
    return snap.resolvedType === "category";
}

export function mapDomainWindow(
    sourceWin: InternalAxisViewport | undefined,
    sourceSnap: CartesianAxisCoordinateSnapshot,
    targetSnap: CartesianAxisCoordinateSnapshot,
    options: ViewportSemanticMapperOptions | undefined,
    context: ViewportSemanticMapperContext
): InternalAxisViewport | undefined {
    if (!sourceWin) {
        return undefined;
    }

    if (sourceSnap.resolvedType === "category" && targetSnap.resolvedType === "category") {
        return mapCategoryDomainWindow(sourceWin, sourceSnap, targetSnap, options, context);
    }

    if (sourceSnap.resolvedType !== "category" && targetSnap.resolvedType !== "category") {
        return mapContinuousDomainWindow(sourceWin, sourceSnap, targetSnap, options, context);
    }

    ChartDiagnostics.warnOnce(
        context.warned,
        `Link "${context.diagnosticScope}" mode "domain" cannot link continuous and category axes.`,
        `link-domain-category-continuous-mismatch-${context.diagnosticScope}`
    );
    return undefined;
}

export function mapRelativeWindow(
    sourceWin: InternalAxisViewport | undefined,
    sourceSnap: CartesianAxisCoordinateSnapshot,
    targetSnap: CartesianAxisCoordinateSnapshot,
    options: ViewportSemanticMapperOptions | undefined
): InternalAxisViewport | undefined {
    if (!sourceWin) {
        return undefined;
    }

    const normalized = computeSourceNormalizedWindow(sourceWin, sourceSnap);

    if (targetSnap.resolvedType === "category") {
        return mapCategoryRelativeWindow(normalized, targetSnap, options);
    }

    return mapContinuousRelativeWindow(normalized, targetSnap, options);
}
