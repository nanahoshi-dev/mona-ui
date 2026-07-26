import { computed, Directive, inject } from "@angular/core";
import { SidebarService } from "../services/sidebar.service";

@Directive({
    selector: "[monaSidebarContent]",
    host: {
        "[class]": "baseClass()"
    }
})
export class SidebarContentDirective {
    readonly #sidebarService = inject(SidebarService, { optional: true });

    /**
     * A scrollbar takes its width out of the content box, and the icon rail has none to give: at a
     * `3rem` rail it claims about a third of it and squeezes every icon in the region. There is nothing
     * to read on the rail anyway — the labels are gone — so the overflow is simply clipped there.
     */
    protected readonly baseClass = computed(() =>
        this.#sidebarService?.iconOnly()
            ? "flex-1 overflow-hidden"
            : "flex-1 overflow-x-hidden overflow-y-auto"
    );
}
