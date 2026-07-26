import { computed, Directive, inject } from "@angular/core";
import { SidebarService } from "../services/sidebar.service";
import { sidebarRailThemeVariants } from "../styles/sidebar.styles";

/**
 * @description
 * A thin strip along the sidebar's inner edge that toggles it. Place it inside `mona-sidebar`,
 * which positions it. Hidden on narrow viewports, where the edge is too easy to hit by accident.
 */
@Directive({
    selector: "button[monaSidebarRail]",
    host: {
        "[attr.aria-controls]": "sidebarId",
        "[attr.aria-expanded]": "expanded()",
        "[attr.tabindex]": "-1",
        "[class]": "baseClass()",
        "(click)": "onClick()"
    }
})
export class SidebarRailDirective {
    readonly #sidebarService = inject(SidebarService);
    protected readonly baseClass = computed(() => sidebarRailThemeVariants({ side: this.#sidebarService.side() }));
    protected readonly expanded = this.#sidebarService.expanded;
    protected readonly sidebarId = this.#sidebarService.sidebarId;

    protected onClick(): void {
        this.#sidebarService.toggle();
    }
}
