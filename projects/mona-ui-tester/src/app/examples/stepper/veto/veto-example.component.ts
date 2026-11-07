import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import type { StepOptions, StepSelectEvent } from "@nanahoshi/mona-ui/stepper";
import { StepperComponent } from "@nanahoshi/mona-ui/stepper";

@Component({
    selector: "app-stepper-veto-example",
    imports: [ButtonDirective, StepperComponent],
    templateUrl: "./veto-example.component.html"
})
export class StepperVetoExampleComponent {
    protected readonly accountDone = signal(false);
    protected readonly currentStep = signal(0);
    protected readonly message = signal("");
    protected readonly steps: StepOptions[] = [{ label: "Account" }, { label: "Profile" }, { label: "Done" }];

    /** Going forward from the first step waits until it's filled in. Going back is always allowed. */
    protected select(event: StepSelectEvent): void {
        if (event.previousIndex === 0 && event.index > 0 && !this.accountDone()) {
            event.preventDefault();
            this.message.set("Fill in the account details first.");
            return;
        }
        this.message.set("");
    }
}
