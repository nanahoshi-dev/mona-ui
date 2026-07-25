import { computed, Directive, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";

@Directive({
    selector: "[monaSidebarFooter]",
    host: {
        "[class]": "classes()"
    }
})
export class SidebarFooterDirective {
    public readonly classes = computed(() => {
        return twMerge(`p-2 shrink-0`, this.userClass());
    });
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
