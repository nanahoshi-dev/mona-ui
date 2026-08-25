import type { ChartField } from "../../models/chart.models";
import {
    composeMarkKey,
    normalizeSeriesKey,
    resolveMarkKeyPart,
    type ChartAnimationMarkKey
} from "./animation-identity";
import type { CartesianDenseMarkIdentityQuery } from "../density/cartesian-dense-interaction-provider";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";

export interface ChartSeriesMarkIdentityOptions {
    readonly extractNaturalKey?: (datum: unknown, index: number) => unknown;
    readonly keyField?: ChartField;
    /** Set only when the caller has already proved the extracted keys unique. */
    readonly naturalKeysUnique?: boolean;
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
    readonly #seriesId: string;
    readonly #seriesPrefix: string;
    #occurrenceRanks: Uint32Array | null;
    #released = false;
    #reverseMap: Map<string, number[]> | null = null;
    #sourceData: readonly unknown[] | null;

    public constructor(seriesId: string, sourceData: readonly unknown[], options?: ChartSeriesMarkIdentityOptions) {
        this.#seriesId = seriesId;
        this.#sourceData = sourceData;
        this.#keyField = options?.keyField;
        this.#extractNaturalKey = options?.extractNaturalKey;
        const normKey = normalizeSeriesKey(options?.seriesKey);
        this.#seriesPrefix = normKey ?? seriesId;

        const n = sourceData.length;
        if (options?.naturalKeysUnique || (!this.#keyField && !this.#extractNaturalKey)) {
            this.#occurrenceRanks = null;
            ChartDensityTracker.current?.onMarkIdentityAuthorityBuild?.();
            return;
        }

        const tracker = new Map<string, number>();
        let hasDuplicateKey = false;

        for (let i = 0; i < n; i++) {
            const datum = sourceData[i];
            const naturalKey = this.#extractNaturalKey ? this.#extractNaturalKey(datum, i) : i;
            const { part } = resolveMarkKeyPart(datum, this.#keyField, naturalKey, i);
            const baseKey = `${part.type}:${part.value}`;
            const count = tracker.get(baseKey) ?? 0;
            if (count > 0) {
                hasDuplicateKey = true;
            }
            tracker.set(baseKey, count + 1);
        }

        this.#occurrenceRanks = hasDuplicateKey ? this.#buildOccurrenceRanks(sourceData) : null;
        ChartDensityTracker.current?.onMarkIdentityAuthorityBuild?.();
        if (hasDuplicateKey) {
            ChartDensityTracker.current?.onOccurrenceRankBuild?.();
        }
    }

    public get seriesId(): string {
        return this.#seriesId;
    }

    public get seriesPrefix(): string {
        return this.#seriesPrefix;
    }

    public locate(query: CartesianDenseMarkIdentityQuery): number | null {
        const sourceData = this.#sourceData;
        if (!sourceData) {
            return null;
        }
        if (query.partType === "i") {
            const idx = Number(query.value);
            return Number.isInteger(idx) && idx >= 0 && idx < sourceData.length ? idx : null;
        }

        if (!this.#reverseMap) {
            const map = new Map<string, number[]>();
            const n = sourceData.length;
            for (let i = 0; i < n; i++) {
                const datum = sourceData[i];
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
        if (this.#occurrenceRanks && sourceIndex >= 0 && sourceIndex < this.#occurrenceRanks.length) {
            return this.#occurrenceRanks[sourceIndex];
        }
        return 0;
    }

    /** Releases source-dependent authority so replaced/destroyed charts do not retain old data. */
    public release(reason: "destroy" | "source-replacement" = "source-replacement"): void {
        if (this.#released) {
            return;
        }
        this.#released = true;
        this.#sourceData = null;
        this.#occurrenceRanks = null;
        this.#reverseMap = null;
        if (reason === "destroy") {
            ChartDensityTracker.current?.onDestroyRelease?.();
        } else {
            ChartDensityTracker.current?.onSourceGenerationRelease?.();
        }
    }

    public resolveKeyAt(sourceIndex: number, naturalKey?: unknown, datum?: unknown): ChartAnimationMarkKey {
        const sourceData = this.#sourceData;
        if (!sourceData || sourceIndex < 0 || sourceIndex >= sourceData.length) {
            return JSON.stringify([this.#seriesPrefix, "i", sourceIndex, 0]);
        }
        const rowDatum = datum !== undefined ? datum : sourceData[sourceIndex];
        const rowNaturalKey =
            naturalKey !== undefined
                ? naturalKey
                : this.#extractNaturalKey
                  ? this.#extractNaturalKey(rowDatum, sourceIndex)
                  : sourceIndex;
        const { part } = resolveMarkKeyPart(rowDatum, this.#keyField, rowNaturalKey, sourceIndex);
        const rank = this.#occurrenceRanks?.[sourceIndex] ?? 0;
        return composeMarkKey(this.#seriesPrefix, part, rank);
    }

    #buildOccurrenceRanks(sourceData: readonly unknown[]): Uint32Array {
        const ranks = new Uint32Array(sourceData.length);
        const tracker = new Map<string, number>();
        for (let i = 0; i < sourceData.length; i++) {
            const datum = sourceData[i];
            const naturalKey = this.#extractNaturalKey ? this.#extractNaturalKey(datum, i) : i;
            const { part } = resolveMarkKeyPart(datum, this.#keyField, naturalKey, i);
            const baseKey = `${part.type}:${part.value}`;
            const count = tracker.get(baseKey) ?? 0;
            ranks[i] = count;
            tracker.set(baseKey, count + 1);
        }
        return ranks;
    }
}
