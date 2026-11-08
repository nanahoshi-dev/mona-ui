import { Component, signal } from "@angular/core";
import { ColorPaletteComponent } from "@nanahoshi/mona-ui/color-palette";

@Component({
    selector: "app-color-palette-custom-example",
    imports: [ColorPaletteComponent],
    templateUrl: "./custom-example.component.html"
})
export class ColorPaletteCustomExampleComponent {
    protected readonly color = signal<string | null>("#0f3460");
    protected readonly colors = ["#1a1a2e", "#16213e", "#0f3460", "#533483", "#e94560", "#f5a25d", "#f8e9a1", "#a8d8ea"];
}
