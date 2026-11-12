import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { GridRowsDemoComponent } from "../../../demo/components/grid-rows-demo/grid-rows-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    imports: [ApiSectionComponent, GridRowsDemoComponent, MarkdownDocComponent],
    selector: "app-grid-rows-doc",
    templateUrl: "./grid-rows-doc.component.html"
})
export class GridRowsDocComponent {}
