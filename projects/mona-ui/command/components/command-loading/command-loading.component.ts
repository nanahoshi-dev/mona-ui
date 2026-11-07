import { Component, computed, inject } from "@angular/core";
import { commandStatusThemeVariants } from "../../styles/command.styles";
import { CommandComponent } from "../command/command.component";

/** Shows while the `mona-command` is `loading`. Its content replaces the default message. */
@Component({
    selector: "mona-command-loading",
    templateUrl: "./command-loading.component.html",
    host: {
        class: "contents"
    }
})
export class CommandLoadingComponent {
    protected readonly root = inject(CommandComponent);
    protected readonly statusClass = computed(() => commandStatusThemeVariants());
}
