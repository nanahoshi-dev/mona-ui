import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { StepperDemoComponent } from "../../../demo/components/stepper-demo/stepper-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-stepper-doc",
    imports: [CodeViewerComponent, SectionComponent, StepperDemoComponent],
    templateUrl: "./stepper-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepperDocComponent {
    protected readonly importCode = `import { StepperComponent } from "mona-ui";`;
}
