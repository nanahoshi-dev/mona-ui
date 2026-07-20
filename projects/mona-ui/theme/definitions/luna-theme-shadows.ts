import type { ThemeShadowDefinition, ThemeShadows } from "../models/ThemeDefinition";

const light: ThemeShadows = Object.freeze({
    "--shadow-control": "0 1px 2px rgb(20 20 20 / 0.04)",
    "--shadow-raised": "0 8px 24px -14px rgb(20 20 20 / 0.14), 0 2px 6px -3px rgb(20 20 20 / 0.06)",
    "--shadow-overlay": "0 18px 42px -20px rgb(20 20 20 / 0.22), 0 6px 16px -10px rgb(20 20 20 / 0.1)"
});

const dark: ThemeShadows = Object.freeze({
    "--shadow-control": "0 1px 2px rgb(0 0 0 / 0.28)",
    "--shadow-raised": "0 10px 26px -14px rgb(0 0 0 / 0.5), 0 2px 7px -4px rgb(0 0 0 / 0.34)",
    "--shadow-overlay": "0 20px 46px -20px rgb(0 0 0 / 0.62), 0 7px 18px -11px rgb(0 0 0 / 0.46)"
});

export const lunaThemeShadows = Object.freeze({ light, dark } satisfies ThemeShadowDefinition);
