import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { TreeViewDemoComponent } from "../../../demo/components/tree-view-demo/tree-view-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-tree-view-doc",
    imports: [CodeViewerComponent, SectionComponent, TreeViewDemoComponent],
    templateUrl: "./tree-view-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeViewDocComponent {
    protected readonly importCode = `import { TreeViewComponent } from "mona-ui";`;
}
