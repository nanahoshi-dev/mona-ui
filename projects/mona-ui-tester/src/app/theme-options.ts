import type { ThemeSelection } from "@nanahoshi/mona-ui/theme";

export interface ThemeOption extends ThemeSelection {
    readonly text: string;
}

export const THEME_OPTIONS: readonly ThemeOption[] = Object.freeze([
    { text: "Mona Light", name: "mona", variant: "light", group: "Mona" },
    { text: "Mona Dark", name: "mona", variant: "dark", group: "Mona" },
    { text: "Anna Light", name: "anna", variant: "light", group: "Anna" },
    { text: "Anna Dark", name: "anna", variant: "dark", group: "Anna" },
    { text: "Luna Light", name: "luna", variant: "light", group: "Luna" },
    { text: "Luna Dark", name: "luna", variant: "dark", group: "Luna" },
    { text: "Rena Light", name: "rena", variant: "light", group: "Rena" },
    { text: "Rena Dark", name: "rena", variant: "dark", group: "Rena" },
    { text: "Aurora Dark", name: "aurora", variant: "dark", group: "Aurora" }
]);
