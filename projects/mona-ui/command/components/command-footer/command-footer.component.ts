import { Component, computed } from "@angular/core";
import { commandFooterThemeVariants } from "../../styles/command.styles";

/** A strip below the list, for key hints or links. */
@Component({
    selector: "mona-command-footer",
    template: "<ng-content />",
    host: {
        "[class]": "hostClass()"
    }
})
export class CommandFooterComponent {
    protected readonly hostClass = computed(() => commandFooterThemeVariants());
}
