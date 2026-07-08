import { computed, Directive, inject, input } from "@angular/core";
import { twMerge } from "tailwind-merge";
import { ThemeService } from "@mirei/mona-ui/theme";
import { breadcrumbListItemThemeVariants, BreadcrumbListItemVariantInput } from "../styles/breadcrumb.styles";

@Directive({
    selector: "button[monaBreadcrumbItem]",
    host: {
        "[class]": "baseClass()",
        "[disabled]": "disabled()"
    }
})
export class BreadcrumbItemDirective implements BreadcrumbListItemVariantInput {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const disabled = this.disabled();
        const listDisabled = this.listDisabled();
        const userClass = this.userClass();
        return twMerge(breadcrumbListItemThemeVariants(theme)({ disabled, listDisabled }), userClass);
    });
    /**
     * @description Renders this item with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false);
    /**
     * @description Reflects whether the parent breadcrumb is disabled. Controls compound disabled styling when only individual items are disabled.
     * @default false
     */
    public readonly listDisabled = input(false);
    /**
     * @description Additional CSS classes merged onto the breadcrumb item via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });
}
