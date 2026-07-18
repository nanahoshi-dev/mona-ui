import type { ThemeStyle } from "../models/Theme";
import { createThemeStrategy } from "./theme-strategy";

describe("createThemeStrategy", () => {
    it("resolves every registered theme without a fallback", () => {
        const strategy = createThemeStrategy({ anna: "anna-styles", mona: "mona-styles" });

        expect(strategy("anna")).toBe("anna-styles");
        expect(strategy("mona")).toBe("mona-styles");
    });

    it("requires a total registry at compile time", () => {
        // @ts-expect-error Anna must be registered explicitly.
        createThemeStrategy({ mona: "mona-styles" });

        expect(true).toBe(true);
    });

    it("does not manufacture a fallback for an invalid runtime value", () => {
        const strategy = createThemeStrategy({ anna: "anna-styles", mona: "mona-styles" });

        expect(strategy("future-theme" as ThemeStyle)).toBeUndefined();
    });
});
