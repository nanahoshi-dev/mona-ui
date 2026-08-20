import { describe, expect, it } from "vitest";
import {
    ChartSelectionController,
    toSelectedPoint
} from "./chart-selection-controller";
import { ChartVisibleMarkIndex } from "../interaction/chart-visible-mark-index";
import type { SceneHitTarget } from "../scene/scene-geometry";

describe("ChartSelectionController", () => {
    describe("normalize", () => {
        it("should return empty array for undefined or empty input", () => {
            expect(ChartSelectionController.normalize(undefined)).toEqual([]);
            expect(ChartSelectionController.normalize([])).toEqual([]);
        });

        it("should deduplicate and remove empty ids", () => {
            expect(ChartSelectionController.normalize(["a", "b", "a", "", "c", "b"])).toEqual(["a", "b", "c"]);
        });
    });

    describe("applyClick", () => {
        it("should handle single selection mode click", () => {
            const current: string[] = [];
            const r1 = ChartSelectionController.applyClick(current, "mark-1", "single");
            expect(r1.next).toEqual(["mark-1"]);
            expect(r1.added).toEqual(["mark-1"]);
            expect(r1.removed).toEqual([]);

            // Clicking a different item in single mode replaces the selection
            const r2 = ChartSelectionController.applyClick(r1.next, "mark-2", "single");
            expect(r2.next).toEqual(["mark-2"]);
            expect(r2.added).toEqual(["mark-2"]);
            expect(r2.removed).toEqual(["mark-1"]);

            // Clicking the already selected item in single mode is idempotent (keeps selected)
            const r3 = ChartSelectionController.applyClick(r2.next, "mark-2", "single");
            expect(r3.next).toEqual(["mark-2"]);
            expect(r3.added).toEqual([]);
            expect(r3.removed).toEqual([]);
        });

        it("should handle multiple selection mode click toggle", () => {
            const current: string[] = [];
            const r1 = ChartSelectionController.applyClick(current, "m1", "multiple");
            expect(r1.next).toEqual(["m1"]);
            expect(r1.added).toEqual(["m1"]);

            const r2 = ChartSelectionController.applyClick(r1.next, "m2", "multiple");
            expect(r2.next).toEqual(["m1", "m2"]);
            expect(r2.added).toEqual(["m2"]);

            // Clicking m1 toggles it off
            const r3 = ChartSelectionController.applyClick(r2.next, "m1", "multiple");
            expect(r3.next).toEqual(["m2"]);
            expect(r3.removed).toEqual(["m1"]);
        });
    });

    describe("applyClear", () => {
        it("should clear current selection", () => {
            const r = ChartSelectionController.applyClear(["m1", "m2"]);
            expect(r.next).toEqual([]);
            expect(r.removed).toEqual(["m1", "m2"]);
            expect(r.added).toEqual([]);
        });
    });

    describe("applyBrush", () => {
        it("should do nothing when behavior is none", () => {
            const r = ChartSelectionController.applyBrush(["m1"], ["m2", "m3"], "none", "multiple");
            expect(r.next).toEqual(["m1"]);
            expect(r.added).toEqual([]);
            expect(r.removed).toEqual([]);
        });

        it("should replace selection when behavior is replace", () => {
            const r = ChartSelectionController.applyBrush(["m1"], ["m2", "m3"], "replace", "multiple");
            expect(r.next).toEqual(["m2", "m3"]);
            expect(r.added).toEqual(["m2", "m3"]);
            expect(r.removed).toEqual(["m1"]);
        });

        it("should add to selection when behavior is add", () => {
            const r = ChartSelectionController.applyBrush(["m1"], ["m2", "m3"], "add", "multiple");
            expect(r.next).toEqual(["m1", "m2", "m3"]);
            expect(r.added).toEqual(["m2", "m3"]);
            expect(r.removed).toEqual([]);
        });

        it("should remove matched from selection when behavior is remove", () => {
            const r = ChartSelectionController.applyBrush(["m1", "m2", "m3"], ["m2"], "remove", "multiple");
            expect(r.next).toEqual(["m1", "m3"]);
            expect(r.removed).toEqual(["m2"]);
        });

        it("should toggle matched items when behavior is toggle", () => {
            const r = ChartSelectionController.applyBrush(["m1", "m2"], ["m2", "m3"], "toggle", "multiple");
            expect(r.next).toEqual(["m1", "m3"]);
            expect(r.added).toEqual(["m3"]);
            expect(r.removed).toEqual(["m2"]);
        });

        it("should restrict to single item if selection mode is single", () => {
            const r = ChartSelectionController.applyBrush(["m1"], ["m2", "m3"], "replace", "single");
            expect(r.next).toEqual(["m2"]);
        });
    });

    describe("buildChangeEvent", () => {
        it("should build accurate ChartSelectionChangeEvent with visibleSelectedPoints", () => {
            const hit1: Partial<SceneHitTarget> = {
                animationKey: "m1",
                seriesId: "s1",
                seriesName: "Series 1",
                seriesType: "line",
                xValue: "A",
                yValue: 10,
                datum: { x: "A", y: 10 }
            };
            const hit2: Partial<SceneHitTarget> = {
                animationKey: "m2",
                seriesId: "s1",
                seriesName: "Series 1",
                seriesType: "line",
                xValue: "B",
                yValue: 20,
                datum: { x: "B", y: 20 }
            };

            const visibleIndex = new ChartVisibleMarkIndex([hit1 as SceneHitTarget, hit2 as SceneHitTarget]);

            const mutation = {
                added: ["m2"],
                next: ["m1", "m2"],
                removed: []
            };

            const evt = ChartSelectionController.buildChangeEvent(
                "click",
                mutation,
                ["m1"],
                visibleIndex
            );

            expect(evt.source).toBe("click");
            expect(evt.previousSelectedMarkIds).toEqual(["m1"]);
            expect(evt.selectedMarkIds).toEqual(["m1", "m2"]);
            expect(evt.addedMarkIds).toEqual(["m2"]);
            expect(evt.removedMarkIds).toEqual([]);
            expect(evt.visibleSelectedPoints).toHaveLength(2);
            expect(evt.visibleSelectedPoints[0].markId).toBe("m1");
            expect(evt.visibleSelectedPoints[1].markId).toBe("m2");
        });
    });
});
