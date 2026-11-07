import { Component, computed, inject } from "@angular/core";
import { commandSeparatorThemeVariants } from "../../styles/command.styles";
import { CommandComponent } from "../command/command.component";

/**
 * A line between items. It's only visual, because a listbox can't contain a separator role. It hides while the
 * component filters, when it would divide nothing.
 */
@Component({
    selector: "mona-command-separator",
    template: "",
    host: {
        "aria-hidden": "true",
        "[class]": "hostClass()",
        "[class.hidden]": "hidden()"
    }
})
export class CommandSeparatorComponent {
    readonly #root = inject(CommandComponent);

    protected readonly hidden = computed(() => this.#root.filterMode() === "auto" && this.#root.query().trim() !== "");
    protected readonly hostClass = computed(() => commandSeparatorThemeVariants());
}
