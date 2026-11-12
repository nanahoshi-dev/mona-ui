import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { TextAreaDemoComponent } from "../../../demo/components/text-area-demo/text-area-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-text-area-doc",
    imports: [ApiSectionComponent, TextAreaDemoComponent, MarkdownDocComponent],
    templateUrl: "./text-area-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextAreaDocComponent {}
