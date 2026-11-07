import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ExpansionPanelComponent } from "@nanahoshi/mona-ui/expansion-panel";

@Component({
    selector: "app-expansion-panel-controlled-example",
    imports: [ButtonDirective, ExpansionPanelComponent],
    templateUrl: "./controlled-example.component.html"
})
export class ExpansionPanelControlledExampleComponent {
    protected readonly detailsOpen = signal(false);
}
