import type { ChartSeriesStyle } from "../../models/chart-style.models";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";

const DEFAULT_CHART_COLORS = [
    "#3b82f6", // Blue (shadcn Chart 1)
    "#10b981", // Emerald (shadcn Chart 2)
    "#f59e0b", // Amber (shadcn Chart 3)
    "#8b5cf6", // Purple (shadcn Chart 4)
    "#ec4899"  // Pink (shadcn Chart 5)
];

const DEFAULT_CHART_PALETTE_VARIABLES = [
    "--color-chart-1",
    "--color-chart-2",
    "--color-chart-3",
    "--color-chart-4",
    "--color-chart-5"
];

export class ChartStyleResolver {
    readonly #rootElement: HTMLElement | null;

    public constructor(rootElement: HTMLElement | null = null) {
        this.#rootElement = rootElement;
    }

    public resolveSeriesStyle(
        series: ChartSeriesRegistration,
        seriesIndex: number,
        colorPalette: readonly string[] = DEFAULT_CHART_PALETTE_VARIABLES
    ): ChartSeriesStyle {
        const explicitColor = series.color();
        const explicitStrokeWidth = series.strokeWidth?.();
        const explicitPointRadius = series.pointRadius?.();
        const explicitFillOpacity = series.fillOpacity?.();

        let elementColor = "";
        let cssLineWidth: number | undefined;
        let cssPointRadius: number | undefined;
        let cssAreaFillColor: string | undefined;
        let cssAreaFillOpacity: number | undefined;

        if (typeof window !== "undefined" && series.element?.nativeElement) {
            try {
                const nativeEl = series.element.nativeElement;
                if (nativeEl.style?.color) {
                    elementColor = nativeEl.style.color;
                }

                const computed = window.getComputedStyle(nativeEl);
                const customWidth = computed.getPropertyValue("--mona-chart-line-width");
                if (customWidth) {
                    const parsed = parseFloat(customWidth);
                    if (!Number.isNaN(parsed)) cssLineWidth = parsed;
                }
                const customRadius = computed.getPropertyValue("--mona-chart-point-radius");
                if (customRadius) {
                    const parsed = parseFloat(customRadius);
                    if (!Number.isNaN(parsed)) cssPointRadius = parsed;
                }
                const customFill = computed.getPropertyValue("--mona-chart-area-fill-color");
                if (customFill) {
                    cssAreaFillColor = customFill.trim();
                }
                const customOpacity = computed.getPropertyValue("--mona-chart-area-fill-opacity");
                if (customOpacity) {
                    const parsed = parseFloat(customOpacity);
                    if (!Number.isNaN(parsed)) cssAreaFillOpacity = parsed;
                }
            } catch {
                // Ignore style resolution errors in non-standard environments
            }
        }

        const paletteVar = colorPalette[seriesIndex % colorPalette.length];
        const fallbackColor = DEFAULT_CHART_COLORS[seriesIndex % DEFAULT_CHART_COLORS.length];
        const themeVarColor = this.resolveCssVariable(paletteVar);
        const defaultColor = themeVarColor && themeVarColor !== paletteVar ? themeVarColor : fallbackColor;

        const resolvedColor = explicitColor || elementColor || defaultColor;
        const resolvedLineWidth = explicitStrokeWidth ?? cssLineWidth ?? (series.type === "line" || series.type === "area" ? 2 : 1);
        const resolvedPointRadius = explicitPointRadius ?? cssPointRadius ?? 3;
        const resolvedFillOpacity = explicitFillOpacity ?? cssAreaFillOpacity ?? (series.type === "area" ? 0.15 : 1);
        const resolvedAreaFillColor = cssAreaFillColor ? this.resolveCssVariable(cssAreaFillColor) : resolvedColor;

        return {
            areaFillColor: resolvedAreaFillColor,
            areaFillOpacity: resolvedFillOpacity,
            color: resolvedColor,
            lineWidth: resolvedLineWidth,
            opacity: 1,
            pointRadius: resolvedPointRadius
        };
    }

    public resolveCssVariable(varNameOrColor: string): string {
        if (!varNameOrColor) {
            return "";
        }
        const isVariable = varNameOrColor.startsWith("var(") || varNameOrColor.startsWith("--");
        if (!isVariable) {
            return varNameOrColor;
        }
        if (typeof window === "undefined" || !this.#rootElement) {
            return "";
        }
        try {
            const rawVar = varNameOrColor.startsWith("var(")
                ? varNameOrColor.replace(/^var\(\s*/, "").replace(/\s*\)$/, "")
                : varNameOrColor;
            const computed = window.getComputedStyle(this.#rootElement);
            const resolved = computed.getPropertyValue(rawVar).trim();
            return resolved || "";
        } catch {
            return "";
        }
    }
}
