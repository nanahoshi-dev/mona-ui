import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ListViewDemoComponent } from "../../../demo/components/list-view-demo/list-view-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-list-view-doc",
    imports: [ListViewDemoComponent, MarkdownDocComponent],
    templateUrl: "./list-view-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListViewDocComponent {}
