import type { SceneHitTarget } from "../scene/scene-geometry";
import { ChartMarkIdentityResolver } from "./chart-mark-identity-resolver";

export class ChartVisibleMarkIndex {
    readonly #byMarkId = new Map<string, SceneHitTarget>();
    readonly #bySeriesId = new Map<string, SceneHitTarget[]>();
    #hits: readonly SceneHitTarget[] = [];
    #markIds: readonly string[] = [];

    public constructor(hits: readonly SceneHitTarget[] = []) {
        if (hits.length > 0) {
            this.build(hits);
        }
    }

    /**
     * Adds a lazily resolved raw hit (dense selection overlay) without
     * disturbing existing identities.
     */
    public add(hit: SceneHitTarget): void {
        const markId = ChartMarkIdentityResolver.resolve(hit);
        if (this.#byMarkId.has(markId)) {
            return;
        }
        this.#byMarkId.set(markId, hit);
        this.#markIds = [...this.#markIds, markId];
        this.#hits = [...this.#hits, hit];
        let seriesHits = this.#bySeriesId.get(hit.seriesId);
        if (!seriesHits) {
            seriesHits = [];
            this.#bySeriesId.set(hit.seriesId, seriesHits);
        }
        seriesHits.push(hit);
    }

    public get hits(): readonly SceneHitTarget[] {
        return this.#hits;
    }

    public get markIds(): readonly string[] {
        return this.#markIds;
    }

    public get size(): number {
        return this.#byMarkId.size;
    }

    public build(hits: readonly SceneHitTarget[]): void {
        this.#hits = hits;
        this.#byMarkId.clear();
        this.#bySeriesId.clear();
        const markIds: string[] = [];

        for (const hit of hits) {
            const markId = ChartMarkIdentityResolver.resolve(hit);
            if (!this.#byMarkId.has(markId)) {
                this.#byMarkId.set(markId, hit);
                markIds.push(markId);
            }
            let seriesHits = this.#bySeriesId.get(hit.seriesId);
            if (!seriesHits) {
                seriesHits = [];
                this.#bySeriesId.set(hit.seriesId, seriesHits);
            }
            seriesHits.push(hit);
        }

        this.#markIds = markIds;
    }

    public get(markId: string): SceneHitTarget | undefined {
        return this.#byMarkId.get(markId);
    }

    public getBySeriesId(seriesId: string): readonly SceneHitTarget[] {
        return this.#bySeriesId.get(seriesId) ?? [];
    }

    public has(markId: string): boolean {
        return this.#byMarkId.has(markId);
    }
}
