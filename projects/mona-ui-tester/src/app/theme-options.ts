import type { ThemeSelection } from "@nanahoshi/mona-ui/theme";

export interface ThemeOption extends ThemeSelection {
    readonly text: string;
}

export const THEME_OPTIONS: readonly ThemeOption[] = Object.freeze([
    { text: "Mona Light", name: "mona", variant: "light" },
    { text: "Mona Dark", name: "mona", variant: "dark" },
    { text: "Anna Dark", name: "anna", variant: "dark" },
    { text: "Luna Light", name: "luna", variant: "light" },
    { text: "Luna Dark", name: "luna", variant: "dark" },
    { text: "Aurora Dark", name: "aurora", variant: "dark" }
]);
