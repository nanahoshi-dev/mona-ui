import type { CartesianXYChartScene } from "../../../scene/chart-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import { setSvgAttribute } from "../svg-attribute-utils";
import { SvgKeyedGroup } from "../svg-keyed-group";

interface GridPathItem {
    readonly d: string;
    readonly id: string;
}

export class SvgCartesianGridRenderer {
    readonly #keyedGroup: SvgKeyedGroup<GridPathItem, SVGPathElement>;

    public constructor(container: SVGGElement) {
        this.#keyedGroup = new SvgKeyedGroup<GridPathItem, SVGPathElement>(container);
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

        const gridColor =
            styleResolver.resolveCssVariable("--mona-chart-grid-color") ||
            "rgba(148, 163, 184, 0.2)";

        const items: GridPathItem[] = [];

        for (const axisScene of axes) {
            if (!axisScene.visible || !axisScene.gridLines) {
                continue;
            }
            const pathSegments: string[] = [];
            if (axisScene.axis === "y") {
                for (const tick of axisScene.ticks) {
                    const y = Math.round(tick.coordinate);
                    pathSegments.push(`M ${plotRect.x} ${y} H ${plotRect.x + plotRect.width}`);
                }
            } else if (axisScene.axis === "x") {
                for (const tick of axisScene.ticks) {
                    const x = Math.round(tick.coordinate);
                    pathSegments.push(`M ${x} ${plotRect.y} V ${plotRect.y + plotRect.height}`);
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
                setSvgAttribute(element, "stroke", gridColor);
                setSvgAttribute(element, "stroke-width", 1);
                setSvgAttribute(element, "shape-rendering", "crispEdges");
            }
        });
    }
}
