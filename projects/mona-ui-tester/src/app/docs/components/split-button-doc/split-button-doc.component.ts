import { ChangeDetectionStrategy, Component } from "@angular/core";
import { SplitButtonDemoComponent } from "../../../demo/components/split-button-demo/split-button-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-split-button-doc",
    imports: [SplitButtonDemoComponent, MarkdownDocComponent],
    templateUrl: "./split-button-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplitButtonDocComponent {}
