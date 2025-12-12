import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import {
    placeholderBaseThemeVariants,
    placeholderTextThemeVariants,
    PlaceholderVariantInput
} from "../styles/placeholder.styles";
import { ThemeService } from "../../../../theme/services/theme.service";
import { twMerge } from "tailwind-merge";

@Component({
    selector: "mona-placeholder",
    templateUrl: "./placeholder.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[class]": "baseClass()"
    }
})
export class PlaceholderComponent implements PlaceholderVariantInput {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const variantClass = placeholderBaseThemeVariants(theme)();
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly textClass = computed(() => {
        const theme = this.#themeService.theme();
        return placeholderTextThemeVariants(theme)();
    });

    /**
     * @description The text to display inside the placeholder.
     * Takes precedence over custom content if both are provided.
     * @default ""
     */
    public readonly text = input("");
    public readonly userClass = input("", { alias: "class" });
}
