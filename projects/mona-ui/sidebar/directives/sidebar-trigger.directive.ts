import { Directive, inject } from "@angular/core";
import { SidebarService } from "../services/sidebar.service";

/**
 * @description
 * Toggles the sidebar of the surrounding `mona-sidebar-layout`. Can be placed anywhere inside the
 * layout, including in the inset, and adds no styling of its own.
 */
@Directive({
    selector: "[monaSidebarTrigger]",
    exportAs: "monaSidebarTrigger",
    host: {
        "[attr.aria-controls]": "sidebarId",
        "[attr.aria-expanded]": "expanded()",
        "(click)": "onClick()"
    }
})
export class SidebarTriggerDirective {
    readonly #sidebarService = inject(SidebarService);
    protected readonly expanded = this.#sidebarService.expanded;
    protected readonly sidebarId = this.#sidebarService.sidebarId;

    protected onClick(): void {
        this.#sidebarService.toggle();
    }
}
