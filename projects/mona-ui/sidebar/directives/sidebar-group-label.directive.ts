import { computed, Directive, inject } from "@angular/core";
import { SidebarService } from "../services/sidebar.service";
import { sidebarGroupLabelThemeVariants } from "../styles/sidebar.styles";

@Directive({
    selector: "[monaSidebarGroupLabel]",
    host: {
        "[class]": "baseClass",
        "[style.display]": "hidden() ? 'none' : null"
    }
})
export class SidebarGroupLabelDirective {
    readonly #sidebarService = inject(SidebarService, { optional: true });
    protected readonly baseClass = sidebarGroupLabelThemeVariants();

    // A group label has no abbreviated form, so the rail simply drops it.
    protected readonly hidden = computed(() => this.#sidebarService?.iconOnly() ?? false);
}
