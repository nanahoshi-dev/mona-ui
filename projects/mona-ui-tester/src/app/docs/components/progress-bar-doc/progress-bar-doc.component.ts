import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ProgressBarDemoComponent } from "../../../demo/components/progress-bar-demo/progress-bar-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-progress-bar-doc",
    imports: [ProgressBarDemoComponent, MarkdownDocComponent],
    templateUrl: "./progress-bar-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressBarDocComponent {}
