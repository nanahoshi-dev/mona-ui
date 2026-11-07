import { computed, Directive, input } from "@angular/core";
import { twMerge } from "tailwind-merge";
import type { BreadcrumbListItemVariantInput } from "../styles/breadcrumb.styles";
import { breadcrumbListItemThemeVariants } from "../styles/breadcrumb.styles";

@Directive({
    selector: "button[monaBreadcrumbItem]",
    host: {
        "[class]": "baseClass()",
        "[disabled]": "disabled()"
    }
})
export class BreadcrumbItemDirective implements BreadcrumbListItemVariantInput {
    protected readonly baseClass = computed(() => {
        const disabled = this.disabled();
        const userClass = this.userClass();
        return twMerge(breadcrumbListItemThemeVariants({ disabled }), userClass);
    });
    /**
     * @description Renders this item with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false);
    /**
     * @description Additional CSS classes merged onto the breadcrumb item via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });
}
