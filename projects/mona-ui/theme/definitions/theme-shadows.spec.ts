import { annaThemeShadows } from "./anna-theme-shadows";
import { monaThemeShadows } from "./mona-theme-shadows";
import { renaThemeShadows } from "./rena-theme-shadows";

describe("built-in theme shadows", () => {
    const requiredTokens = ["--shadow-control", "--shadow-overlay", "--shadow-raised"];

    it("keeps every supported theme variant on the same elevation contract", () => {
        for (const shadows of [
            monaThemeShadows.light,
            monaThemeShadows.dark,
            annaThemeShadows.light,
            annaThemeShadows.dark,
            renaThemeShadows.light,
            renaThemeShadows.dark
        ]) {
            expect(Object.keys(shadows).sort()).toEqual(requiredTokens);
            expect(Object.keys(shadows).every(name => name.startsWith("--shadow-"))).toBe(true);
        }
    });

    it("keeps the static Tailwind fallback aligned with Mona Light", () => {
        expect(monaThemeShadows.light).toEqual({
            "--shadow-control": "0 1px 2px rgb(9 9 11 / 0.03)",
            "--shadow-raised": "0 2px 6px rgb(9 9 11 / 0.1)",
            "--shadow-overlay": "0 8px 24px rgb(9 9 11 / 0.14)"
        });
    });

    // Components put a shadow in one box-shadow list with their focus ring, where "none" would make the list invalid.
    it("never writes no shadow as none", () => {
        for (const shadows of [
            monaThemeShadows.light,
            monaThemeShadows.dark,
            annaThemeShadows.light,
            annaThemeShadows.dark,
            renaThemeShadows.light,
            renaThemeShadows.dark
        ]) {
            expect(Object.values(shadows)).not.toContain("none");
        }
    });

    it("owns elevation independently for every supported theme variant", () => {
        expect(monaThemeShadows.dark).not.toEqual(monaThemeShadows.light);
        expect(annaThemeShadows.light).not.toEqual(monaThemeShadows.light);
        expect(annaThemeShadows.dark).not.toEqual(monaThemeShadows.dark);
        expect(annaThemeShadows.light["--shadow-control"]).toBe("0 0 #0000");
        expect(annaThemeShadows.dark["--shadow-control"]).toBe("0 0 #0000");
        expect(annaThemeShadows.dark["--shadow-raised"]).toContain("rgb(0 0 0 / 0.6)");
        expect(annaThemeShadows.dark["--shadow-overlay"]).toContain("rgb(0 0 0 / 0.65)");
    });
});
