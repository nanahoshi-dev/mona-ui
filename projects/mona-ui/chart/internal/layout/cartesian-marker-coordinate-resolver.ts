import type { ChartContinuousPositionScale, ChartPositionScale } from "../scale/chart-scale";
import type { ChartInteractionXKey } from "../scene/scene-geometry";
import { isFiniteNumber } from "../utils/number-utils";
import { resolveCartesianTemporalValue } from "../data/cartesian-temporal-value-resolver";

export interface ResolvedCartesianXCoordinate {
    readonly coordinate: number;
    readonly interactionKey: ChartInteractionXKey;
    readonly valid: boolean;
    readonly value: unknown;
}

/**
 * Neutral coordinate resolver to eliminate module cycles between marker layout and materializers (SD4-R10).
 */
export function resolveCartesianContinuousXCoordinate(
    val: unknown,
    linearXScale: ChartContinuousPositionScale<number> | undefined,
    timeScale: ChartContinuousPositionScale<Date> | undefined,
    dataIndex: number,
    genericXScale?: ChartPositionScale
): ResolvedCartesianXCoordinate {
    const activeScale = genericXScale ?? linearXScale ?? timeScale;
    if (activeScale) {
        if (activeScale.type === "time" || activeScale.type === "utc") {
            const resolved = resolveCartesianTemporalValue(val);
            if (resolved) {
                const coord = (activeScale as unknown as { map(value: unknown): number | undefined }).map(resolved.date);
                if (coord !== undefined && Number.isFinite(coord)) {
                    return {
                        coordinate: coord,
                        interactionKey: resolved.epochMs,
                        valid: true,
                        value: val
                    };
                }
            }
        } else if (isFiniteNumber(val)) {
            const num = Number(val);
            const coord = (activeScale as unknown as { map(value: unknown): number | undefined }).map(num);
            if (coord !== undefined && Number.isFinite(coord)) {
                return {
                    coordinate: coord,
                    interactionKey: num,
                    valid: true,
                    value: val
                };
            }
        }
    }

    return {
        coordinate: 0,
        interactionKey: dataIndex,
        valid: false,
        value: val
    };
}
