import { computed, Directive, inject, input } from "@angular/core";
import { twMerge } from "tailwind-merge";
import { ThemeService } from "../../../theme/services/theme.service";
import { breadcrumbListItemThemeVariants, BreadcrumbListItemVariantInput } from "../styles/breadcrumb.styles";

@Directive({
    selector: "span[monaBreadcrumbItem]",
    host: {
        "[class]": "baseClass()",
        "[attr.aria-disabled]": "disabled() ? 'true' : null"
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
    public readonly disabled = input(false);
    public readonly listDisabled = input(false);
    public readonly userClass = input<string>("", { alias: "class" });
}
