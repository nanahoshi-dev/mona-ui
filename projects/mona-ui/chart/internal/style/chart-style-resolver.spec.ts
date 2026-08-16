import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
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
): ChartSeriesRegistration {
    return {
        color: signal(options?.color ?? ""),
        data: signal(undefined),
        element: { nativeElement: options?.nativeElement ?? ({} as HTMLElement) },
        field: signal("val"),
        fillOpacity: signal(options?.fillOpacity),
        id: `mock-${type}`,
        name: signal("Mock Series"),
        pointRadius: signal(options?.pointRadius),
        strokeWidth: signal(options?.strokeWidth),
        type,
        userClass: options?.userClass !== undefined ? signal(options.userClass) : undefined,
        visible: signal(true),
        xField: signal(undefined)
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

    it("should resolve computed style custom properties when inputs are undefined", () => {
        const seriesEl = document.createElement("div");
        seriesEl.style.setProperty("--mona-chart-line-width", "5");
        seriesEl.style.setProperty("--mona-chart-point-radius", "8");
        seriesEl.style.setProperty("--mona-chart-area-fill-opacity", "0.75");
        document.body.appendChild(seriesEl);

        const resolver = new ChartStyleResolver();
        const s0 = createMockSeries("area", { nativeElement: seriesEl });

        const style = resolver.resolveSeriesStyle(s0, 0);
        expect(style.lineWidth).toBe(5);
        expect(style.pointRadius).toBe(8);
        expect(style.fillOpacity).toBe(0.75);

        document.body.removeChild(seriesEl);
    });

    it("should allow explicit component inputs to override CSS custom properties", () => {
        const seriesEl = document.createElement("div");
        seriesEl.style.setProperty("--mona-chart-line-width", "5");
        document.body.appendChild(seriesEl);

        const resolver = new ChartStyleResolver();
        const s0 = createMockSeries("line", {
            nativeElement: seriesEl,
            strokeWidth: 10
        });

        const style = resolver.resolveSeriesStyle(s0, 0);
        expect(style.lineWidth).toBe(10);

        document.body.removeChild(seriesEl);
    });

    it("should resolve series color from Tailwind text class on series element", () => {
        const host = document.createElement("div");
        host.style.color = "rgb(15, 23, 42)";
        document.body.appendChild(host);

        const seriesEl = document.createElement("div");
        seriesEl.style.color = "rgb(239, 68, 68)";
        host.appendChild(seriesEl);

        const resolver = new ChartStyleResolver(host);
        const s0 = createMockSeries("line", {
            nativeElement: seriesEl,
            userClass: "text-red-500"
        });

        const style = resolver.resolveSeriesStyle(s0, 0);
        expect(style.color).toBe("rgb(239, 68, 68)");

        document.body.removeChild(host);
    });

    it("should return empty string for undefined CSS variables without resolving to black or inherited text color", () => {
        const host = document.createElement("div");
        host.style.color = "rgb(30, 32, 34)";
        document.body.appendChild(host);

        const resolver = new ChartStyleResolver(host);
        expect(resolver.resolveCssVariable("--mona-chart-grid-color")).toBe("");
        expect(resolver.resolveCssVariable("--mona-chart-bar-highlight-color")).toBe("");
        expect(resolver.resolveCssVariable("--non-existent-color-var")).toBe("");
        expect(resolver.resolveCssVariable("var(--non-existent-var)")).toBe("");

        document.body.removeChild(host);
    });

    it("should convert oklch CSS color values to standard rgb format and return empty string for raw var names", () => {
        expect(toCanvasColor("--some-var-name")).toBe("");
        expect(toCanvasColor("var(--some-var)")).toBe("");
        expect(toCanvasColor("#3b82f6")).toBe("#3b82f6");
        expect(toCanvasColor("rgba(148, 163, 184, 0.2)")).toBe("rgba(148, 163, 184, 0.2)");
        // oklch values should convert to standard rgb syntax
        const converted = toCanvasColor("oklch(87.1% 0.006 286.286)");
        expect(converted.startsWith("rgb(")).toBe(true);
    });
});
