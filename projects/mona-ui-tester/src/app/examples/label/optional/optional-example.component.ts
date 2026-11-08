import { Component } from "@angular/core";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-label-optional-example",
    imports: [LabelComponent, TextBoxComponent],
    templateUrl: "./optional-example.component.html"
})
export class LabelOptionalExampleComponent {}
