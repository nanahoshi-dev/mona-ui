import { Component, signal } from "@angular/core";
import { ComboBoxComponent } from "@nanahoshi/mona-ui/combo-box";
import { LabelDirective } from "@nanahoshi/mona-ui/label";

@Component({
    selector: "app-combo-box-primitive-example",
    imports: [ComboBoxComponent, LabelDirective],
    templateUrl: "./primitive-example.component.html"
})
export class ComboBoxPrimitiveExampleComponent {
    protected readonly sizeCode = signal<string | null>("M");
    protected readonly sizes = [
        { code: "S", label: "Small" },
        { code: "M", label: "Medium" },
        { code: "L", label: "Large" },
        { code: "XL", label: "Extra large" }
    ];
}
