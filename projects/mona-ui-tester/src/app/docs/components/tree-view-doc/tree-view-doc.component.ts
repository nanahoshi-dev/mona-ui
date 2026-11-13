import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { TreeViewDemoComponent } from "../../../demo/components/tree-view-demo/tree-view-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-tree-view-doc",
    imports: [ApiSectionComponent, MarkdownDocComponent, TreeViewDemoComponent],
    templateUrl: "./tree-view-doc.component.html"
})
export class TreeViewDocComponent {}
