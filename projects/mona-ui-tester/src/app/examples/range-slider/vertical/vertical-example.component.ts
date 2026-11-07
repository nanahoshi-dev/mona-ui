import { Component, signal } from "@angular/core";
import { RangeSliderComponent } from "@nanahoshi/mona-ui/slider";

@Component({
    selector: "app-range-slider-vertical-example",
    imports: [RangeSliderComponent],
    templateUrl: "./vertical-example.component.html"
})
export class RangeSliderVerticalExampleComponent {
    protected readonly temperature = signal<[number, number]>([18, 24]);
}
