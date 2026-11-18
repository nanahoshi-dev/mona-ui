import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { MultiSelectTreeDemoComponent } from "../../../demo/components/multi-select-tree-demo/multi-select-tree-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-multi-select-tree-doc",
    imports: [ApiSectionComponent, MultiSelectTreeDemoComponent, MarkdownDocComponent],
    templateUrl: "./multi-select-tree-doc.component.html"
})
export class MultiSelectTreeDocComponent {}
