import type { StepOptions } from "./Step";

export interface StepperTemplateContext<T = unknown> {
    /** @description The step's options object (also available as the implicit binding). */
    $implicit: StepOptions<T>;

    /** @description True when this step's index is less than or equal to the current active step index. */
    active: boolean;

    /** @description Zero-based index of the currently active step. */
    currentIndex: number;

    /** @description Whether this step is disabled and cannot be activated. */
    disabled: boolean;

    /** @description Zero-based index of this step. */
    index: number;
}
