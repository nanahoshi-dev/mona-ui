import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "../../../theme/services/theme.service";
import { breadcrumbListItemThemeVariants, BreadcrumbListItemVariantInput } from "../styles/breadcrumb.styles";

@Directive({
    selector: "li[monaBreadcrumbItem]",
    host: {
        "[class]": "baseClass()"
    }
})
export class BreadcrumbItemDirective implements BreadcrumbListItemVariantInput {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const disabled = this.disabled();
        return breadcrumbListItemThemeVariants(theme)({ disabled });
    });
    public readonly disabled = input(false);
}
