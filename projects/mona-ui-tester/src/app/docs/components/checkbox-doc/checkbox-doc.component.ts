import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { CheckboxDemoComponent } from "../../../demo/components/checkbox-demo/checkbox-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-checkbox-doc",
    imports: [ApiSectionComponent, CheckboxDemoComponent, MarkdownDocComponent],
    templateUrl: "./checkbox-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxDocComponent {}
