import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import type { ButtonGroupClickEvent } from "@nanahoshi/mona-ui/button-group";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";

@Component({
    selector: "app-button-group-actions-example",
    imports: [ButtonDirective, ButtonGroupComponent],
    templateUrl: "./actions-example.component.html"
})
export class ButtonGroupActionsExampleComponent {
    protected readonly lastAction = signal("none");

    protected onClick(event: ButtonGroupClickEvent): void {
        this.lastAction.set(typeof event.value === "string" ? event.value : "none");
    }
}
