export interface StepOptions<T = unknown> {
    /**
     * @description Whether the step is finished. When left unset, the steps before the current one count as completed.
     * Set it when a step can be passed without being finished, or finished ahead of the current one.
     */
    completed?: boolean;

    /** @description Optional arbitrary data attached to this step. */
    data?: T;

    /** @description When true, the step cannot be activated by click or keyboard regardless of linear mode. */
    disabled?: boolean;

    /** @description When true, the step shows and announces that it has errors. */
    invalid?: boolean;

    /** @description Display label shown beneath the step indicator. */
    label: string;
}

/**
 * Where a step stands. `current` outranks the others, and `disabled` outranks `completed` and `upcoming`. Invalid is
 * separate, because a step of any state can have errors.
 */
export type StepState = "completed" | "current" | "disabled" | "upcoming";

export interface StepItem<T = unknown> {
    /** @description Zero-based position of the step in the list. */
    readonly index: number;

    /** @description The original options object for this step. */
    readonly options: StepOptions<T>;
}
