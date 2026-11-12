import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { ButtonDemoComponent } from "../../../demo/components/button-demo/button-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-button-doc",
    imports: [ApiSectionComponent, ButtonDemoComponent, MarkdownDocComponent],
    templateUrl: "./button-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonDocComponent {}
