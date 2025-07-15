import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { PopupDemoComponent } from "../../../demo/components/popup-demo/popup-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-popup-doc",
    imports: [CodeViewerComponent, SectionComponent, PopupDemoComponent],
    templateUrl: "./popup-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopupDocComponent {
    protected readonly importCode = `import { PopupComponent } from "mona-ui";`;
}
