import { computed, Directive, inject } from "@angular/core";
import { SidebarService } from "../services/sidebar.service";
import { sidebarGroupHeaderThemeVariants } from "../styles/sidebar.styles";

/**
 * @description
 * The row above a group's content, holding its label and any group action. Collapses to nothing on
 * the icon rail rather than leaving an empty gap where the label used to be.
 */
@Directive({
    selector: "[monaSidebarGroupHeader]",
    host: {
        "[class]": "baseClass()"
    }
})
export class SidebarGroupHeaderDirective {
    readonly #sidebarService = inject(SidebarService, { optional: true });
    protected readonly baseClass = computed(() =>
        sidebarGroupHeaderThemeVariants({ iconOnly: this.#sidebarService?.iconOnly() ?? false })
    );
}
