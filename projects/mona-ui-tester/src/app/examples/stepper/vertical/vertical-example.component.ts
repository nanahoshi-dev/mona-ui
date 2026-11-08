import { Component, signal } from "@angular/core";
import { LucideCheck, LucideCreditCard, LucideDynamicIcon, LucideShoppingCart, LucideTruck } from "@lucide/angular";
import type { StepOptions } from "@nanahoshi/mona-ui/stepper";
import { StepperComponent, StepperIndicatorTemplateDirective } from "@nanahoshi/mona-ui/stepper";

@Component({
    selector: "app-stepper-vertical-example",
    imports: [LucideCheck, LucideDynamicIcon, StepperComponent, StepperIndicatorTemplateDirective],
    templateUrl: "./vertical-example.component.html"
})
export class StepperVerticalExampleComponent {
    protected readonly currentStep = signal(1);
    protected readonly icons = [LucideShoppingCart, LucideCreditCard, LucideTruck];
    protected readonly steps: StepOptions[] = [{ label: "Cart" }, { label: "Payment" }, { label: "Shipping" }];
}
