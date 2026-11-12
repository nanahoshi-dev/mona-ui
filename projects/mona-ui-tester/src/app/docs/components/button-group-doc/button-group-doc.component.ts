import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { ButtonGroupDemoComponent } from "../../../demo/components/button-group-demo/button-group-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-button-group-doc",
    imports: [ApiSectionComponent, ButtonGroupDemoComponent, MarkdownDocComponent],
    templateUrl: "./button-group-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonGroupDocComponent {}
