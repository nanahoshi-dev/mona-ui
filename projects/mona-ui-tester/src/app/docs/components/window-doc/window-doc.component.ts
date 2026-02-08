import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { WindowDemoComponent } from "../../../demo/components/window-demo/window-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-window-doc",
    imports: [CodeViewerComponent, SectionComponent, WindowDemoComponent],
    templateUrl: "./window-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WindowDocComponent {
    protected readonly importCode = `import { WindowComponent } from "mona-ui";`;
}
