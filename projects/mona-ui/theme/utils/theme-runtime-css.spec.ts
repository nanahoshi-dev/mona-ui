import { describe, expect, it } from "vitest";
import { themeDefinitions } from "../definitions/theme-definitions";
import { createRuntimeThemeCss, toRuntimeVariableName } from "./theme-runtime-css";

describe("theme runtime CSS", () => {
    it("uses the namespaced runtime variable convention", () => {
        expect(toRuntimeVariableName("--color-primary")).toBe("--mona-color-primary");
        expect(toRuntimeVariableName("--mona-color-primary")).toBe("--mona-color-primary");
    });

    it("generates fallback declarations from the Mona light registry definition", () => {
        const css = createRuntimeThemeCss(themeDefinitions.mona.light);

        expect(css).toContain(":root {");
        expect(css).toContain("--mona-color-chart-5: #f4a462;");
        expect(css).toContain("--mona-color-background: oklch(1 0 0);");
        expect(css).not.toContain("--color-chart-5:");
    });
});
