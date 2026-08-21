import { formatRgb, parse, wcagContrast } from "culori";
import type { ChartBrushLineStyle } from "../../models/chart-brush.models";
import type { ChartSeriesStyle } from "../../models/chart-style.models";
import type {
    ChartAnnotationRegistration,
    ChartBrushRegistration,
    ChartCartesianSeriesRegistration,
    ChartCrosshairRegistration,
    ChartFinancialSeriesRegistration,
    ChartFunnelSeriesRegistration,
    ChartGaugeSeriesRegistration,
    ChartHeatmapSeriesRegistration,
    ChartPolarSeriesRegistration,
    ChartRadialArcSeriesRegistration,
    ChartRadialBarSeriesRegistration,
    ChartRadialSeriesRegistration,
    ChartReferenceBandRegistration,
    ChartReferenceLineRegistration,
    ChartRoseSeriesRegistration,
    ChartSelectionRegistration,
    ChartSeriesRegistration,
    ChartTreemapSeriesRegistration,
    ChartWaterfallSeriesRegistration
} from "../context/chart-registration-context";
import type { ChartField } from "../../models/chart.models";
import type { ChartHeatmapSeriesStyle } from "../../models/chart-heatmap.models";
import { resolveValue } from "../data/chart-value-resolver";
import type { ChartFinancialSeriesStyle } from "../scene/cartesian-scene";
import type { ChartPolarSeriesStyle } from "../scene/polar-scene";
import type { ChartGaugeSeriesStyle, ChartRadialArcSeriesStyle } from "../scene/polar-arc-scene";
import type { ChartTreemapSeriesStyle } from "../scene/hierarchical-scene";
import type { ChartFunnelSeriesStyle } from "../scene/funnel-scene";
import type { ChartWaterfallSeriesStyle } from "../scene/waterfall-scene";
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
    readonly #styleSnapshot: ReadonlyMap<string, string> | null;

    public constructor(
        rootElement: HTMLElement | null = null,
        styleSnapshot: ReadonlyMap<string, string> | null = null
    ) {
        this.#rootElement = rootElement;
        this.#styleSnapshot = styleSnapshot;
    }

    public static captureStyleSnapshot(element: HTMLElement | null): ReadonlyMap<string, string> {
        const snapshot = new Map<string, string>();
        if (typeof window === "undefined" || !element) {
            return snapshot;
        }
        try {
            const computed = window.getComputedStyle(element);
            for (let i = 0; i < computed.length; i++) {
                const prop = computed[i];
                if (prop.startsWith("--")) {
                    const val = computed.getPropertyValue(prop).trim();
                    if (val) {
                        snapshot.set(prop, val);
                    }
                }
            }
            const knownVars = [
                "--mona-chart-surface",
                "--mona-chart-grid-color",
                "--mona-chart-axis-color",
                "--mona-chart-label-color",
                "--mona-chart-tooltip-background",
                "--mona-chart-tooltip-text",
                "--mona-chart-crosshair-color",
                "--mona-chart-slice-stroke-color",
                "--mona-chart-slice-fill-opacity",
                "--mona-chart-radial-track-color",
                "--color-surface",
                "--color-card",
                "--color-background",
                "--color-foreground",
                "--color-muted",
                "--color-muted-foreground",
                "--color-border",
                "--color-primary",
                "--color-primary-foreground",
                ...DEFAULT_CHART_PALETTE_VARIABLES
            ];
            for (const varName of knownVars) {
                const val = computed.getPropertyValue(varName).trim();
                if (val) {
                    snapshot.set(varName, val);
                }
            }

            const textProps = [
                "font-family",
                "font-size",
                "font-weight",
                "font-style",
                "line-height",
                "letter-spacing",
                "color",
                "background-color"
            ];
            for (const prop of textProps) {
                const val = computed.getPropertyValue(prop).trim();
                if (val) {
                    snapshot.set(prop, val);
                }
            }
        } catch {
            // Ignore capture errors
        }
        return snapshot;
    }

    public createSnapshotResolver(): ChartStyleResolver {
        const snapshot = this.#styleSnapshot ?? ChartStyleResolver.captureStyleSnapshot(this.#rootElement);
        return new ChartStyleResolver(null, snapshot);
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

        const seriesEl = series.element?.nativeElement ?? null;

        let cssRisingColor: string | undefined;
        let cssFallingColor: string | undefined;
        let cssNeutralColor: string | undefined;
        let cssWickColor: string | undefined;
        let cssHollowFillColor: string | undefined;
        let cssWickWidth: number | undefined;
        let cssOpacity: number | undefined;

        if (typeof window !== "undefined") {
            try {
                if (seriesEl) {
                    const computed = window.getComputedStyle(seriesEl);

                    const risingVal = computed.getPropertyValue("--mona-chart-financial-rising-color") || computed.getPropertyValue("--mona-chart-color-rising");
                    if (risingVal) cssRisingColor = risingVal.trim();

                    const fallingVal = computed.getPropertyValue("--mona-chart-financial-falling-color") || computed.getPropertyValue("--mona-chart-color-falling");
                    if (fallingVal) cssFallingColor = fallingVal.trim();

                    const neutralVal = computed.getPropertyValue("--mona-chart-financial-neutral-color") || computed.getPropertyValue("--mona-chart-color-neutral");
                    if (neutralVal) cssNeutralColor = neutralVal.trim();

                    const wickColVal = computed.getPropertyValue("--mona-chart-financial-wick-color");
                    if (wickColVal) cssWickColor = wickColVal.trim();

                    const hollowVal = computed.getPropertyValue("--mona-chart-financial-hollow-fill");
                    if (hollowVal) cssHollowFillColor = hollowVal.trim();

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
                }

                if (this.#rootElement) {
                    const rootComputed = window.getComputedStyle(this.#rootElement);
                    if (!cssRisingColor) {
                        const rootRising = rootComputed.getPropertyValue("--mona-chart-financial-rising-color") || rootComputed.getPropertyValue("--mona-chart-color-rising");
                        if (rootRising) cssRisingColor = rootRising.trim();
                    }
                    if (!cssFallingColor) {
                        const rootFalling = rootComputed.getPropertyValue("--mona-chart-financial-falling-color") || rootComputed.getPropertyValue("--mona-chart-color-falling");
                        if (rootFalling) cssFallingColor = rootFalling.trim();
                    }
                    if (!cssNeutralColor) {
                        const rootNeutral = rootComputed.getPropertyValue("--mona-chart-financial-neutral-color") || rootComputed.getPropertyValue("--mona-chart-color-neutral");
                        if (rootNeutral) cssNeutralColor = rootNeutral.trim();
                    }
                    if (!cssHollowFillColor) {
                        const rootHollow = rootComputed.getPropertyValue("--mona-chart-financial-hollow-fill");
                        if (rootHollow) cssHollowFillColor = rootHollow.trim();
                    }
                }
            } catch {
                // Ignore style resolution errors
            }
        }

        const risingColor = this.resolveCssVariable(rawExplicitRising || cssRisingColor || "#22c55e", seriesEl);
        const fallingColor = this.resolveCssVariable(rawExplicitFalling || cssFallingColor || "#ef4444", seriesEl);
        const neutralColor = this.resolveCssVariable(rawExplicitNeutral || cssNeutralColor || "#6b7280", seriesEl);
        const wickColor = (rawExplicitWickColor || cssWickColor)
            ? this.resolveCssVariable((rawExplicitWickColor || cssWickColor)!, seriesEl)
            : undefined;
        const color = rawExplicitColor ? this.resolveCssVariable(rawExplicitColor, seriesEl) : undefined;
        const wickWidth = explicitWickWidth !== undefined && isFiniteNumber(explicitWickWidth) && explicitWickWidth >= 0
            ? explicitWickWidth
            : (cssWickWidth ?? 1);
        const opacity = explicitOpacity !== undefined && isFiniteNumber(explicitOpacity)
            ? Math.max(0, Math.min(1, explicitOpacity))
            : (cssOpacity !== undefined ? cssOpacity : undefined);

        const hollowFillColor = this.resolveCssVariable(
            cssHollowFillColor ||
            this.resolveCssVariable("--mona-chart-financial-hollow-fill", seriesEl) ||
            this.resolveCssVariable("--color-surface", seriesEl) ||
            this.resolveCssVariable("--mona-chart-surface", seriesEl) ||
            this.resolveCssVariable("--color-card", seriesEl) ||
            this.resolveCssVariable("--color-background", seriesEl) ||
            "#ffffff",
            seriesEl
        ) || "#ffffff";

        return {
            color,
            fallingColor: fallingColor || "#ef4444",
            hollowFillColor,
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

    public resolveDatumColor(
        colorField: ChartField | undefined,
        colors: readonly string[] | undefined,
        datum: unknown,
        dataIndex: number,
        paletteIndex: number,
        targetElement?: HTMLElement | null
    ): string {
        if (colorField !== undefined) {
            const raw = resolveValue(datum, colorField, dataIndex);
            if (typeof raw === "string" && raw) {
                const resolved = this.resolveCssVariable(raw, targetElement);
                if (resolved) {
                    return resolved;
                }
            }
        }

        if (colors && colors.length > 0) {
            const explicit = colors[paletteIndex % colors.length];
            if (explicit) {
                const resolved = this.resolveCssVariable(explicit, targetElement);
                if (resolved) {
                    return resolved;
                }
            }
        }

        return this.resolvePaletteColor(paletteIndex);
    }

    public resolveSliceColor(
        registration: ChartPolarSeriesRegistration,
        datum: unknown,
        dataIndex: number,
        paletteIndex: number
    ): string {
        return this.resolveDatumColor(
            registration.colorField(),
            registration.colors(),
            datum,
            dataIndex,
            paletteIndex,
            registration.element?.nativeElement
        );
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
        if (this.#styleSnapshot) {
            let current = trimmed;
            for (let i = 0; i < 5; i++) {
                if (!current.startsWith("var(") && !current.startsWith("--")) {
                    break;
                }
                let rawVar = current;
                let fallback: string | undefined;
                if (current.startsWith("var(")) {
                    const inner = current.slice(4, -1).trim();
                    const commaIdx = inner.indexOf(",");
                    if (commaIdx !== -1) {
                        rawVar = inner.slice(0, commaIdx).trim();
                        fallback = inner.slice(commaIdx + 1).trim();
                    } else {
                        rawVar = inner;
                    }
                }
                let resolved = this.#styleSnapshot.get(rawVar)?.trim();
                if (!resolved && fallback) {
                    current = fallback;
                    continue;
                }
                if (!resolved) {
                    return "";
                }
                current = resolved;
            }
            if (current.startsWith("var(") || current.startsWith("--")) {
                return "";
            }
            return toCanvasColor(current);
        }
        if (typeof window === "undefined") {
            if (trimmed.startsWith("var(")) {
                const inner = trimmed.slice(4, -1).trim();
                const commaIdx = inner.indexOf(",");
                if (commaIdx !== -1) {
                    return toCanvasColor(inner.slice(commaIdx + 1).trim());
                }
            }
            return "";
        }
        try {
            let current = trimmed;
            const primaryEl = targetElement ?? this.#rootElement ?? (typeof document !== "undefined" ? document.body : null);
            if (!primaryEl) {
                if (current.startsWith("var(")) {
                    const inner = current.slice(4, -1).trim();
                    const commaIdx = inner.indexOf(",");
                    if (commaIdx !== -1) {
                        return toCanvasColor(inner.slice(commaIdx + 1).trim());
                    }
                }
                return "";
            }
            for (let i = 0; i < 5; i++) {
                if (!current.startsWith("var(") && !current.startsWith("--")) {
                    break;
                }
                let rawVar = current;
                let fallback: string | undefined;
                if (current.startsWith("var(")) {
                    const inner = current.slice(4, -1).trim();
                    const commaIdx = inner.indexOf(",");
                    if (commaIdx !== -1) {
                        rawVar = inner.slice(0, commaIdx).trim();
                        fallback = inner.slice(commaIdx + 1).trim();
                    } else {
                        rawVar = inner;
                    }
                }
                let resolved = window.getComputedStyle(primaryEl).getPropertyValue(rawVar).trim();
                if (!resolved && targetElement && this.#rootElement && targetElement !== this.#rootElement) {
                    resolved = window.getComputedStyle(this.#rootElement).getPropertyValue(rawVar).trim();
                }
                if (!resolved && fallback) {
                    current = fallback;
                    continue;
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

    public resolveRadialArcSeriesStyle(
        series: ChartRadialBarSeriesRegistration | ChartRoseSeriesRegistration
    ): ChartRadialArcSeriesStyle {
        const rawStrokeColor = series.strokeColor();
        const strokeWidthInput = series.strokeWidth?.();
        const fillOpacityInput = series.fillOpacity?.();
        const trackColorInput = "trackColor" in series ? series.trackColor() : "";
        const trackOpacityInput = "trackOpacity" in series ? series.trackOpacity?.() : undefined;

        let cssStrokeWidth: number | undefined;
        let cssStrokeColor: string | undefined;
        let cssFillOpacity: number | undefined;
        let cssTrackColor: string | undefined;
        let cssTrackOpacity: number | undefined;

        const seriesEl = series.element?.nativeElement;

        if (typeof window !== "undefined" && seriesEl) {
            try {
                const computed = window.getComputedStyle(seriesEl);
                const sw = computed.getPropertyValue("--mona-chart-radial-arc-stroke-width");
                if (sw) {
                    const parsed = parseFloat(sw);
                    if (isFiniteNumber(parsed) && parsed >= 0) cssStrokeWidth = parsed;
                }
                const sc = computed.getPropertyValue("--mona-chart-radial-arc-stroke-color");
                if (sc) {
                    cssStrokeColor = sc.trim();
                }
                const fo = computed.getPropertyValue("--mona-chart-radial-arc-fill-opacity");
                if (fo) {
                    const parsed = parseFloat(fo);
                    if (isFiniteNumber(parsed)) cssFillOpacity = Math.max(0, Math.min(1, parsed));
                }
                const tc = computed.getPropertyValue("--mona-chart-radial-track-color");
                if (tc) {
                    cssTrackColor = tc.trim();
                }
                const to = computed.getPropertyValue("--mona-chart-radial-track-opacity");
                if (to) {
                    const parsed = parseFloat(to);
                    if (isFiniteNumber(parsed)) cssTrackOpacity = Math.max(0, Math.min(1, parsed));
                }
            } catch {
                // Ignore style resolution errors
            }
        }

        const hasExplicitStroke = Boolean(rawStrokeColor || cssStrokeColor);
        const strokeSource: "default" | "explicit" = hasExplicitStroke ? "explicit" : "default";

        const strokeColor = rawStrokeColor
            ? this.resolveCssVariable(rawStrokeColor, seriesEl)
            : (cssStrokeColor
                  ? this.resolveCssVariable(cssStrokeColor, seriesEl)
                  : "");

        const strokeWidth =
            strokeWidthInput !== undefined && isFiniteNumber(strokeWidthInput) && strokeWidthInput >= 0
                ? strokeWidthInput
                : (cssStrokeWidth ?? 0);

        const fillOpacity =
            fillOpacityInput !== undefined && isFiniteNumber(fillOpacityInput)
                ? Math.max(0, Math.min(1, fillOpacityInput))
                : (cssFillOpacity ?? 1);

        const defaultTrackColor =
            this.resolveCssVariable("--mona-chart-radial-track-color", seriesEl) ||
            this.resolveCssVariable("--color-muted", seriesEl) ||
            "#e2e8f0";

        const trackColor = trackColorInput
            ? this.resolveCssVariable(trackColorInput, seriesEl)
            : (cssTrackColor ? this.resolveCssVariable(cssTrackColor, seriesEl) : defaultTrackColor);

        const defaultTrackOpacity = 0.15;
        const trackOpacity =
            trackOpacityInput !== undefined && isFiniteNumber(trackOpacityInput)
                ? Math.max(0, Math.min(1, trackOpacityInput))
                : (cssTrackOpacity ?? defaultTrackOpacity);

        return {
            fillOpacity,
            strokeColor,
            strokeSource,
            strokeWidth,
            trackColor,
            trackOpacity
        };
    }

    public resolveGaugeSeriesStyle(
        series: ChartGaugeSeriesRegistration
    ): ChartGaugeSeriesStyle {
        const rawColor = series.color();
        const rawNeedleColor = series.needleColor();
        const rawTrackColor = series.trackColor();
        const rawTrackOpacity = series.trackOpacity?.();
        const rawFillOpacity = series.fillOpacity?.();

        const seriesEl = series.element?.nativeElement;

        let cssGaugeColor: string | undefined;
        let cssNeedleColor: string | undefined;
        let cssHubColor: string | undefined;
        let cssTrackColor: string | undefined;
        let cssTrackOpacity: number | undefined;
        let cssFillOpacity: number | undefined;

        if (typeof window !== "undefined" && seriesEl) {
            try {
                const computed = window.getComputedStyle(seriesEl);
                const gc = computed.getPropertyValue("--mona-chart-gauge-color");
                if (gc) cssGaugeColor = gc.trim();

                const nc = computed.getPropertyValue("--mona-chart-gauge-needle-color");
                if (nc) cssNeedleColor = nc.trim();

                const hc = computed.getPropertyValue("--mona-chart-gauge-hub-color");
                if (hc) cssHubColor = hc.trim();

                const tc = computed.getPropertyValue("--mona-chart-radial-track-color");
                if (tc) cssTrackColor = tc.trim();

                const to = computed.getPropertyValue("--mona-chart-radial-track-opacity");
                if (to) {
                    const parsed = parseFloat(to);
                    if (isFiniteNumber(parsed)) cssTrackOpacity = Math.max(0, Math.min(1, parsed));
                }

                const fo = computed.getPropertyValue("--mona-chart-radial-arc-fill-opacity");
                if (fo) {
                    const parsed = parseFloat(fo);
                    if (isFiniteNumber(parsed)) cssFillOpacity = Math.max(0, Math.min(1, parsed));
                }
            } catch {
                // Ignore style resolution errors
            }
        }

        const primaryColor = rawColor
            ? this.resolveCssVariable(rawColor, seriesEl)
            : (cssGaugeColor
                  ? this.resolveCssVariable(cssGaugeColor, seriesEl)
                  : this.resolvePaletteColor(0));

        const defaultTrackColor =
            this.resolveCssVariable("--mona-chart-radial-track-color", seriesEl) ||
            this.resolveCssVariable("--color-muted", seriesEl) ||
            "#e2e8f0";

        const trackColor = rawTrackColor
            ? this.resolveCssVariable(rawTrackColor, seriesEl)
            : (cssTrackColor ? this.resolveCssVariable(cssTrackColor, seriesEl) : defaultTrackColor);

        const defaultTrackOpacity = 0.15;
        const trackOpacity =
            rawTrackOpacity !== undefined && isFiniteNumber(rawTrackOpacity)
                ? Math.max(0, Math.min(1, rawTrackOpacity))
                : (cssTrackOpacity ?? defaultTrackOpacity);

        const needleColor = rawNeedleColor
            ? this.resolveCssVariable(rawNeedleColor, seriesEl)
            : (cssNeedleColor
                  ? this.resolveCssVariable(cssNeedleColor, seriesEl)
                  : (primaryColor || "#1e293b"));

        const hubColor = cssHubColor
            ? this.resolveCssVariable(cssHubColor, seriesEl)
            : needleColor;

        const fillOpacity =
            rawFillOpacity !== undefined && isFiniteNumber(rawFillOpacity)
                ? Math.max(0, Math.min(1, rawFillOpacity))
                : (cssFillOpacity ?? 1);

        return {
            color: primaryColor,
            fillOpacity,
            hubColor,
            needleColor,
            strokeColor: "",
            strokeSource: "default",
            strokeWidth: 0,
            trackColor,
            trackOpacity
        };
    }

    public resolveTreemapSeriesStyle(
        series: ChartTreemapSeriesRegistration
    ): ChartTreemapSeriesStyle {
        const rawStrokeColor = series.strokeColor ? series.strokeColor() : "";
        const strokeWidthInput = series.strokeWidth?.();
        const fillOpacityInput = series.fillOpacity?.();
        const parentFillOpacityInput = series.parentFillOpacity?.();
        const borderRadiusInput = series.borderRadius?.();
        const rawBaseColor = series.colors ? (series.colors()?.[0] ?? "") : (series.color ? (series.color() ?? "") : "");

        let cssStrokeWidth: number | undefined;
        let cssStrokeColor: string | undefined;
        let cssFillOpacity: number | undefined;
        let cssParentFillOpacity: number | undefined;
        let cssBorderRadius: number | undefined;
        let cssLabelColor: string | undefined;

        const targetElements = [
            series.element?.nativeElement,
            this.#rootElement
        ].filter((el): el is HTMLElement => Boolean(el));

        if (typeof window !== "undefined") {
            for (const el of targetElements) {
                try {
                    const computed = window.getComputedStyle(el);
                    if (cssStrokeWidth === undefined) {
                        const sw = computed.getPropertyValue("--mona-chart-treemap-stroke-width");
                        if (sw) {
                            const parsed = parseFloat(sw);
                            if (isFiniteNumber(parsed) && parsed >= 0) cssStrokeWidth = parsed;
                        }
                    }
                    if (!cssStrokeColor) {
                        const sc = computed.getPropertyValue("--mona-chart-treemap-stroke-color").trim();
                        if (sc) cssStrokeColor = sc;
                    }
                    if (cssFillOpacity === undefined) {
                        const fo = computed.getPropertyValue("--mona-chart-treemap-fill-opacity");
                        if (fo) {
                            const parsed = parseFloat(fo);
                            if (isFiniteNumber(parsed)) cssFillOpacity = Math.max(0, Math.min(1, parsed));
                        }
                    }
                    if (cssParentFillOpacity === undefined) {
                        const pfo = computed.getPropertyValue("--mona-chart-treemap-parent-fill-opacity");
                        if (pfo) {
                            const parsed = parseFloat(pfo);
                            if (isFiniteNumber(parsed)) cssParentFillOpacity = Math.max(0, Math.min(1, parsed));
                        }
                    }
                    if (cssBorderRadius === undefined) {
                        const br = computed.getPropertyValue("--mona-chart-treemap-border-radius");
                        if (br) {
                            const parsed = parseFloat(br);
                            if (isFiniteNumber(parsed) && parsed >= 0) cssBorderRadius = parsed;
                        }
                    }
                    if (!cssLabelColor) {
                        const lc = computed.getPropertyValue("--mona-chart-treemap-label-color").trim();
                        if (lc) cssLabelColor = lc;
                    }
                } catch {
                    // Ignore style resolution errors
                }
            }
        }

        const seriesEl = series.element?.nativeElement ?? this.#rootElement;

        const defaultStrokeColor =
            this.resolveCssVariable("--color-surface", seriesEl) ||
            this.resolveCssVariable("--color-background", seriesEl) ||
            "#ffffff";

        const strokeColor = rawStrokeColor
            ? this.resolveCssVariable(rawStrokeColor, seriesEl)
            : (cssStrokeColor ? this.resolveCssVariable(cssStrokeColor, seriesEl) : defaultStrokeColor);

        const strokeWidth =
            strokeWidthInput !== undefined && isFiniteNumber(strokeWidthInput) && strokeWidthInput >= 0
                ? strokeWidthInput
                : (cssStrokeWidth !== undefined ? cssStrokeWidth : 1);

        const fillOpacity =
            fillOpacityInput !== undefined && isFiniteNumber(fillOpacityInput)
                ? Math.max(0, Math.min(1, fillOpacityInput))
                : (cssFillOpacity !== undefined ? cssFillOpacity : 1);

        const parentFillOpacity =
            parentFillOpacityInput !== undefined && isFiniteNumber(parentFillOpacityInput)
                ? Math.max(0, Math.min(1, parentFillOpacityInput))
                : (cssParentFillOpacity !== undefined ? cssParentFillOpacity : 0.15);

        const borderRadius =
            borderRadiusInput !== undefined && isFiniteNumber(borderRadiusInput) && borderRadiusInput >= 0
                ? borderRadiusInput
                : (cssBorderRadius !== undefined ? cssBorderRadius : 0);

        const baseColor = rawBaseColor
            ? this.resolveCssVariable(rawBaseColor, seriesEl)
            : this.resolvePaletteColor(0);

        const labelColor = cssLabelColor ? this.resolveCssVariable(cssLabelColor, seriesEl) : undefined;

        return {
            baseColor,
            borderRadius,
            fillOpacity,
            labelColor,
            parentFillOpacity,
            strokeColor,
            strokeWidth
        };
    }

    public resolveFunnelSeriesStyle(
        series: ChartFunnelSeriesRegistration
    ): ChartFunnelSeriesStyle {
        const rawStrokeColor = series.strokeColor ? series.strokeColor() : "";
        const strokeWidthInput = series.strokeWidth?.();
        const fillOpacityInput = series.fillOpacity?.();
        const rawBaseColor = series.colors ? (series.colors()?.[0] ?? "") : (series.color ? (series.color() ?? "") : "");

        let cssStrokeWidth: number | undefined;
        let cssStrokeColor: string | undefined;
        let cssFillOpacity: number | undefined;
        let cssLabelColor: string | undefined;

        const targetElements = [
            series.element?.nativeElement,
            this.#rootElement
        ].filter((el): el is HTMLElement => Boolean(el));

        if (typeof window !== "undefined") {
            for (const el of targetElements) {
                try {
                    const computed = window.getComputedStyle(el);
                    if (cssStrokeWidth === undefined) {
                        const sw = computed.getPropertyValue("--mona-chart-funnel-stroke-width");
                        if (sw) {
                            const parsed = parseFloat(sw);
                            if (isFiniteNumber(parsed) && parsed >= 0) cssStrokeWidth = parsed;
                        }
                    }
                    if (!cssStrokeColor) {
                        const sc = computed.getPropertyValue("--mona-chart-funnel-stroke-color").trim();
                        if (sc) cssStrokeColor = sc;
                    }
                    if (cssFillOpacity === undefined) {
                        const fo = computed.getPropertyValue("--mona-chart-funnel-fill-opacity");
                        if (fo) {
                            const parsed = parseFloat(fo);
                            if (isFiniteNumber(parsed)) cssFillOpacity = Math.max(0, Math.min(1, parsed));
                        }
                    }
                    if (!cssLabelColor) {
                        const lc = computed.getPropertyValue("--mona-chart-funnel-label-color").trim();
                        if (lc) cssLabelColor = lc;
                    }
                } catch {
                    // Ignore style resolution errors
                }
            }
        }

        const seriesEl = series.element?.nativeElement ?? this.#rootElement;

        const defaultStrokeColor =
            this.resolveCssVariable("--color-surface", seriesEl) ||
            this.resolveCssVariable("--color-background", seriesEl) ||
            "#ffffff";

        const strokeColor = rawStrokeColor
            ? this.resolveCssVariable(rawStrokeColor, seriesEl)
            : (cssStrokeColor ? this.resolveCssVariable(cssStrokeColor, seriesEl) : defaultStrokeColor);

        const strokeWidth =
            strokeWidthInput !== undefined && isFiniteNumber(strokeWidthInput) && strokeWidthInput >= 0
                ? strokeWidthInput
                : (cssStrokeWidth !== undefined ? cssStrokeWidth : 1);

        const fillOpacity =
            fillOpacityInput !== undefined && isFiniteNumber(fillOpacityInput)
                ? Math.max(0, Math.min(1, fillOpacityInput))
                : (cssFillOpacity !== undefined ? cssFillOpacity : 1);

        const baseColor = rawBaseColor
            ? this.resolveCssVariable(rawBaseColor, seriesEl)
            : this.resolvePaletteColor(0);

        const labelColor = cssLabelColor
            ? this.resolveCssVariable(cssLabelColor, seriesEl)
            : undefined;

        return {
            baseColor,
            fillOpacity,
            labelColor,
            strokeColor,
            strokeWidth
        };
    }

    public resolveWaterfallSeriesStyle(
        series: ChartWaterfallSeriesRegistration
    ): ChartWaterfallSeriesStyle {
        const rawIncreaseColor = series.increaseColor ? series.increaseColor() : "";
        const rawDecreaseColor = series.decreaseColor ? series.decreaseColor() : "";
        const rawNeutralColor = series.neutralColor ? series.neutralColor() : "";
        const rawSubtotalColor = series.subtotalColor ? series.subtotalColor() : "";
        const rawTotalColor = series.totalColor ? series.totalColor() : "";
        const rawConnectorColor = series.connectorColor ? series.connectorColor() : "";
        const rawStrokeColor = series.strokeColor ? series.strokeColor() : "";

        const connectorWidthInput = series.connectorWidth?.();
        const strokeWidthInput = series.strokeWidth?.();
        const fillOpacityInput = series.fillOpacity?.();
        const borderRadiusInput = series.borderRadius?.();

        let cssIncreaseColor: string | undefined;
        let cssDecreaseColor: string | undefined;
        let cssNeutralColor: string | undefined;
        let cssSubtotalColor: string | undefined;
        let cssTotalColor: string | undefined;
        let cssConnectorColor: string | undefined;
        let cssConnectorWidth: number | undefined;
        let cssStrokeColor: string | undefined;
        let cssStrokeWidth: number | undefined;
        let cssFillOpacity: number | undefined;
        let cssBorderRadius: number | undefined;
        let cssLabelColor: string | undefined;

        const targetElements = [
            series.element?.nativeElement,
            this.#rootElement
        ].filter((el): el is HTMLElement => Boolean(el));

        if (typeof window !== "undefined") {
            for (const el of targetElements) {
                try {
                    const computed = window.getComputedStyle(el);
                    if (!cssIncreaseColor) {
                        const v = computed.getPropertyValue("--mona-chart-waterfall-increase-color").trim();
                        if (v) cssIncreaseColor = v;
                    }
                    if (!cssDecreaseColor) {
                        const v = computed.getPropertyValue("--mona-chart-waterfall-decrease-color").trim();
                        if (v) cssDecreaseColor = v;
                    }
                    if (!cssNeutralColor) {
                        const v = computed.getPropertyValue("--mona-chart-waterfall-neutral-color").trim();
                        if (v) cssNeutralColor = v;
                    }
                    if (!cssSubtotalColor) {
                        const v = computed.getPropertyValue("--mona-chart-waterfall-subtotal-color").trim();
                        if (v) cssSubtotalColor = v;
                    }
                    if (!cssTotalColor) {
                        const v = computed.getPropertyValue("--mona-chart-waterfall-total-color").trim();
                        if (v) cssTotalColor = v;
                    }
                    if (!cssConnectorColor) {
                        const v = computed.getPropertyValue("--mona-chart-waterfall-connector-color").trim();
                        if (v) cssConnectorColor = v;
                    }
                    if (cssConnectorWidth === undefined) {
                        const sw = computed.getPropertyValue("--mona-chart-waterfall-connector-width");
                        if (sw) {
                            const parsed = parseFloat(sw);
                            if (isFiniteNumber(parsed) && parsed >= 0) cssConnectorWidth = parsed;
                        }
                    }
                    if (!cssStrokeColor) {
                        const sc = computed.getPropertyValue("--mona-chart-waterfall-stroke-color").trim();
                        if (sc) cssStrokeColor = sc;
                    }
                    if (cssStrokeWidth === undefined) {
                        const sw = computed.getPropertyValue("--mona-chart-waterfall-stroke-width");
                        if (sw) {
                            const parsed = parseFloat(sw);
                            if (isFiniteNumber(parsed) && parsed >= 0) cssStrokeWidth = parsed;
                        }
                    }
                    if (cssFillOpacity === undefined) {
                        const fo = computed.getPropertyValue("--mona-chart-waterfall-fill-opacity");
                        if (fo) {
                            const parsed = parseFloat(fo);
                            if (isFiniteNumber(parsed)) cssFillOpacity = Math.max(0, Math.min(1, parsed));
                        }
                    }
                    if (cssBorderRadius === undefined) {
                        const br = computed.getPropertyValue("--mona-chart-waterfall-border-radius");
                        if (br) {
                            const parsed = parseFloat(br);
                            if (isFiniteNumber(parsed) && parsed >= 0) cssBorderRadius = parsed;
                        }
                    }
                    if (!cssLabelColor) {
                        const lc = computed.getPropertyValue("--mona-chart-waterfall-label-color").trim();
                        if (lc) cssLabelColor = lc;
                    }
                } catch {
                    // Ignore style resolution errors
                }
            }
        }

        const seriesEl = series.element?.nativeElement ?? this.#rootElement;

        const defaultIncrease =
            this.resolveCssVariable("--color-emerald-500", seriesEl) ||
            this.resolveCssVariable("--color-green-500", seriesEl) ||
            "#10b981";

        const defaultDecrease =
            this.resolveCssVariable("--color-red-500", seriesEl) ||
            this.resolveCssVariable("--color-rose-500", seriesEl) ||
            "#ef4444";

        const defaultNeutral =
            this.resolveCssVariable("--color-muted-foreground", seriesEl) ||
            this.resolveCssVariable("--color-gray-500", seriesEl) ||
            "#6b7280";

        const defaultSubtotal =
            this.resolveCssVariable("--color-chart-2", seriesEl) ||
            this.resolvePaletteColor(1) ||
            "#3b82f6";

        const defaultTotal =
            this.resolveCssVariable("--color-chart-1", seriesEl) ||
            this.resolvePaletteColor(0) ||
            "#1d4ed8";

        const defaultConnector =
            this.resolveCssVariable("--color-muted-foreground", seriesEl) ||
            this.resolveCssVariable("--color-border", seriesEl) ||
            "#64748b";

        const increaseColor = rawIncreaseColor
            ? this.resolveCssVariable(rawIncreaseColor, seriesEl)
            : (cssIncreaseColor ? this.resolveCssVariable(cssIncreaseColor, seriesEl) : defaultIncrease);

        const decreaseColor = rawDecreaseColor
            ? this.resolveCssVariable(rawDecreaseColor, seriesEl)
            : (cssDecreaseColor ? this.resolveCssVariable(cssDecreaseColor, seriesEl) : defaultDecrease);

        const neutralColor = rawNeutralColor
            ? this.resolveCssVariable(rawNeutralColor, seriesEl)
            : (cssNeutralColor ? this.resolveCssVariable(cssNeutralColor, seriesEl) : defaultNeutral);

        const subtotalColor = rawSubtotalColor
            ? this.resolveCssVariable(rawSubtotalColor, seriesEl)
            : (cssSubtotalColor ? this.resolveCssVariable(cssSubtotalColor, seriesEl) : defaultSubtotal);

        const totalColor = rawTotalColor
            ? this.resolveCssVariable(rawTotalColor, seriesEl)
            : (cssTotalColor ? this.resolveCssVariable(cssTotalColor, seriesEl) : defaultTotal);

        const connectorColor = rawConnectorColor
            ? this.resolveCssVariable(rawConnectorColor, seriesEl)
            : (cssConnectorColor ? this.resolveCssVariable(cssConnectorColor, seriesEl) : defaultConnector);

        const strokeColor = rawStrokeColor
            ? this.resolveCssVariable(rawStrokeColor, seriesEl)
            : (cssStrokeColor ? this.resolveCssVariable(cssStrokeColor, seriesEl) : "");

        const strokeWidth =
            strokeWidthInput !== undefined && isFiniteNumber(strokeWidthInput) && strokeWidthInput >= 0
                ? strokeWidthInput
                : (cssStrokeWidth !== undefined ? cssStrokeWidth : 0);

        const connectorWidth =
            connectorWidthInput !== undefined && isFiniteNumber(connectorWidthInput) && connectorWidthInput >= 0
                ? connectorWidthInput
                : (cssConnectorWidth !== undefined ? cssConnectorWidth : 1);

        const fillOpacity =
            fillOpacityInput !== undefined && isFiniteNumber(fillOpacityInput)
                ? Math.max(0, Math.min(1, fillOpacityInput))
                : (cssFillOpacity !== undefined ? cssFillOpacity : 1);

        const borderRadius =
            borderRadiusInput !== undefined && isFiniteNumber(borderRadiusInput) && borderRadiusInput >= 0
                ? borderRadiusInput
                : (cssBorderRadius !== undefined ? cssBorderRadius : 4);

        const labelColor = cssLabelColor ? this.resolveCssVariable(cssLabelColor, seriesEl) : undefined;

        return {
            borderRadius,
            connectorColor,
            connectorWidth,
            decreaseColor,
            fillOpacity,
            increaseColor,
            labelColor,
            neutralColor,
            strokeColor,
            strokeWidth,
            subtotalColor,
            totalColor
        };
    }

    public resolveNumericCssVariable(varName: string, targetElement?: HTMLElement | null): number | undefined {
        if (typeof window === "undefined") {
            return undefined;
        }
        try {
            const primaryEl = targetElement ?? this.#rootElement ?? (typeof document !== "undefined" ? document.body : null);
            if (!primaryEl) {
                return undefined;
            }
            let resolved = window.getComputedStyle(primaryEl).getPropertyValue(varName).trim();
            if (!resolved && targetElement && this.#rootElement && targetElement !== this.#rootElement) {
                resolved = window.getComputedStyle(this.#rootElement).getPropertyValue(varName).trim();
            }
            if (!resolved) {
                return undefined;
            }
            const num = parseFloat(resolved);
            return Number.isFinite(num) ? num : undefined;
        } catch {
            return undefined;
        }
    }

    public resolveCrosshairStyle(registration: ChartCrosshairRegistration): {
        readonly color: string;
        readonly opacity: number;
        readonly width: number;
    } {
        const el = registration.element?.nativeElement;
        const explicitColor = registration.color();
        const explicitWidth = registration.lineWidth();
        const explicitOpacity = registration.opacity();

        let color = explicitColor ? this.resolveCssVariable(explicitColor, el) : "";
        if (!color) {
            color =
                this.resolveCssVariable("--mona-chart-crosshair-color", el) ||
                this.resolveCssVariable("--color-focus-indicator", el) ||
                this.resolveCssVariable("--color-muted-foreground", el) ||
                "rgba(148, 163, 184, 0.4)";
        }

        let width = explicitWidth !== undefined && isFiniteNumber(explicitWidth) && explicitWidth >= 0 ? explicitWidth : undefined;
        if (width === undefined) {
            const cssWidth = this.resolveNumericCssVariable("--mona-chart-crosshair-width", el);
            width = cssWidth !== undefined && cssWidth >= 0 ? cssWidth : 1;
        }

        let opacity = explicitOpacity !== undefined && isFiniteNumber(explicitOpacity) ? Math.max(0, Math.min(1, explicitOpacity)) : undefined;
        if (opacity === undefined) {
            const cssOpacity = this.resolveNumericCssVariable("--mona-chart-crosshair-opacity", el);
            opacity = cssOpacity !== undefined && isFiniteNumber(cssOpacity) ? Math.max(0, Math.min(1, cssOpacity)) : 1;
        }

        return { color, opacity, width };
    }

    public resolveReferenceLineStyle(registration: ChartReferenceLineRegistration): {
        readonly color: string;
        readonly opacity: number;
        readonly width: number;
    } {
        const el = registration.element?.nativeElement;
        const explicitColor = registration.color();
        const explicitWidth = registration.width();
        const explicitOpacity = registration.opacity();

        let color = explicitColor ? this.resolveCssVariable(explicitColor, el) : "";
        if (!color) {
            color =
                this.resolveCssVariable("--mona-chart-reference-line-color", el) ||
                this.resolveCssVariable("--color-muted-foreground", el) ||
                "rgba(148, 163, 184, 0.8)";
        }

        let width = explicitWidth !== undefined && isFiniteNumber(explicitWidth) && explicitWidth >= 0 ? explicitWidth : undefined;
        if (width === undefined) {
            const cssWidth = this.resolveNumericCssVariable("--mona-chart-reference-line-width", el);
            width = cssWidth !== undefined && cssWidth >= 0 ? cssWidth : 1;
        }

        let opacity = explicitOpacity !== undefined && isFiniteNumber(explicitOpacity) ? Math.max(0, Math.min(1, explicitOpacity)) : undefined;
        if (opacity === undefined) {
            const cssOpacity = this.resolveNumericCssVariable("--mona-chart-reference-line-opacity", el);
            opacity = cssOpacity !== undefined && isFiniteNumber(cssOpacity) ? Math.max(0, Math.min(1, cssOpacity)) : 1;
        }

        return { color, opacity, width };
    }

    public resolveReferenceBandStyle(registration: ChartReferenceBandRegistration): {
        readonly borderColor?: string;
        readonly borderWidth: number;
        readonly fillColor: string;
        readonly fillOpacity: number;
    } {
        const el = registration.element?.nativeElement;
        const explicitFill = registration.fillColor();
        const explicitFillOpacity = registration.fillOpacity();
        const explicitBorderColor = registration.borderColor();
        const explicitBorderWidth = registration.borderWidth();

        let fillColor = explicitFill ? this.resolveCssVariable(explicitFill, el) : "";
        if (!fillColor) {
            fillColor =
                this.resolveCssVariable("--mona-chart-reference-band-color", el) ||
                this.resolveCssVariable("--color-muted", el) ||
                "rgb(148, 163, 184)";
        }

        let fillOpacity = explicitFillOpacity !== undefined && isFiniteNumber(explicitFillOpacity) ? Math.max(0, Math.min(1, explicitFillOpacity)) : undefined;
        if (fillOpacity === undefined) {
            const cssOpacity = this.resolveNumericCssVariable("--mona-chart-reference-band-opacity", el);
            fillOpacity = cssOpacity !== undefined && isFiniteNumber(cssOpacity) ? Math.max(0, Math.min(1, cssOpacity)) : 0.15;
        }

        let borderColor = explicitBorderColor ? this.resolveCssVariable(explicitBorderColor, el) : undefined;
        if (!borderColor) {
            const cssBorder = this.resolveCssVariable("--mona-chart-reference-band-border-color", el);
            if (cssBorder) {
                borderColor = cssBorder;
            }
        }

        let borderWidth = explicitBorderWidth !== undefined && isFiniteNumber(explicitBorderWidth) && explicitBorderWidth >= 0 ? explicitBorderWidth : undefined;
        if (borderWidth === undefined) {
            const cssBorderWidth = this.resolveNumericCssVariable("--mona-chart-reference-band-border-width", el);
            borderWidth = cssBorderWidth !== undefined && cssBorderWidth >= 0 ? cssBorderWidth : (borderColor ? 1 : 0);
        }

        return { borderColor, borderWidth, fillColor, fillOpacity };
    }

    public resolveAnnotationStyle(registration: ChartAnnotationRegistration): {
        readonly color: string;
        readonly connectorWidth: number;
        readonly markerRadius: number;
        readonly markerStrokeWidth: number;
    } {
        const el = registration.element?.nativeElement;
        const explicitColor = registration.color();
        const explicitRadius = registration.markerRadius();
        const explicitStrokeWidth = registration.markerStrokeWidth();
        const explicitConnectorWidth = registration.connectorWidth();

        let color = explicitColor ? this.resolveCssVariable(explicitColor, el) : "";
        if (!color) {
            color =
                this.resolveCssVariable("--mona-chart-annotation-color", el) ||
                this.resolveCssVariable("--color-primary", el) ||
                "#3b82f6";
        }

        let markerRadius = explicitRadius !== undefined && isFiniteNumber(explicitRadius) && explicitRadius >= 0 ? explicitRadius : undefined;
        if (markerRadius === undefined) {
            const cssRadius = this.resolveNumericCssVariable("--mona-chart-annotation-marker-radius", el);
            markerRadius = cssRadius !== undefined && cssRadius >= 0 ? cssRadius : 4;
        }

        const markerStrokeWidth = explicitStrokeWidth !== undefined && isFiniteNumber(explicitStrokeWidth) && explicitStrokeWidth >= 0 ? explicitStrokeWidth : 1.5;
        const connectorWidth = explicitConnectorWidth !== undefined && isFiniteNumber(explicitConnectorWidth) && explicitConnectorWidth >= 0 ? explicitConnectorWidth : 1;

        return { color, connectorWidth, markerRadius, markerStrokeWidth };
    }

    public resolveSelectionStyle(registration?: ChartSelectionRegistration | null): {
        readonly color: string;
        readonly fillOpacity: number;
        readonly strokeWidth: number;
    } {
        const explicitColor = registration?.color?.();
        const explicitWidth = registration?.strokeWidth?.();
        const explicitOpacity = registration?.fillOpacity?.();

        let color = explicitColor ? this.resolveCssVariable(explicitColor) : "";
        if (!color) {
            color =
                this.resolveCssVariable("--mona-chart-selection-color") ||
                this.resolveCssVariable("--color-primary") ||
                "#3b82f6";
        }

        let strokeWidth = explicitWidth !== undefined && isFiniteNumber(explicitWidth) && explicitWidth >= 0 ? explicitWidth : undefined;
        if (strokeWidth === undefined) {
            const cssWidth = this.resolveNumericCssVariable("--mona-chart-selection-stroke-width");
            strokeWidth = cssWidth !== undefined && cssWidth >= 0 ? cssWidth : 2;
        }

        let fillOpacity = explicitOpacity !== undefined && isFiniteNumber(explicitOpacity) ? Math.max(0, Math.min(1, explicitOpacity)) : undefined;
        if (fillOpacity === undefined) {
            const cssOpacity = this.resolveNumericCssVariable("--mona-chart-selection-fill-opacity");
            fillOpacity = cssOpacity !== undefined && isFiniteNumber(cssOpacity) ? Math.max(0, Math.min(1, cssOpacity)) : 0.12;
        }

        return { color, fillOpacity, strokeWidth };
    }

    public resolveBrushStyle(registration?: ChartBrushRegistration | null): {
        readonly borderColor: string;
        readonly borderWidth: number;
        readonly fillColor: string;
        readonly fillOpacity: number;
        readonly lineStyle: ChartBrushLineStyle;
    } {
        const explicitFill = registration?.fillColor?.();
        const explicitFillOpacity = registration?.fillOpacity?.();
        const explicitBorderColor = registration?.borderColor?.();
        const explicitBorderWidth = registration?.borderWidth?.();
        const explicitLineStyle = registration?.lineStyle?.();

        let fillColor = explicitFill ? this.resolveCssVariable(explicitFill) : "";
        if (!fillColor) {
            fillColor =
                this.resolveCssVariable("--mona-chart-brush-fill-color") ||
                this.resolveCssVariable("--color-primary") ||
                "#3b82f6";
        }

        let fillOpacity = explicitFillOpacity !== undefined && isFiniteNumber(explicitFillOpacity) ? Math.max(0, Math.min(1, explicitFillOpacity)) : undefined;
        if (fillOpacity === undefined) {
            const cssOpacity = this.resolveNumericCssVariable("--mona-chart-brush-fill-opacity");
            fillOpacity = cssOpacity !== undefined && isFiniteNumber(cssOpacity) ? Math.max(0, Math.min(1, cssOpacity)) : 0.15;
        }

        let borderColor = explicitBorderColor ? this.resolveCssVariable(explicitBorderColor) : "";
        if (!borderColor) {
            borderColor =
                this.resolveCssVariable("--mona-chart-brush-border-color") ||
                this.resolveCssVariable("--color-primary") ||
                "#3b82f6";
        }

        let borderWidth = explicitBorderWidth !== undefined && isFiniteNumber(explicitBorderWidth) && explicitBorderWidth >= 0 ? explicitBorderWidth : undefined;
        if (borderWidth === undefined) {
            const cssBorderWidth = this.resolveNumericCssVariable("--mona-chart-brush-border-width");
            borderWidth = cssBorderWidth !== undefined && cssBorderWidth >= 0 ? cssBorderWidth : 1;
        }

        const lineStyle = explicitLineStyle ?? "solid";

        return { borderColor, borderWidth, fillColor, fillOpacity, lineStyle };
    }

    public resolveDataLabelStyle(): {
        readonly color: string;
        readonly font: string;
        readonly haloColor: string;
        readonly haloWidth: number;
    } {
        let color = this.resolveCssVariable("--mona-chart-data-label-color");
        if (!color) {
            color = this.resolveCssVariable("--color-text-primary") || "#1e293b";
        }

        let font = this.resolveCssVariable("--mona-chart-data-label-font");
        if (!font) {
            font = "500 11px system-ui, sans-serif";
        }

        let haloColor = this.resolveCssVariable("--mona-chart-data-label-halo-color");
        if (!haloColor) {
            haloColor = "rgba(255, 255, 255, 0.85)";
        }

        const haloWidth = this.resolveNumericCssVariable("--mona-chart-data-label-halo-width") ?? 2;

        return { color, font, haloColor, haloWidth };
    }
}
