import { computed, Directive, inject } from "@angular/core";
import { TextBoxDirective } from "@nanahoshi/mona-ui/text-box";
import { SidebarService } from "../services/sidebar.service";

/**
 * @description
 * A text input sized for the sidebar, composing `monaTextBox`. Stands down on the icon rail,
 * where there is no room to type.
 */
@Directive({
    selector: "input[monaSidebarInput]",
    hostDirectives: [TextBoxDirective],
    host: {
        // `TextBoxDirective` owns the `[class]` binding on this element, so visibility is driven
        // through a style binding rather than a competing class binding.
        "[style.display]": "hidden() ? 'none' : null",
        class: "w-full h-8"
    }
})
export class SidebarInputDirective {
    readonly #sidebarService = inject(SidebarService, { optional: true });
    protected readonly hidden = computed(() => this.#sidebarService?.iconOnly() ?? false);
}
