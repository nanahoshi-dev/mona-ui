import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { TextBoxDemoComponent } from "../../../demo/components/text-box-demo/text-box-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-text-box-doc",
    imports: [ApiSectionComponent, TextBoxDemoComponent, MarkdownDocComponent],
    templateUrl: "./text-box-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextBoxDocComponent {}
