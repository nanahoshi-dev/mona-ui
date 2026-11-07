import { Component, signal } from "@angular/core";
import { form, FormField, required } from "@angular/forms/signals";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { LabelDirective } from "@nanahoshi/mona-ui/label";

interface OrderModel {
    shippingId: number | null;
}

@Component({
    selector: "app-dropdown-list-forms-example",
    imports: [DropdownListComponent, FormField, LabelDirective],
    templateUrl: "./forms-example.component.html"
})
export class DropdownListFormsExampleComponent {
    readonly #model = signal<OrderModel>({ shippingId: null });
    protected readonly methods = [
        { id: 1, name: "Standard (5–7 days)" },
        { id: 2, name: "Express (2 days)" },
        { id: 3, name: "Overnight" }
    ];
    protected readonly order = form(this.#model, path => {
        required(path.shippingId);
    });
}
