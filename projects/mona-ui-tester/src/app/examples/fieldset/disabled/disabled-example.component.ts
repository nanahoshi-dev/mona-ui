import { Component, signal } from "@angular/core";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { FieldsetComponent } from "@nanahoshi/mona-ui/fieldset";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-fieldset-disabled-example",
    imports: [CheckBoxComponent, FieldsetComponent, LabelComponent, SwitchComponent, TextBoxComponent],
    templateUrl: "./disabled-example.component.html"
})
export class FieldsetDisabledExampleComponent {
    protected readonly sameAsBilling = signal(true);
}
