import type { ThemeShadowDefinition, ThemeShadows } from "../models/ThemeDefinition";

const light: ThemeShadows = Object.freeze({
    "--shadow-control": "none",
    "--shadow-raised": "0 2px 6px -2px rgb(17 17 20 / 0.14)",
    "--shadow-overlay": "0 8px 20px -6px rgb(17 17 20 / 0.22)"
});

const dark: ThemeShadows = Object.freeze({
    "--shadow-control": "none",
    "--shadow-raised": "0 4px 10px -4px rgb(0 0 0 / 0.6)",
    "--shadow-overlay": "0 6px 14px -4px rgb(0 0 0 / 0.65)"
});

export const annaThemeShadows = Object.freeze({ light, dark } satisfies ThemeShadowDefinition);
