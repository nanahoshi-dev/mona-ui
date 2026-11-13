import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { GridStateExportDemoComponent } from "../../../demo/components/grid-state-export-demo/grid-state-export-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ApiSectionComponent, GridStateExportDemoComponent, MarkdownDocComponent],
    selector: "app-grid-state-export-doc",
    templateUrl: "./grid-state-export-doc.component.html"
})
export class GridStateExportDocComponent {}
