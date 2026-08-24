import { isDevMode } from "@angular/core";
import { formatRgb, interpolate, parse, wcagContrast, type Color } from "culori";
import type {
    
    ChartColorLegendStop,
    ChartColorLegendTick,
    ChartHeatmapColorMode,
    ChartHeatmapColorScaleScene,
    ChartHeatmapSeriesStyle
} from "../../models/chart-heatmap.models";
import type { ChartValueFormatter } from "../../models/chart.models";
import { clamp, formatCompactNumber, isFiniteNumber } from "../utils/number-utils";

export interface HeatmapColorScaleOptions {
    readonly colors?: readonly string[];
    readonly domain: readonly [number, number];
    readonly emptyCellColor?: string;
    readonly explicitMidpoint?: number;
    readonly mode: ChartHeatmapColorMode;
    readonly style: ChartHeatmapSeriesStyle;
    readonly title?: string;
    readonly valueFormatter?: ChartValueFormatter;
    readonly warnedDiagnosticSignatures?: Set<string>;
}

const defaultWarnedSignatures = new Set<string>();

function warnOnce(signature: string, message: string, warnedSet: Set<string> = defaultWarnedSignatures): void {
    if (isDevMode() && !warnedSet.has(signature)) {
        warnedSet.add(signature);
        console.warn(message);
    }
}

export class HeatmapColorScale {
    readonly #colorLut: readonly string[];
    readonly #descriptor: ChartHeatmapColorScaleScene;
    readonly #domain: readonly [number, number];
    readonly #labelColorLut: readonly string[];
    readonly #midpoint?: number;
    readonly #mode: ChartHeatmapColorMode;

    public constructor(options: HeatmapColorScaleOptions) {
        const {
            colors,
            domain,
            emptyCellColor = "rgba(0, 0, 0, 0)",
            explicitMidpoint,
            mode,
            style,
            title = "",
            valueFormatter,
            warnedDiagnosticSignatures = defaultWarnedSignatures
        } = options;

        this.#domain = domain;
        this.#mode = mode;

        const [min, max] = domain;

        let resolvedStops: string[] = [];
        let midpoint: number | undefined;

        const isStopValid = (c: string): boolean => {
            if (!c || typeof c !== "string") return false;
            try {
                return Boolean(parse(c.trim()));
            } catch {
                return false;
            }
        };

        if (mode === "diverging") {
            const derivedMidpoint = min < 0 && max > 0 ? 0 : (min + max) / 2;
            if (explicitMidpoint !== undefined && isFiniteNumber(explicitMidpoint)) {
                if (explicitMidpoint >= min && explicitMidpoint <= max) {
                    midpoint = explicitMidpoint;
                } else {
                    warnOnce(
                        `invalid-heatmap-midpoint-${explicitMidpoint}`,
                        `[MonaChart] Explicit heatmap midpoint (${explicitMidpoint}) is outside the value domain [${min}, ${max}]. Falling back to derived midpoint (${derivedMidpoint}).`,
                        warnedDiagnosticSignatures
                    );
                    midpoint = derivedMidpoint;
                }
            } else {
                midpoint = derivedMidpoint;
            }
            this.#midpoint = midpoint;

            if (colors && colors.length === 3 && colors.every(isStopValid)) {
                resolvedStops = [...colors];
            } else {
                if (colors && colors.length !== 3) {
                    warnOnce(
                        `invalid-diverging-colors-${colors.length}`,
                        `[MonaChart] Diverging colorMode requires exactly 3 colors ([low, midpoint, high]). Found ${colors.length}. Falling back to theme diverging colors.`,
                        warnedDiagnosticSignatures
                    );
                } else if (colors && !colors.every(isStopValid)) {
                    warnOnce(
                        "invalid-diverging-color-stops",
                        "[MonaChart] One or more diverging color stops are invalid CSS colors. Falling back to theme diverging colors.",
                        warnedDiagnosticSignatures
                    );
                }
                const low = (style.lowColor && isStopValid(style.lowColor)) ? style.lowColor : "#3b82f6";
                const mid = (style.midColor && isStopValid(style.midColor)) ? style.midColor : "#f8fafc";
                const high = (style.highColor && isStopValid(style.highColor)) ? style.highColor : "#ef4444";
                resolvedStops = [low, mid, high];
            }
        } else {
            // Sequential mode
            if (colors && colors.length >= 2 && colors.every(isStopValid)) {
                resolvedStops = [...colors];
            } else {
                if (colors && colors.length === 1) {
                    warnOnce(
                        "invalid-sequential-colors-1",
                        "[MonaChart] Sequential colorMode requires at least 2 colors. Falling back to default sequential scale.",
                        warnedDiagnosticSignatures
                    );
                } else if (colors && !colors.every(isStopValid)) {
                    warnOnce(
                        "invalid-sequential-color-stops",
                        "[MonaChart] One or more sequential color stops are invalid CSS colors. Falling back to default sequential scale.",
                        warnedDiagnosticSignatures
                    );
                }
                const low = (style.lowColor && isStopValid(style.lowColor)) ? style.lowColor : "#eff6ff";
                const high = (style.highColor && isStopValid(style.highColor))
                    ? style.highColor
                    : (style.baseColor && isStopValid(style.baseColor))
                        ? style.baseColor
                        : "#3b82f6";
                resolvedStops = [low, high];
            }
        }

        // Build Culori interpolator in OKLab perceptual color space
        let interpolator: (t: number) => Color | undefined;
        try {
            interpolator = interpolate(resolvedStops, "oklab");
        } catch {
            interpolator = interpolate(["#eff6ff", "#3b82f6"], "oklab");
        }

        // Generate 256-entry lookup table (LUT)
        const colorLut: string[] = new Array(256);
        const labelColorLut: string[] = new Array(256);

        for (let i = 0; i < 256; i++) {
            const t = i / 255;
            const culoriColor = interpolator(t);
            const rgbStr = (culoriColor ? formatRgb(culoriColor) : undefined) ?? "rgb(59, 130, 246)";
            colorLut[i] = rgbStr;

            const darkContrast = wcagContrast(rgbStr, "#0f172a") ?? 1;
            const lightContrast = wcagContrast(rgbStr, "#ffffff") ?? 1;
            labelColorLut[i] = lightContrast >= darkContrast ? "#ffffff" : "#0f172a";
        }

        this.#colorLut = colorLut;
        this.#labelColorLut = labelColorLut;

        // Build legend stops and ticks descriptor
        const formatVal = (v: number, idx: number) =>
            valueFormatter ? valueFormatter(v, idx) : formatCompactNumber(v);

        const stops: ChartColorLegendStop[] = [];
        if (mode === "diverging" && resolvedStops.length === 3) {
            stops.push(
                { color: resolvedStops[0], offset: 0, value: min },
                { color: resolvedStops[1], offset: 0.5, value: midpoint ?? (min + max) / 2 },
                { color: resolvedStops[2], offset: 1, value: max }
            );
        } else {
            const stopCount = resolvedStops.length;
            for (let i = 0; i < stopCount; i++) {
                const offset = stopCount > 1 ? i / (stopCount - 1) : 0;
                const value = min + offset * (max - min);
                stops.push({ color: resolvedStops[i], offset, value });
            }
        }

        const ticks: ChartColorLegendTick[] = [];
        ticks.push({ formattedValue: formatVal(min, 0), offset: 0, value: min });
        if (mode === "diverging" && midpoint !== undefined) {
            ticks.push({ formattedValue: formatVal(midpoint, 1), offset: 0.5, value: midpoint });
        }
        ticks.push({ formattedValue: formatVal(max, ticks.length), offset: 1, value: max });

        this.#descriptor = {
            domain,
            emptyCellColor,
            formattedMax: formatVal(max, 1),
            formattedMidpoint: midpoint !== undefined ? formatVal(midpoint, 1) : undefined,
            formattedMin: formatVal(min, 0),
            kind: "color",
            midpoint,
            mode,
            stops,
            ticks,
            title
        };
    }

    public get descriptor(): ChartHeatmapColorScaleScene {
        return this.#descriptor;
    }

    public get domain(): readonly [number, number] {
        return this.#domain;
    }

    public indexFor(value: number): number {
        const [min, max] = this.#domain;
        if (min === max) {
            return 128;
        }

        let t: number;
        if (this.#mode === "diverging" && this.#midpoint !== undefined) {
            if (value <= this.#midpoint) {
                const span = this.#midpoint - min;
                t = span <= 0 ? 0.5 : 0.5 * clamp((value - min) / span, 0, 1);
            } else {
                const span = max - this.#midpoint;
                t = span <= 0 ? 0.5 : 0.5 + 0.5 * clamp((value - this.#midpoint) / span, 0, 1);
            }
        } else {
            t = clamp((value - min) / (max - min), 0, 1);
        }

        return Math.min(255, Math.max(0, Math.round(t * 255)));
    }

    public colorFor(value: number): string {
        return this.#colorLut[this.indexFor(value)];
    }

    public labelColorFor(value: number): string {
        return this.#labelColorLut[this.indexFor(value)];
    }
}
