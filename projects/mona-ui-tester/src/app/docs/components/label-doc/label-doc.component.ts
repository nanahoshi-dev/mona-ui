import { ChangeDetectionStrategy, Component } from "@angular/core";
import { LabelDemoComponent } from "../../../demo/components/label-demo/label-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-label-doc",
    imports: [LabelDemoComponent, MarkdownDocComponent],
    templateUrl: "./label-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabelDocComponent {}
