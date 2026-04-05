export interface StepOptions<T = unknown> {
    data?: T;
    label: string;
}

export interface StepItem<T = unknown> {
    readonly index: number;
    readonly options: StepOptions<T>;
}
