import type {
    ChartContinuousPositionScale,
    ChartPositionScale,
    ResolvedChartCartesianAxisType
} from "../scale/chart-scale";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";

export interface CartesianNormalizedBaseMapper {
    readonly invert: (normalized: number) => unknown | undefined;
    readonly map: (value: unknown) => number | undefined;
}

export interface CartesianNormalizedBaseMapperOptions {
    readonly domain: readonly unknown[];
    readonly exponent?: number;
    readonly logBase?: number;
    readonly symlogConstant?: number;
    readonly type: ResolvedChartCartesianAxisType;
}

export interface CartesianNormalizedBaseMapperSource {
    readonly baseDomain: readonly unknown[];
    readonly baseScale: ChartPositionScale<unknown>;
    readonly normalizedBaseMapper?: CartesianNormalizedBaseMapper;
    readonly resolvedType: ResolvedChartCartesianAxisType;
}

const fallbackMapperCache = new WeakMap<object, CartesianNormalizedBaseMapper | null>();

export function createCartesianNormalizedBaseMapper(
    options: CartesianNormalizedBaseMapperOptions
): CartesianNormalizedBaseMapper | undefined {
    if (options.type === "category" || options.domain.length < 2) {
        return undefined;
    }

    const scale = CartesianScaleFactory.createExactPositionScale({
        domain: options.domain,
        exponent: options.exponent,
        logBase: options.logBase,
        range: [0, 1],
        symlogConstant: options.symlogConstant,
        type: options.type
    });
    const continuousScale = scale as ChartContinuousPositionScale<number | Date>;

    return {
        invert: normalized => {
            if (!Number.isFinite(normalized) || typeof continuousScale.invert !== "function") {
                return undefined;
            }
            const value = continuousScale.invert(normalized);
            if (value instanceof Date) {
                return Number.isFinite(value.getTime()) ? value : undefined;
            }
            return Number.isFinite(value) ? value : undefined;
        },
        map: value => {
            const pixel = scale.map(value as never);
            return pixel !== undefined && Number.isFinite(pixel) ? pixel : undefined;
        }
    };
}

/**
 * Resolves the mapper attached to an authority snapshot. Manual snapshots
 * from older callers are supported through a weakly cached exact mapper, while
 * production authority snapshots carry the mapper created during preparation.
 */
export function resolveCartesianNormalizedBaseMapper(
    source: CartesianNormalizedBaseMapperSource
): CartesianNormalizedBaseMapper | undefined {
    if (source.normalizedBaseMapper) {
        return source.normalizedBaseMapper;
    }

    const cached = fallbackMapperCache.get(source);
    if (cached !== undefined) {
        return cached ?? undefined;
    }

    const baseScale = source.baseScale as ChartPositionScale<unknown> & {
        readonly constant?: number;
        readonly exponent?: number;
        readonly logBase?: number;
    };
    const mapper =
        createCartesianNormalizedBaseMapper({
            domain: source.baseDomain,
            exponent: baseScale.exponent,
            logBase: baseScale.logBase,
            symlogConstant: baseScale.constant,
            type: source.resolvedType
        }) ?? null;
    fallbackMapperCache.set(source, mapper);
    return mapper ?? undefined;
}
