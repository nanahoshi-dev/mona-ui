import { Component, signal } from "@angular/core";
import { SliderComponent } from "@nanahoshi/mona-ui/slider";

@Component({
    selector: "app-slider-ticks-example",
    imports: [SliderComponent],
    templateUrl: "./ticks-example.component.html"
})
export class SliderTicksExampleComponent {
    protected readonly volume = signal(40);
}
