import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { GridSelectionDemoComponent } from "../../../demo/components/grid-selection-demo/grid-selection-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ApiSectionComponent, GridSelectionDemoComponent, MarkdownDocComponent],
    selector: "app-grid-selection-doc",
    templateUrl: "./grid-selection-doc.component.html"
})
export class GridSelectionDocComponent {}
