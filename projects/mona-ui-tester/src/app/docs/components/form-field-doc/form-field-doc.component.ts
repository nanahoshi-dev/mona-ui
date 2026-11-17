import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { FormFieldDemoComponent } from "../../../demo/components/form-field-demo/form-field-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-form-field-doc",
    imports: [ApiSectionComponent, FormFieldDemoComponent, MarkdownDocComponent],
    templateUrl: "./form-field-doc.component.html"
})
export class FormFieldDocComponent {}
