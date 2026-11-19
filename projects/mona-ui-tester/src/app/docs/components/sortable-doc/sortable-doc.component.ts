import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { SortableDemoComponent } from "../../../demo/components/sortable-demo/sortable-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-sortable-doc",
    imports: [ApiSectionComponent, MarkdownDocComponent, SortableDemoComponent],
    templateUrl: "./sortable-doc.component.html"
})
export class SortableDocComponent {}
