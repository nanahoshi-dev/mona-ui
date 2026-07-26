import { computed, Directive, effect, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { SidebarService } from "../services/sidebar.service";

@Directive({
    selector: "button[monaSidebarMenuAction]",
    hostDirectives: [ButtonDirective],
    host: {
        // `ButtonDirective` owns the `[class]` binding on this element, so visibility is driven
        // through a style binding rather than a competing class binding.
        "[style.display]": "hidden() ? 'none' : null",
        class: "w-auto h-auto p-1! hover:bg-accent!"
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
