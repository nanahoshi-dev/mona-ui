import { Component, computed, inject, input } from "@angular/core";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { twMerge } from "tailwind-merge";
import { PLACEHOLDER_STYLE_STRATEGY, PlaceholderVariantInput } from "../../styles/placeholder.styles";

@Component({
    selector: "mona-placeholder",
    templateUrl: "./placeholder.component.html",
    host: {
        "[class]": "baseClass()"
    }
})
export class PlaceholderComponent implements PlaceholderVariantInput {
    readonly #styleStrategy = inject(PLACEHOLDER_STYLE_STRATEGY);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const variantClass = this.#styleStrategy.resolve(theme).base();
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly textClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).text();
    });

    /**
     * @description The text to display inside the placeholder.
     * Takes precedence over projected content if both are provided.
     * @default ""
     */
    public readonly text = input("");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * Bind this input with the public `class` alias.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });
}
