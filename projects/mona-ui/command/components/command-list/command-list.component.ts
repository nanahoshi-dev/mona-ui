import { Component, computed, inject, input } from "@angular/core";
import { commandListThemeVariants } from "../../styles/command.styles";
import { CommandComponent } from "../command/command.component";

/**
 * Holds the items of a `mona-command`, and scrolls them. The empty and loading states sit outside the listbox, which
 * may only contain options and groups.
 */
@Component({
    selector: "mona-command-list",
    templateUrl: "./command-list.component.html",
    host: {
        class: "flex min-h-0 flex-1 flex-col"
    }
})
export class CommandListComponent {
    protected readonly listClass = computed(() => commandListThemeVariants());
    protected readonly root = inject(CommandComponent);

    /** @description The accessible name of the list. */
    public readonly ariaLabel = input<string>();
}
