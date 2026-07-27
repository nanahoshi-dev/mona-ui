import { computed, Directive, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { sidebarFooterThemeVariants } from "../styles/sidebar.styles";

@Directive({
    selector: "[monaSidebarFooter]",
    host: {
        "[class]": "classes()"
    }
})
export class SidebarFooterDirective {
    public readonly classes = computed(() => {
        return twMerge(sidebarFooterThemeVariants(), this.userClass());
    });
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
