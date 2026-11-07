import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import type { StepOptions } from "@nanahoshi/mona-ui/stepper";
import { StepperComponent } from "@nanahoshi/mona-ui/stepper";

@Component({
    selector: "app-stepper-wizard-example",
    imports: [ButtonDirective, StepperComponent],
    templateUrl: "./wizard-example.component.html"
})
export class StepperWizardExampleComponent {
    protected readonly currentStep = signal(0);
    protected readonly descriptions = [
        "Check the items in your cart.",
        "Enter the delivery address.",
        "Choose how to pay.",
        "Review the order and place it."
    ];
    protected readonly steps: StepOptions[] = [
        { label: "Cart" },
        { label: "Address" },
        { label: "Payment" },
        { label: "Review" }
    ];
}
