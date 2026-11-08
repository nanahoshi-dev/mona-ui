import { Component, signal } from "@angular/core";
import { RadioButtonDirective } from "@nanahoshi/mona-ui/radio-button";

@Component({
    selector: "app-radio-button-directive-example",
    imports: [RadioButtonDirective],
    templateUrl: "./directive-example.component.html"
})
export class RadioButtonDirectiveExampleComponent {
    protected readonly directions = ["North", "East", "South", "West"];
    protected readonly selected = signal("North");
}
