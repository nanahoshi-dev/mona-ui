import { Component, signal } from "@angular/core";
import { SliderComponent } from "@nanahoshi/mona-ui/slider";

const PRIORITIES = ["Low", "Medium", "High"];

@Component({
    selector: "app-slider-value-text-example",
    imports: [SliderComponent],
    templateUrl: "./value-text-example.component.html"
})
export class SliderValueTextExampleComponent {
    protected readonly priority = signal(1);
    protected readonly priorityName = (value: number): string => PRIORITIES[value] ?? "";
}
