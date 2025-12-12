import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { TabsDemoComponent } from "../../../demo/components/tabs-demo/tabs-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-tabs-doc",
    imports: [CodeViewerComponent, SectionComponent, TabsDemoComponent],
    templateUrl: "./tabs-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsDocComponent {
    protected readonly importCode = `import { TabsComponent } from "mona-ui";`;
}
