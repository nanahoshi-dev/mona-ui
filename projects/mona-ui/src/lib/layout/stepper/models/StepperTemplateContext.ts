import type { StepOptions } from "./Step";

export interface StepperTemplateContext<T = unknown> {
    $implicit: StepOptions<T>;
    active: boolean;
    currentIndex: number;
    index: number;
}
