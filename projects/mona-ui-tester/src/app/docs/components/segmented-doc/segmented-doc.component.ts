import { ChangeDetectionStrategy, Component } from "@angular/core";
import { SegmentedDemoComponent } from "../../../demo/components/segmented-demo/segmented-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-segmented-doc",
    imports: [SegmentedDemoComponent, MarkdownDocComponent],
    templateUrl: "./segmented-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SegmentedDocComponent {}
