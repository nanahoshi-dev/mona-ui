import type { ThemeShadowDefinition, ThemeShadows } from "../models/ThemeDefinition";

const dark: ThemeShadows = Object.freeze({
    "--shadow-control": "none",
    "--shadow-raised": "0 4px 10px -4px rgb(0 0 0 / 0.6)",
    "--shadow-overlay": "0 6px 14px -4px rgb(0 0 0 / 0.65)"
});

export const annaThemeShadows = Object.freeze({ dark } satisfies ThemeShadowDefinition);
