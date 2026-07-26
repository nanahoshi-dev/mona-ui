import { computed, Directive, inject } from "@angular/core";
import { SidebarService } from "../services/sidebar.service";
import { sidebarGroupLabelThemeVariants } from "../styles/sidebar.styles";

@Directive({
    selector: "[monaSidebarGroupLabel]",
    host: {
        "[class]": "baseClass",
        // Faded rather than removed from the layout: the header around it closes by height over the
        // same interval, so dropping the label outright would empty the row before it had finished
        // shrinking. `visibility` follows the fade so it leaves the accessibility tree with it.
        "[style.opacity]": "hidden() ? '0' : '1'",
        "[style.visibility]": "hidden() ? 'hidden' : null"
    }
})
export class SidebarGroupLabelDirective {
    readonly #sidebarService = inject(SidebarService, { optional: true });
    protected readonly baseClass = sidebarGroupLabelThemeVariants();

    // A group label has no abbreviated form, so the rail simply drops it.
    protected readonly hidden = computed(() => this.#sidebarService?.iconOnly() ?? false);
}
