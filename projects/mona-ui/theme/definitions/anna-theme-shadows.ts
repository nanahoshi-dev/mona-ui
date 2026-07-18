import type { ThemeShadowDefinition, ThemeShadows } from "../models/ThemeDefinition";

const light: ThemeShadows = Object.freeze({
    "--shadow-control": "none",
    "--shadow-raised": "0 2px 6px rgb(18 18 22 / 0.12)",
    "--shadow-overlay": "0 8px 24px -6px rgb(18 18 22 / 0.22)"
});

const dark: ThemeShadows = Object.freeze({
    "--shadow-control": "none",
    "--shadow-raised": "0 4px 10px -4px rgb(0 0 0 / 0.6)",
    "--shadow-overlay": "0 6px 14px -4px rgb(0 0 0 / 0.65)"
});

export const annaThemeShadows = Object.freeze({ light, dark } satisfies ThemeShadowDefinition);
