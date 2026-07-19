import type { ThemeShadowDefinition, ThemeShadows } from "../models/ThemeDefinition";

const light: ThemeShadows = Object.freeze({
    "--shadow-control": "inset 0 1px 0 rgb(255 255 255 / 0.72), 0 2px 8px rgb(73 75 130 / 0.14)",
    "--shadow-raised": "inset 0 1px 0 rgb(255 255 255 / 0.78), 0 8px 24px -8px rgb(61 64 122 / 0.24)",
    "--shadow-overlay": "inset 0 1px 0 rgb(255 255 255 / 0.82), 0 20px 48px -14px rgb(46 48 100 / 0.34)"
});

const dark: ThemeShadows = Object.freeze({
    "--shadow-control": "inset 0 1px 0 rgb(255 255 255 / 0.16), 0 3px 10px rgb(0 0 0 / 0.32)",
    "--shadow-raised": "inset 0 1px 0 rgb(255 255 255 / 0.18), 0 10px 28px -8px rgb(0 0 0 / 0.52)",
    "--shadow-overlay": "inset 0 1px 0 rgb(255 255 255 / 0.2), 0 24px 56px -14px rgb(0 0 0 / 0.68)"
});

export const lunaThemeShadows = Object.freeze({ light, dark } satisfies ThemeShadowDefinition);
