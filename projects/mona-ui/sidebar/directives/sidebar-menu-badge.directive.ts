import { computed, Directive, inject, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { SidebarService } from "../services/sidebar.service";
import { sidebarMenuBadgeThemeVariants } from "../styles/sidebar.styles";

/**
 * @description
 * A trailing count or status badge on a menu item. Stands down on the icon rail, where it would
 * crowd out the icon it belongs to.
 */
@Directive({
    selector: "[monaSidebarMenuBadge]",
    host: {
        "[class]": "baseClass()",
        "[style.display]": "hidden() ? 'none' : null"
    }
})
export class SidebarMenuBadgeDirective {
    readonly #sidebarService = inject(SidebarService, { optional: true });
    protected readonly baseClass = computed(() => twMerge(sidebarMenuBadgeThemeVariants(), this.userClass()));
    protected readonly hidden = computed(() => this.#sidebarService?.iconOnly() ?? false);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
