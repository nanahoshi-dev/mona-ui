export interface CartesianStageInstrumentation {
    onAxisRegistry?(): void;
    onBindingResolution?(): void;
    onOrientationPolicy?(): void;
    onSeriesPolicy?(): void;
    onStackAnalysis?(): void;
    onStageA?(): void;
    onStageB?(): void;
    onStageC?(): void;
}

export class CartesianStageTracker {
    public static current: CartesianStageInstrumentation | null = null;
}
