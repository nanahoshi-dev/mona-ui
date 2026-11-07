import { Component, signal } from "@angular/core";
import { ColorPickerComponent, ColorPickerValueTemplateDirective } from "@nanahoshi/mona-ui/color-picker";

@Component({
    selector: "app-color-picker-value-template-example",
    imports: [ColorPickerComponent, ColorPickerValueTemplateDirective],
    templateUrl: "./value-template-example.component.html"
})
export class ColorPickerValueTemplateExampleComponent {
    protected readonly color = signal<string | null>("#16a34a");
}
