import { Component, signal } from "@angular/core";
import { form, FormField, required } from "@angular/forms/signals";
import { ComboBoxComponent } from "@nanahoshi/mona-ui/combo-box";
import { LabelDirective } from "@nanahoshi/mona-ui/label";

interface EmployeeModel {
    departmentId: number | null;
}

@Component({
    selector: "app-combo-box-forms-example",
    imports: [ComboBoxComponent, FormField, LabelDirective],
    templateUrl: "./forms-example.component.html"
})
export class ComboBoxFormsExampleComponent {
    readonly #model = signal<EmployeeModel>({ departmentId: null });
    protected readonly departments = [
        { id: 1, name: "Engineering" },
        { id: 2, name: "Finance" },
        { id: 3, name: "Marketing" },
        { id: 4, name: "Support" }
    ];
    protected readonly employee = form(this.#model, path => {
        required(path.departmentId);
    });
}
