import { ChartExportError } from "../../models/chart-export.models";

const FORBIDDEN_COLOR_PATTERNS = [
    /url\s*\(/i,
    /javascript:/i,
    /blob:/i,
    /gradient/i,
    /paint\s*\(/i,
    /var\s*\(/i,
    /currentcolor/i,
    /calc\s*\(/i
];

const CSS_WIDE_KEYWORDS = new Set([
    "inherit",
    "initial",
    "unset",
    "revert",
    "revert-layer"
]);

/**
 * Guards against environments whose 2D context exists but cannot render or read back
 * pixels (e.g. stub canvases in test DOMs). Probed once with a known opaque color.
 */
let canvasReadbackReliable: boolean | null = null;

function isCanvasPixelReadbackReliable(): boolean {
    if (canvasReadbackReliable !== null) {
        return canvasReadbackReliable;
    }
    try {
        const probe = document.createElement("canvas");
        probe.width = 1;
        probe.height = 1;
        const pctx = probe.getContext("2d", { willReadFrequently: true });
        if (!pctx) {
            canvasReadbackReliable = false;
            return false;
        }
        pctx.fillStyle = "#ff0000";
        pctx.fillRect(0, 0, 1, 1);
        const data = pctx.getImageData(0, 0, 1, 1).data;
        canvasReadbackReliable = data[0] === 255 && data[1] === 0 && data[2] === 0 && data[3] === 255;
    } catch {
        canvasReadbackReliable = false;
    }
    return canvasReadbackReliable;
}

/**
 * Canonicalizes a browser-resolved CSS color to the standalone sRGB contract:
 * `rgb(r, g, b)` for opaque colors, `rgba(r, g, b, a)` otherwise (R4-08).
 *
 * Uses a 1x1 offscreen canvas pixel read so modern accepted forms (oklch, lab,
 * color(display-p3), system keywords) become deterministic concrete sRGB output
 * independent of the original syntax.
 */
function canonicalizeToSrgb(resolvedColor: string): string | null {
    if (typeof document === "undefined" || !isCanvasPixelReadbackReliable()) {
        return null;
    }
    try {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
            return null;
        }
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = resolvedColor;
        ctx.fillRect(0, 0, 1, 1);
        const pixel = ctx.getImageData(0, 0, 1, 1).data;
        const r = pixel[0];
        const g = pixel[1];
        const b = pixel[2];
        const alpha = pixel[3] / 255;

        if (pixel[3] === 0) {
            return "rgba(0, 0, 0, 0)";
        }
        if (pixel[3] === 255) {
            return `rgb(${r}, ${g}, ${b})`;
        }
        const roundedAlpha = Math.round(alpha * 1000) / 1000;
        return `rgba(${r}, ${g}, ${b}, ${roundedAlpha})`;
    } catch {
        return null;
    }
}

export class ChartExportColorNormalizer {
    /**
     * Validates and normalizes an explicit CSS color string to a concrete standalone color.
     * Rejects CSS-wide keywords, unresolved CSS variables, currentColor, paint servers, URLs, gradients, and invalid tokens.
     * Accepted colors are canonicalized to deterministic sRGB `rgb()`/`rgba()` output (R4-08).
     */
    public static normalizeColor(colorStr: string): string {
        const trimmed = colorStr.trim();
        if (!trimmed) {
            throw new ChartExportError(
                "invalid-size",
                "Color string cannot be empty."
            );
        }

        const lower = trimmed.toLowerCase();
        if (CSS_WIDE_KEYWORDS.has(lower)) {
            throw new ChartExportError(
                "invalid-size",
                `CSS-wide keyword '${trimmed}' is not a standalone concrete color.`
            );
        }

        for (const pattern of FORBIDDEN_COLOR_PATTERNS) {
            if (pattern.test(trimmed)) {
                throw new ChartExportError(
                    "invalid-size",
                    `Invalid color value '${trimmed}'. URLs, gradients, CSS variables, and currentColor are not standalone concrete colors.`
                );
            }
        }

        // Validate syntax and resolve to computed concrete color via browser DOM if available
        if (typeof document !== "undefined") {
            const testEl = document.createElement("div");
            testEl.style.display = "none";
            testEl.style.color = "";
            testEl.style.color = trimmed;

            if (!testEl.style.color) {
                throw new ChartExportError(
                    "invalid-size",
                    `Invalid CSS color syntax: '${trimmed}'.`
                );
            }

            if (document.body) {
                document.body.appendChild(testEl);
                try {
                    const computed = window.getComputedStyle(testEl).color;
                    if (computed) {
                        const canonical = canonicalizeToSrgb(computed);
                        if (canonical) {
                            return canonical;
                        }
                        if (computed.startsWith("rgb") || computed.startsWith("#")) {
                            return computed;
                        }
                    }
                } catch {
                    // Fallback to validated trimmed string
                } finally {
                    testEl.remove();
                }
            }
        }

        return trimmed;
    }

    /**
     * Resolves an auto background color from computed styles and style snapshot.
     *
     * Fallback semantics are explicit (R4-08):
     * - No usable candidate found → documented white default.
     * - A concrete non-transparent candidate exists but cannot be normalized → explicit failure,
     *   never a silent replacement with white.
     */
    public static resolveAutoBackground(
        hostElement: HTMLElement | null,
        styleSnapshot: ReadonlyMap<string, string>
    ): string {
        const candidates = [
            styleSnapshot.get("--mona-chart-surface"),
            styleSnapshot.get("--color-surface"),
            styleSnapshot.get("--color-card"),
            styleSnapshot.get("--color-background"),
            styleSnapshot.get("background-color"),
            hostElement && typeof window !== "undefined" ? window.getComputedStyle(hostElement).backgroundColor : null
        ];

        for (const candidate of candidates) {
            if (!candidate || !candidate.trim()) {
                continue;
            }
            const trimmed = candidate.trim();
            if (trimmed === "transparent" || trimmed === "rgba(0, 0, 0, 0)") {
                continue;
            }
            // Unresolved variable/context references are not concrete chosen backgrounds;
            // skip them in favor of the next candidate rather than failing the export.
            if (/var\s*\(/i.test(trimmed) || /currentcolor/i.test(trimmed)) {
                continue;
            }
            try {
                return ChartExportColorNormalizer.normalizeColor(trimmed);
            } catch (err) {
                if (err instanceof ChartExportError) {
                    throw new ChartExportError(
                        "invalid-size",
                        `Resolved chart background '${trimmed}' is not a valid standalone color for export.`,
                        { cause: err }
                    );
                }
                throw err;
            }
        }

        return "#ffffff";
    }
}
