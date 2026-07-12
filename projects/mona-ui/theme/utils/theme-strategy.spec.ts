import { describe, expect, it } from "vitest";
import { createInheritedThemeStrategy, createThemeStrategy } from "./theme-strategy";

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

describe("createInheritedThemeStrategy", () => {
    it("uses Mona when a theme has no explicit inherited style", () => {
        const strategy = createInheritedThemeStrategy("mona-style", {});

        expect(strategy.resolve("mona")).toBe("mona-style");
        expect(strategy.resolve("reina")).toBe("mona-style");
    });

    it("uses a supplied inherited style", () => {
        const strategy = createInheritedThemeStrategy("mona-style", { reina: "reina-style" });

        expect(strategy.resolve("reina")).toBe("reina-style");
    });
});
