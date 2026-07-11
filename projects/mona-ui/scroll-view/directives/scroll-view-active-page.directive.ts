import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { SCROLL_VIEW_STYLE_STRATEGY, type ScrollViewVariantProps } from "../styles/scroll-view.styles";

@Directive({
    selector: "button[monaScrollViewActivePage]",
    host: {
        "[class]": "pageItemClass()"
    }
})
export class ScrollViewActivePageDirective {
    readonly #styleStrategy = inject(SCROLL_VIEW_STYLE_STRATEGY);
    readonly #themeService = inject(ThemeService);
    protected readonly pageItemClass = computed(() => {
        const theme = this.#themeService.theme();
        const active = this.active();
        const pagerRounded = this.rounded();
        return this.#styleStrategy.resolve(theme).pagerListItem({ active, pagerRounded });
    });
    public readonly active = input.required<boolean>();
    public readonly rounded = input.required<ScrollViewVariantProps["pagerRounded"]>();
}
