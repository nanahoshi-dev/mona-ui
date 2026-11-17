import { Component } from "@angular/core";
import { FormFieldComponent, FormFieldHintTemplateDirective } from "@nanahoshi/mona-ui/form-field";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-form-field-hint-and-optional-example",
    imports: [FormFieldComponent, FormFieldHintTemplateDirective, TextBoxComponent],
    templateUrl: "./hint-and-optional-example.component.html"
})
export class FormFieldHintAndOptionalExampleComponent {}
