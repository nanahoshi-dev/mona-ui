import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    CollapsibleContentDirective,
    CollapsibleDirective,
    CollapsibleTriggerDirective
} from "@nanahoshi/mona-ui/collapsible";

@Component({
    selector: "app-collapsible-programmatic-example",
    imports: [ButtonDirective, CollapsibleContentDirective, CollapsibleDirective, CollapsibleTriggerDirective],
    templateUrl: "./programmatic-example.component.html"
})
export class CollapsibleProgrammaticExampleComponent {
    protected readonly locked = signal(false);
}
