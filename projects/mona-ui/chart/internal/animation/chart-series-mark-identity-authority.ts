import type { ChartField } from "../../models/chart.models";
import {
    composeMarkKey,
    normalizeSeriesKey,
    resolveMarkKeyPart,
    type ChartAnimationMarkKey
} from "./animation-identity";
import type { CartesianDenseMarkIdentityQuery } from "../density/cartesian-dense-interaction-provider";

export interface ChartSeriesMarkIdentityOptions {
    readonly extractNaturalKey?: (datum: unknown, index: number) => unknown;
    readonly keyField?: ChartField;
    readonly seriesKey?: string;
}

/**
 * Immutable full-source mark identity authority (WP3 / SD4-R15, SD4-R16, SD4-R17, SD4-R18).
 * Precomputes source-order occurrence ranks across the entire source data revision so that
 * full layouts, sampled layouts, and dense raw hits all produce identical, stable mark IDs.
 */
export class ChartSeriesMarkIdentityAuthority {
    readonly #extractNaturalKey?: (datum: unknown, index: number) => unknown;
    readonly #keyField?: ChartField;
    readonly #occurrenceRanks: Int32Array;
    readonly #seriesId: string;
    readonly #seriesPrefix: string;
    readonly #sourceData: readonly unknown[];
    #reverseMap: Map<string, number[]> | null = null;

    public constructor(
        seriesId: string,
        sourceData: readonly unknown[],
        options?: ChartSeriesMarkIdentityOptions
    ) {
        this.#seriesId = seriesId;
        this.#sourceData = sourceData;
        this.#keyField = options?.keyField;
        this.#extractNaturalKey = options?.extractNaturalKey;
        const normKey = normalizeSeriesKey(options?.seriesKey);
        this.#seriesPrefix = normKey ?? seriesId;

        const n = sourceData.length;
        const ranks = new Int32Array(n);
        const tracker = new Map<string, number>();

        for (let i = 0; i < n; i++) {
            const datum = sourceData[i];
            const naturalKey = this.#extractNaturalKey ? this.#extractNaturalKey(datum, i) : i;
            const { part } = resolveMarkKeyPart(datum, this.#keyField, naturalKey, i);
            const baseKey = `${part.type}:${part.value}`;
            const count = tracker.get(baseKey) ?? 0;
            ranks[i] = count;
            tracker.set(baseKey, count + 1);
        }

        this.#occurrenceRanks = ranks;
    }

    public get seriesId(): string {
        return this.#seriesId;
    }

    public get seriesPrefix(): string {
        return this.#seriesPrefix;
    }

    public locate(query: CartesianDenseMarkIdentityQuery): number | null {
        if (query.partType === "i") {
            const idx = Number(query.value);
            return Number.isInteger(idx) && idx >= 0 && idx < this.#sourceData.length ? idx : null;
        }

        if (!this.#reverseMap) {
            const map = new Map<string, number[]>();
            const n = this.#sourceData.length;
            for (let i = 0; i < n; i++) {
                const datum = this.#sourceData[i];
                const naturalKey = this.#extractNaturalKey ? this.#extractNaturalKey(datum, i) : i;
                const { part } = resolveMarkKeyPart(datum, this.#keyField, naturalKey, i);
                const k = `${part.type}:${part.value}`;
                let list = map.get(k);
                if (!list) {
                    list = [];
                    map.set(k, list);
                }
                list.push(i);
            }
            this.#reverseMap = map;
        }

        const k = `${query.partType}:${query.value}`;
        const list = this.#reverseMap.get(k);
        if (!list || query.occurrenceRank >= list.length) {
            return null;
        }
        return list[query.occurrenceRank];
    }

    public occurrenceRankAt(sourceIndex: number): number {
        if (sourceIndex >= 0 && sourceIndex < this.#occurrenceRanks.length) {
            return this.#occurrenceRanks[sourceIndex];
        }
        return 0;
    }

    public resolveKeyAt(sourceIndex: number, naturalKey?: unknown, datum?: unknown): ChartAnimationMarkKey {
        if (sourceIndex < 0 || sourceIndex >= this.#sourceData.length) {
            return JSON.stringify([this.#seriesPrefix, "i", sourceIndex, 0]);
        }
        const rowDatum = datum !== undefined ? datum : this.#sourceData[sourceIndex];
        const rowNaturalKey = naturalKey !== undefined ? naturalKey : (this.#extractNaturalKey ? this.#extractNaturalKey(rowDatum, sourceIndex) : sourceIndex);
        const { part } = resolveMarkKeyPart(rowDatum, this.#keyField, rowNaturalKey, sourceIndex);
        const rank = this.#occurrenceRanks[sourceIndex];
        return composeMarkKey(this.#seriesPrefix, part, rank);
    }
}
