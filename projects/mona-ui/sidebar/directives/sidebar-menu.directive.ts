import { computed, Directive, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { sidebarMenuThemeVariants } from "../styles/sidebar.styles";

@Directive({
    selector: "ul[monaSidebarMenu]",
    host: {
        "[class]": "baseClass()"
    }
})
export class SidebarMenuDirective {
    protected readonly baseClass = computed(() => twMerge(sidebarMenuThemeVariants(), this.userClass()));

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
