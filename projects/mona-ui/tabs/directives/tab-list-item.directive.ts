import { computed, Directive, inject, input } from "@angular/core";
import { RippleDirective } from "@nanahoshi/mona-ui/ripple";
import type { TabListListItemVariantInput, TabListListItemVariantProps } from "../styles/tabs.styles";
import { tabListListItemThemeVariants } from "../styles/tabs.styles";

@Directive({
    selector: "li[monaTabListItem]",
    host: {
        "[class]": "listItemClass()"
    },
    // The item, rather than the tab inside it, is what shows the hover and the selection, so it ripples.
    hostDirectives: [RippleDirective]
})
export class TabListItemDirective implements TabListListItemVariantInput {
    protected readonly listItemClass = computed(() => {
        const active = this.active();
        const disabled = this.disabled();
        const look = this.look();
        const position = this.position();
        const size = this.size();
        return tabListListItemThemeVariants({ active, disabled, look, position, size });
    });
    public readonly active = input.required<boolean>();
    public readonly disabled = input.required<boolean>();
    public readonly look = input<TabListListItemVariantProps["look"]>("line");
    public readonly position = input.required<TabListListItemVariantProps["position"]>();
    public readonly size = input.required<TabListListItemVariantProps["size"]>();

    public constructor() {
        inject(RippleDirective, { self: true }).setHostDisabled(this.disabled);
    }
}
