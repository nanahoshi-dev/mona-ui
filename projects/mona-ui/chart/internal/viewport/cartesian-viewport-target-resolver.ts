import type { ChartAxisScene } from "../scene/cartesian-scene";
import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type {
    ChartNavigationAxisTarget,
    ChartViewportAxisRef
} from "../../models/chart-viewport.models";
import type { NormalizedChartNavigationOptions } from "./chart-navigation-options";

export interface ResolvedTargetAxes {
    readonly isAxisGutterHit: boolean;
    readonly targetAxes: readonly ChartViewportAxisRef[];
}

export class CartesianViewportTargetResolver {
    public static resolveTargets(
        pointer: ChartPoint | null,
        plotRect: ChartRect,
        axisScenes: readonly ChartAxisScene[],
        options: NormalizedChartNavigationOptions,
        orientation: "horizontal" | "vertical",
        explicitTarget?: ChartNavigationAxisTarget
    ): ResolvedTargetAxes {
        const targetOption = explicitTarget ?? options.panAxes;

        if (pointer) {
            const gutterAxis = this.findAxisAtPoint(pointer, plotRect, axisScenes);
            if (gutterAxis) {
                const axisId = gutterAxis.axisId ?? (gutterAxis.axis === "x" ? "default-x" : "default-y");
                if (targetOption !== "auto" && targetOption !== "xy") {
                    const explicitAxes = this.resolveExplicitTarget(targetOption, axisScenes);
                    const isAllowed = explicitAxes.some(a => a.axisId === axisId && a.axis === gutterAxis.axis);
                    if (isAllowed) {
                        return {
                            isAxisGutterHit: true,
                            targetAxes: [{ axis: gutterAxis.axis, axisId }]
                        };
                    }
                    return {
                        isAxisGutterHit: false,
                        targetAxes: []
                    };
                }
                return {
                    isAxisGutterHit: true,
                    targetAxes: [{ axis: gutterAxis.axis, axisId }]
                };
            }
        }

        // Inside plotRect or no pointer
        if (targetOption !== "auto") {
            return {
                isAxisGutterHit: false,
                targetAxes: this.resolveExplicitTarget(targetOption, axisScenes)
            };
        }

        const targets: ChartViewportAxisRef[] = [];
        for (const scene of axisScenes) {
            if (!scene.visible) continue;
            const axisId = scene.axisId ?? (scene.axis === "x" ? "default-x" : "default-y");
            targets.push({ axis: scene.axis, axisId });
        }

        return {
            isAxisGutterHit: false,
            targetAxes: targets.length > 0
                ? targets
                : axisScenes.filter(s => s.visible).map(s => ({ axis: s.axis, axisId: s.axisId ?? (s.axis === "x" ? "default-x" : "default-y") }))
        };
    }

    public static resolveExplicitTarget(
        target: ChartNavigationAxisTarget,
        axisScenes: readonly ChartAxisScene[]
    ): readonly ChartViewportAxisRef[] {
        if (target === "xy" || target === "auto") {
            return axisScenes.map(s => ({
                axis: s.axis,
                axisId: s.axisId ?? (s.axis === "x" ? "default-x" : "default-y")
            }));
        }
        if (target === "x") {
            return axisScenes
                .filter(s => s.axis === "x")
                .map(s => ({ axis: "x", axisId: s.axisId ?? "default-x" }));
        }
        if (target === "y") {
            return axisScenes
                .filter(s => s.axis === "y")
                .map(s => ({ axis: "y", axisId: s.axisId ?? "default-y" }));
        }
        if (Array.isArray(target)) {
            return (target as readonly ChartNavigationAxisTarget[]).flatMap(t =>
                this.resolveExplicitTarget(t, axisScenes)
            );
        }
        if (typeof target === "object" && target !== null && "axis" in target && "axisId" in target) {
            return [target as ChartViewportAxisRef];
        }
        return axisScenes.map(s => ({
            axis: s.axis,
            axisId: s.axisId ?? (s.axis === "x" ? "default-x" : "default-y")
        }));
    }

    public static findAxisAtPoint(
        point: ChartPoint,
        plotRect: ChartRect,
        axisScenes: readonly ChartAxisScene[]
    ): ChartAxisScene | null {
        for (const scene of axisScenes) {
            if (!scene.visible || (scene.gutter ?? 0) <= 0) continue;

            const gutter = scene.gutter ?? 0;
            const sideOffset = scene.sideOffset ?? 0;
            let minX = 0;
            let maxX = 0;
            let minY = 0;
            let maxY = 0;

            switch (scene.position) {
                case "left":
                    minX = plotRect.x - sideOffset - gutter;
                    maxX = plotRect.x - sideOffset;
                    minY = plotRect.y;
                    maxY = plotRect.y + plotRect.height;
                    break;
                case "right":
                    minX = plotRect.x + plotRect.width + sideOffset;
                    maxX = plotRect.x + plotRect.width + sideOffset + gutter;
                    minY = plotRect.y;
                    maxY = plotRect.y + plotRect.height;
                    break;
                case "top":
                    minX = plotRect.x;
                    maxX = plotRect.x + plotRect.width;
                    minY = plotRect.y - sideOffset - gutter;
                    maxY = plotRect.y - sideOffset;
                    break;
                case "bottom":
                    minX = plotRect.x;
                    maxX = plotRect.x + plotRect.width;
                    minY = plotRect.y + plotRect.height + sideOffset;
                    maxY = plotRect.y + plotRect.height + sideOffset + gutter;
                    break;
            }

            if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
                return scene;
            }
        }
        return null;
    }
}
