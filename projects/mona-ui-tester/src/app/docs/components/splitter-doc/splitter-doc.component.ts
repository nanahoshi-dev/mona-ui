import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { SplitterDemoComponent } from "../../../demo/components/splitter-demo/splitter-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-splitter-doc",
    imports: [CodeViewerComponent, SectionComponent, SplitterDemoComponent],
    templateUrl: "./splitter-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplitterDocComponent {
    protected readonly importCode = `import { SplitterComponent } from "mona-ui";`;
}
