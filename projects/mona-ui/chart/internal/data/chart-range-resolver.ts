import type { ChartField } from "../../models/chart.models";
import { isFiniteNumber } from "../utils/number-utils";
import { resolveValue } from "./chart-value-resolver";

export interface ResolvedRangeValues {
    readonly fromValue: number;
    readonly highValue: number;
    readonly lowValue: number;
    readonly toValue: number;
}

export function resolveFiniteRangeValues(
    datum: unknown,
    fromField: ChartField,
    toField: ChartField,
    index: number
): ResolvedRangeValues | null {
    const rawFrom = resolveValue(datum, fromField, index);
    const rawTo = resolveValue(datum, toField, index);

    if (!isFiniteNumber(rawFrom) || !isFiniteNumber(rawTo)) {
        return null;
    }

    const fromValue = Number(rawFrom);
    const toValue = Number(rawTo);
    const lowValue = Math.min(fromValue, toValue);
    const highValue = Math.max(fromValue, toValue);

    return {
        fromValue,
        highValue,
        lowValue,
        toValue
    };
}
