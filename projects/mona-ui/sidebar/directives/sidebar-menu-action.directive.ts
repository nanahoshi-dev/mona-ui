import { computed, Directive, effect, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { SidebarService } from "../services/sidebar.service";

@Directive({
    selector: "button[monaSidebarMenuAction]",
    hostDirectives: [ButtonDirective],
    host: {
        "[style.display]": "hidden() ? 'none' : null",
        "[style.padding]": "'0.25rem'",
        class: "w-auto h-auto hover:bg-sidebar-accent!"
    }
})
export class SidebarMenuActionDirective {
    readonly #button = inject(ButtonDirective);
    readonly #sidebarService = inject(SidebarService, { optional: true });

    // A trailing action would crowd out the icon it belongs to on the rail.
    protected readonly hidden = computed(() => this.#sidebarService?.iconOnly() ?? false);

    public constructor() {
        effect(() => {
            this.#button.look.set("ghost");
        });
    }
}
