import { computed, Directive, inject, input } from "@angular/core";
import { CollapsibleToken } from "@nanahoshi/mona-ui/collapsible";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { sidebarMenuItemThemeVariants } from "../styles/sidebar.styles";

@Directive({
    selector: "li[monaSidebarMenuItem]",
    host: {
        "[class]": "baseClass()"
    }
})
export class SidebarMenuItemDirective {
    // Applying `monaCollapsible` to the same element turns the item into a disclosure row, so it has to
    // stack its trigger and submenu instead of laying them out side by side.
    readonly #collapsible = inject(CollapsibleToken, { optional: true, self: true });
    protected readonly baseClass = computed(() => {
        const variantClass = sidebarMenuItemThemeVariants({ collapsible: this.#collapsible !== null });
        return twMerge(variantClass, this.userClass());
    });

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
