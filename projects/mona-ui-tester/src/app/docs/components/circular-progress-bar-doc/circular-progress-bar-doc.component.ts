import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CircularProgressBarDemoComponent } from "../../../demo/components/circular-progress-bar-demo/circular-progress-bar-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-circular-progress-bar-doc",
    imports: [CircularProgressBarDemoComponent, MarkdownDocComponent],
    templateUrl: "./circular-progress-bar-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CircularProgressBarDocComponent {}
