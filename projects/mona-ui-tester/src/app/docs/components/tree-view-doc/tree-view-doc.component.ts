import { Component } from "@angular/core";
import { TreeViewDemoComponent } from "../../../demo/components/tree-view-demo/tree-view-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-tree-view-doc",
    imports: [MarkdownDocComponent, TreeViewDemoComponent],
    templateUrl: "./tree-view-doc.component.html"
})
export class TreeViewDocComponent {}
