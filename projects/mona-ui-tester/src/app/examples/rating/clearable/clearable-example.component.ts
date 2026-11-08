import { Component, signal } from "@angular/core";
import { RatingComponent } from "@nanahoshi/mona-ui/rating";

@Component({
    selector: "app-rating-clearable-example",
    imports: [RatingComponent],
    templateUrl: "./clearable-example.component.html"
})
export class RatingClearableExampleComponent {
    protected readonly rating = signal(3);
}
