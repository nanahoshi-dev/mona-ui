import { Component, signal } from "@angular/core";
import { ColorPickerComponent } from "@nanahoshi/mona-ui/color-picker";

@Component({
    selector: "app-color-picker-palette-example",
    imports: [ColorPickerComponent],
    templateUrl: "./palette-example.component.html"
})
export class ColorPickerPaletteExampleComponent {
    protected readonly color = signal<string | null>("#2563eb");
    protected readonly colors = [
        "#dc2626",
        "#ea580c",
        "#ca8a04",
        "#16a34a",
        "#0891b2",
        "#2563eb",
        "#7c3aed",
        "#db2777",
        "#57534e",
        "#171717"
    ];
}
