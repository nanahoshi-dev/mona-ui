import { Directive, effect, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";

@Directive({
    selector: "button[monaSidebarMenuAction]",
    hostDirectives: [ButtonDirective],
    host: {
        class: "w-auto h-auto p-1! hover:bg-accent!"
    }
})
export class SidebarMenuActionDirective {
    readonly #button = inject(ButtonDirective);
    public constructor() {
        effect(() => {
            this.#button.look.set("ghost");
        });
    }
}
