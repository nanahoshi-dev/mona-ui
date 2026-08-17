import { formatRgb, parse, wcagContrast } from "culori";
import type { ChartSeriesStyle } from "../../models/chart-style.models";
import type {
    ChartCartesianSeriesRegistration,
    ChartFinancialSeriesRegistration,
    ChartHeatmapSeriesRegistration,
    ChartPolarSeriesRegistration,
    ChartRadialSeriesRegistration,
    ChartSeriesRegistration
} from "../context/chart-registration-context";
import type { ChartHeatmapSeriesStyle } from "../../models/chart-heatmap.models";
import { resolveValue } from "../data/chart-value-resolver";
import type { ChartFinancialSeriesStyle } from "../scene/cartesian-scene";
import type { ChartPolarSeriesStyle } from "../scene/polar-scene";
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

    public resolvePaletteColor(
        paletteIndex: number,
        colorPalette: readonly string[] = DEFAULT_CHART_PALETTE_VARIABLES
    ): string {
        const paletteVar = colorPalette[paletteIndex % colorPalette.length];
        const fallbackColor = DEFAULT_CHART_COLORS[paletteIndex % DEFAULT_CHART_COLORS.length];
        const themeVarColor = this.resolveCssVariable(paletteVar);
        return themeVarColor && themeVarColor !== paletteVar ? themeVarColor : fallbackColor;
    }

    public resolvePolarSeriesStyle(registration: ChartPolarSeriesRegistration): ChartPolarSeriesStyle {
        const rawStrokeColor = registration.strokeColor();
        const strokeWidthInput = registration.strokeWidth?.();
        const fillOpacityInput = registration.fillOpacity?.();

        let cssStrokeWidth: number | undefined;
        let cssStrokeColor: string | undefined;
        let cssFillOpacity: number | undefined;

        if (typeof window !== "undefined" && registration.element?.nativeElement) {
            try {
                const computed = window.getComputedStyle(registration.element.nativeElement);
                const sw = computed.getPropertyValue("--mona-chart-slice-stroke-width");
                if (sw) {
                    const parsed = parseFloat(sw);
                    if (isFiniteNumber(parsed) && parsed >= 0) cssStrokeWidth = parsed;
                }
                const sc = computed.getPropertyValue("--mona-chart-slice-stroke-color");
                if (sc) {
                    cssStrokeColor = sc.trim();
                }
                const fo = computed.getPropertyValue("--mona-chart-slice-fill-opacity");
                if (fo) {
                    const parsed = parseFloat(fo);
                    if (isFiniteNumber(parsed)) cssFillOpacity = Math.max(0, Math.min(1, parsed));
                }
            } catch {
                // Ignore style resolution errors
            }
        }

        const hasExplicitStroke = Boolean(rawStrokeColor || cssStrokeColor);
        const strokeSource: "default" | "explicit" = hasExplicitStroke ? "explicit" : "default";

        const strokeColor = rawStrokeColor
            ? this.resolveCssVariable(rawStrokeColor)
            : (cssStrokeColor
                  ? this.resolveCssVariable(cssStrokeColor)
                  : (this.resolveCssVariable("--color-surface") || "#ffffff"));

        const strokeWidth =
            strokeWidthInput !== undefined && isFiniteNumber(strokeWidthInput) && strokeWidthInput >= 0
                ? strokeWidthInput
                : (cssStrokeWidth ?? 1);

        const fillOpacity =
            fillOpacityInput !== undefined && isFiniteNumber(fillOpacityInput)
                ? Math.max(0, Math.min(1, fillOpacityInput))
                : (cssFillOpacity ?? 1);

        return {
            fillOpacity,
            strokeColor,
            strokeSource,
            strokeWidth
        };
    }

    public resolveSeriesStyle(
        series: ChartCartesianSeriesRegistration,
        seriesIndex: number,
        colorPalette: readonly string[] = DEFAULT_CHART_PALETTE_VARIABLES
    ): ChartSeriesStyle {
        const rawExplicitColor = series.color?.();
        const explicitColor = rawExplicitColor ? this.resolveCssVariable(rawExplicitColor) : "";
        const explicitStrokeWidth = "strokeWidth" in series ? series.strokeWidth?.() : undefined;
        const explicitPointRadius = "pointRadius" in series ? series.pointRadius?.() : undefined;
        const explicitFillOpacity = "fillOpacity" in series ? series.fillOpacity?.() : undefined;

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

        const defaultColor = this.resolvePaletteColor(seriesIndex, colorPalette);
        const resolvedColor = explicitColor || elementColor || defaultColor;
        const isAreaLike = series.type === "area" || series.type === "rangeArea";
        const isLineLike = series.type === "line" || series.type === "area" || series.type === "rangeArea";

        const defaultLineWidth = isLineLike ? 2 : 1;
        const resolvedLineWidth = explicitStrokeWidth !== undefined && isFiniteNumber(explicitStrokeWidth) && explicitStrokeWidth >= 0
            ? explicitStrokeWidth
            : (cssLineWidth ?? defaultLineWidth);

        const defaultPointRadius = isAreaLike ? 4 : 3;
        const resolvedPointRadius = explicitPointRadius !== undefined && isFiniteNumber(explicitPointRadius) && explicitPointRadius >= 0
            ? explicitPointRadius
            : (cssPointRadius ?? defaultPointRadius);

        const defaultFillOpacity = isAreaLike ? 0.18 : 1;
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

    public resolveFinancialSeriesStyle(
        series: ChartFinancialSeriesRegistration
    ): ChartFinancialSeriesStyle {
        const rawExplicitRising = series.risingColor?.();
        const rawExplicitFalling = series.fallingColor?.();
        const rawExplicitNeutral = series.neutralColor?.();
        const rawExplicitWickColor = series.wickColor?.();
        const rawExplicitColor = series.color?.();
        const explicitWickWidth = series.wickWidth?.();
        const explicitOpacity = series.opacity?.();

        let cssRisingColor: string | undefined;
        let cssFallingColor: string | undefined;
        let cssNeutralColor: string | undefined;
        let cssWickColor: string | undefined;
        let cssWickWidth: number | undefined;
        let cssOpacity: number | undefined;

        if (typeof window !== "undefined" && series.element?.nativeElement) {
            try {
                const nativeEl = series.element.nativeElement;
                const computed = window.getComputedStyle(nativeEl);

                const risingVal = computed.getPropertyValue("--mona-chart-financial-rising-color");
                if (risingVal) cssRisingColor = risingVal.trim();

                const fallingVal = computed.getPropertyValue("--mona-chart-financial-falling-color");
                if (fallingVal) cssFallingColor = fallingVal.trim();

                const neutralVal = computed.getPropertyValue("--mona-chart-financial-neutral-color");
                if (neutralVal) cssNeutralColor = neutralVal.trim();

                const wickColVal = computed.getPropertyValue("--mona-chart-financial-wick-color");
                if (wickColVal) cssWickColor = wickColVal.trim();

                const wickWVal = computed.getPropertyValue("--mona-chart-financial-wick-width");
                if (wickWVal) {
                    const parsed = parseFloat(wickWVal);
                    if (isFiniteNumber(parsed) && parsed >= 0) cssWickWidth = parsed;
                }

                const opVal = computed.getPropertyValue("--mona-chart-fill-opacity");
                if (opVal) {
                    const parsed = parseFloat(opVal);
                    if (isFiniteNumber(parsed)) cssOpacity = Math.max(0, Math.min(1, parsed));
                }
            } catch {
                // Ignore style resolution errors
            }
        }

        const risingColor = this.resolveCssVariable(rawExplicitRising || cssRisingColor || "#22c55e");
        const fallingColor = this.resolveCssVariable(rawExplicitFalling || cssFallingColor || "#ef4444");
        const neutralColor = this.resolveCssVariable(rawExplicitNeutral || cssNeutralColor || "#6b7280");
        const wickColor = (rawExplicitWickColor || cssWickColor)
            ? this.resolveCssVariable((rawExplicitWickColor || cssWickColor)!)
            : undefined;
        const color = rawExplicitColor ? this.resolveCssVariable(rawExplicitColor) : undefined;
        const wickWidth = explicitWickWidth !== undefined && isFiniteNumber(explicitWickWidth) && explicitWickWidth >= 0
            ? explicitWickWidth
            : (cssWickWidth ?? 1);
        const opacity = explicitOpacity !== undefined && isFiniteNumber(explicitOpacity)
            ? Math.max(0, Math.min(1, explicitOpacity))
            : (cssOpacity !== undefined ? cssOpacity : undefined);

        return {
            color,
            fallingColor: fallingColor || "#ef4444",
            neutralColor: neutralColor || "#6b7280",
            opacity,
            risingColor: risingColor || "#22c55e",
            wickColor,
            wickWidth
        };
    }

    public resolveMarkerSeriesStyle(
        series: ChartCartesianSeriesRegistration,
        seriesIndex: number,
        colorPalette: readonly string[] = DEFAULT_CHART_PALETTE_VARIABLES
    ): {
        color: string;
        fillOpacity: number;
        strokeColor: string;
        strokeWidth: number;
    } {
        const rawExplicitColor = series.color?.();
        const explicitColor = rawExplicitColor ? this.resolveCssVariable(rawExplicitColor) : "";
        const explicitFillOpacity = "fillOpacity" in series ? series.fillOpacity?.() : undefined;
        const explicitStrokeColor = "strokeColor" in series ? series.strokeColor?.() : undefined;
        const explicitStrokeWidth = "strokeWidth" in series ? series.strokeWidth?.() : undefined;

        let elementColor = "";
        let cssFillOpacity: number | undefined;
        let cssStrokeColor: string | undefined;
        let cssStrokeWidth: number | undefined;

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

                const customOpacity =
                    computed.getPropertyValue("--mona-chart-marker-fill-opacity") ||
                    computed.getPropertyValue("--mona-chart-fill-opacity");
                if (customOpacity) {
                    const parsed = parseFloat(customOpacity);
                    if (isFiniteNumber(parsed)) cssFillOpacity = Math.max(0, Math.min(1, parsed));
                }

                const customStroke = computed.getPropertyValue("--mona-chart-marker-stroke-color");
                if (customStroke) {
                    cssStrokeColor = customStroke.trim();
                }

                const customStrokeWidth = computed.getPropertyValue("--mona-chart-marker-stroke-width");
                if (customStrokeWidth) {
                    const parsed = parseFloat(customStrokeWidth);
                    if (isFiniteNumber(parsed) && parsed >= 0) cssStrokeWidth = parsed;
                }
            } catch {
                // Ignore style resolution errors
            }
        }

        const defaultColor = this.resolvePaletteColor(seriesIndex, colorPalette);
        const resolvedColor = explicitColor || elementColor || defaultColor;

        const defaultOpacity = series.type === "bubble" ? 0.55 : 0.9;
        const resolvedFillOpacity =
            explicitFillOpacity !== undefined && isFiniteNumber(explicitFillOpacity)
                ? Math.max(0, Math.min(1, explicitFillOpacity))
                : (cssFillOpacity ?? defaultOpacity);

        const defaultStrokeWidth = 1.5;
        const resolvedStrokeWidth =
            explicitStrokeWidth !== undefined && isFiniteNumber(explicitStrokeWidth) && explicitStrokeWidth >= 0
                ? explicitStrokeWidth
                : (cssStrokeWidth ?? defaultStrokeWidth);

        let defaultStrokeColor = resolvedColor;
        if (series.type === "scatter") {
            defaultStrokeColor =
                this.resolveCssVariable("--color-surface") ||
                this.resolveCssVariable("--color-card") ||
                "#ffffff";
        }

        const resolvedStrokeColor = explicitStrokeColor
            ? this.resolveCssVariable(explicitStrokeColor)
            : (cssStrokeColor ? this.resolveCssVariable(cssStrokeColor) : defaultStrokeColor);

        return {
            color: resolvedColor,
            fillOpacity: resolvedFillOpacity,
            strokeColor: resolvedStrokeColor,
            strokeWidth: resolvedStrokeWidth
        };
    }

    public resolveMarkerSeriesGeometry(
        series: ChartCartesianSeriesRegistration
    ): {
        bubbleMaxRadius?: number;
        bubbleMinRadius?: number;
        pointRadius?: number;
    } {
        let cssPointRadius: number | undefined;
        let cssBubbleMinRadius: number | undefined;
        let cssBubbleMaxRadius: number | undefined;

        if (typeof window !== "undefined" && series.element?.nativeElement) {
            try {
                const computed = window.getComputedStyle(series.element.nativeElement);
                const pr = computed.getPropertyValue("--mona-chart-point-radius");
                if (pr) {
                    const parsed = parseFloat(pr);
                    if (isFiniteNumber(parsed)) cssPointRadius = parsed;
                }
                const minR = computed.getPropertyValue("--mona-chart-bubble-min-radius");
                if (minR) {
                    const parsed = parseFloat(minR);
                    if (isFiniteNumber(parsed)) cssBubbleMinRadius = parsed;
                }
                const maxR = computed.getPropertyValue("--mona-chart-bubble-max-radius");
                if (maxR) {
                    const parsed = parseFloat(maxR);
                    if (isFiniteNumber(parsed)) cssBubbleMaxRadius = parsed;
                }
            } catch {
                // Ignore style resolution errors
            }
        }

        return {
            bubbleMaxRadius: cssBubbleMaxRadius,
            bubbleMinRadius: cssBubbleMinRadius,
            pointRadius: cssPointRadius
        };
    }

    public resolveRadialSeriesStyle(
        series: ChartRadialSeriesRegistration,
        seriesIndex: number,
        colorPalette: readonly string[] = DEFAULT_CHART_PALETTE_VARIABLES
    ): {
        color: string;
        fillOpacity: number;
        pointRadius: number;
        strokeWidth: number;
    } {
        const rawExplicitColor = series.color();
        const explicitColor = rawExplicitColor ? this.resolveCssVariable(rawExplicitColor) : "";
        const explicitStrokeWidth = series.strokeWidth?.();
        const explicitPointRadius = series.pointRadius?.();
        const explicitFillOpacity = series.fillOpacity?.();

        let elementColor = "";
        let cssStrokeWidth: number | undefined;
        let cssPointRadius: number | undefined;
        let cssFillOpacity: number | undefined;

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

                const customWidth = computed.getPropertyValue("--mona-chart-radial-stroke-width");
                if (customWidth) {
                    const parsed = parseFloat(customWidth);
                    if (isFiniteNumber(parsed) && parsed >= 0) cssStrokeWidth = parsed;
                }
                const customRadius = computed.getPropertyValue("--mona-chart-radial-point-radius");
                if (customRadius) {
                    const parsed = parseFloat(customRadius);
                    if (isFiniteNumber(parsed) && parsed >= 0) cssPointRadius = parsed;
                }
                const customOpacity = computed.getPropertyValue("--mona-chart-radial-fill-opacity");
                if (customOpacity) {
                    const parsed = parseFloat(customOpacity);
                    if (isFiniteNumber(parsed)) cssFillOpacity = Math.max(0, Math.min(1, parsed));
                }
            } catch {
                // Ignore style resolution errors
            }
        }

        const defaultColor = this.resolvePaletteColor(seriesIndex, colorPalette);
        const resolvedColor = explicitColor || elementColor || defaultColor;
        const defaultStrokeWidth = 2;
        const resolvedStrokeWidth =
            explicitStrokeWidth !== undefined && isFiniteNumber(explicitStrokeWidth) && explicitStrokeWidth >= 0
                ? explicitStrokeWidth
                : (cssStrokeWidth ?? defaultStrokeWidth);
        const defaultPointRadius = series.type === "radar" ? 3.5 : 3;
        const resolvedPointRadius =
            explicitPointRadius !== undefined && isFiniteNumber(explicitPointRadius) && explicitPointRadius >= 0
                ? explicitPointRadius
                : (cssPointRadius ?? defaultPointRadius);
        const defaultFillOpacity = 0.18;
        const resolvedFillOpacity =
            explicitFillOpacity !== undefined && isFiniteNumber(explicitFillOpacity)
                ? Math.max(0, Math.min(1, explicitFillOpacity))
                : (cssFillOpacity ?? defaultFillOpacity);

        return {
            color: resolvedColor,
            fillOpacity: resolvedFillOpacity,
            pointRadius: resolvedPointRadius,
            strokeWidth: resolvedStrokeWidth
        };
    }

    public resolveSliceColor(
        registration: ChartPolarSeriesRegistration,
        datum: unknown,
        dataIndex: number,
        paletteIndex: number
    ): string {
        const colorField = registration.colorField();
        if (colorField !== undefined) {
            const raw = resolveValue(datum, colorField, dataIndex);
            if (typeof raw === "string" && raw) {
                const resolved = this.resolveCssVariable(raw);
                if (resolved) {
                    return resolved;
                }
            }
        }

        const colors = registration.colors();
        if (colors && colors.length > 0) {
            const explicit = colors[paletteIndex % colors.length];
            if (explicit) {
                const resolved = this.resolveCssVariable(explicit);
                if (resolved) {
                    return resolved;
                }
            }
        }

        return this.resolvePaletteColor(paletteIndex);
    }

    public resolveCssVariable(varNameOrColor: string, targetElement?: HTMLElement | null): string {
        if (!varNameOrColor) {
            return "";
        }
        const trimmed = varNameOrColor.trim();
        const isVariable = trimmed.startsWith("var(") || trimmed.startsWith("--");
        if (!isVariable) {
            return toCanvasColor(trimmed, (targetElement ?? this.#rootElement)?.ownerDocument);
        }
        if (typeof window === "undefined" || (!targetElement && !this.#rootElement)) {
            return "";
        }
        try {
            let current = trimmed;
            const primaryEl = targetElement ?? this.#rootElement!;
            for (let i = 0; i < 5; i++) {
                if (!current.startsWith("var(") && !current.startsWith("--")) {
                    break;
                }
                const rawVar = current.startsWith("var(")
                    ? current.replace(/^var\(\s*/, "").replace(/\s*\)$/, "").split(",")[0].trim()
                    : current;
                let resolved = window.getComputedStyle(primaryEl).getPropertyValue(rawVar).trim();
                if (!resolved && targetElement && this.#rootElement && targetElement !== this.#rootElement) {
                    resolved = window.getComputedStyle(this.#rootElement).getPropertyValue(rawVar).trim();
                }
                if (!resolved) {
                    return "";
                }
                current = resolved;
            }
            if (current.startsWith("var(") || current.startsWith("--")) {
                return "";
            }
            return toCanvasColor(current, (targetElement ?? this.#rootElement)?.ownerDocument);
        } catch {
            return "";
        }
    }

    public getReadableForeground(backgroundColor: string): string {
        if (!backgroundColor) {
            return "#ffffff";
        }
        try {
            const canvasColor = toCanvasColor(backgroundColor, this.#rootElement?.ownerDocument) || backgroundColor;
            const parsed = parse(canvasColor);
            if (parsed) {
                const whiteContrast = wcagContrast(parsed, "#ffffff");
                const darkContrast = wcagContrast(parsed, "#0f172a");
                return darkContrast > whiteContrast ? "#0f172a" : "#ffffff";
            }
        } catch {
            // Fallback
        }
        return "#ffffff";
    }

    public resolveHeatmapSeriesStyle(
        series: ChartHeatmapSeriesRegistration,
        seriesIndex: number = 0
    ): ChartHeatmapSeriesStyle {
        const explicitColor = series.color();
        const explicitStrokeColor = series.strokeColor();
        const explicitStrokeWidth = series.strokeWidth();
        const explicitBorderRadius = series.borderRadius();
        const explicitFillOpacity = series.fillOpacity();

        let elementColor = "";
        let cssLowColor: string | undefined;
        let cssMidColor: string | undefined;
        let cssHighColor: string | undefined;
        let cssBorderColor: string | undefined;

        let cssStrokeWidth: number | undefined;
        let cssBorderRadius: number | undefined;
        let cssFillOpacity: number | undefined;

        const targetElements = [
            series.element?.nativeElement,
            this.#rootElement
        ].filter((el): el is HTMLElement => Boolean(el));

        if (typeof window !== "undefined") {
            for (const el of targetElements) {
                try {
                    const computed = window.getComputedStyle(el);
                    if (!elementColor && el === series.element?.nativeElement) {
                        const rootComputed = this.#rootElement ? window.getComputedStyle(this.#rootElement) : null;
                        const rootColor = rootComputed?.color ?? "";
                        const userClass = series.userClass?.() ?? "";
                        const hasTextClass = typeof userClass === "string" && (/\btext-/.test(userClass) || /\btext\[/.test(userClass));

                        if (el.style?.color) {
                            elementColor = this.resolveCssVariable(el.style.color);
                        } else if (computed.color && (hasTextClass || (rootColor !== "" && computed.color !== rootColor))) {
                            elementColor = toCanvasColor(computed.color, this.#rootElement?.ownerDocument);
                        }
                    }

                    if (!cssLowColor) {
                        const val = computed.getPropertyValue("--mona-chart-heatmap-low-color").trim();
                        if (val) cssLowColor = this.resolveCssVariable(val);
                    }
                    if (!cssMidColor) {
                        const val = computed.getPropertyValue("--mona-chart-heatmap-mid-color").trim();
                        if (val) cssMidColor = this.resolveCssVariable(val);
                    }
                    if (!cssHighColor) {
                        const val = computed.getPropertyValue("--mona-chart-heatmap-high-color").trim();
                        if (val) cssHighColor = this.resolveCssVariable(val);
                    }
                    if (!cssBorderColor) {
                        const val = computed.getPropertyValue("--mona-chart-heatmap-cell-border-color").trim();
                        if (val) cssBorderColor = this.resolveCssVariable(val);
                    }
                    if (cssStrokeWidth === undefined) {
                        const sw = computed.getPropertyValue("--mona-chart-heatmap-cell-border-width");
                        if (sw) {
                            const parsed = parseFloat(sw);
                            if (isFiniteNumber(parsed) && parsed >= 0) cssStrokeWidth = parsed;
                        }
                    }
                    if (cssBorderRadius === undefined) {
                        const br = computed.getPropertyValue("--mona-chart-heatmap-cell-radius");
                        if (br) {
                            const parsed = parseFloat(br);
                            if (isFiniteNumber(parsed) && parsed >= 0) cssBorderRadius = parsed;
                        }
                    }
                    if (cssFillOpacity === undefined) {
                        const fo = computed.getPropertyValue("--mona-chart-heatmap-fill-opacity");
                        if (fo) {
                            const parsed = parseFloat(fo);
                            if (isFiniteNumber(parsed)) cssFillOpacity = Math.max(0, Math.min(1, parsed));
                        }
                    }
                } catch {
                    // Ignore style resolution errors
                }
            }
        }

        const resolvedBaseColor =
            (explicitColor ? this.resolveCssVariable(explicitColor) : "") ||
            elementColor ||
            cssHighColor ||
            this.resolvePaletteColor(seriesIndex);

        const resolvedStrokeColor =
            (explicitStrokeColor ? this.resolveCssVariable(explicitStrokeColor) : "") ||
            cssBorderColor ||
            "";

        const resolvedStrokeWidth =
            explicitStrokeWidth !== undefined && isFiniteNumber(explicitStrokeWidth) && explicitStrokeWidth >= 0
                ? explicitStrokeWidth
                : cssStrokeWidth !== undefined
                    ? cssStrokeWidth
                    : 0;

        const resolvedBorderRadius =
            explicitBorderRadius !== undefined && isFiniteNumber(explicitBorderRadius) && explicitBorderRadius >= 0
                ? explicitBorderRadius
                : cssBorderRadius !== undefined
                    ? cssBorderRadius
                    : 2;

        const resolvedFillOpacity =
            explicitFillOpacity !== undefined && isFiniteNumber(explicitFillOpacity)
                ? Math.max(0, Math.min(1, explicitFillOpacity))
                : cssFillOpacity !== undefined
                    ? Math.max(0, Math.min(1, cssFillOpacity))
                    : 1;

        return {
            baseColor: resolvedBaseColor,
            borderRadius: Math.max(0, resolvedBorderRadius),
            fillOpacity: Math.max(0, Math.min(1, resolvedFillOpacity)),
            highColor: cssHighColor || undefined,
            lowColor: cssLowColor || undefined,
            midColor: cssMidColor || undefined,
            strokeColor: resolvedStrokeColor,
            strokeWidth: Math.max(0, resolvedStrokeWidth)
        };
    }
}
