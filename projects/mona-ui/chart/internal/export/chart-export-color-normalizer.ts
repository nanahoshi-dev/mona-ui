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

export class ChartExportColorNormalizer {
    /**
     * Validates and normalizes an explicit CSS color string to a concrete color.
     * Rejects unresolved CSS variables, currentColor, paint servers, URLs, gradients, and invalid tokens.
     */
    public static normalizeColor(colorStr: string): string {
        const trimmed = colorStr.trim();
        if (!trimmed) {
            throw new ChartExportError(
                "invalid-size",
                "Color string cannot be empty."
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

        // Validate syntax via browser DOM if available
        if (typeof document !== "undefined") {
            const testEl = document.createElement("div");
            testEl.style.color = "";
            testEl.style.color = trimmed;

            if (!testEl.style.color) {
                throw new ChartExportError(
                    "invalid-size",
                    `Invalid CSS color syntax: '${trimmed}'.`
                );
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

        try {
            return ChartExportColorNormalizer.normalizeColor(candidate);
        } catch {
            return "#ffffff";
        }
    }
}
