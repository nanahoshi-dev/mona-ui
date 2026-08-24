import type { CartesianXYChartScene } from "../../../scene/chart-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import { setSvgAttribute } from "../svg-attribute-utils";
import { SvgKeyedGroup } from "../svg-keyed-group";

interface AxisPathItem {
    readonly d: string;
    readonly id: string;
}

export class SvgCartesianAxisRenderer {
    readonly #keyedGroup: SvgKeyedGroup<AxisPathItem, SVGPathElement>;

    public constructor(container: SVGGElement) {
        this.#keyedGroup = new SvgKeyedGroup<AxisPathItem, SVGPathElement>(container);
    }

    public clear(): void {
        this.#keyedGroup.clear();
    }

    public destroy(): void {
        this.#keyedGroup.destroy();
    }

    public render(scene: CartesianXYChartScene, styleResolver: ChartStyleResolver): void {
        const { axes, plotRect } = scene;
        if (plotRect.width <= 0 || plotRect.height <= 0) {
            this.#keyedGroup.clear();
            return;
        }

        const axisLineColor =
            styleResolver.resolveCssVariable("--mona-chart-axis-line-color") ||
            styleResolver.resolveCssVariable("--color-border-control") ||
            "rgba(148, 163, 184, 0.5)";

        const items: AxisPathItem[] = [];

        for (const axisScene of axes) {
            if (!axisScene.visible) {
                continue;
            }

            const pathSegments: string[] = [];
            const sideOffset = axisScene.sideOffset ?? 0;

            if (axisScene.axisLine) {
                if (axisScene.axis === "x") {
                    const y =
                        axisScene.position === "top"
                            ? Math.round(plotRect.y - sideOffset)
                            : Math.round(plotRect.y + plotRect.height + sideOffset);
                    pathSegments.push(`M ${plotRect.x} ${y} H ${plotRect.x + plotRect.width}`);
                } else if (axisScene.axis === "y") {
                    const x =
                        axisScene.position === "right"
                            ? Math.round(plotRect.x + plotRect.width + sideOffset)
                            : Math.round(plotRect.x - sideOffset);
                    pathSegments.push(`M ${x} ${plotRect.y} V ${plotRect.y + plotRect.height}`);
                }
            }

            if (axisScene.tickMarks && axisScene.ticks.length > 0) {
                const tickSize = axisScene.tickSize ?? 6;
                if (axisScene.axis === "x") {
                    const baselineY =
                        axisScene.position === "top"
                            ? plotRect.y - sideOffset
                            : plotRect.y + plotRect.height + sideOffset;
                    const targetY = axisScene.position === "top" ? baselineY - tickSize : baselineY + tickSize;
                    const roundedBaselineY = Math.round(baselineY);
                    const roundedTargetY = Math.round(targetY);
                    for (const tick of axisScene.ticks) {
                        const x = Math.round(tick.coordinate);
                        pathSegments.push(`M ${x} ${roundedBaselineY} V ${roundedTargetY}`);
                    }
                } else if (axisScene.axis === "y") {
                    const baselineX =
                        axisScene.position === "right"
                            ? plotRect.x + plotRect.width + sideOffset
                            : plotRect.x - sideOffset;
                    const targetX = axisScene.position === "right" ? baselineX + tickSize : baselineX - tickSize;
                    const roundedBaselineX = Math.round(baselineX);
                    const roundedTargetX = Math.round(targetX);
                    for (const tick of axisScene.ticks) {
                        const y = Math.round(tick.coordinate);
                        pathSegments.push(`M ${roundedBaselineX} ${y} H ${roundedTargetX}`);
                    }
                }
            }

            if (pathSegments.length > 0) {
                items.push({
                    d: pathSegments.join(" "),
                    id: `${axisScene.axis}:${axisScene.axisId ?? "default"}`
                });
            }
        }

        this.#keyedGroup.reconcile(items, {
            key: item => item.id,
            tag: "path",
            update: (element, item) => {
                setSvgAttribute(element, "d", item.d);
                setSvgAttribute(element, "fill", "none");
                setSvgAttribute(element, "stroke", axisLineColor);
                setSvgAttribute(element, "stroke-width", 1);
                setSvgAttribute(element, "shape-rendering", "crispEdges");
            }
        });
    }
}
