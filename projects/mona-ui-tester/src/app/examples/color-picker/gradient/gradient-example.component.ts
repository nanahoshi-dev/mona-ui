import { Component, signal } from "@angular/core";
import { ColorPickerComponent } from "@nanahoshi/mona-ui/color-picker";

@Component({
    selector: "app-color-picker-gradient-example",
    imports: [ColorPickerComponent],
    templateUrl: "./gradient-example.component.html"
})
export class ColorPickerGradientExampleComponent {
    protected readonly color = signal<string | null>("#336699");
}
