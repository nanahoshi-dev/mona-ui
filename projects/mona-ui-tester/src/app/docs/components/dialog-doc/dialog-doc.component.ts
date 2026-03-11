import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { DialogDemoComponent } from "../../../demo/components/dialog-demo/dialog-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-dialog-doc",
    imports: [CodeViewerComponent, SectionComponent, DialogDemoComponent],
    templateUrl: "./dialog-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogDocComponent {
    protected readonly importCode = `import { DialogComponent } from "mona-ui";`;
}
