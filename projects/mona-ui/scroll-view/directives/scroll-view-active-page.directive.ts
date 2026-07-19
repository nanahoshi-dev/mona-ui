import { computed, Directive, inject, input } from "@angular/core";
import { scrollViewPagerListItemThemeVariants, type ScrollViewVariantProps } from "../styles/scroll-view.styles";

@Directive({
    selector: "button[monaScrollViewActivePage]",
    host: {
        "[class]": "pageItemClass()"
    }
})
export class ScrollViewActivePageDirective {
    protected readonly pageItemClass = computed(() => {
        const active = this.active();
        const pagerRounded = this.rounded();
        return scrollViewPagerListItemThemeVariants({ active, pagerRounded });
    });
    public readonly active = input.required<boolean>();
    public readonly rounded = input.required<ScrollViewVariantProps["pagerRounded"]>();
}
