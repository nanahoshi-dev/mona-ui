export interface MonaStepperMessages {
    readonly stepCompleted: string;
    readonly stepInvalid: string;
    readonly stepPosition: (current: number, total: number) => string;
    readonly stepProgress: string;
    readonly stepper: string;
}
