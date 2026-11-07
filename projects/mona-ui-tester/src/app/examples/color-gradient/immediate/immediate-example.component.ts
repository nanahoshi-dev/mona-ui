import { Component, signal } from "@angular/core";
import { ColorGradientComponent } from "@nanahoshi/mona-ui/color-gradient";

@Component({
    selector: "app-color-gradient-immediate-example",
    imports: [ColorGradientComponent],
    templateUrl: "./immediate-example.component.html"
})
export class ColorGradientImmediateExampleComponent {
    protected readonly color = signal<string | null | undefined>("rgba(233, 69, 96, 1)");
}
