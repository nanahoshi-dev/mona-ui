import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { GridColumnsDemoComponent } from "../../../demo/components/grid-columns-demo/grid-columns-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ApiSectionComponent, GridColumnsDemoComponent, MarkdownDocComponent],
    selector: "app-grid-columns-doc",
    templateUrl: "./grid-columns-doc.component.html"
})
export class GridColumnsDocComponent {}
