import { Component } from "@angular/core";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-form-field-horizontal-example",
    imports: [DropdownListComponent, FormFieldComponent, NumericTextBoxComponent, TextBoxComponent],
    templateUrl: "./horizontal-example.component.html"
})
export class FormFieldHorizontalExampleComponent {
    protected readonly units = ["Pieces", "Boxes", "Pallets"];
}
