import { Component, signal } from "@angular/core";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";

@Component({
    selector: "app-numeric-textbox-step-example",
    imports: [NumericTextBoxComponent],
    templateUrl: "./step-example.component.html"
})
export class NumericTextboxStepExampleComponent {
    protected readonly duration = signal<number | null>(30);
}
