import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { InputDemoComponent } from "../../../demo/components/input-demo/input-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-input-doc",
    imports: [ApiSectionComponent, InputDemoComponent, MarkdownDocComponent],
    templateUrl: "./input-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputDocComponent {}
