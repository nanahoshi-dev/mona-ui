import { Component, signal } from "@angular/core";
import { form, FormField, max, min } from "@angular/forms/signals";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { SliderComponent } from "@nanahoshi/mona-ui/slider";

@Component({
    selector: "app-slider-forms-example",
    imports: [FormField, LabelComponent, SliderComponent],
    templateUrl: "./forms-example.component.html"
})
export class SliderFormsExampleComponent {
    readonly #model = signal({ guests: 4 });
    protected readonly booking = form(this.#model, path => {
        min(path.guests, 1);
        max(path.guests, 12);
    });
}
