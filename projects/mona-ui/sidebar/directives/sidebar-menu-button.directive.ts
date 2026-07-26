import { computed, Directive, effect, inject, input } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { SidebarService } from "../services/sidebar.service";

@Directive({
    selector: "button[monaSidebarMenuButton]",
    hostDirectives: [ButtonDirective],
    host: {
        "[attr.title]": "railTitle()",
        class: "flex w-full h-full justify-start px-1! py-1 font-normal rounded-md hover:bg-accent"
    }
})
export class SidebarMenuButtonDirective {
    readonly #button = inject(ButtonDirective);
    readonly #sidebarService = inject(SidebarService, { optional: true });

    // The label is clipped away on the rail, so the icon needs something to identify it. Only set
    // there, so the title never duplicates a label that is already legible.
    protected readonly railTitle = computed(() => {
        const tooltip = this.tooltip();
        return tooltip && this.#sidebarService?.iconOnly() ? tooltip : null;
    });

    /**
     * @description Text identifying this item while the sidebar is collapsed to its icon rail, where the
     * label is clipped away. Applied as the host's `title`, which the browser surfaces on hover.
     * @default ""
     */
    public readonly tooltip = input("");

    public constructor() {
        effect(() => {
            this.#button.look.set("clear");
        });
    }
}
