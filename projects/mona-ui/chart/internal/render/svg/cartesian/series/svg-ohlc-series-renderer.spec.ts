import { describe, expect, it } from "vitest";
import type { ChartFinancialSeriesStyle, ChartOhlcSeriesScene } from "../../../../scene/cartesian-scene";
import { SvgOhlcSeriesRenderer } from "./svg-ohlc-series-renderer";

describe("SvgOhlcSeriesRenderer", () => {
    function createContainer(): SVGGElement {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        svg.appendChild(group);
        return group;
    }

    function createScene(style: Partial<ChartFinancialSeriesStyle> = {}): ChartOhlcSeriesScene {
        return {
            bodyWidth: 10,
            id: "ohlc-1",
            marks: [
                {
                    animationKey: "m1",
                    centerX: 50,
                    close: 12,
                    closeY: 40,
                    datum: {},
                    direction: "rising",
                    high: 14,
                    highY: 20,
                    index: 0,
                    low: 8,
                    lowY: 80,
                    open: 10,
                    openY: 60,
                    tickWidth: 5,
                    totalWidth: 10,
                    wickWidth: 2,
                    xValue: 0
                }
            ],
            maxBodyWidth: 32,
            name: "Prices",
            style: { fallingColor: "#ef4444", neutralColor: "#6b7280", risingColor: "#16a34a", wickWidth: 2, ...style },
            tickWidth: 5,
            type: "ohlc",
            wickWidth: 2,
            xAxisId: "default-x",
            yAxisId: "default-y"
        };
    }

    it("strokes the stem in wickColor and the ticks in the direction color", () => {
        const container = createContainer();
        new SvgOhlcSeriesRenderer(container).render(createScene({ wickColor: "#111111" }));

        const [stem, ticks] = Array.from(container.querySelectorAll("path"));
        expect(stem.getAttribute("d")).toBe("M 50 20 V 80");
        expect(stem.getAttribute("stroke")).toBe("#111111");
        expect(ticks.getAttribute("d")).toBe("M 45 60 H 50 M 50 40 H 55");
        expect(ticks.getAttribute("stroke")).toBe("#16a34a");
        expect(container.querySelector("g")?.getAttribute("stroke-width")).toBe("2");
    });

    it("strokes the stem in the direction color when wickColor is unset", () => {
        const container = createContainer();
        new SvgOhlcSeriesRenderer(container).render(createScene());

        const [stem] = Array.from(container.querySelectorAll("path"));
        expect(stem.getAttribute("stroke")).toBe("#16a34a");
    });

    it("reuses the paths of a mark when it renders again", () => {
        const container = createContainer();
        const renderer = new SvgOhlcSeriesRenderer(container);
        renderer.render(createScene());
        const first = container.querySelector("path");

        renderer.render(createScene({ wickColor: "#222222" }));

        expect(container.querySelectorAll("path").length).toBe(2);
        expect(container.querySelector("path")).toBe(first);
        expect(first?.getAttribute("stroke")).toBe("#222222");
    });
});
