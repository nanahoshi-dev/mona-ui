import type { ChartField } from "../../models/chart.models";
import { resolveValue } from "../data/chart-value-resolver";

export type ChartAnimationMarkKey = string;

export type KeyPartType = "b" | "d" | "i" | "n" | "s";

export interface TypedKeyPart {
    readonly type: KeyPartType;
    readonly value: boolean | number | string;
}

export function serializeKeyPart(value: unknown): TypedKeyPart | null {
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value === "string") {
        return { type: "s", value };
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? { type: "n", value } : null;
    }
    if (typeof value === "boolean") {
        return { type: "b", value };
    }
    if (value instanceof Date) {
        const time = value.getTime();
        return Number.isNaN(time) ? null : { type: "d", value: time };
    }
    return null;
}

export function normalizeSeriesKey(value: string | undefined | null): string | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }
    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export class ChartMarkKeyResolver {
    readonly #occurrenceTracker = new Map<string, number>();
    readonly #warnedDuplicateKeys = new Set<string>();
    readonly #seriesId: string;
    readonly #seriesPrefix: string;
    readonly #keyField?: ChartField;

    public constructor(seriesId: string, keyField?: ChartField, seriesKey?: string) {
        this.#seriesId = seriesId;
        const normKey = normalizeSeriesKey(seriesKey);
        this.#seriesPrefix = normKey ?? seriesId;
        this.#keyField = keyField;
    }

    public resolveKey(datum: unknown, naturalKey: unknown, dataIndex: number): ChartAnimationMarkKey {
        return this.#composeKey(datum, naturalKey, dataIndex, null);
    }

    /**
     * Resolves a mark key with an explicit occurrence rank instead of the
     * internal tracker. Dense raw interaction uses this so repeated
     * materialization of the same source datum stays identical to the ID the
     * full sequential layout produced (stable mark identity).
     */
    public resolveKeyWithRank(datum: unknown, naturalKey: unknown, dataIndex: number, occurrenceRank: number): ChartAnimationMarkKey {
        return this.#composeKey(datum, naturalKey, dataIndex, occurrenceRank);
    }

    #composeKey(datum: unknown, naturalKey: unknown, dataIndex: number, forcedRank: number | null): ChartAnimationMarkKey {
        let part: TypedKeyPart | null = null;
        let isExplicit = false;

        if (this.#keyField) {
            const explicitVal = resolveValue(datum, this.#keyField, dataIndex);
            part = serializeKeyPart(explicitVal);
            if (part !== null) {
                isExplicit = true;
            }
        }

        if (part === null) {
            part = serializeKeyPart(naturalKey);
        }

        if (part === null) {
            part = { type: "i", value: dataIndex };
        }

        const baseKey = `${part.type}:${part.value}`;
        const count = forcedRank ?? this.#occurrenceTracker.get(baseKey) ?? 0;
        if (forcedRank === null) {
            this.#occurrenceTracker.set(baseKey, count + 1);
        }

        if (count > 0 && isExplicit && typeof ngDevMode !== "undefined" && ngDevMode) {
            if (!this.#warnedDuplicateKeys.has(baseKey)) {
                this.#warnedDuplicateKeys.add(baseKey);
                // eslint-disable-next-line no-console
                console.warn(
                    `[Mona Chart] Duplicate explicit keyField value "${part.value}" encountered in series "${this.#seriesId}". Suffixing occurrence to maintain unique identity.`
                );
            }
        }

        return JSON.stringify([this.#seriesPrefix, part.type, part.value, count]);
    }
}
