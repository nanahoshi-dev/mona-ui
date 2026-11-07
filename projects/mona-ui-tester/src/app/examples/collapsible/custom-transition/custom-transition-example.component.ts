import { Component, signal } from "@angular/core";
import { LucideChevronDown } from "@lucide/angular";
import {
    CollapsibleContentDirective,
    CollapsibleDirective,
    CollapsibleTriggerDirective
} from "@nanahoshi/mona-ui/collapsible";

@Component({
    selector: "app-collapsible-custom-transition-example",
    imports: [CollapsibleContentDirective, CollapsibleDirective, CollapsibleTriggerDirective, LucideChevronDown],
    templateUrl: "./custom-transition-example.component.html"
})
export class CollapsibleCustomTransitionExampleComponent {
    protected readonly expanded = signal(false);
}
