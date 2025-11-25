import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "../../../theme/services/theme.service";
import { scrollViewPagerListItemThemeVariants, ScrollViewVariantProps } from "../styles/scroll-view.styles";

@Directive({
    selector: "li[monaScrollViewActivePage]",
    host: {
        "[class]": "pageItemClass()"
    }
})
export class ScrollViewActivePageDirective {
    readonly #themeService = inject(ThemeService);
    protected readonly pageItemClass = computed(() => {
        const theme = this.#themeService.theme();
        const active = this.active();
        const rounded = this.rounded();
        return scrollViewPagerListItemThemeVariants(theme)({ active, rounded });
    });
    public readonly active = input.required<boolean>();
    public readonly rounded = input.required<ScrollViewVariantProps["rounded"]>();
}
