import { Component, signal } from "@angular/core";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { RadioButtonComponent, RadioGroupComponent } from "@nanahoshi/mona-ui/radio-button";

@Component({
    selector: "app-radio-button-group-example",
    imports: [LabelComponent, RadioButtonComponent, RadioGroupComponent],
    templateUrl: "./group-example.component.html"
})
export class RadioButtonGroupExampleComponent {
    protected readonly shipping = signal("standard");
}
