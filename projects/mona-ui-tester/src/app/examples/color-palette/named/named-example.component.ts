import { Component, signal } from "@angular/core";
import type { ColorPaletteItem } from "@nanahoshi/mona-ui/common";
import { ColorPaletteComponent } from "@nanahoshi/mona-ui/color-palette";

@Component({
    selector: "app-color-palette-named-example",
    imports: [ColorPaletteComponent],
    templateUrl: "./named-example.component.html"
})
export class ColorPaletteNamedExampleComponent {
    protected readonly color = signal<string | null>(null);
    protected readonly statusColors: readonly ColorPaletteItem[] = [
        { color: "#15803d", name: "Done" },
        { color: "#1d4ed8", name: "In progress" },
        { color: "#b45309", name: "Blocked" },
        { color: "#6b7280", name: "Not started" }
    ];
}
