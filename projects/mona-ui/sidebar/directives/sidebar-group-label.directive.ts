import { computed, Directive, inject } from "@angular/core";
import { SidebarService } from "../services/sidebar.service";
import { sidebarGroupLabelThemeVariants } from "../styles/sidebar.styles";

@Directive({
    selector: "[monaSidebarGroupLabel]",
    host: {
        "[class]": "baseClass()"
    }
})
export class SidebarGroupLabelDirective {
    readonly #sidebarService = inject(SidebarService, { optional: true });

    // Faded rather than removed from the layout: the header around it closes by height over the same
    // interval, so dropping the label outright would empty the row before it had finished shrinking.
    // `visibility` follows the fade so it leaves the accessibility tree with it.
    protected readonly baseClass = computed(() =>
        sidebarGroupLabelThemeVariants({ hidden: this.#sidebarService?.iconOnly() ?? false })
    );
}
