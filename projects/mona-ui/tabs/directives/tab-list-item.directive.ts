import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { TABS_STYLE_STRATEGY } from "../styles/tabs.style-provider";
import { TabListListItemVariantInput, TabListListItemVariantProps } from "../styles/tabs.styles";

@Directive({
    selector: "li[monaTabListItem]",
    host: {
        "[class]": "listItemClass()"
    }
})
export class TabListItemDirective implements TabListListItemVariantInput {
    readonly #styleStrategy = inject(TABS_STYLE_STRATEGY);
    readonly #themeService = inject(ThemeService);
    protected readonly listItemClass = computed(() => {
        const theme = this.#themeService.theme();
        const active = this.active();
        const disabled = this.disabled();
        const rounded = this.rounded();
        return this.#styleStrategy.resolve(theme).listItem({ active, disabled, rounded });
    });
    public readonly active = input.required<boolean>();
    public readonly disabled = input.required<boolean>();
    public readonly rounded = input.required<TabListListItemVariantProps["rounded"]>();
}
