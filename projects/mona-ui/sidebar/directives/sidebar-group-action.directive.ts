import { computed, Directive, inject } from "@angular/core";
import { SidebarService } from "../services/sidebar.service";

@Directive({
    selector: "button[monaSidebarGroupAction]",
    host: {
        // Consumers commonly add `monaButton` to this element, which owns the `[class]` binding,
        // so visibility is driven through style bindings rather than a competing class binding.
        // Faded rather than removed: the header around it closes by height over the same interval, so
        // dropping it outright would empty the row before it had finished shrinking. `visibility`
        // transitions discretely, flipping only once the fade is done, and takes it out of tab order.
        "[style.opacity]": "hidden() ? '0' : '1'",
        "[style.transition]":
            "'opacity var(--mona-motion-standard) ease-out, visibility var(--mona-motion-standard) ease-out'",
        "[style.visibility]": "hidden() ? 'hidden' : null",
        class: "p-1 w-auto h-auto"
    }
})
export class SidebarGroupActionDirective {
    readonly #sidebarService = inject(SidebarService, { optional: true });

    // The group header it belongs to has no room on the rail.
    protected readonly hidden = computed(() => this.#sidebarService?.iconOnly() ?? false);
}
