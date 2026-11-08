import { Component, signal } from "@angular/core";
import { SliderComponent } from "@nanahoshi/mona-ui/slider";

@Component({
    selector: "app-slider-vertical-example",
    imports: [SliderComponent],
    templateUrl: "./vertical-example.component.html"
})
export class SliderVerticalExampleComponent {
    protected readonly bass = signal(6);
    protected readonly middle = signal(0);
    protected readonly treble = signal(-3);
}
