import { ChangeDetectionStrategy, Component } from "@angular/core";
import { PagerDemoComponent } from "../../../demo/components/pager-demo/pager-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-pager-doc",
    imports: [PagerDemoComponent, MarkdownDocComponent],
    templateUrl: "./pager-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PagerDocComponent {}
