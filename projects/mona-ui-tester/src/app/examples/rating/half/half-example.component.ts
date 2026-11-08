import { Component, signal } from "@angular/core";
import { RatingComponent } from "@nanahoshi/mona-ui/rating";

@Component({
    selector: "app-rating-half-example",
    imports: [RatingComponent],
    templateUrl: "./half-example.component.html"
})
export class RatingHalfExampleComponent {
    protected readonly rating = signal(3.5);
}
