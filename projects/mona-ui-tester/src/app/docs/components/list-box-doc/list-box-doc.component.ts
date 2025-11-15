import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { SectionComponent } from "../../../layout/components/section/section.component";
import { ListBoxDemoComponent } from "../../../demo/components/list-box-demo/list-box-demo.component";

@Component({
    selector: "app-list-box-doc",
    imports: [CodeViewerComponent, SectionComponent, ListBoxDemoComponent],
    templateUrl: "./list-box-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListBoxDocComponent {
    protected readonly importCode = `import { ListBoxComponent } from "mona-ui";`;
}
