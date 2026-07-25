import { Directive, effect, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";

@Directive({
    selector: "button[monaSidebarMenuButton]",
    hostDirectives: [ButtonDirective],
    host: {
        class: "flex w-full h-full justify-start px-1! py-1 font-normal"
    }
})
export class SidebarMenuButtonDirective {
    readonly #button = inject(ButtonDirective);
    public constructor() {
        effect(() => {
            this.#button.look.set("clear");
        });
    }
}
