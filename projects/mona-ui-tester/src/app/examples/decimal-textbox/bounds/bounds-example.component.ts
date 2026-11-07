import { Component, signal } from "@angular/core";
import { DecimalTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";

@Component({
    selector: "app-decimal-textbox-bounds-example",
    imports: [DecimalTextBoxComponent],
    templateUrl: "./bounds-example.component.html"
})
export class DecimalTextboxBoundsExampleComponent {
    protected readonly rate = signal<string | null>("12345678901234567890.1234");
}
