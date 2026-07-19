import { computed, Directive, inject, input } from "@angular/core";
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
    protected readonly listItemClass = computed(() => {
        const active = this.active();
        const disabled = this.disabled();
        const rounded = this.rounded();
        return tabListListItemThemeVariants({ active, disabled, rounded });
    });
    public readonly active = input.required<boolean>();
    public readonly disabled = input.required<boolean>();
    public readonly rounded = input.required<TabListListItemVariantProps["rounded"]>();
}
