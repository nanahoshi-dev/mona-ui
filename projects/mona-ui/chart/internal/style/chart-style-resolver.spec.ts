import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type {
    ChartCartesianSeriesRegistration,
    ChartPieSeriesRegistration
} from "../context/chart-registration-context";
import { ChartStyleResolver, toCanvasColor } from "./chart-style-resolver";

function createMockSeries(
    type: "area" | "bar" | "line",
    options?: {
        color?: string;
        fillOpacity?: number;
        nativeElement?: HTMLElement;
        pointRadius?: number;
        strokeWidth?: number;
        userClass?: string;
    }
): ChartCartesianSeriesRegistration {
    return {
        color: signal(options?.color ?? ""),
        data: signal(undefined),
        element: { nativeElement: options?.nativeElement ?? ({} as HTMLElement) },
        field: signal("val"),
        fillOpacity: signal(options?.fillOpacity),
        id: `mock-${type}`,
        name: signal("Mock Series"),
        pointRadius: signal(options?.pointRadius),
        stack: signal(undefined),
        stackMode: signal("normal"),
        strokeWidth: signal(options?.strokeWidth),
        type,
        userClass: options?.userClass !== undefined ? signal(options.userClass) : undefined,
        visible: signal(true),
        xAxisId: signal(undefined),
        xField: signal(undefined),
        yAxisId: signal(undefined)
    } as ChartCartesianSeriesRegistration;
}

function createMockPieSeries(options?: {
    colorField?: string;
    colors?: readonly string[];
    fillOpacity?: number;
    strokeColor?: string;
    strokeWidth?: number;
}): ChartPieSeriesRegistration {
    return {
        categoryField: signal("category"),
        categoryFormatter: signal(undefined),
        colorField: signal(options?.colorField),
        colors: signal(options?.colors),
        cornerRadius: signal(undefined),
        data: signal(undefined),
        element: { nativeElement: {} as HTMLElement },
        endAngle: signal(360),
        field: signal("val"),
        fillOpacity: signal(options?.fillOpacity),
        id: "mock-pie",
        isSliceVisible: () => true,
        labelContent: signal("percentage"),
        labelPosition: signal("outside"),
        minLabelAngle: signal(12),
        name: signal("Mock Pie"),
        outerRadiusRatio: signal(0.9),
        padAngle: signal(0),
        showLabels: signal(false),
        sliceLabelTemplate: signal(undefined),
        startAngle: signal(0),
        strokeColor: signal(options?.strokeColor ?? ""),
        strokeWidth: signal(options?.strokeWidth),
        toggleSliceVisibility: () => true,
        type: "pie",
        valueFormatter: signal(undefined),
        visibilityRevision: signal(0),
        visible: signal(true)
    };
}

describe("ChartStyleResolver", () => {
    it("should use default chart palette when no overrides are set", () => {
        const resolver = new ChartStyleResolver();
        const s0 = createMockSeries("line");
        const s1 = createMockSeries("line");

        const style0 = resolver.resolveSeriesStyle(s0, 0);
        const style1 = resolver.resolveSeriesStyle(s1, 1);

        expect(style0.color).toBe("#3b82f6");
        expect(style1.color).toBe("#10b981");
        expect(style0.lineWidth).toBe(2);
        expect(style0.pointRadius).toBe(3);
    });

    it("should prioritize explicit component color input", () => {
        const resolver = new ChartStyleResolver();
        const s0 = createMockSeries("line", { color: "#ff5500" });

        const style = resolver.resolveSeriesStyle(s0, 0);
        expect(style.color).toBe("#ff5500");
    });

    it("should resolve CSS variable when explicit color uses var() syntax", () => {
        const host = document.createElement("div");
        host.style.setProperty("--color-custom-test", "#123456");
        document.body.appendChild(host);

        const resolver = new ChartStyleResolver(host);
        const s0 = createMockSeries("line", { color: "var(--color-custom-test)" });

        const style = resolver.resolveSeriesStyle(s0, 0);
        expect(style.color).toBe("#123456");

        document.body.removeChild(host);
    });

    it("should extract computed CSS color from element style", () => {
        const el = document.createElement("div");
        el.style.color = "rgb(255, 0, 128)";
        document.body.appendChild(el);

        const resolver = new ChartStyleResolver();
        const s0 = createMockSeries("line", { nativeElement: el });

        const style = resolver.resolveSeriesStyle(s0, 0);
        expect(style.color).toBe("rgb(255, 0, 128)");

        document.body.removeChild(el);
    });

    it("should apply component explicit strokeWidth and pointRadius", () => {
        const resolver = new ChartStyleResolver();
        const s0 = createMockSeries("line", { pointRadius: 6, strokeWidth: 4 });

        const style = resolver.resolveSeriesStyle(s0, 0);
        expect(style.lineWidth).toBe(4);
        expect(style.pointRadius).toBe(6);
    });

    it("should compute area fill colors with proper defaults", () => {
        const resolver = new ChartStyleResolver();
        const s0 = createMockSeries("area", { color: "#8b5cf6", fillOpacity: 0.4 });

        const style = resolver.resolveSeriesStyle(s0, 0);
        expect(style.color).toBe("#8b5cf6");
        expect(style.areaFillColor).toBe("#8b5cf6");
        expect(style.areaFillOpacity).toBe(0.4);
    });

    it("should resolve polar series styles and slice colors", () => {
        const resolver = new ChartStyleResolver();
        const pieSeries = createMockPieSeries({ colors: ["#ff0000", "#00ff00", "#0000ff"] });

        const color0 = resolver.resolveSliceColor(pieSeries, { name: "A" }, 0, 0);
        const color1 = resolver.resolveSliceColor(pieSeries, { name: "B" }, 1, 1);

        expect(color0).toBe("#ff0000");
        expect(color1).toBe("#00ff00");
    });

    it("should resolve datum colorField over explicit colors array", () => {
        const resolver = new ChartStyleResolver();
        const pieSeries = createMockPieSeries({ colorField: "customColor", colors: ["#000000"] });

        const color = resolver.resolveSliceColor(pieSeries, { customColor: "#abcdef" }, 0, 0);
        expect(color).toBe("#abcdef");
    });

    it("should distinguish default vs explicit strokeSource in polar series style", () => {
        const resolver = new ChartStyleResolver();
        const defaultPie = createMockPieSeries();
        const explicitPie = createMockPieSeries({ strokeColor: "#ff0000" });

        const defaultStyle = resolver.resolvePolarSeriesStyle(defaultPie);
        const explicitStyle = resolver.resolvePolarSeriesStyle(explicitPie);

        expect(defaultStyle.strokeSource).toBe("default");
        expect(explicitStyle.strokeSource).toBe("explicit");
        expect(explicitStyle.strokeColor).toBe("#ff0000");
    });

    it("should resolve financial series style with series host CSS variables, explicit inputs, and hollow fallback", () => {
        const seriesEl = document.createElement("div");
        seriesEl.style.setProperty("--mona-chart-financial-rising-color", "#00ffaa");
        seriesEl.style.setProperty("--mona-chart-financial-falling-color", "#ff00aa");
        seriesEl.style.setProperty("--mona-chart-financial-hollow-fill", "#112233");
        document.body.appendChild(seriesEl);

        const resolver = new ChartStyleResolver();
        const mockFinancial = {
            bodyWidth: signal(undefined),
            bodyWidthRatio: signal(0.7),
            closeField: signal("c"),
            color: signal(undefined),
            data: signal(undefined),
            element: { nativeElement: seriesEl },
            fallingColor: signal(undefined),
            fillMode: signal("hollow" as const),
            highField: signal("h"),
            id: "mock-fin",
            lowField: signal("l"),
            maxBodyWidth: signal(undefined),
            name: signal("Candles"),
            neutralColor: signal(undefined),
            opacity: signal(0.9),
            openField: signal("o"),
            risingColor: signal(undefined),
            type: "candlestick" as const,
            visible: signal(true),
            wickColor: signal(undefined),
            wickWidth: signal(2),
            xField: signal("x")
        };

        const style = resolver.resolveFinancialSeriesStyle(mockFinancial as any);

        expect(style.risingColor).toBe("#00ffaa");
        expect(style.fallingColor).toBe("#ff00aa");
        expect(style.hollowFillColor).toBe("#112233");
        expect(style.opacity).toBe(0.9);
        expect(style.wickWidth).toBe(2);

        document.body.removeChild(seriesEl);
    });

    it("should resolve CSS variable with inline fallback in resolveCssVariable", () => {
        const resolver = new ChartStyleResolver();
        const resolved = resolver.resolveCssVariable("var(--non-existent-token, #abcdef)");
        expect(resolved).toBe("#abcdef");
    });
});

describe("toCanvasColor", () => {
    it("should parse rgb and hex color strings", () => {
        expect(toCanvasColor("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
        expect(toCanvasColor("#ff0000")).toBe("#ff0000");
    });

    it("should return empty string for css variable names or invalid colors", () => {
        expect(toCanvasColor("--color-chart-1")).toBe("");
        expect(toCanvasColor("")).toBe("");
    });
});
