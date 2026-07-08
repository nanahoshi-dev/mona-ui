export interface StepOptions<T = unknown> {
    /** @description Optional arbitrary data attached to this step. */
    data?: T;

    /** @description When true, the step cannot be activated by click or keyboard regardless of linear mode. */
    disabled?: boolean;

    /** @description Display label shown beneath the step indicator. */
    label: string;
}

export interface StepItem<T = unknown> {
    /** @description Zero-based position of the step in the list. */
    readonly index: number;

    /** @description The original options object for this step. */
    readonly options: StepOptions<T>;
}
