import { describe, expect, it } from "vitest";
import type {
    ChartGaugeSeriesScene,
    ChartRadialBarSeriesScene,
    ChartRoseSeriesScene
} from "../../scene/polar-arc-scene";
import { RadialArcAnimationAdapter } from "./radial-arc-animation-adapter";

describe("RadialArcAnimationAdapter", () => {
    const adapter = new RadialArcAnimationAdapter();

    it("samples radial bar ring animation smoothly from collapsed to full sweep", () => {
        const targetScene: ChartRadialBarSeriesScene = {
            barGap: 4,
            fillMode: "solid",
            id: "rb-1",
            marks: [
                {
                    animationKey: "rb-1:rb:s:A",
                    category: "A",
                    color: "#3b82f6",
                    cornerRadius: 4,
                    dataIndex: 0,
                    datum: {},
                    endAngle: Math.PI,
                    formattedCategory: "A",
                    formattedValue: "50",
                    innerRadius: 50,
                    itemId: "s:A",
                    normalizedValue: 0.5,
                    outerRadius: 70,
                    padAngle: 0,
                    rawValue: 50,
                    startAngle: 0,
                    visible: true
                }
            ],
            name: "Radial Bar",
            style: {
                fillOpacity: 1,
                strokeColor: "",
                strokeSource: "default",
                strokeWidth: 0,
                trackColor: "#e2e8f0",
                trackOpacity: 0.15
            },
            tracks: [],
            type: "radialBar"
        };

        const plan = adapter.createPlan(null, targetScene, {} as never);
        expect(plan.adapterType).toBe("radialBar");

        const frame0 = plan.sample(0) as ChartRadialBarSeriesScene;
        expect(frame0.marks[0].endAngle).toBe(0); // collapsed at startAngle
        expect(frame0.marks[0].renderOpacity).toBe(0);

        const frameMid = plan.sample(0.5) as ChartRadialBarSeriesScene;
        expect(frameMid.marks[0].endAngle).toBeCloseTo(Math.PI / 2);
        expect(frameMid.marks[0].renderOpacity).toBeCloseTo(0.5);

        const frameEnd = plan.sample(1) as ChartRadialBarSeriesScene;
        expect(frameEnd.marks[0].endAngle).toBeCloseTo(Math.PI);
        expect(frameEnd.marks[0].renderOpacity ?? 1).toBe(1);
    });

    it("samples gauge value and needle transition", () => {
        const prevScene: ChartGaugeSeriesScene = {
            fillMode: "solid",
            id: "gauge-1",
            indicator: "both",
            name: "Speed",
            needle: {
                angle: 0,
                color: "#1e293b",
                hubColor: "#1e293b",
                hubRadius: 5,
                length: 80,
                width: 2
            },
            showValue: true,
            style: {
                color: "#3b82f6",
                fillOpacity: 1,
                hubColor: "#1e293b",
                needleColor: "#1e293b",
                strokeColor: "",
                strokeSource: "default",
                strokeWidth: 0,
                trackColor: "#e2e8f0",
                trackOpacity: 0.15
            },
            track: {
                color: "#e2e8f0",
                endAngle: Math.PI,
                innerRadius: 60,
                opacity: 0.15,
                outerRadius: 90,
                startAngle: -Math.PI
            },
            type: "gauge",
            value: {
                animationKey: "gauge-1:gauge:i:0",
                dataIndex: 0,
                datum: {},
                endAngle: 0,
                formattedValue: "0",
                innerRadius: 60,
                isClamped: false,
                max: 100,
                min: 0,
                outerRadius: 90,
                ratio: 0,
                rawValue: 0,
                startAngle: -Math.PI
            }
        };

        const targetScene: ChartGaugeSeriesScene = {
            ...prevScene,
            needle: {
                ...prevScene.needle!,
                angle: Math.PI / 2
            },
            value: {
                ...prevScene.value,
                endAngle: Math.PI / 2,
                formattedValue: "75",
                ratio: 0.75,
                rawValue: 75
            }
        };

        const plan = adapter.createPlan(prevScene, targetScene, {} as never);
        const frameMid = plan.sample(0.5) as ChartGaugeSeriesScene;

        expect(frameMid.value.rawValue).toBeCloseTo(37.5);
        expect(frameMid.value.endAngle).toBeCloseTo(Math.PI / 4);
        expect(frameMid.needle?.angle).toBeCloseTo(Math.PI / 4);
    });
});
