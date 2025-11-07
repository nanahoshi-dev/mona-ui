import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { ListViewDemoComponent } from "../../../demo/components/list-view-demo/list-view-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-list-view-doc",
    imports: [CodeViewerComponent, SectionComponent, ListViewDemoComponent],
    templateUrl: "./list-view-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListViewDocComponent {
    protected readonly importCode = `import { ListViewComponent } from "mona-ui";`;
}
