import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { StepperDemoComponent } from "../../../demo/components/stepper-demo/stepper-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-stepper-doc",
    imports: [ApiSectionComponent, StepperDemoComponent, MarkdownDocComponent],
    templateUrl: "./stepper-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepperDocComponent {}
