import { ChangeDetectionStrategy, Component } from "@angular/core";
import { FieldsetDemoComponent } from "../../../demo/components/fieldset-demo/fieldset-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-fieldset-doc",
    imports: [FieldsetDemoComponent, MarkdownDocComponent],
    templateUrl: "./fieldset-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldsetDocComponent {}
