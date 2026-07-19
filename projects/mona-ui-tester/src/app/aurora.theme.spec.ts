import { auroraTheme } from "./aurora.theme";

describe("Aurora theme profile", () => {
    it("keeps its existing opaque material and radius scale", () => {
        const profile = auroraTheme.variants.dark;

        expect(profile.effects["--mona-effect-control-backdrop-filter"]).toBe("none");
        expect(profile.effects["--mona-effect-raised-backdrop-filter"]).toBe("none");
        expect(profile.effects["--mona-effect-overlay-backdrop-filter"]).toBe("none");
        expect(profile.shape).toEqual({
            "--radius-sm": "0.25rem",
            "--radius-md": "0.375rem",
            "--radius-lg": "0.5rem"
        });
    });
});
