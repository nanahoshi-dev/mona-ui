import { Component, signal } from "@angular/core";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-textbox-clear-button-example",
    imports: [LabelComponent, TextBoxComponent],
    templateUrl: "./clear-button-example.component.html"
})
export class TextboxClearButtonExampleComponent {
    protected readonly city = signal("Lisbon");
}
