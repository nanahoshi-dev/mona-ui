import { Component, signal } from "@angular/core";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-label-wrapping-example",
    imports: [LabelComponent, SwitchComponent, TextBoxComponent],
    templateUrl: "./wrapping-example.component.html"
})
export class LabelWrappingExampleComponent {
    protected readonly email = signal("");
    protected readonly updates = signal(false);
}
