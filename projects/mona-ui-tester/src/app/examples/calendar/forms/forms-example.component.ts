import { Component, signal } from "@angular/core";
import { form, FormField, required } from "@angular/forms/signals";
import { CalendarComponent } from "@nanahoshi/mona-ui/calendar";

interface DeliveryModel {
    date: Date | Date[] | null;
}

@Component({
    selector: "app-calendar-forms-example",
    imports: [CalendarComponent, FormField],
    templateUrl: "./forms-example.component.html"
})
export class CalendarFormsExampleComponent {
    readonly #model = signal<DeliveryModel>({ date: null });
    protected readonly delivery = form(this.#model, path => {
        required(path.date);
    });
}
