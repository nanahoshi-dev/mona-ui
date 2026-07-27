import { computed, Directive, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { sidebarFooterThemeVariants } from "../styles/sidebar.styles";

/**
 * @description
 * The region at the bottom of the sidebar, below its content. Holds what stays put while the content
 * scrolls — a profile menu, a sign-out.
 */
@Directive({
    selector: "[monaSidebarFooter]",
    host: {
        "[class]": "baseClass()"
    }
})
export class SidebarFooterDirective {
    protected readonly baseClass = computed(() => twMerge(sidebarFooterThemeVariants(), this.userClass()));

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
