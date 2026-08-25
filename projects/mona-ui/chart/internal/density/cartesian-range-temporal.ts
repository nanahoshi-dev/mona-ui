import {
    isNumericLikeTemporalString,
    resolveCartesianTemporalValue,
    resolveRepresentableDateEpoch,
    type ResolvedCartesianTemporalValue
} from "../data/cartesian-temporal-value-resolver";

export type ResolvedRangeTemporalXValue = ResolvedCartesianTemporalValue;

export { isNumericLikeTemporalString, resolveCartesianTemporalValue, resolveRepresentableDateEpoch };

/**
 * Range-area continuous X semantics shared by live layout and density.
 * Numeric-looking strings remain invalid; numeric epochs must be numbers.
 */
export function resolveRangeTemporalXValue(value: unknown): ResolvedRangeTemporalXValue | null {
    return resolveCartesianTemporalValue(value);
}
