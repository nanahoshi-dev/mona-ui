import { Component, computed, input, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import {
    sidebarLayoutBaseThemeVariants,
    sidebarLayoutContentThemeVariants,
    sidebarThemeVariants
} from "../../styles/sidebar.styles";

@Component({
    selector: "mona-sidebar-layout",
    templateUrl: "./sidebar-layout.component.html",
    imports: [ButtonDirective],
    host: {
        "[class]": "baseClass()"
    }
})
export class SidebarLayoutComponent {
    protected readonly baseClass = computed(() => {
        const variantClass = sidebarLayoutBaseThemeVariants();
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly sidebarClass = sidebarThemeVariants();
    protected readonly sidebarContentClass = sidebarLayoutContentThemeVariants();
    protected readonly sidebarExpanded = signal(true);
    protected readonly sidebarWidthString = computed(() => {
        const expanded = this.sidebarExpanded();
        const width = this.sidebarWidth();
        const widthStr = typeof width === "number" ? `${width}px` : width;
        return expanded ? widthStr : "0";
    });
    public readonly sidebarWidth = input<string | number>();
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });

    protected collapse(): void {
        this.sidebarExpanded.set(false);
    }

    protected expand(): void {
        this.sidebarExpanded.set(true);
    }

    protected onSidebarToggle(): void {
        this.sidebarExpanded.set(!this.sidebarExpanded());
    }
}
