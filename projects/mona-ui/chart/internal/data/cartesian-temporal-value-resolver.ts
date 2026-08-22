export interface ResolvedCartesianTemporalValue {
    readonly date: Date;
    readonly epochMs: number;
}

export interface CartesianTemporalDomainInput {
    readonly explicitMax?: unknown;
    readonly explicitMin?: unknown;
    readonly fallbackDomain?: readonly [number, number];
    readonly fallbackSpanMs?: number;
    readonly observedMaxEpoch?: number;
    readonly observedMinEpoch?: number;
}

export interface NormalizedCartesianTemporalDomain {
    readonly domain: readonly [Date, Date];
    readonly explicitMaxEpoch?: number;
    readonly explicitMinEpoch?: number;
    readonly hasValidExplicitMax: boolean;
    readonly hasValidExplicitMin: boolean;
}

const MAX_DATE_EPOCH = 8_640_000_000_000_000;
const MIN_DATE_EPOCH = -MAX_DATE_EPOCH;
const DEFAULT_TEMPORAL_DOMAIN_SPAN_MS = 3_600_000;

const numericLikeTemporalPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

/** Numeric-looking strings are not implicit epoch values on temporal axes. */
export function isNumericLikeTemporalString(value: string): boolean {
    return numericLikeTemporalPattern.test(value.trim());
}

/** Returns a Date only when the epoch is finite and representable by Date. */
export function resolveRepresentableDateEpoch(epochMs: number): Date | null {
    if (!Number.isFinite(epochMs)) {
        return null;
    }
    const date = new Date(epochMs);
    return Number.isFinite(date.getTime()) ? date : null;
}

/** Resolves one raw temporal value under the chart-wide time-axis policy. */
export function resolveCartesianTemporalValue(value: unknown): ResolvedCartesianTemporalValue | null {
    if (value instanceof Date) {
        const date = resolveRepresentableDateEpoch(value.getTime());
        return date ? { date, epochMs: date.getTime() } : null;
    }
    if (typeof value === "number") {
        const date = resolveRepresentableDateEpoch(value);
        return date ? { date, epochMs: date.getTime() } : null;
    }
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0 || isNumericLikeTemporalString(trimmed)) {
        return null;
    }
    const epochMs = Date.parse(trimmed);
    const date = resolveRepresentableDateEpoch(epochMs);
    return date ? { date, epochMs: date.getTime() } : null;
}

/**
 * Expands one representable temporal point without crossing JavaScript Date's
 * representable boundaries. The returned pair is always ascending and has a
 * non-zero span whenever the input point is representable.
 */
export function expandTemporalPointSafely(
    epochMs: number,
    spanMs: number = DEFAULT_TEMPORAL_DOMAIN_SPAN_MS,
    mode: "backward" | "center" | "forward" = "center"
): readonly [number, number] {
    const anchor = resolveRepresentableDateEpoch(epochMs)?.getTime() ?? 0;
    const span = Number.isFinite(spanMs) && spanMs > 0 ? spanMs : DEFAULT_TEMPORAL_DOMAIN_SPAN_MS;

    let min = anchor;
    let max = anchor;
    if (mode === "backward") {
        min = Math.max(MIN_DATE_EPOCH, anchor - span);
    } else if (mode === "forward") {
        max = Math.min(MAX_DATE_EPOCH, anchor + span);
    } else {
        const halfSpan = Math.max(1, span / 2);
        min = Math.max(MIN_DATE_EPOCH, anchor - halfSpan);
        max = Math.min(MAX_DATE_EPOCH, anchor + halfSpan);
    }

    if (min === max) {
        if (anchor < MAX_DATE_EPOCH) {
            max = anchor + 1;
        } else if (anchor > MIN_DATE_EPOCH) {
            min = anchor - 1;
        }
    }

    return [min, max];
}

function normalizeTemporalObservedEpoch(epochMs: number | undefined): number | undefined {
    return epochMs === undefined ? undefined : resolveRepresentableDateEpoch(epochMs)?.getTime();
}

function normalizeTemporalFallbackDomain(
    fallbackDomain: readonly [number, number] | undefined
): readonly [number, number] {
    const fallbackMin = normalizeTemporalObservedEpoch(fallbackDomain?.[0]);
    const fallbackMax = normalizeTemporalObservedEpoch(fallbackDomain?.[1]);
    if (fallbackMin !== undefined && fallbackMax !== undefined) {
        if (fallbackMin === fallbackMax) {
            return expandTemporalPointSafely(fallbackMin);
        }
        return [Math.min(fallbackMin, fallbackMax), Math.max(fallbackMin, fallbackMax)];
    }
    return [0, 1];
}

/**
 * Applies the chart-wide temporal domain policy once for every authoritative
 * domain path. Invalid explicit values behave as absent; valid explicit sides
 * retain their semantic lower/upper role even when they fall outside data.
 */
export function normalizeCartesianTemporalDomain(
    input: CartesianTemporalDomainInput
): NormalizedCartesianTemporalDomain {
    const explicitMinEpoch = resolveCartesianTemporalValue(input.explicitMin)?.epochMs;
    const explicitMaxEpoch = resolveCartesianTemporalValue(input.explicitMax)?.epochMs;
    const observedMinEpoch = normalizeTemporalObservedEpoch(input.observedMinEpoch);
    const observedMaxEpoch = normalizeTemporalObservedEpoch(input.observedMaxEpoch);
    const fallbackSpanMs = input.fallbackSpanMs ?? DEFAULT_TEMPORAL_DOMAIN_SPAN_MS;

    let min: number;
    let max: number;

    if (explicitMinEpoch !== undefined && explicitMaxEpoch !== undefined) {
        min = Math.min(explicitMinEpoch, explicitMaxEpoch);
        max = Math.max(explicitMinEpoch, explicitMaxEpoch);
        if (min === max) {
            [min, max] = expandTemporalPointSafely(min, fallbackSpanMs);
        }
    } else if (explicitMinEpoch !== undefined) {
        const observedUpper = observedMaxEpoch ?? observedMinEpoch;
        if (observedUpper !== undefined && observedUpper > explicitMinEpoch) {
            min = explicitMinEpoch;
            max = observedUpper;
        } else {
            [min, max] = expandTemporalPointSafely(explicitMinEpoch, fallbackSpanMs, "forward");
        }
    } else if (explicitMaxEpoch !== undefined) {
        const observedLower = observedMinEpoch ?? observedMaxEpoch;
        if (observedLower !== undefined && observedLower < explicitMaxEpoch) {
            min = observedLower;
            max = explicitMaxEpoch;
        } else {
            [min, max] = expandTemporalPointSafely(explicitMaxEpoch, fallbackSpanMs, "backward");
        }
    } else if (observedMinEpoch !== undefined || observedMaxEpoch !== undefined) {
        const observedLower = observedMinEpoch ?? observedMaxEpoch!;
        const observedUpper = observedMaxEpoch ?? observedMinEpoch!;
        min = Math.min(observedLower, observedUpper);
        max = Math.max(observedLower, observedUpper);
        if (min === max) {
            [min, max] = expandTemporalPointSafely(min, fallbackSpanMs);
        }
    } else {
        [min, max] = normalizeTemporalFallbackDomain(input.fallbackDomain);
    }

    return {
        domain: [new Date(min), new Date(max)],
        explicitMaxEpoch,
        explicitMinEpoch,
        hasValidExplicitMax: explicitMaxEpoch !== undefined,
        hasValidExplicitMin: explicitMinEpoch !== undefined
    };
}
