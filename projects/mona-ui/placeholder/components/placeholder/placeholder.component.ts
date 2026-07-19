import { Component, computed, inject, input } from "@angular/core";
import { twMerge } from "tailwind-merge";
import {
    placeholderBaseThemeVariants,
    placeholderTextThemeVariants,
    PlaceholderVariantInput
} from "../../styles/placeholder.styles";

@Component({
    selector: "mona-placeholder",
    templateUrl: "./placeholder.component.html",
    host: {
        "[class]": "baseClass()"
    }
})
export class PlaceholderComponent implements PlaceholderVariantInput {
    protected readonly baseClass = computed(() => {
        const variantClass = placeholderBaseThemeVariants();
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly textClass = computed(() => {
        return placeholderTextThemeVariants();
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
