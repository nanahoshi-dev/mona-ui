import { Component, computed, inject } from "@angular/core";
import { commandStatusThemeVariants } from "../../styles/command.styles";
import { CommandComponent } from "../command/command.component";

/** Shows while a query has no results. Its content replaces the default message. */
@Component({
    selector: "mona-command-empty",
    templateUrl: "./command-empty.component.html",
    host: {
        class: "contents"
    }
})
export class CommandEmptyComponent {
    protected readonly root = inject(CommandComponent);
    protected readonly statusClass = computed(() => commandStatusThemeVariants());
}
