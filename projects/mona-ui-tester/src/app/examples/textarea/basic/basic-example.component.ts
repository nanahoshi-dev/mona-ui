import { Component } from "@angular/core";
import { TextAreaDirective } from "@nanahoshi/mona-ui/text-area";

@Component({
    selector: "app-textarea-basic-example",
    imports: [TextAreaDirective],
    templateUrl: "./basic-example.component.html"
})
export class TextareaBasicExampleComponent {
    protected readonly terms = "Payment is due within 30 days of the invoice date.";
}
