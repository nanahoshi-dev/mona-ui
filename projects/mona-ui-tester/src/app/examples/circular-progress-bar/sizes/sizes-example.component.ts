import { Component } from "@angular/core";
import { CircularProgressBarComponent } from "@nanahoshi/mona-ui/circular-progress-bar";

@Component({
    selector: "app-circular-progress-bar-sizes-example",
    imports: [CircularProgressBarComponent],
    templateUrl: "./sizes-example.component.html"
})
export class CircularProgressBarSizesExampleComponent {
    protected quotaColor = (percent: number): string => (percent >= 90 ? "#b91c1c" : "#4338ca");
}
