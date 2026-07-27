import { computed, Directive, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { sidebarHeaderThemeVariants } from "../styles/sidebar.styles";

/**
 * @description
 * The region at the top of the sidebar, above its content. Holds what stays put while the content
 * scrolls — a workspace switcher, a search box.
 */
@Directive({
    selector: "[monaSidebarHeader]",
    host: {
        "[class]": "baseClass()"
    }
})
export class SidebarHeaderDirective {
    protected readonly baseClass = computed(() => twMerge(sidebarHeaderThemeVariants(), this.userClass()));

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
