import { computed, Directive, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { sidebarMenuSubThemeVariants } from "../styles/sidebar.styles";

/**
 * @description
 * An indented submenu inside a `monaSidebarMenuItem` that is also a `monaCollapsible`.
 *
 * It carries no hiding of its own on the icon rail. `SidebarMenuItemDirective` closes the disclosure
 * there instead, which leaves the trigger's `aria-expanded` truthful and lets the collapsible content
 * directive apply its own `inert`. Hiding it here as well used to produce the opposite: a submenu the
 * trigger still described as expanded, with focusable items, that nobody could see.
 */
@Directive({
    selector: "ul[monaSidebarMenuSub]",
    host: {
        "[class]": "baseClass()"
    }
})
export class SidebarMenuSubDirective {
    protected readonly baseClass = computed(() => twMerge(sidebarMenuSubThemeVariants(), this.userClass()));

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
