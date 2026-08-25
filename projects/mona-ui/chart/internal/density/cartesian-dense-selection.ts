import { ChartMarkIdentityResolver } from "../interaction/chart-mark-identity-resolver";
import type {
    CartesianDenseInteractionProvider,
    CartesianDenseMarkIdentityQuery
} from "./cartesian-dense-interaction-provider";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ResolvedCartesianBrushTarget } from "../brush/cartesian-brush-target-resolver";
import type { SceneHitTarget } from "../scene/scene-geometry";

/**
 * Aggregates exact raw matches from dense connected-path providers for one
 * brush rectangle (§70). The returned raw dense matches may overlap with
 * committed sampled-scene matches; the caller merges them by stable mark
 * identity.
 */
export function collectDenseBrushHits(
    scene: CartesianXYChartScene,
    bounds: ChartRect,
    target: ResolvedCartesianBrushTarget
): SceneHitTarget[] {
    const providers = scene.denseInteraction;
    if (!providers || providers.size === 0) {
        return [];
    }

    const plotRect = scene.plotRect;
    const pixelA: ChartPoint = {
        x: target.mode === "y" ? plotRect.x : bounds.x,
        y: target.mode === "x" ? plotRect.y : bounds.y
    };
    const pixelB: ChartPoint = {
        x: target.mode === "y" ? plotRect.x + plotRect.width : bounds.x + bounds.width,
        y: target.mode === "x" ? plotRect.y + plotRect.height : bounds.y + bounds.height
    };

    const results: SceneHitTarget[] = [];
    for (const [seriesId, provider] of providers) {
        if (!providerAppliesToTarget(seriesId, provider, target)) {
            continue;
        }
        for (const hit of provider.queryRange({ hitPolicy: target.hitPolicy, pixelA, pixelB })) {
            results.push(hit);
        }
    }

    return results;
}

export interface CartesianBrushOrderContext {
    readonly seriesOrdinalById?: ReadonlyMap<string, number>;
}

function compareBrushHitsCanonical(a: SceneHitTarget, b: SceneHitTarget, context: CartesianBrushOrderContext): number {
    const seriesOrdinal = (hit: SceneHitTarget): number =>
        context.seriesOrdinalById?.get(hit.seriesId) ??
        hit.markerInteractionOrder?.seriesOrdinal ??
        Number.MAX_SAFE_INTEGER;
    const sourceOrdinal = (hit: SceneHitTarget): number =>
        hit.markerInteractionOrder?.sourceOrdinal ?? hit.index ?? hit.dataIndex ?? Number.MAX_SAFE_INTEGER;

    const seriesDifference = seriesOrdinal(a) - seriesOrdinal(b);
    if (seriesDifference !== 0) {
        return seriesDifference;
    }
    const sourceDifference = sourceOrdinal(a) - sourceOrdinal(b);
    if (sourceDifference !== 0) {
        return sourceDifference;
    }
    const renderDifference = (a.renderOrder ?? 0) - (b.renderOrder ?? 0);
    if (renderDifference !== 0) {
        return renderDifference;
    }
    return ChartMarkIdentityResolver.resolve(a).localeCompare(ChartMarkIdentityResolver.resolve(b));
}

/**
 * Merges committed scene hits with exact dense hits without collapsing
 * distinct full-source occurrence identities. Ordinary scene hits own the
 * first occurrence when both paths resolve the same mark.
 */
export function mergeBrushHitsByIdentity(
    ordinaryHits: readonly SceneHitTarget[],
    denseHits: readonly SceneHitTarget[],
    context: CartesianBrushOrderContext = {}
): SceneHitTarget[] {
    const byIdentity = new Map<string, SceneHitTarget>();

    for (const hit of ordinaryHits) {
        const identity = ChartMarkIdentityResolver.resolve(hit);
        byIdentity.set(identity, hit);
    }
    for (const hit of denseHits) {
        const identity = ChartMarkIdentityResolver.resolve(hit);
        if (!byIdentity.has(identity)) {
            byIdentity.set(identity, hit);
        }
    }

    const merged = Array.from(byIdentity.values());
    merged.sort((a, b) => compareBrushHitsCanonical(a, b, context));
    return merged;
}

function providerAppliesToTarget(
    _seriesId: string,
    provider: CartesianDenseInteractionProvider,
    target: ResolvedCartesianBrushTarget
): boolean {
    if (target.xAxisId && provider.xAxisId && provider.xAxisId !== target.xAxisId) {
        return false;
    }
    if (target.yAxisId && provider.yAxisId && provider.yAxisId !== target.yAxisId) {
        return false;
    }
    return true;
}

/**
 * Resolves a controlled/selected mark ID that is absent from the rendered
 * sample back to its raw source datum (§72/§73 / SD3-R11, SD3-R12).
 * Strictly requires typed reverse lookup; never treats occurrence rank as source index.
 */
export function resolveDenseMarkById(scene: CartesianXYChartScene, markId: string): SceneHitTarget | null {
    const providers = scene.denseInteraction;
    if (!providers || providers.size === 0) {
        return null;
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(markId);
    } catch {
        return null;
    }
    if (!Array.isArray(parsed) || parsed.length !== 4) {
        return null;
    }
    const [seriesId, partType, rawValue, occurrenceRank] = parsed as [string, string, unknown, number];

    const candidateProviders =
        typeof seriesId === "string" && providers.has(seriesId) ? [providers.get(seriesId)!] : [...providers.values()];

    const query: CartesianDenseMarkIdentityQuery = {
        occurrenceRank: typeof occurrenceRank === "number" ? occurrenceRank : 0,
        partType: partType as "b" | "d" | "i" | "n" | "s",
        seriesPrefix: String(seriesId),
        value: rawValue as boolean | number | string
    };

    for (const provider of candidateProviders) {
        if (typeof provider.locateMarkIdentity === "function") {
            const index = provider.locateMarkIdentity(query);
            if (index !== null && index >= 0) {
                const resolved = provider.materializeAt(index);
                if (resolved && ChartMarkIdentityResolver.resolve(resolved) === markId) {
                    return resolved;
                }
            }
        }
    }
    return null;
}
