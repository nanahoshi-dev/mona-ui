import { Component, signal } from "@angular/core";
import { LabelComponent, LabelDirective } from "@nanahoshi/mona-ui/label";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
import { TextBoxComponent, TextBoxDirective } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-label-for-example",
    imports: [LabelComponent, LabelDirective, SwitchComponent, TextBoxComponent, TextBoxDirective],
    templateUrl: "./for-example.component.html"
})
export class LabelForExampleComponent {
    protected readonly city = signal("");
    protected readonly darkMode = signal(false);
}
