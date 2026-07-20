import type { ThemeShadowDefinition, ThemeShadows } from "../models/ThemeDefinition";

const light: ThemeShadows = Object.freeze({
    "--shadow-control": "0 1px 2px rgb(9 9 11 / 0.03)",
    "--shadow-raised": "0 2px 6px rgb(9 9 11 / 0.1)",
    "--shadow-overlay": "0 8px 24px rgb(9 9 11 / 0.14)"
});

const dark: ThemeShadows = Object.freeze({
    "--shadow-control": "0 1px 2px rgb(0 0 0 / 0.28)",
    "--shadow-raised": "0 4px 10px -4px rgb(0 0 0 / 0.55)",
    "--shadow-overlay": "0 8px 24px -6px rgb(0 0 0 / 0.72)"
});

export const monaThemeShadows = Object.freeze({ light, dark } satisfies ThemeShadowDefinition);
