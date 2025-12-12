import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CircularProgressBarDemoComponent } from "../../../demo/components/circular-progress-bar-demo/circular-progress-bar-demo.component";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-circular-progress-bar-doc",
    imports: [CodeViewerComponent, SectionComponent, CircularProgressBarDemoComponent],
    templateUrl: "./circular-progress-bar-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CircularProgressBarDocComponent {
    protected readonly importCode = `
        import { CircularProgressBarComponent } from "mona-ui";
    `;
}
