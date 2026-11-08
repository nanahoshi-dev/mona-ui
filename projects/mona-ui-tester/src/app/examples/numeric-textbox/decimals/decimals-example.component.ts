import { Component, signal } from "@angular/core";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";

@Component({
    selector: "app-numeric-textbox-decimals-example",
    imports: [NumericTextBoxComponent],
    templateUrl: "./decimals-example.component.html"
})
export class NumericTextboxDecimalsExampleComponent {
    protected readonly weight = signal<number | null>(12);
}
