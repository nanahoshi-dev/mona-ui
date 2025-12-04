import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "../../../theme/services/theme.service";
import {
    tabListListItemThemeVariants,
    TabListListItemVariantInput,
    TabListListItemVariantProps
} from "../styles/tabs.styles";

@Directive({
    selector: "li[monaTabListItem]",
    host: {
        "[class]": "listItemClass()"
    }
})
export class TabListItemDirective implements TabListListItemVariantInput {
    readonly #themeService = inject(ThemeService);
    protected readonly listItemClass = computed(() => {
        const theme = this.#themeService.theme();
        const active = this.active();
        const disabled = this.disabled();
        const rounded = this.rounded();
        return tabListListItemThemeVariants(theme)({ active, disabled, rounded });
    });
    public readonly active = input.required<boolean>();
    public readonly disabled = input.required<boolean>();
    public readonly rounded = input.required<TabListListItemVariantProps["rounded"]>();
}
