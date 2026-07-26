import { computed, Directive, inject } from "@angular/core";
import { SidebarService } from "../services/sidebar.service";

@Directive({
    selector: "button[monaSidebarGroupAction]",
    host: {
        // Consumers commonly add `monaButton` to this element, which owns the `[class]` binding,
        // so visibility is driven through a style binding rather than a competing class binding.
        "[style.display]": "hidden() ? 'none' : null",
        class: "p-1 w-auto h-auto"
    }
})
export class SidebarGroupActionDirective {
    readonly #sidebarService = inject(SidebarService, { optional: true });

    // The group header it belongs to has no room on the rail.
    protected readonly hidden = computed(() => this.#sidebarService?.iconOnly() ?? false);
}
