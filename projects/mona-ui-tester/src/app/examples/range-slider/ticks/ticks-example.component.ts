import { Component, signal } from "@angular/core";
import { RangeSliderComponent } from "@nanahoshi/mona-ui/slider";

@Component({
    selector: "app-range-slider-ticks-example",
    imports: [RangeSliderComponent],
    templateUrl: "./ticks-example.component.html"
})
export class RangeSliderTicksExampleComponent {
    protected readonly price = signal<[number, number]>([200, 700]);
}
