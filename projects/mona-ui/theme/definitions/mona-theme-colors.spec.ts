import { monaThemeColors } from "./mona-theme-colors";

describe("monaThemeColors", () => {
    it("keeps light and dark variants on the same color contract", () => {
        expect(Object.keys(monaThemeColors.dark).sort()).toEqual(Object.keys(monaThemeColors.light).sort());
    });

    it("uses only color variable names", () => {
        for (const colors of Object.values(monaThemeColors)) {
            expect(Object.keys(colors).every(name => name.startsWith("--color-"))).toBe(true);
        }
    });

    it("defines the required semantic tokens in both variants", () => {
        const requiredTokens = [
            "--color-background",
            "--color-surface-muted",
            "--color-foreground",
            "--color-primary",
            "--color-accent-foreground",
            "--color-destructive",
            "--color-destructive-foreground"
        ];

        for (const colors of Object.values(monaThemeColors)) {
            expect(Object.keys(colors)).toEqual(expect.arrayContaining(requiredTokens));
        }
    });

    it("uses the dark error colors for destructive actions", () => {
        expect(monaThemeColors.dark["--color-destructive"]).toBe(monaThemeColors.dark["--color-error"]);
        expect(monaThemeColors.dark["--color-destructive-foreground"]).toBe(
            monaThemeColors.dark["--color-error-foreground"]
        );
    });

    it("does not include tester-owned colors", () => {
        for (const colors of Object.values(monaThemeColors)) {
            expect(colors).not.toHaveProperty("--color-page-background");
            expect(colors).not.toHaveProperty("--color-demo-background");
            expect(colors).not.toHaveProperty("--page-background");
        }
    });
});
