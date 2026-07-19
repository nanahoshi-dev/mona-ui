import { Component, computed, inject } from "@angular/core";
import { ThemeService, type ThemeColorVariable } from "@nanahoshi/mona-ui/theme";
import { wcagContrast } from "culori";

interface ColorRolePreview {
    readonly label: string;
    readonly token: "primary" | "secondary" | "success" | "error" | "warning" | "info";
}

@Component({
    selector: "app-theme-colors-doc",
    templateUrl: "./theme-colors-doc.component.html",
    styleUrl: "./theme-colors-doc.component.css",
    host: {
        class: "block"
    }
})
export class ThemeColorsDocComponent {
    readonly #themeService = inject(ThemeService);
    protected readonly themeLabel = computed(
        () => `${this.#themeService.themeName()}-${this.#themeService.themeVariant()}`
    );
    protected readonly colors = computed(() => this.#themeService.profile().colors);
    protected readonly roles: readonly ColorRolePreview[] = [
        { label: "Primary", token: "primary" },
        { label: "Secondary", token: "secondary" },
        { label: "Success", token: "success" },
        { label: "Error", token: "error" },
        { label: "Warning", token: "warning" },
        { label: "Info", token: "info" }
    ];

    protected contrast(foreground: ThemeColorVariable, background: ThemeColorVariable): string {
        return wcagContrast(this.#resolve(foreground), this.#resolve(background)).toFixed(2);
    }

    protected roleVariable(role: ColorRolePreview, suffix = ""): ThemeColorVariable {
        return `--color-${role.token}${suffix}`;
    }

    #resolve(name: ThemeColorVariable): string {
        const value = this.colors()[name];
        const alias = /^var\((--color-[^)]+)\)$/.exec(value)?.[1] as ThemeColorVariable | undefined;
        return alias ? this.#resolve(alias) : value;
    }
}
