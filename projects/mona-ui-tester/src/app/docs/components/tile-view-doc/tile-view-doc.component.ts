import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { TileViewDemoComponent } from "../../../demo/components/tile-view-demo/tile-view-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-tile-view-doc",
    imports: [ApiSectionComponent, TileViewDemoComponent, MarkdownDocComponent],
    templateUrl: "./tile-view-doc.component.html"
})
export class TileViewDocComponent {}
