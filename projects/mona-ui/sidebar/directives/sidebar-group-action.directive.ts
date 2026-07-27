import { computed, Directive, inject } from "@angular/core";
import { SidebarService } from "../services/sidebar.service";
import { sidebarGroupActionClasses } from "../styles/sidebar.styles";

@Directive({
    selector: "button[monaSidebarGroupAction]",
    host: {
        // Consumers commonly add `monaButton` to this element, which owns the `[class]` binding.
        // A data attribute lets the static sidebar recipe respond without competing with it.
        // Faded rather than removed: the header around it closes by height over the same interval, so
        // dropping it outright would empty the row before it had finished shrinking. `visibility`
        // transitions discretely, flipping only once the fade is done, and takes it out of tab order.
        "[attr.data-hidden]": "hidden() ? 'true' : null",
        class: sidebarGroupActionClasses
    }
})
export class SidebarGroupActionDirective {
    readonly #sidebarService = inject(SidebarService, { optional: true });

    // The group header it belongs to has no room on the rail.
    protected readonly hidden = computed(() => this.#sidebarService?.iconOnly() ?? false);
}
