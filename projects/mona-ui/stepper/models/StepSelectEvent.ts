import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import type { StepOptions } from "./Step";

/**
 * What `mona-stepper` reports before a click or key changes the step. Call `preventDefault()` to stay on the current step.
 */
export class StepSelectEvent<T = unknown> extends PreventableEvent {
    readonly #index: number;
    readonly #previousIndex: number;
    readonly #step: StepOptions<T>;

    public constructor(index: number, previousIndex: number, step: StepOptions<T>, originalEvent?: Event) {
        super("stepSelect", originalEvent);
        this.#index = index;
        this.#previousIndex = previousIndex;
        this.#step = step;
    }

    /** Zero-based index of the step being selected. */
    public get index(): number {
        return this.#index;
    }

    /** Zero-based index of the step that is current now. */
    public get previousIndex(): number {
        return this.#previousIndex;
    }

    /** The options of the step being selected. */
    public get step(): StepOptions<T> {
        return this.#step;
    }
}
