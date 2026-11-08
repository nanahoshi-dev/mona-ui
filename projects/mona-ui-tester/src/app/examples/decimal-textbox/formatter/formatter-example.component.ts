import { Component, signal } from "@angular/core";
import { formatNumber } from "@nanahoshi/mona-ui/i18n";
import { DecimalTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";

@Component({
    selector: "app-decimal-textbox-formatter-example",
    imports: [DecimalTextBoxComponent],
    templateUrl: "./formatter-example.component.html"
})
export class DecimalTextboxFormatterExampleComponent {
    protected readonly amount = signal<string | null>("1234567.5");
    protected readonly currencyFormatter = (value: string | null): string =>
        value == null ? "" : formatNumber(value, "en-US", { currency: "USD", style: "currency" });
}
