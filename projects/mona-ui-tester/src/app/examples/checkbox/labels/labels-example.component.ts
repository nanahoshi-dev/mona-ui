import { Component, signal } from "@angular/core";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";

@Component({
    selector: "app-checkbox-labels-example",
    imports: [CheckBoxComponent],
    templateUrl: "./labels-example.component.html"
})
export class CheckboxLabelsExampleComponent {
    protected readonly releases = signal(true);
    protected readonly signedIn = signal(false);
    protected readonly terms = signal(false);
}
