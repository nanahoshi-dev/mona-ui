import { computed, Directive, inject } from "@angular/core";
import { SidebarService } from "../services/sidebar.service";
import { sidebarMenuThemeVariants } from "../styles/sidebar.styles";

@Directive({
    selector: "ul[monaSidebarMenu]",
    host: {
        "[class]": "baseClass()"
    }
})
export class SidebarMenuDirective {
    readonly #sidebarService = inject(SidebarService, { optional: true });
    protected readonly baseClass = computed(() =>
        sidebarMenuThemeVariants({ iconOnly: this.#sidebarService?.iconOnly() ?? false })
    );
}
