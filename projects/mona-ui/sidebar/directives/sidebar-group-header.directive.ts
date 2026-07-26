import { computed, Directive, inject } from "@angular/core";
import { SidebarService } from "../services/sidebar.service";
import { sidebarGroupHeaderThemeVariants } from "../styles/sidebar.styles";

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
