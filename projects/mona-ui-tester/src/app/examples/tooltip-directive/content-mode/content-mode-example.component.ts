import { Component } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { TooltipDirective } from "@nanahoshi/mona-ui/tooltip";

@Component({
    selector: "app-tooltip-directive-content-mode-example",
    imports: [ButtonDirective, TooltipDirective],
    templateUrl: "./content-mode-example.component.html"
})
export class TooltipDirectiveContentModeExampleComponent {
    protected readonly actions = [
        { description: "Upload your changes to the server", id: "save", label: "Save" },
        { description: "Go back to the last saved version", id: "revert", label: "Revert" },
        { description: "Send a link to this document", id: "share", label: "Share" }
    ];
}
