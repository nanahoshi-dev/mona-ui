import { Component, signal } from "@angular/core";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";

@Component({
    selector: "app-switch-labels-example",
    imports: [LabelComponent, SwitchComponent],
    templateUrl: "./labels-example.component.html"
})
export class SwitchLabelsExampleComponent {
    protected readonly bluetooth = signal(false);
    protected readonly wifi = signal(true);
}
