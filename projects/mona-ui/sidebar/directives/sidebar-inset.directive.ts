import { computed, Directive, inject, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { SidebarService } from "../services/sidebar.service";
import { sidebarInsetThemeVariants } from "../styles/sidebar.styles";

/**
 * @description
 * Marks the main region beside the sidebar. Fills the remaining width and scrolls independently.
 * Takes on the raised surface when the sidebar uses the `inset` variant.
 */
@Directive({
    selector: "[monaSidebarInset]",
    host: {
        "[class]": "baseClass()",
        // The drawer is modal, so everything behind it leaves the tab order and the accessibility
        // tree. `inert` covers both, and unlike `aria-hidden` it also stops pointer interaction.
        "[attr.inert]": "behindDrawer() ? '' : null",
        // The scoped equivalent of locking body scroll. The layout already clips its own overflow, so
        // this region is the only thing behind the drawer that scrolls; suppressing it here avoids
        // reaching out to mutate `document.body`, which a library has no business owning.
        "[style.overflow]": "behindDrawer() ? 'hidden' : null"
    }
})
export class SidebarInsetDirective {
    readonly #sidebarService = inject(SidebarService, { optional: true });
    protected readonly baseClass = computed(() => {
        const variantClass = sidebarInsetThemeVariants({ variant: this.#sidebarService?.variant() ?? "sidebar" });
        return twMerge(variantClass, this.userClass());
    });
    protected readonly behindDrawer = computed(() => this.#sidebarService?.mobileOpen() ?? false);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
