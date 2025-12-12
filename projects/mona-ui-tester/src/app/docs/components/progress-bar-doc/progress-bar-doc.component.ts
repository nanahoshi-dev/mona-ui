import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { ProgressBarDemoComponent } from "../../../demo/components/progress-bar-demo/progress-bar-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-progress-bar-doc",
    imports: [CodeViewerComponent, SectionComponent, ProgressBarDemoComponent],
    templateUrl: "./progress-bar-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressBarDocComponent {
    protected readonly importCode = `
        import { ProgressBarComponent } from "mona-ui";
    `;
}
