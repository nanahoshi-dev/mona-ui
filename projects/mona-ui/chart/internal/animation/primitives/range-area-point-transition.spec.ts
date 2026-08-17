import { describe, expect, it } from "vitest";
import {
    sampleRangeAreaPointTransition,
    type RangeAreaPointMarkTransitionPlan
} from "./range-area-point-transition";

describe("sampleRangeAreaPointTransition", () => {
    it("should sample progress <= 0 using from state", () => {
        const plan: RangeAreaPointMarkTransitionPlan = {
            animationKey: "k1",
            from: {
                animationKey: "k1",
                datum: { id: 1 },
                defined: true,
                formattedFrom: "10",
                formattedTo: "20",
                fromPoint: { x: 50, y: 100 },
                fromValue: 10,
                index: 0,
                opacity: 1,
                toPoint: { x: 50, y: 50 },
                toValue: 20,
                x: 50,
                xValue: "Jan"
            },
            to: {
                animationKey: "k1",
                datum: { id: 1 },
                defined: true,
                formattedFrom: "20",
                formattedTo: "40",
                fromPoint: { x: 60, y: 80 },
                fromValue: 20,
                index: 0,
                opacity: 1,
                toPoint: { x: 60, y: 30 },
                toValue: 40,
                x: 60,
                xValue: "Jan"
            },
            type: "update"
        };

        const sampled = sampleRangeAreaPointTransition(plan, 0);
        expect(sampled.x).toBe(50);
        expect(sampled.fromPoint?.y).toBe(100);
        expect(sampled.toPoint?.y).toBe(50);
        expect(sampled.lowValue).toBe(10);
        expect(sampled.highValue).toBe(20);
        expect(sampled.renderOpacity).toBe(1);
    });

    it("should sample progress >= 1 using to state", () => {
        const plan: RangeAreaPointMarkTransitionPlan = {
            animationKey: "k1",
            from: {
                animationKey: "k1",
                datum: { id: 1 },
                defined: true,
                formattedFrom: "10",
                formattedTo: "20",
                fromPoint: { x: 50, y: 100 },
                fromValue: 10,
                index: 0,
                opacity: 1,
                toPoint: { x: 50, y: 50 },
                toValue: 20,
                x: 50,
                xValue: "Jan"
            },
            to: {
                animationKey: "k1",
                datum: { id: 1 },
                defined: true,
                formattedFrom: "20",
                formattedTo: "40",
                fromPoint: { x: 60, y: 80 },
                fromValue: 20,
                index: 0,
                opacity: 1,
                toPoint: { x: 60, y: 30 },
                toValue: 40,
                x: 60,
                xValue: "Jan"
            },
            type: "update"
        };

        const sampled = sampleRangeAreaPointTransition(plan, 1);
        expect(sampled.x).toBe(60);
        expect(sampled.fromPoint?.y).toBe(80);
        expect(sampled.toPoint?.y).toBe(30);
        expect(sampled.lowValue).toBe(20);
        expect(sampled.highValue).toBe(40);
    });

    it("should linearly interpolate semantic fromPoint and toPoint endpoints at progress 0.5 (RNG-002)", () => {
        const plan: RangeAreaPointMarkTransitionPlan = {
            animationKey: "k1",
            from: {
                animationKey: "k1",
                datum: { id: 1 },
                defined: true,
                formattedFrom: "10",
                formattedTo: "30",
                fromPoint: { x: 100, y: 100 },
                fromValue: 10,
                index: 0,
                opacity: 1,
                toPoint: { x: 100, y: 40 },
                toValue: 30,
                x: 100,
                xValue: "Jan"
            },
            to: {
                animationKey: "k1",
                datum: { id: 1 },
                defined: true,
                formattedFrom: "30",
                formattedTo: "10",
                fromPoint: { x: 200, y: 40 },
                fromValue: 30,
                index: 0,
                opacity: 1,
                toPoint: { x: 200, y: 100 },
                toValue: 10,
                x: 200,
                xValue: "Jan"
            },
            type: "update"
        };

        const sampled = sampleRangeAreaPointTransition(plan, 0.5);
        expect(sampled.x).toBe(150);
        // fromPoint interpolates from y=100 to y=40 -> 70
        expect(sampled.fromPoint?.y).toBe(70);
        // toPoint interpolates from y=40 to y=100 -> 70
        expect(sampled.toPoint?.y).toBe(70);
        // fromValue interpolates from 10 to 30 -> 20
        expect(sampled.fromValue).toBe(20);
        // toValue interpolates from 30 to 10 -> 20
        expect(sampled.toValue).toBe(20);
        expect(sampled.lowValue).toBe(20);
        expect(sampled.highValue).toBe(20);
    });
});
