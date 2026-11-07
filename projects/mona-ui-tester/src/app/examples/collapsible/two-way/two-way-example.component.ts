import { Component, signal } from "@angular/core";
import { LucideChevronDown } from "@lucide/angular";
import {
    CollapsibleContentDirective,
    CollapsibleDirective,
    CollapsibleTriggerDirective
} from "@nanahoshi/mona-ui/collapsible";

@Component({
    selector: "app-collapsible-two-way-example",
    imports: [CollapsibleContentDirective, CollapsibleDirective, CollapsibleTriggerDirective, LucideChevronDown],
    templateUrl: "./two-way-example.component.html"
})
export class CollapsibleTwoWayExampleComponent {
    protected readonly expanded = signal(false);
}
