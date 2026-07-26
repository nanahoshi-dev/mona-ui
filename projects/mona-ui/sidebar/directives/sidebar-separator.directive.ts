import { computed, Directive, inject, input } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { SidebarService } from "../services/sidebar.service";
import { sidebarSeparatorThemeVariants } from "../styles/sidebar.styles";

/**
 * @description
 * A horizontal rule between sidebar regions. Tightens its inset on the icon rail.
 */
@Directive({
    selector: "[monaSidebarSeparator]",
    host: {
        "[class]": "baseClass()"
    }
})
export class SidebarSeparatorDirective {
    readonly #sidebarService = inject(SidebarService, { optional: true });
    protected readonly baseClass = computed(() => {
        const variantClass = sidebarSeparatorThemeVariants({
            iconOnly: this.#sidebarService?.iconOnly() ?? false
        });
        return twMerge(variantClass, this.userClass());
    });

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });
}
