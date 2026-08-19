import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type {
    ChartNavigationAxisTarget,
    ChartViewportAxisRef,
    ChartViewportChangeEvent,
    ChartViewportConstraint,
    ChartViewportLinkGroup,
    ChartViewportState
} from "../../models/chart-viewport.models";
import type { ChartAxisScene } from "../scene/cartesian-scene";
import type { CartesianAxisCoordinateSpace } from "./cartesian-axis-coordinate-space";
import { CartesianViewportOperationCoordinator } from "./cartesian-viewport-operation-coordinator";
import {
    areInternalViewportStatesEqual,
    type InternalCartesianViewportState
} from "./cartesian-viewport-normalizer";
import { CartesianViewportTargetResolver } from "./cartesian-viewport-target-resolver";
import type { NormalizedChartNavigationOptions } from "./chart-navigation-options";

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
        defaultViewport?: ChartViewportState
    ): ChartViewportKeyboardResult {
        if (!options.enabled || !options.keyboard || !coordinateSpace) {
            return { announcement: null, changedAxes: [], handled: false, nextState: null };
        }

        const center: ChartPoint = {
            x: plotRect.x + plotRect.width / 2,
            y: plotRect.y + plotRect.height / 2
        };

        const keyTarget: ChartNavigationAxisTarget | undefined = activeNamespace
            ? [activeNamespace]
            : event.shiftKey
              ? (event.key === "ArrowLeft" || event.key === "ArrowRight" ? "x" : (event.key === "ArrowUp" || event.key === "ArrowDown" ? "y" : undefined))
              : (event.key === "+" || event.key === "=" || event.key === "-" || event.key === "_")
                ? options.zoomAxes
                : undefined;

        const resolved = CartesianViewportTargetResolver.resolveTargets(
            center,
            plotRect,
            axisScenes,
            options,
            orientation,
            keyTarget
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

        if (event.shiftKey) {
            if (event.key === "ArrowLeft") {
                const res = CartesianViewportOperationCoordinator.transform(
                    currentViewport,
                    coordinateSpace,
                    targetAxes.filter(a => a.axis === "x"),
                    { panDeltaPx: { x: xPanStep, y: 0 } },
                    coordinatorOptions
                );
                nextState = res.viewport;
                changedAxes = res.changedAxes;
                announcement = "Panned left";
                handled = true;
            } else if (event.key === "ArrowRight") {
                const res = CartesianViewportOperationCoordinator.transform(
                    currentViewport,
                    coordinateSpace,
                    targetAxes.filter(a => a.axis === "x"),
                    { panDeltaPx: { x: -xPanStep, y: 0 } },
                    coordinatorOptions
                );
                nextState = res.viewport;
                changedAxes = res.changedAxes;
                announcement = "Panned right";
                handled = true;
            } else if (event.key === "ArrowUp") {
                const res = CartesianViewportOperationCoordinator.transform(
                    currentViewport,
                    coordinateSpace,
                    targetAxes.filter(a => a.axis === "y"),
                    { panDeltaPx: { x: 0, y: yPanStep } },
                    coordinatorOptions
                );
                nextState = res.viewport;
                changedAxes = res.changedAxes;
                announcement = "Panned up";
                handled = true;
            } else if (event.key === "ArrowDown") {
                const res = CartesianViewportOperationCoordinator.transform(
                    currentViewport,
                    coordinateSpace,
                    targetAxes.filter(a => a.axis === "y"),
                    { panDeltaPx: { x: 0, y: -yPanStep } },
                    coordinatorOptions
                );
                nextState = res.viewport;
                changedAxes = res.changedAxes;
                announcement = "Panned down";
                handled = true;
            }
        } else if (event.key === "+" || event.key === "=") {
            const res = CartesianViewportOperationCoordinator.transform(
                currentViewport,
                coordinateSpace,
                targetAxes,
                { anchor: center, zoomFactor: zoomInFactor },
                coordinatorOptions
            );
            nextState = res.viewport;
            changedAxes = res.changedAxes;
            announcement = "Zoomed in";
            handled = true;
        } else if (event.key === "-" || event.key === "_") {
            const res = CartesianViewportOperationCoordinator.transform(
                currentViewport,
                coordinateSpace,
                targetAxes,
                { anchor: center, zoomFactor: zoomOutFactor },
                coordinatorOptions
            );
            nextState = res.viewport;
            changedAxes = res.changedAxes;
            announcement = "Zoomed out";
            handled = true;
        } else if (event.key === "0") {
            const res = CartesianViewportOperationCoordinator.reset(
                currentViewport,
                coordinateSpace,
                defaultViewport,
                undefined,
                coordinatorOptions
            );
            nextState = res.viewport;
            changedAxes = res.changedAxes;
            announcement = "Viewport reset to full range";
            handled = true;
        }

        if (handled && !areInternalViewportStatesEqual(currentViewport, nextState)) {
            return { announcement, changedAxes, handled: true, nextState };
        }

        return { announcement: null, changedAxes: [], handled, nextState: null };
    }
}
