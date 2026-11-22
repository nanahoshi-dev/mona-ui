import type { ThemeShadowDefinition, ThemeShadows } from "../models/ThemeDefinition";

// Tailwind CSS's shadow scale (MIT): xs on controls, sm on raised surfaces and lg on overlays. Popups draw their own
// border, so the overlay shadow needs no hairline of its own.
const light: ThemeShadows = Object.freeze({
    "--shadow-control": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "--shadow-raised": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    "--shadow-overlay": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
});

// The same shapes, darker, so they still read against gray-900.
const dark: ThemeShadows = Object.freeze({
    "--shadow-control": "0 1px 2px 0 rgb(0 0 0 / 0.3)",
    "--shadow-raised": "0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)",
    "--shadow-overlay": "0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5)"
});

export const renaThemeShadows = Object.freeze({ light, dark } satisfies ThemeShadowDefinition);
