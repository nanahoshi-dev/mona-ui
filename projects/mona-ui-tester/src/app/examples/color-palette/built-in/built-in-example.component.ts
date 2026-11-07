import { Component, signal } from "@angular/core";
import { ColorPaletteComponent } from "@nanahoshi/mona-ui/color-palette";

@Component({
    selector: "app-color-palette-built-in-example",
    imports: [ColorPaletteComponent],
    templateUrl: "./built-in-example.component.html"
})
export class ColorPaletteBuiltInExampleComponent {
    protected readonly color = signal<string | null>(null);
}
