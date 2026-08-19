export interface ChartViewportAxisRef {
    readonly axis: "x" | "y";
    readonly axisId: string;
}

export interface ChartContinuousViewportWindow extends ChartViewportAxisRef {
    readonly kind: "continuous";
    readonly max: Date | number;
    readonly min: Date | number;
}

export interface ChartCategoryViewportWindow extends ChartViewportAxisRef {
    readonly endIndexExclusive: number;
    readonly kind: "category";
    readonly startIndex: number;
}

export type ChartViewportWindow =
    | ChartCategoryViewportWindow
    | ChartContinuousViewportWindow;

export interface ChartViewportState {
    readonly axes: readonly ChartViewportWindow[];
}

export type ChartNavigationAxisTarget =
    | "auto"
    | "x"
    | "xy"
    | "y"
    | readonly ChartViewportAxisRef[];

export interface ChartViewportConstraint extends ChartViewportAxisRef {
    readonly maxSpan?: number;
    readonly maxVisibleCategories?: number;
    readonly maxZoom?: number;
    readonly minSpan?: number;
    readonly minVisibleCategories?: number;
}

export type ChartViewportLinkMode =
    | "domain"
    | "relative";

export interface ChartViewportLinkGroup {
    readonly axes: readonly ChartViewportAxisRef[];
    readonly id: string;
    readonly mode: ChartViewportLinkMode;
}

export interface ChartNavigationOptions {
    readonly clampToData?: boolean;
    readonly constraints?: readonly ChartViewportConstraint[];
    readonly dragPan?: boolean;
    readonly keyboard?: boolean;
    readonly keyboardPanRatio?: number;
    readonly keyboardZoomFactor?: number;
    readonly linkGroups?: readonly ChartViewportLinkGroup[];
    readonly minVisibleCategories?: number;
    readonly pan?: boolean;
    readonly panAxes?: ChartNavigationAxisTarget;
    readonly pinchZoom?: boolean;
    readonly wheelSensitivity?: number;
    readonly wheelZoom?: boolean;
    readonly zoom?: boolean;
    readonly zoomAxes?: ChartNavigationAxisTarget;
}

export type ChartNavigationInput =
    | boolean
    | ChartNavigationOptions;

export type ChartViewportChangeSource =
    | "data-reconcile"
    | "drag"
    | "fit"
    | "keyboard"
    | "pinch"
    | "programmatic"
    | "reset"
    | "wheel";

export type ChartViewportChangePhase =
    | "end"
    | "start"
    | "update";

export interface ChartViewportChangeEvent {
    readonly changedAxes: readonly ChartViewportAxisRef[];
    readonly phase: ChartViewportChangePhase;
    readonly previousViewport: ChartViewportState;
    readonly source: ChartViewportChangeSource;
    readonly viewport: ChartViewportState;
}
