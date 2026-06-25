import { ChangeDetectionStrategy, Component } from "@angular/core";
import { TextBoxDemoComponent } from "../../../demo/components/text-box-demo/text-box-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-text-box-doc",
    imports: [TextBoxDemoComponent, MarkdownDocComponent],
    templateUrl: "./text-box-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextBoxDocComponent {}
