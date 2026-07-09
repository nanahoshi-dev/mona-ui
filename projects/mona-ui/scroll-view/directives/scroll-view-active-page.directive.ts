import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { scrollViewPagerListItemThemeVariants, type ScrollViewVariantProps } from "../styles/scroll-view.styles";

@Directive({
    selector: "button[monaScrollViewActivePage]",
    host: {
        "[class]": "pageItemClass()"
    }
})
export class ScrollViewActivePageDirective {
    readonly #themeService = inject(ThemeService);
    protected readonly pageItemClass = computed(() => {
        const theme = this.#themeService.theme();
        const active = this.active();
        const pagerRounded = this.rounded();
        return scrollViewPagerListItemThemeVariants(theme)({ active, pagerRounded });
    });
    public readonly active = input.required<boolean>();
    public readonly rounded = input.required<ScrollViewVariantProps["pagerRounded"]>();
}
