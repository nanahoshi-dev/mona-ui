import type { ThemeId, ThemeStyle, ThemeVariant } from "@nanahoshi/mona-ui/theme";

export interface ThemeOption {
    readonly id: ThemeId;
    readonly text: string;
    readonly theme: ThemeStyle;
    readonly variant: ThemeVariant;
}

export const THEME_OPTIONS: readonly ThemeOption[] = Object.freeze([
    { text: "Mona Light", theme: "mona", variant: "light", id: "mona-light" },
    { text: "Mona Dark", theme: "mona", variant: "dark", id: "mona-dark" },
    { text: "Anna Dark", theme: "anna", variant: "dark", id: "anna-dark" }
]);
