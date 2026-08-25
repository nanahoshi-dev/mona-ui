import { describe, expect, it } from "vitest";
import { ChartExportColorNormalizer } from "./chart-export-color-normalizer";
import { ChartExportError } from "../../models/chart-export.models";

describe("ChartExportColorNormalizer", () => {
    it("accepts valid hex, rgb, rgba, hsl, and named colors", () => {
        const validColors = [
            "#fff",
            "#ffffff",
            "#112233",
            "#112233aa",
            "rgb(255, 0, 0)",
            "rgba(255, 0, 0, 0.5)",
            "hsl(120, 100%, 50%)",
            "red",
            "white",
            "blue",
            "transparent"
        ];

        for (const c of validColors) {
            expect(() => ChartExportColorNormalizer.normalizeColor(c)).not.toThrow();
        }
    });

    it("rejects CSS variables, gradients, URLs, currentColor, and invalid tokens", () => {
        const invalidColors = [
            "var(--primary)",
            "currentColor",
            "url(https://example.com/pat)",
            "linear-gradient(to right, red, blue)",
            "radial-gradient(circle, red, yellow)",
            "paint(my-paint)",
            "calc(10px + 20px)",
            "not-a-color-token",
            "   "
        ];

        for (const c of invalidColors) {
            expect(() => ChartExportColorNormalizer.normalizeColor(c)).toThrow(ChartExportError);
        }
    });
});
