import { computed, Directive, inject, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { SidebarLayoutService } from "../services/sidebar-layout.service";
import { sidebarInsetThemeVariants } from "../styles/sidebar.styles";

/**
 * @description
 * Marks the main region beside the sidebar. Fills the remaining width and scrolls independently.
 * Takes on the raised surface when the sidebar uses the `inset` variant.
 *
 * It sits beside the sidebars rather than inside one, so it answers to the layout as a whole: it steps
 * out of the way for whichever drawer is open, and where a layout holds more than one sidebar it takes
 * its surface from the first one in author order.
 */
@Directive({
    selector: "[monaSidebarInset]",
    host: {
        "[class]": "baseClass()",
        // The drawer is modal, so everything behind it leaves the tab order and the accessibility
        // tree. `inert` covers both, and unlike `aria-hidden` it also stops pointer interaction.
        "[attr.inert]": "behindDrawer() ? '' : null"
        // The scoped equivalent of locking body scroll. The layout already clips its own overflow, so
        // this region is the only thing behind the drawer that scrolls; suppressing it here avoids
        // reaching out to mutate `document.body`, which a library has no business owning.
    }
})
export class SidebarInsetDirective {
    readonly #layoutService = inject(SidebarLayoutService, { optional: true });
    protected readonly baseClass = computed(() => {
        const variantClass = sidebarInsetThemeVariants({
            behindDrawer: this.behindDrawer(),
            variant: this.#layoutService?.primaryVariant() ?? "sidebar"
        });
        return twMerge(variantClass, this.userClass());
    });
    protected readonly behindDrawer = computed(() => this.#layoutService?.anyMobileOpen() ?? false);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
