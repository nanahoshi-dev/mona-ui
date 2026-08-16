import { formatRgb, parse } from "culori";
import type { ChartSeriesStyle } from "../../models/chart-style.models";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import { isFiniteNumber } from "../utils/number-utils";

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

export function toCanvasColor(colorStr: string, documentRef?: Document | null): string {
    if (!colorStr) {
        return "";
    }
    const trimmed = colorStr.trim();
    if (!trimmed || trimmed.startsWith("--") || trimmed.startsWith("var(")) {
        return "";
    }
    if (
        trimmed.startsWith("#") ||
        trimmed.startsWith("rgb(") ||
        trimmed.startsWith("rgba(") ||
        trimmed.startsWith("hsl(") ||
        trimmed.startsWith("hsla(")
    ) {
        try {
            const parsed = parse(trimmed);
            if (parsed) {
                return trimmed;
            }
        } catch {
            return "";
        }
        return "";
    }

    const doc = documentRef ?? (typeof document !== "undefined" ? document : null);
    if (doc && doc.body) {
        try {
            const testEl = doc.createElement("span");
            testEl.style.display = "none";
            testEl.setAttribute("aria-hidden", "true");
            testEl.style.color = trimmed;
            if (testEl.style.color) {
                doc.body.appendChild(testEl);
                const computed = (doc.defaultView ?? window).getComputedStyle(testEl).color;
                testEl.remove();
                if (
                    computed &&
                    (computed.startsWith("rgb(") ||
                        computed.startsWith("rgba(") ||
                        computed.startsWith("#") ||
                        computed.startsWith("hsl(") ||
                        computed.startsWith("hsla("))
                ) {
                    return computed;
                }
            }
        } catch {
            // Fall through to culori
        }
    }

    try {
        let parseTarget = trimmed;
        if (parseTarget.startsWith("oklch(") || parseTarget.startsWith("oklab(")) {
            parseTarget = parseTarget.replace(/(\d+(?:\.\d+)?)%/g, (_, n) => String(parseFloat(n) / 100));
        }
        const parsed = parse(parseTarget);
        if (parsed) {
            return formatRgb(parsed) || "";
        }
    } catch {
        return "";
    }
    return "";
}

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
        const rawExplicitColor = series.color();
        const explicitColor = rawExplicitColor ? this.resolveCssVariable(rawExplicitColor) : "";
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
                const computed = window.getComputedStyle(nativeEl);
                const rootComputed = this.#rootElement ? window.getComputedStyle(this.#rootElement) : null;
                const rootColor = rootComputed?.color ?? "";
                const userClass = (series as { userClass?: () => string }).userClass?.() ?? "";
                const hasTextClass = typeof userClass === "string" && (/\btext-/.test(userClass) || /\btext\[/.test(userClass));

                if (nativeEl.style?.color) {
                    elementColor = this.resolveCssVariable(nativeEl.style.color);
                } else if (computed.color && (hasTextClass || (rootColor !== "" && computed.color !== rootColor))) {
                    elementColor = toCanvasColor(computed.color, this.#rootElement?.ownerDocument);
                }

                const customWidth = computed.getPropertyValue("--mona-chart-line-width");
                if (customWidth) {
                    const parsed = parseFloat(customWidth);
                    if (isFiniteNumber(parsed) && parsed >= 0) cssLineWidth = parsed;
                }
                const customRadius = computed.getPropertyValue("--mona-chart-point-radius");
                if (customRadius) {
                    const parsed = parseFloat(customRadius);
                    if (isFiniteNumber(parsed) && parsed >= 0) cssPointRadius = parsed;
                }
                const customFill = computed.getPropertyValue("--mona-chart-area-fill-color");
                if (customFill) {
                    cssAreaFillColor = customFill.trim();
                }
                const customOpacity =
                    computed.getPropertyValue("--mona-chart-fill-opacity") ||
                    computed.getPropertyValue("--mona-chart-area-fill-opacity");
                if (customOpacity) {
                    const parsed = parseFloat(customOpacity);
                    if (isFiniteNumber(parsed)) cssAreaFillOpacity = Math.max(0, Math.min(1, parsed));
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
        const resolvedLineWidth = explicitStrokeWidth !== undefined && isFiniteNumber(explicitStrokeWidth) && explicitStrokeWidth >= 0
            ? explicitStrokeWidth
            : (cssLineWidth ?? (series.type === "line" || series.type === "area" ? 2 : 1));
        const resolvedPointRadius = explicitPointRadius !== undefined && isFiniteNumber(explicitPointRadius) && explicitPointRadius >= 0
            ? explicitPointRadius
            : (cssPointRadius ?? 3);
        const defaultFillOpacity = series.type === "area" ? 0.15 : 1;
        const resolvedFillOpacity = explicitFillOpacity !== undefined && isFiniteNumber(explicitFillOpacity)
            ? Math.max(0, Math.min(1, explicitFillOpacity))
            : (cssAreaFillOpacity ?? defaultFillOpacity);
        const resolvedAreaFillColor = cssAreaFillColor ? this.resolveCssVariable(cssAreaFillColor) : resolvedColor;

        return {
            areaFillColor: resolvedAreaFillColor,
            areaFillOpacity: resolvedFillOpacity,
            color: resolvedColor,
            fillOpacity: resolvedFillOpacity,
            lineWidth: resolvedLineWidth,
            opacity: 1,
            pointRadius: resolvedPointRadius
        };
    }

    public resolveCssVariable(varNameOrColor: string): string {
        if (!varNameOrColor) {
            return "";
        }
        const trimmed = varNameOrColor.trim();
        const isVariable = trimmed.startsWith("var(") || trimmed.startsWith("--");
        if (!isVariable) {
            return toCanvasColor(trimmed, this.#rootElement?.ownerDocument);
        }
        if (typeof window === "undefined" || !this.#rootElement) {
            return "";
        }
        try {
            let current = trimmed;
            const computed = window.getComputedStyle(this.#rootElement);
            for (let i = 0; i < 5; i++) {
                if (!current.startsWith("var(") && !current.startsWith("--")) {
                    break;
                }
                const rawVar = current.startsWith("var(")
                    ? current.replace(/^var\(\s*/, "").replace(/\s*\)$/, "").split(",")[0].trim()
                    : current;
                const resolved = computed.getPropertyValue(rawVar).trim();
                if (!resolved) {
                    return "";
                }
                current = resolved;
            }
            if (current.startsWith("var(") || current.startsWith("--")) {
                return "";
            }
            return toCanvasColor(current, this.#rootElement?.ownerDocument);
        } catch {
            return "";
        }
    }
}
