import { ChangeDetectionStrategy, Component } from "@angular/core";
import { GridDemoComponent } from "../../../demo/components/grid-demo/grid-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-grid-doc",
    imports: [GridDemoComponent, MarkdownDocComponent],
    templateUrl: "./grid-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridDocComponent {}
