import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { FieldsetDemoComponent } from "../../../demo/components/fieldset-demo/fieldset-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-fieldset-doc",
    imports: [ApiSectionComponent, FieldsetDemoComponent, MarkdownDocComponent],
    templateUrl: "./fieldset-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldsetDocComponent {}
