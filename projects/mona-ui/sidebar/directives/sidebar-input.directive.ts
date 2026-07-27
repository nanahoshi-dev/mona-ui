import { computed, Directive, inject } from "@angular/core";
import { TextBoxDirective } from "@nanahoshi/mona-ui/text-box";
import { SidebarService } from "../services/sidebar.service";
import { sidebarInputClasses } from "../styles/sidebar.styles";

/**
 * @description
 * A text input sized for the sidebar, composing `monaTextBox`. Stands down on the icon rail,
 * where there is no room to type.
 */
@Directive({
    selector: "input[monaSidebarInput]",
    hostDirectives: [TextBoxDirective],
    host: {
        // `TextBoxDirective` owns `[class]`, so a data attribute drives the static sidebar recipe.
        "[attr.data-hidden]": "hidden() ? 'true' : null",
        "[class]": "baseClass"
    }
})
export class SidebarInputDirective {
    readonly #sidebarService = inject(SidebarService, { optional: true });
    protected readonly baseClass = sidebarInputClasses();
    protected readonly hidden = computed(() => this.#sidebarService?.iconOnly() ?? false);
}
