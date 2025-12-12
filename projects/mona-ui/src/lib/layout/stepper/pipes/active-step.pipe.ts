import { Pipe, PipeTransform } from "@angular/core";
import { StepItem } from "../models/Step";

@Pipe({
    name: "activeStep"
})
export class ActiveStepPipe implements PipeTransform {
    public transform(step: StepItem, activeStep: StepItem): boolean {
        return step.index <= activeStep.index;
    }
}
