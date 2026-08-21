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

export class ChartExportColorNormalizer {
    /**
     * Validates and normalizes an explicit CSS color string to a concrete standalone color.
     * Rejects CSS-wide keywords, unresolved CSS variables, currentColor, paint servers, URLs, gradients, and invalid tokens.
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
                    if (computed && (computed.startsWith("rgb") || computed.startsWith("#"))) {
                        return computed;
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
     * Resolves and normalizes an auto background color from computed styles and style snapshot.
     */
    public static resolveAutoBackground(
        hostElement: HTMLElement | null,
        styleSnapshot: ReadonlyMap<string, string>
    ): string {
        const candidate =
            styleSnapshot.get("--mona-chart-surface") ||
            styleSnapshot.get("--color-surface") ||
            styleSnapshot.get("--color-card") ||
            styleSnapshot.get("--color-background") ||
            styleSnapshot.get("background-color") ||
            (hostElement && typeof window !== "undefined" ? window.getComputedStyle(hostElement).backgroundColor : null) ||
            "#ffffff";

        if (candidate === "transparent" || candidate === "rgba(0, 0, 0, 0)") {
            return "#ffffff";
        }

        try {
            return ChartExportColorNormalizer.normalizeColor(candidate);
        } catch {
            return "#ffffff";
        }
    }
}
