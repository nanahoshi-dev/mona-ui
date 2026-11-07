import { Component, signal } from "@angular/core";
import { ColorGradientComponent } from "@nanahoshi/mona-ui/color-gradient";

@Component({
    selector: "app-color-gradient-buttons-example",
    imports: [ColorGradientComponent],
    templateUrl: "./buttons-example.component.html"
})
export class ColorGradientButtonsExampleComponent {
    protected readonly color = signal<string | null | undefined>("#336699");
    protected readonly lastAction = signal("none");
}
