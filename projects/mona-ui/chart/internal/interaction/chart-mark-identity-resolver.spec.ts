import { describe, expect, it } from "vitest";
import { ChartMarkIdentityResolver } from "./chart-mark-identity-resolver";
import type { SceneHitTarget } from "../scene/scene-geometry";

describe("ChartMarkIdentityResolver", () => {
    it("should resolve animationKey if present", () => {
        const hit: Partial<SceneHitTarget> = {
            animationKey: "series-a::item-123",
            seriesId: "series-a",
            index: 0
        };
        expect(ChartMarkIdentityResolver.resolve(hit as SceneHitTarget)).toBe("series-a::item-123");
    });

    it("should resolve itemId if animationKey is not present", () => {
        const hit: Partial<SceneHitTarget> = {
            itemId: "item-456",
            seriesId: "series-b",
            index: 2
        };
        expect(ChartMarkIdentityResolver.resolve(hit as SceneHitTarget)).toBe("item-456");
    });

    it("should resolve sliceId if animationKey and itemId are not present", () => {
        const hit: Partial<SceneHitTarget> = {
            sliceId: "slice-789",
            seriesId: "series-c",
            index: 1
        };
        expect(ChartMarkIdentityResolver.resolve(hit as SceneHitTarget)).toBe("slice-789");
    });

    it("should fallback to JSON serialization of seriesId and index/dataIndex", () => {
        const hit: Partial<SceneHitTarget> = {
            seriesId: "series-d",
            dataIndex: 4,
            index: 4
        };
        expect(ChartMarkIdentityResolver.resolve(hit as SceneHitTarget)).toBe(JSON.stringify(["series-d", "index", 4]));
    });

    it("should resolve consistent markIds for identical hit targets", () => {
        const hit1: Partial<SceneHitTarget> = { seriesId: "s1", index: 3 };
        const hit2: Partial<SceneHitTarget> = { seriesId: "s1", index: 3 };
        expect(ChartMarkIdentityResolver.resolve(hit1 as SceneHitTarget)).toBe(
            ChartMarkIdentityResolver.resolve(hit2 as SceneHitTarget)
        );
    });
});
