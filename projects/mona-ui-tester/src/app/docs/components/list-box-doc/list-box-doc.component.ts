import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ListBoxDemoComponent } from "../../../demo/components/list-box-demo/list-box-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-list-box-doc",
    imports: [ListBoxDemoComponent, MarkdownDocComponent],
    templateUrl: "./list-box-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListBoxDocComponent {}
