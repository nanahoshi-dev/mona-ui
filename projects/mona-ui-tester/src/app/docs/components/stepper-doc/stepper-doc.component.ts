import { ChangeDetectionStrategy, Component } from "@angular/core";
import { StepperDemoComponent } from "../../../demo/components/stepper-demo/stepper-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-stepper-doc",
    imports: [StepperDemoComponent, MarkdownDocComponent],
    templateUrl: "./stepper-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepperDocComponent {}
