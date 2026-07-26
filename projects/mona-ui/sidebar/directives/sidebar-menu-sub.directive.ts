import { computed, Directive, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { sidebarMenuSubThemeVariants } from "../styles/sidebar.styles";

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
