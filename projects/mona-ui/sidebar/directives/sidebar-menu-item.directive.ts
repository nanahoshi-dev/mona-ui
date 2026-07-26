import { computed, Directive, inject, input } from "@angular/core";
import { CollapsibleToken } from "@nanahoshi/mona-ui/collapsible";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { SidebarService } from "../services/sidebar.service";
import { sidebarMenuItemThemeVariants } from "../styles/sidebar.styles";

@Directive({
    selector: "li[monaSidebarMenuItem]",
    host: {
        "[attr.data-active]": "active() ? 'true' : null",
        "[class]": "baseClass()"
    }
})
export class SidebarMenuItemDirective {
    // Applying `monaCollapsible` to the same element turns the item into a disclosure row, so it has to
    // stack its trigger and submenu instead of laying them out side by side.
    readonly #collapsible = inject(CollapsibleToken, { optional: true, self: true });
    readonly #sidebarService = inject(SidebarService, { optional: true });
    protected readonly baseClass = computed(() => {
        const variantClass = sidebarMenuItemThemeVariants({
            collapsible: this.#collapsible !== null,
            iconOnly: this.#sidebarService?.iconOnly() ?? false
        });
        return twMerge(variantClass, this.userClass());
    });

    /**
     * @description Marks this row as the current sidebar destination. The row owns the selected
     * surface so trailing badges and actions remain inside one continuous highlight.
     * @default false
     */
    public readonly active = input(false);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
