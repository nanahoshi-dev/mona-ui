import { computed, Directive, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { sidebarHeaderThemeVariants } from "../styles/sidebar.styles";

@Directive({
    selector: "[monaSidebarHeader]",
    host: {
        "[class]": "classes()"
    }
})
export class SidebarHeaderDirective {
    public readonly classes = computed(() => {
        return twMerge(sidebarHeaderThemeVariants(), this.userClass());
    });
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
