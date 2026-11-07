import { Component, signal } from "@angular/core";
import { form, FormField } from "@angular/forms/signals";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { RangeSliderComponent } from "@nanahoshi/mona-ui/slider";

interface FilterModel {
    hours: [number, number];
}

@Component({
    selector: "app-range-slider-forms-example",
    imports: [FormField, LabelComponent, RangeSliderComponent],
    templateUrl: "./forms-example.component.html"
})
export class RangeSliderFormsExampleComponent {
    readonly #model = signal<FilterModel>({ hours: [9, 17] });
    protected readonly filter = form(this.#model);
}
