import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { GridDemoComponent } from "../../../demo/components/grid-demo/grid-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-grid-doc",
    imports: [CodeViewerComponent, SectionComponent, GridDemoComponent],
    templateUrl: "./grid-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridDocComponent {
    protected readonly importCode = `import { GridComponent } from "mona-ui";`;
}
