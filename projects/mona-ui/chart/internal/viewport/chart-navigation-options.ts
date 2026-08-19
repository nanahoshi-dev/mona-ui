import type {
    ChartNavigationAxisTarget,
    ChartNavigationInput,
    ChartNavigationOptions,
    ChartViewportConstraint,
    ChartViewportLinkGroup
} from "../../models/chart-viewport.models";

export interface NormalizedChartNavigationOptions {
    readonly clampToData: boolean;
    readonly constraints: readonly ChartViewportConstraint[];
    readonly dragPan: boolean;
    readonly enabled: boolean;
    readonly keyboard: boolean;
    readonly keyboardPanRatio: number;
    readonly keyboardZoomFactor: number;
    readonly linkGroups: readonly ChartViewportLinkGroup[];
    readonly minVisibleCategories: number;
    readonly pan: boolean;
    readonly panAxes: ChartNavigationAxisTarget;
    readonly pinchZoom: boolean;
    readonly wheelSensitivity: number;
    readonly wheelZoom: boolean;
    readonly zoom: boolean;
    readonly zoomAxes: ChartNavigationAxisTarget;
}

export const DEFAULT_NAVIGATION_OPTIONS: NormalizedChartNavigationOptions = {
    clampToData: true,
    constraints: [],
    dragPan: true,
    enabled: true,
    keyboard: true,
    keyboardPanRatio: 0.1,
    keyboardZoomFactor: 1.2,
    linkGroups: [],
    minVisibleCategories: 1,
    pan: true,
    panAxes: "auto",
    pinchZoom: true,
    wheelSensitivity: 0.002,
    wheelZoom: true,
    zoom: true,
    zoomAxes: "auto"
};

export const DISABLED_NAVIGATION_OPTIONS: NormalizedChartNavigationOptions = {
    clampToData: true,
    constraints: [],
    dragPan: false,
    enabled: false,
    keyboard: false,
    keyboardPanRatio: 0.1,
    keyboardZoomFactor: 1.2,
    linkGroups: [],
    minVisibleCategories: 1,
    pan: false,
    panAxes: "auto",
    pinchZoom: false,
    wheelSensitivity: 0.002,
    wheelZoom: false,
    zoom: false,
    zoomAxes: "auto"
};

export function normalizeChartNavigationOptions(
    input: ChartNavigationInput | undefined | null
): NormalizedChartNavigationOptions {
    if (input === false || input === undefined || input === null) {
        return DISABLED_NAVIGATION_OPTIONS;
    }

    if (input === true) {
        return DEFAULT_NAVIGATION_OPTIONS;
    }

    const pan = input.pan !== false;
    const zoom = input.zoom !== false;
    const dragPan = pan && input.dragPan !== false;
    const pinchZoom = zoom && input.pinchZoom !== false;
    const wheelZoom = zoom && input.wheelZoom !== false;
    const keyboard = (pan || zoom) && input.keyboard !== false;

    const enabled = pan || zoom || dragPan || pinchZoom || wheelZoom || keyboard;

    return {
        clampToData: input.clampToData !== false,
        constraints: input.constraints ?? [],
        dragPan,
        enabled,
        keyboard,
        keyboardPanRatio:
            typeof input.keyboardPanRatio === "number" && Number.isFinite(input.keyboardPanRatio) && input.keyboardPanRatio > 0
                ? input.keyboardPanRatio
                : 0.1,
        keyboardZoomFactor:
            typeof input.keyboardZoomFactor === "number" && Number.isFinite(input.keyboardZoomFactor) && input.keyboardZoomFactor > 1
                ? input.keyboardZoomFactor
                : 1.2,
        linkGroups: input.linkGroups ?? [],
        minVisibleCategories:
            typeof input.minVisibleCategories === "number" && input.minVisibleCategories >= 1
                ? Math.floor(input.minVisibleCategories)
                : 1,
        pan,
        panAxes: input.panAxes ?? "auto",
        pinchZoom,
        wheelSensitivity:
            typeof input.wheelSensitivity === "number" && Number.isFinite(input.wheelSensitivity) && input.wheelSensitivity > 0
                ? input.wheelSensitivity
                : 0.002,
        wheelZoom,
        zoom,
        zoomAxes: input.zoomAxes ?? "auto"
    };
}
