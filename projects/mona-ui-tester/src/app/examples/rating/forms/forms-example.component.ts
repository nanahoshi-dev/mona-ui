import { Component, signal } from "@angular/core";
import { form, FormField, min } from "@angular/forms/signals";
import { RatingComponent } from "@nanahoshi/mona-ui/rating";

@Component({
    selector: "app-rating-forms-example",
    imports: [FormField, RatingComponent],
    templateUrl: "./forms-example.component.html"
})
export class RatingFormsExampleComponent {
    readonly #model = signal({ rating: 0 });
    protected readonly review = form(this.#model, path => {
        min(path.rating, 1);
    });
}
