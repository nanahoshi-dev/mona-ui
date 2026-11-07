import { Component, computed } from "@angular/core";
import { commandHeaderThemeVariants } from "../../styles/command.styles";

/** A strip above or below the input, for filters or a title. */
@Component({
    selector: "mona-command-header",
    template: "<ng-content />",
    host: {
        "[class]": "hostClass()"
    }
})
export class CommandHeaderComponent {
    protected readonly hostClass = computed(() => commandHeaderThemeVariants());
}
