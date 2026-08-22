import { ChartMarkIdentityResolver } from "../interaction/chart-mark-identity-resolver";
import type {
    CartesianDenseInteractionProvider
} from "./cartesian-dense-interaction-provider";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartBrushHitPolicy } from "../../models/chart-brush.models";
import type { ResolvedCartesianBrushTarget } from "../brush/cartesian-brush-target-resolver";
import type { SceneHitTarget } from "../scene/scene-geometry";

/**
 * Aggregates exact raw matches from dense connected-path providers for one
 * brush rectangle (§70). Ordinary materialized-scene results are merged by the
 * caller; this returns only the unsampled raw portion.
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
        for (const hit of provider.queryRange({ hitPolicy: undefined, pixelA, pixelB })) {
            results.push(hit);
        }
    }

    // Deterministic order: series ID, then source index.
    results.sort((a, b) => {
        if (a.seriesId !== b.seriesId) {
            return a.seriesId < b.seriesId ? -1 : 1;
        }
        return (a.index ?? 0) - (b.index ?? 0);
    });
    return results;
}

function providerAppliesToTarget(
    _seriesId: string,
    _provider: CartesianDenseInteractionProvider,
    _target: ResolvedCartesianBrushTarget
): boolean {
    // Connected-path providers are bound to their own series axes; axis
    // namespace filtering happens on semantic ranges via the shared coordinate
    // space inversion, so every dense series participates by default.
    return true;
}

export interface CartesianDenseInteractionProviderWithLookup extends CartesianDenseInteractionProvider {
    locateRawIndex(semanticX: number): { readonly candidateIndices: readonly number[] } | null;
}

/**
 * Resolves a controlled/selected mark ID that is absent from the rendered
 * sample back to its raw source datum (§72/§73). Parsing is lazy per request;
 * no million-entry reverse map is built.
 */
export function resolveDenseMarkById(
    scene: CartesianXYChartScene,
    markId: string
): SceneHitTarget | null {
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
    const [, partType, rawValue, occurrenceRank] = parsed as [string, string, unknown, number];
    if (partType !== "n" || typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
        return null;
    }

    // Locate the exact raw datum across providers.
    for (const provider of providers.values()) {
        const withLookup = provider as CartesianDenseInteractionProviderWithLookup;
        if (typeof withLookup.locateRawIndex !== "function") {
            continue;
        }
        const lookup = withLookup.locateRawIndex(rawValue);
        if (!lookup || lookup.candidateIndices.length === 0) {
            continue;
        }
        const index = lookup.candidateIndices[Math.min(Math.max(0, occurrenceRank), lookup.candidateIndices.length - 1)];
        const resolved = provider.materializeAt(index);
        if (resolved && ChartMarkIdentityResolver.resolve(resolved) === markId) {
            return resolved;
        }
    }
    return null;
}
