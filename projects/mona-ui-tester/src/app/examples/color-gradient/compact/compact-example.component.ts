import { Component, signal } from "@angular/core";
import { ColorGradientComponent } from "@nanahoshi/mona-ui/color-gradient";

@Component({
    selector: "app-color-gradient-compact-example",
    imports: [ColorGradientComponent],
    templateUrl: "./compact-example.component.html"
})
export class ColorGradientCompactExampleComponent {
    protected readonly color = signal<string | null | undefined>("#0f3460");
}
