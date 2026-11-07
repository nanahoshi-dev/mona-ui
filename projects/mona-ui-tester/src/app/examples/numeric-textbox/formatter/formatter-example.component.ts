import { Component, signal } from "@angular/core";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";

@Component({
    selector: "app-numeric-textbox-formatter-example",
    imports: [NumericTextBoxComponent],
    templateUrl: "./formatter-example.component.html"
})
export class NumericTextboxFormatterExampleComponent {
    protected readonly price = signal<number | null>(49.9);

    protected readonly currencyFormatter = (value: number | null): string =>
        value == null ? "" : `$ ${value.toFixed(2)}`;
}
