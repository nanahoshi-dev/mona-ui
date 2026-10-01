import { Component } from "@angular/core";
import { GridDemoComponent } from "../../../demo/components/grid-demo/grid-demo.component";
import { GridRowSizingDemoComponent } from "../../../demo/components/grid-row-sizing-demo/grid-row-sizing-demo.component";
import { GridServerBindingDemoComponent } from "../../../demo/components/grid-server-binding-demo/grid-server-binding-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-grid-doc",
    imports: [GridDemoComponent, GridRowSizingDemoComponent, GridServerBindingDemoComponent, MarkdownDocComponent],
    templateUrl: "./grid-doc.component.html"
})
export class GridDocComponent {}
