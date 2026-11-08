import { Component, signal } from "@angular/core";
import type { StepOptions } from "@nanahoshi/mona-ui/stepper";
import { StepperComponent } from "@nanahoshi/mona-ui/stepper";

@Component({
    selector: "app-stepper-step-states-example",
    imports: [StepperComponent],
    templateUrl: "./step-states-example.component.html"
})
export class StepperStepStatesExampleComponent {
    protected readonly currentStep = signal(1);
    protected readonly steps: StepOptions[] = [
        { label: "Details", invalid: true },
        { label: "Team" },
        { label: "Billing", disabled: true },
        { label: "Integrations", completed: true },
        { label: "Review" }
    ];
}
