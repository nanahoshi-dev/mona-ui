import { describe, expect, it } from "vitest";
import { createThemeStrategy } from "./theme-strategy";

describe("createThemeStrategy", () => {
    it("resolves a registered theme", () => {
        const strategy = createThemeStrategy({ mona: "mona-style", reina: "reina-style" }, "fallback");

        expect(strategy.resolve("reina")).toBe("reina-style");
    });

    it("uses the fallback for themes without a registered style", () => {
        const strategy = createThemeStrategy({ mona: "mona-style" }, "fallback");

        expect(strategy.resolve("reina")).toBe("fallback");
    });
});
