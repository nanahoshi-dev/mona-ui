import { computed, Directive, effect, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { SidebarService } from "../services/sidebar.service";
import { sidebarMenuActionClasses } from "../styles/sidebar.styles";

@Directive({
    selector: "button[monaSidebarMenuAction]",
    hostDirectives: [ButtonDirective],
    host: {
        "[attr.data-hidden]": "hidden() ? 'true' : null",
        "[class]": "baseClass"
    }
})
export class SidebarMenuActionDirective {
    readonly #button = inject(ButtonDirective);
    readonly #sidebarService = inject(SidebarService, { optional: true });
    protected readonly baseClass = sidebarMenuActionClasses();
    // A trailing action would crowd out the icon it belongs to on the rail.
    protected readonly hidden = computed(() => this.#sidebarService?.iconOnly() ?? false);

    public constructor() {
        effect(() => this.#button.look.set("ghost"));
    }
}
