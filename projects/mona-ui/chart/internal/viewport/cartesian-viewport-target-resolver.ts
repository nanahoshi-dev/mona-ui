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

export type CartesianNavigationProfile = "independent-x" | "independent-y" | "xy";

export class CartesianViewportTargetResolver {
    public static resolveTargets(
        pointer: ChartPoint | null,
        plotRect: ChartRect,
        axisScenes: readonly ChartAxisScene[],
        options: NormalizedChartNavigationOptions,
        orientation: "horizontal" | "vertical",
        explicitTarget?: ChartNavigationAxisTarget,
        profile?: CartesianNavigationProfile
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

        if (pointer) {
            const isInsidePlot =
                pointer.x >= plotRect.x &&
                pointer.x <= plotRect.x + plotRect.width &&
                pointer.y >= plotRect.y &&
                pointer.y <= plotRect.y + plotRect.height;
            if (!isInsidePlot) {
                return {
                    isAxisGutterHit: false,
                    targetAxes: []
                };
            }
        }

        if (targetOption === "auto") {
            if (profile === "xy") {
                return {
                    isAxisGutterHit: false,
                    targetAxes: this.resolveExplicitTarget("xy", axisScenes)
                };
            }
            if (orientation === "horizontal" || profile === "independent-y") {
                return {
                    isAxisGutterHit: false,
                    targetAxes: this.resolveExplicitTarget("y", axisScenes)
                };
            }
            return {
                isAxisGutterHit: false,
                targetAxes: this.resolveExplicitTarget("x", axisScenes)
            };
        }

        return {
            isAxisGutterHit: false,
            targetAxes: this.resolveExplicitTarget(targetOption, axisScenes)
        };
    }

    public static resolveExplicitTarget(
        target: ChartNavigationAxisTarget,
        axisScenes: readonly ChartAxisScene[]
    ): readonly ChartViewportAxisRef[] {
        const visibleScenes = axisScenes.filter(s => s.visible);
        const primaryX = visibleScenes.find(s => s.axis === "x" && s.isPrimary) ?? visibleScenes.find(s => s.axis === "x");
        const primaryY = visibleScenes.find(s => s.axis === "y" && s.isPrimary) ?? visibleScenes.find(s => s.axis === "y");

        if (target === "xy") {
            const targets: ChartViewportAxisRef[] = [];
            if (primaryX) {
                targets.push({ axis: "x", axisId: primaryX.axisId ?? "default-x" });
            }
            if (primaryY) {
                targets.push({ axis: "y", axisId: primaryY.axisId ?? "default-y" });
            }
            return targets;
        }
        if (target === "x") {
            return primaryX
                ? [{ axis: "x", axisId: primaryX.axisId ?? "default-x" }]
                : [];
        }
        if (target === "y") {
            return primaryY
                ? [{ axis: "y", axisId: primaryY.axisId ?? "default-y" }]
                : [];
        }
        if (target === "auto") {
            return primaryX
                ? [{ axis: "x", axisId: primaryX.axisId ?? "default-x" }]
                : [];
        }
        if (Array.isArray(target)) {
            const seen = new Set<string>();
            const result: ChartViewportAxisRef[] = [];
            for (const t of target) {
                const resolved = this.resolveExplicitTarget(t, axisScenes);
                for (const r of resolved) {
                    const key = `${r.axis}:${r.axisId}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        result.push(r);
                    }
                }
            }
            return result;
        }
        if (typeof target === "object" && target !== null && "axis" in target && "axisId" in target) {
            const exists = visibleScenes.some(
                s => s.axis === target.axis && (s.axisId ?? (s.axis === "x" ? "default-x" : "default-y")) === target.axisId
            );
            return exists ? [target as ChartViewportAxisRef] : [];
        }
        return [];
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
