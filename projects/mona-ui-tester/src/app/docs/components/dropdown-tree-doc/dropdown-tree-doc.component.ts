import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { DropdownTreeDemoComponent } from "../../../demo/components/dropdown-tree-demo/dropdown-tree-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-dropdown-tree-doc",
    imports: [ApiSectionComponent, DropdownTreeDemoComponent, MarkdownDocComponent],
    templateUrl: "./dropdown-tree-doc.component.html"
})
export class DropdownTreeDocComponent {}
