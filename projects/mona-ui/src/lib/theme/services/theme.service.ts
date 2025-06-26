import { Injectable, signal } from "@angular/core";
import { ThemeStyle } from "mona-ui/theme/models/Theme";
import { generatePrimaryColorPalette } from "mona-ui/theme/utils/generateThemeColors";
import { themeColorMap } from "mona-ui/theme/utils/themeColorMap";

@Injectable({
    providedIn: "root"
})
export class ThemeService {
    readonly #theme = signal<ThemeStyle>("shadcn");
    public readonly theme = this.#theme.asReadonly();

    public setTheme(theme: ThemeStyle): void {
        this.#theme.set(theme);
        this.updateThemeVariables();
    }

    private getActiveThemeVariables(): Record<string, string> {
        return this.#theme() === "mona" ? this.getMonaDarkThemeVariables() : this.getShadcnLightThemeVariables();
    }

    private getMonaDarkThemeVariables(): Record<string, string> {
        return {
            "--color-background": "oklch(0.22 0 0)",
            "--color-foreground": "oklch(100% 0.001 106.424)",
            "--color-selected": "oklch(24% 0 0)",

            "--color-popover": "#fff",
            "--color-popover-foreground": "#09090b",

            ...generatePrimaryColorPalette(themeColorMap.mona),

            // "--color-primary": "oklch(39.8% 0.195 277.366)",
            // "--color-primary-foreground": "oklch(94.3% 0.029 294.588)",
            // "--color-primary-hover": "oklch(43.8% 0.195 277.366)",
            // "--color-primary-active": "oklch(35.8% 0.195 277.366)",
            // "--color-primary-selected": "oklch(48.8% 0.195 277.366)",

            "--color-secondary": "oklch(0.27 0 0)",
            "--color-secondary-foreground": "oklch(97.7% 0.001 106.424)",
            "--color-secondary-hover": "oklch(0.29 0 0)",
            "--color-secondary-active": "oklch(0.31 0 0)",
            // "--color-secondary-selected": "oklch(43.8% 0.195 277.366 / 0.5)",

            "--color-success": "oklch(62.7% 0.194 149.214)",
            "--color-success-foreground": "oklch(94.3% 0.029 294.588)",
            "--color-success-hover": "oklch(66.7% 0.194 149.214)",
            "--color-success-active": "oklch(54.7% 0.194 149.214)",
            "--color-success-selected": "oklch(76.7% 0.194 149.214)",

            "--color-error": "oklch(57.7% 0.245 27.325)",
            "--color-error-foreground": "oklch(94.3% 0.029 294.588)",
            "--color-error-hover": "oklch(61.7% 0.245 27.325)",
            "--color-error-active": "oklch(53.7% 0.245 27.325)",
            "--color-error-selected": "oklch(71.7% 0.245 27.325)",

            "--color-warning": "oklch(66.6% 0.179 58.318)",
            "--color-warning-foreground": "oklch(94.3% 0.029 294.588)",
            "--color-warning-hover": "oklch(70.6% 0.179 58.318)",
            "--color-warning-active": "oklch(58.6% 0.179 58.318)",
            "--color-warning-selected": "oklch(80.6% 0.179 58.318)",

            "--color-info": "oklch(54.6% 0.245 262.881)",
            "--color-info-foreground": "oklch(94.3% 0.029 294.588)",
            "--color-info-hover": "oklch(58.6% 0.245 262.881)",
            "--color-info-active": "oklch(46.6% 0.245 262.881)",
            "--color-info-selected": "oklch(68.6% 0.245 262.881)",

            "--color-muted": "#f4f4f5",
            "--color-muted-foreground": "#71717a",

            "--color-accent": "oklch(0.23 0 0)",
            "--color-accent-dark": "oklch(0.21 0 0)",
            "--color-accent-foreground": "oklch(97% 0 0)",

            "--color-border": "oklch(0.1689 0.0021 286.18)",
            "--color-input": "#e4e4e7",

            "--color-chart-1": "#e76e50",
            "--color-chart-2": "#2a9d90",
            "--color-chart-3": "#274754",
            "--color-chart-4": "#e8c468",
            "--color-chart-5": "#f4a462",

            "--color-scrollbar-thumb": "#d1d5db",
            "--color-scrollbar-thumb-hover": "#9ca3af",
            "--color-scrollbar-thumb-active": "#6b7280",
            "--color-scrollbar-thumb-focus": "#9ca3af",
            "--color-scrollbar-track": "#f9fafb",
            "--color-scrollbar-track-hover": "#f4f5f7",
            "--color-scrollbar-track-active": "#e5e7eb",
            "--color-scrollbar-track-focus": "#f4f5f7",
            "--color-scrollbar-corner": "#f9fafb",

            // Temporary variables for testing purposes
            "--page-background": "#1a1b1c",
            "--color-demo-background": "#202122"
        };
    }

    private getMonaLightThemeVariables(): Record<string, string> {
        return {
            "--color-background": "oklch(100% 0.001 106.424)",
            "--color-foreground": "oklch(20% 0 0)",

            "--color-popover": "#fff",
            "--color-popover-foreground": "#09090b",

            ...generatePrimaryColorPalette(themeColorMap.mona),

            "--color-secondary": "oklch(92% 0.004 286.32)",
            "--color-secondary-foreground": "#18181b",
            "--color-secondary-hover": "oklch(93% 0.004 286.32)",
            "--color-secondary-active": "oklch(91% 0.004 286.32)",

            "--color-success": "oklch(62.7% 0.194 149.214)",
            "--color-success-foreground": "oklch(97.7% 0.001 106.424)",
            "--color-success-hover": "oklch(66.7% 0.194 149.214)",
            "--color-success-active": "oklch(54.7% 0.194 149.214)",
            "--color-success-selected": "oklch(76.7% 0.194 149.214)",

            "--color-error": "oklch(57.7% 0.245 27.325)",
            "--color-error-foreground": "oklch(94.3% 0.029 294.588)",
            "--color-error-hover": "oklch(61.7% 0.245 27.325)",
            "--color-error-active": "oklch(53.7% 0.245 27.325)",
            "--color-error-selected": "oklch(71.7% 0.245 27.325)",

            "--color-warning": "oklch(66.6% 0.179 58.318)",
            "--color-warning-foreground": "oklch(94.3% 0.029 294.588)",
            "--color-warning-hover": "oklch(70.6% 0.179 58.318)",
            "--color-warning-active": "oklch(58.6% 0.179 58.318)",
            "--color-warning-selected": "oklch(80.6% 0.179 58.318)",

            "--color-info": "oklch(54.6% 0.245 262.881)",
            "--color-info-foreground": "oklch(94.3% 0.029 294.588)",
            "--color-info-hover": "oklch(58.6% 0.245 262.881)",
            "--color-info-active": "oklch(46.6% 0.245 262.881)",
            "--color-info-selected": "oklch(68.6% 0.245 262.881)",

            "--color-muted": "#f4f4f5",
            "--color-muted-foreground": "#71717a",

            "--color-accent": "oklch(98% 0.001 106.424)",
            "--color-accent-dark": "oklch(96% 0.001 106.424)",
            "--color-accent-foreground": "oklch(14.1% 0.005 285.823)",

            "--color-border": "oklch(0.9197 0.004 286.32)",
            "--color-input": "#e4e4e7",

            "--color-chart-1": "#e76e50",
            "--color-chart-2": "#2a9d90",
            "--color-chart-3": "#274754",
            "--color-chart-4": "#e8c468",
            "--color-chart-5": "#f4a462",

            "--color-scrollbar-thumb": "#d1d5db",
            "--color-scrollbar-thumb-hover": "#9ca3af",
            "--color-scrollbar-thumb-active": "#6b7280",
            "--color-scrollbar-thumb-focus": "#9ca3af",
            "--color-scrollbar-track": "#f9fafb",
            "--color-scrollbar-track-hover": "#f4f5f7",
            "--color-scrollbar-track-active": "#e5e7eb",
            "--color-scrollbar-track-focus": "#f4f5f7",
            "--color-scrollbar-corner": "#f9fafb",

            // Temporary variables for testing purposes
            "--page-background": "#fff",
            "--color-demo-background": "#f9fafb"
        };
    }

    private getShadcnLightThemeVariables(): Record<string, string> {
        return {
            "--color-background": "#fff",
            "--color-foreground": "#09090b",
            "--color-selected": "#f4f5f7",

            "--color-popover": "#fff",
            "--color-popover-foreground": "#09090b",

            ...generatePrimaryColorPalette("oklch(0.21 0.01 0)"),

            "--color-secondary": "oklch(.97 0 0)",
            "--color-secondary-foreground": "oklch(0.21 0 0)",
            "--color-secondary-hover": "oklch(0.95 0 0)",
            "--color-secondary-active": "oklch(0.90 0 0)",

            "--color-success": "oklch(62.7% 0.194 149.214)",
            "--color-success-foreground": "oklch(97.7% 0.001 106.424)",
            "--color-success-hover": "oklch(66.7% 0.194 149.214)",
            "--color-success-active": "oklch(54.7% 0.194 149.214)",
            "--color-success-selected": "oklch(76.7% 0.194 149.214)",

            "--color-error": "oklch(57.7% 0.245 27.325)",
            "--color-error-foreground": "oklch(94.3% 0.029 294.588)",
            "--color-error-hover": "oklch(61.7% 0.245 27.325)",
            "--color-error-active": "oklch(53.7% 0.245 27.325)",
            "--color-error-selected": "oklch(71.7% 0.245 27.325)",

            "--color-warning": "oklch(66.6% 0.179 58.318)",
            "--color-warning-foreground": "oklch(94.3% 0.029 294.588)",
            "--color-warning-hover": "oklch(70.6% 0.179 58.318)",
            "--color-warning-active": "oklch(58.6% 0.179 58.318)",
            "--color-warning-selected": "oklch(80.6% 0.179 58.318)",

            "--color-info": "oklch(54.6% 0.245 262.881)",
            "--color-info-foreground": "oklch(94.3% 0.029 294.588)",
            "--color-info-hover": "oklch(58.6% 0.245 262.881)",
            "--color-info-active": "oklch(46.6% 0.245 262.881)",
            "--color-info-selected": "oklch(68.6% 0.245 262.881)",

            "--color-muted": "#f4f4f5",
            "--color-muted-foreground": "#71717a",

            "--color-accent": "oklch(0.97 0 0)",
            "--color-accent-dark": "oklch(0.95 0 0)",
            "--color-accent-foreground": "oklch(0.21 0 0)",

            "--color-destructive": "#ef4444",
            "--color-destructive-foreground": "#fafafa",

            "--color-border": "oklch(0.9197 0.004 286.32)",
            "--color-input": "#e4e4e7",

            "--color-chart-1": "#e76e50",
            "--color-chart-2": "#2a9d90",
            "--color-chart-3": "#274754",
            "--color-chart-4": "#e8c468",
            "--color-chart-5": "#f4a462",

            "--color-scrollbar-thumb": "#d1d5db",
            "--color-scrollbar-thumb-hover": "#9ca3af",
            "--color-scrollbar-thumb-active": "#6b7280",
            "--color-scrollbar-thumb-focus": "#9ca3af",
            "--color-scrollbar-track": "#f9fafb",
            "--color-scrollbar-track-hover": "#f4f5f7",
            "--color-scrollbar-track-active": "#e5e7eb",
            "--color-scrollbar-track-focus": "#f4f5f7",
            "--color-scrollbar-corner": "#f9fafb",

            "--page-background": "#fff",
            "--color-demo-background": "#f9fafb"
        };
    }

    private updateThemeVariables(): void {
        const themeVariables = this.getActiveThemeVariables();
        const root = document.querySelector(":root") as HTMLElement;
        Object.entries(themeVariables).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }
}
