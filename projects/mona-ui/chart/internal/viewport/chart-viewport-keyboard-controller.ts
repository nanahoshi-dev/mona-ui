import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type {
    ChartNavigationAxisTarget,
    ChartViewportAxisRef,
    ChartViewportConstraint,
    ChartViewportLinkGroup,
    ChartViewportState
} from "../../models/chart-viewport.models";
import type { ChartAxisScene } from "../scene/cartesian-scene";
import type { CartesianAxisCoordinateSpace } from "./cartesian-axis-coordinate-space";
import { CartesianViewportOperationCoordinator } from "./cartesian-viewport-operation-coordinator";
import { areInternalViewportStatesEqual, type InternalCartesianViewportState } from "./cartesian-viewport-normalizer";
import { CartesianViewportTargetResolver, type CartesianNavigationProfile } from "./cartesian-viewport-target-resolver";
import type { NormalizedChartNavigationOptions } from "./chart-navigation-options";
import { chartMessages } from "../utils/chart-locale";

export interface ChartViewportKeyboardResult {
    announcement: string | null;
    changedAxes: readonly ChartViewportAxisRef[];
    handled: boolean;
    nextState: InternalCartesianViewportState | null;
}

export class ChartViewportKeyboardController {
    public static handleKeyDown(
        event: KeyboardEvent,
        coordinateSpace: CartesianAxisCoordinateSpace | undefined,
        plotRect: ChartRect,
        axisScenes: readonly ChartAxisScene[],
        options: NormalizedChartNavigationOptions,
        orientation: "horizontal" | "vertical",
        currentViewport: InternalCartesianViewportState,
        constraints?: readonly ChartViewportConstraint[],
        linkGroups?: readonly ChartViewportLinkGroup[],
        activeNamespace?: { axis: "x" | "y"; axisId: string } | null,
        defaultViewport?: ChartViewportState,
        navigationProfile?: CartesianNavigationProfile
    ): ChartViewportKeyboardResult {
        if (!options.enabled || !options.keyboard || !coordinateSpace) {
            return { announcement: null, changedAxes: [], handled: false, nextState: null };
        }

        const center: ChartPoint = {
            x: plotRect.x + plotRect.width / 2,
            y: plotRect.y + plotRect.height / 2
        };

        const isPanKey =
            event.shiftKey &&
            (event.key === "ArrowLeft" ||
                event.key === "ArrowRight" ||
                event.key === "ArrowUp" ||
                event.key === "ArrowDown");

        const isZoomKey =
            !event.shiftKey && (event.key === "+" || event.key === "=" || event.key === "-" || event.key === "_");

        const isResetKey = !event.shiftKey && event.key === "0";

        if (isPanKey && !options.pan) {
            return { announcement: null, changedAxes: [], handled: false, nextState: null };
        }

        if (isZoomKey && !options.zoom) {
            return { announcement: null, changedAxes: [], handled: false, nextState: null };
        }

        if (isResetKey && !options.pan && !options.zoom) {
            return { announcement: null, changedAxes: [], handled: false, nextState: null };
        }

        // A pan goes along the key's direction: the focused point's axis only when it lies that way, so Shift+ArrowUp
        // still pans Y after arrowing to a point on the X axis.
        const panAxis = event.key === "ArrowLeft" || event.key === "ArrowRight" ? "x" : "y";
        const keyTarget: ChartNavigationAxisTarget | undefined = isPanKey
            ? activeNamespace && activeNamespace.axis === panAxis
                ? [activeNamespace]
                : panAxis
            : activeNamespace
              ? [activeNamespace]
              : isZoomKey
                ? options.zoomAxes
                : undefined;

        const resolved = CartesianViewportTargetResolver.resolveTargets(
            center,
            plotRect,
            axisScenes,
            options,
            orientation,
            keyTarget,
            navigationProfile
        );

        const targetAxes = resolved.targetAxes;

        const xPanStep = plotRect.width * options.keyboardPanRatio;
        const yPanStep = plotRect.height * options.keyboardPanRatio;
        const zoomInFactor = options.keyboardZoomFactor;
        const zoomOutFactor = 1 / options.keyboardZoomFactor;

        let nextState = currentViewport;
        let announcement: string | null = null;
        let handled = false;
        let changedAxes: readonly ChartViewportAxisRef[] = [];

        const coordinatorOptions = {
            clampToData: options.clampToData,
            constraints,
            linkGroups,
            minVisibleCategories: options.minVisibleCategories
        };

        if (isPanKey) {
            if (event.key === "ArrowLeft") {
                const res = CartesianViewportOperationCoordinator.transform(
                    currentViewport,
                    coordinateSpace,
                    targetAxes.filter(a => a.axis === "x"),
                    { panDeltaPx: { x: xPanStep, y: 0 } },
                    coordinatorOptions
                );
                if (res.accepted) {
                    nextState = res.viewport;
                    changedAxes = res.changedAxes;
                    announcement = chartMessages().pannedLeft;
                    handled = true;
                }
            } else if (event.key === "ArrowRight") {
                const res = CartesianViewportOperationCoordinator.transform(
                    currentViewport,
                    coordinateSpace,
                    targetAxes.filter(a => a.axis === "x"),
                    { panDeltaPx: { x: -xPanStep, y: 0 } },
                    coordinatorOptions
                );
                if (res.accepted) {
                    nextState = res.viewport;
                    changedAxes = res.changedAxes;
                    announcement = chartMessages().pannedRight;
                    handled = true;
                }
            } else if (event.key === "ArrowUp") {
                const res = CartesianViewportOperationCoordinator.transform(
                    currentViewport,
                    coordinateSpace,
                    targetAxes.filter(a => a.axis === "y"),
                    { panDeltaPx: { x: 0, y: yPanStep } },
                    coordinatorOptions
                );
                if (res.accepted) {
                    nextState = res.viewport;
                    changedAxes = res.changedAxes;
                    announcement = chartMessages().pannedUp;
                    handled = true;
                }
            } else if (event.key === "ArrowDown") {
                const res = CartesianViewportOperationCoordinator.transform(
                    currentViewport,
                    coordinateSpace,
                    targetAxes.filter(a => a.axis === "y"),
                    { panDeltaPx: { x: 0, y: -yPanStep } },
                    coordinatorOptions
                );
                if (res.accepted) {
                    nextState = res.viewport;
                    changedAxes = res.changedAxes;
                    announcement = chartMessages().pannedDown;
                    handled = true;
                }
            }
        } else if (event.key === "+" || event.key === "=") {
            const res = CartesianViewportOperationCoordinator.transform(
                currentViewport,
                coordinateSpace,
                targetAxes,
                { anchor: center, zoomFactor: zoomInFactor },
                coordinatorOptions
            );
            if (res.accepted) {
                nextState = res.viewport;
                changedAxes = res.changedAxes;
                announcement = chartMessages().zoomedIn;
                handled = true;
            }
        } else if (event.key === "-" || event.key === "_") {
            const res = CartesianViewportOperationCoordinator.transform(
                currentViewport,
                coordinateSpace,
                targetAxes,
                { anchor: center, zoomFactor: zoomOutFactor },
                coordinatorOptions
            );
            if (res.accepted) {
                nextState = res.viewport;
                changedAxes = res.changedAxes;
                announcement = chartMessages().zoomedOut;
                handled = true;
            }
        } else if (isResetKey) {
            const res = CartesianViewportOperationCoordinator.reset(
                currentViewport,
                coordinateSpace,
                defaultViewport,
                undefined,
                coordinatorOptions
            );
            if (res.accepted) {
                nextState = res.viewport;
                changedAxes = res.changedAxes;
                announcement =
                    defaultViewport && defaultViewport.axes && defaultViewport.axes.length > 0
                        ? chartMessages().viewportResetToDefault
                        : chartMessages().viewportResetToFull;
                handled = true;
            }
        }

        if (handled && !areInternalViewportStatesEqual(currentViewport, nextState)) {
            return { announcement, changedAxes, handled: true, nextState };
        }

        return { announcement: null, changedAxes: [], handled, nextState: null };
    }
}
