import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { SectionComponent } from "../../../layout/components/section/section.component";
import { ExpansionPanelDemoComponent } from "../../../demo/components/expansion-panel-demo/expansion-panel-demo.component";

@Component({
    selector: "app-expansion-panel-doc",
    imports: [CodeViewerComponent, SectionComponent, ExpansionPanelDemoComponent],
    templateUrl: "./expansion-panel-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpansionPanelDocComponent {
    protected readonly importCode = `import { ExpansionPanelComponent } from "mona-ui";`;
}
