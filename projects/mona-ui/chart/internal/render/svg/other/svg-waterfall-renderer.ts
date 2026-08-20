import type { ChartInteractionState } from "../../../interaction/chart-interaction-state";
import type { CartesianWaterfallChartScene, SceneWaterfallBar, SceneWaterfallConnector } from "../../../scene/waterfall-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import { buildRoundedRectPath } from "../../geometry/rounded-rect-path-builder";
import { setSvgAttribute } from "../svg-attribute-utils";
import { createSvgElement } from "../svg-element-utils";
import { SvgKeyedGroup } from "../svg-keyed-group";

interface WaterfallRenderBarItem {
    readonly alpha: number;
    readonly bar: SceneWaterfallBar;
    readonly key: string;
    readonly strokeColor?: string;
    readonly strokeWidth: number;
}

interface WaterfallRenderConnectorItem {
    readonly alpha: number;
    readonly conn: SceneWaterfallConnector;
    readonly key: string;
}

export class SvgWaterfallRenderer {
    readonly #container: SVGGElement;
    readonly #gridGroup: SVGGElement;
    readonly #connectorsGroup: SVGGElement;
    readonly #barsGroup: SVGGElement;
    readonly #axesGroup: SVGGElement;
    readonly #highlightGroup: SVGGElement;

    #gridPath: SVGPathElement | null = null;
    #axisPath: SVGPathElement | null = null;

    readonly #connectorKeyedGroup: SvgKeyedGroup<WaterfallRenderConnectorItem, SVGLineElement>;
    readonly #barKeyedGroup: SvgKeyedGroup<WaterfallRenderBarItem, SVGElement>;

    public constructor(container: SVGGElement) {
        this.#container = container;

        this.#gridGroup = createSvgElement("g");
        this.#gridGroup.setAttribute("data-waterfall-layer", "grid");
        this.#container.appendChild(this.#gridGroup);

        this.#connectorsGroup = createSvgElement("g");
        this.#connectorsGroup.setAttribute("data-waterfall-layer", "connectors");
        this.#container.appendChild(this.#connectorsGroup);

        this.#barsGroup = createSvgElement("g");
        this.#barsGroup.setAttribute("data-waterfall-layer", "bars");
        this.#container.appendChild(this.#barsGroup);

        this.#axesGroup = createSvgElement("g");
        this.#axesGroup.setAttribute("data-waterfall-layer", "axes");
        this.#container.appendChild(this.#axesGroup);

        this.#highlightGroup = createSvgElement("g");
        this.#highlightGroup.setAttribute("data-waterfall-layer", "highlight");
        this.#container.appendChild(this.#highlightGroup);

        this.#connectorKeyedGroup = new SvgKeyedGroup<WaterfallRenderConnectorItem, SVGLineElement>(this.#connectorsGroup);
        this.#barKeyedGroup = new SvgKeyedGroup<WaterfallRenderBarItem, SVGElement>(this.#barsGroup);
    }

    public render(
        scene: CartesianWaterfallChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { axes, plotRect, series } = scene;
        if (plotRect.width <= 0 || plotRect.height <= 0) {
            this.clear();
            return;
        }

        // 1. Grid
        const gridColor =
            styleResolver.resolveCssVariable("--mona-chart-grid-color") ||
            "rgba(148, 163, 184, 0.2)";

        const gridSegments: string[] = [];
        for (const axisScene of axes) {
            if (!axisScene.visible || !axisScene.gridLines) continue;
            if (axisScene.axis === "y") {
                for (const tick of axisScene.ticks) {
                    const y = Math.round(tick.coordinate);
                    gridSegments.push(`M ${plotRect.x} ${y} H ${plotRect.x + plotRect.width}`);
                }
            } else if (axisScene.axis === "x") {
                for (const tick of axisScene.ticks) {
                    const x = Math.round(tick.coordinate);
                    gridSegments.push(`M ${x} ${plotRect.y} V ${plotRect.y + plotRect.height}`);
                }
            }
        }
        if (gridSegments.length > 0) {
            if (!this.#gridPath) {
                this.#gridPath = createSvgElement("path");
                this.#gridGroup.appendChild(this.#gridPath);
            }
            setSvgAttribute(this.#gridPath, "d", gridSegments.join(" "));
            setSvgAttribute(this.#gridPath, "fill", "none");
            setSvgAttribute(this.#gridPath, "stroke", gridColor);
            setSvgAttribute(this.#gridPath, "stroke-width", 1);
            setSvgAttribute(this.#gridPath, "shape-rendering", "crispEdges");
        } else if (this.#gridPath) {
            this.#gridPath.remove();
            this.#gridPath = null;
        }

        // 2. Connectors & Bars
        const connectorItems: WaterfallRenderConnectorItem[] = [];
        const barItems: WaterfallRenderBarItem[] = [];

        for (const s of series) {
            const { bars, connectors, renderOpacity = 1, style } = s;
            if (bars.length === 0 || renderOpacity <= 0) continue;

            const strokeWidth = style.strokeWidth ?? 0;
            const strokeColor = style.strokeColor;
            const fillOpacity = style.fillOpacity ?? 1;

            // Connectors
            for (const conn of connectors) {
                const connOpacity = conn.renderOpacity ?? 1;
                if (connOpacity <= 0 || conn.width <= 0 || conn.fromX >= conn.toX) continue;

                connectorItems.push({
                    alpha: renderOpacity * connOpacity,
                    conn,
                    key: conn.animationKey || `conn:${conn.fromAnimationKey}:${conn.toAnimationKey}`
                });
            }

            // Bars
            for (const bar of bars) {
                const barOpacity = bar.renderOpacity ?? 1;
                if (barOpacity <= 0 || bar.bounds.width <= 0 || bar.bounds.height <= 0) continue;

                barItems.push({
                    alpha: renderOpacity * barOpacity * fillOpacity,
                    bar,
                    key: bar.animationKey || String(bar.dataIndex),
                    strokeColor,
                    strokeWidth
                });
            }
        }

        this.#connectorKeyedGroup.reconcile(connectorItems, {
            key: item => item.key,
            tag: "line",
            update: (lineEl, item) => {
                setSvgAttribute(lineEl, "x1", item.conn.fromX);
                setSvgAttribute(lineEl, "y1", item.conn.y);
                setSvgAttribute(lineEl, "x2", item.conn.toX);
                setSvgAttribute(lineEl, "y2", item.conn.y);
                setSvgAttribute(lineEl, "stroke", item.conn.color);
                setSvgAttribute(lineEl, "stroke-width", item.conn.width);
                setSvgAttribute(lineEl, "stroke-dasharray", "4 4");
                setSvgAttribute(lineEl, "opacity", item.alpha);
            }
        });

        this.#barKeyedGroup.reconcile(barItems, {
            key: item => item.key,
            tag: item => (item.bar.borderRadius > 0 && !item.bar.isZeroChange ? "path" : "rect"),
            update: (element, item) => {
                const bar = item.bar;
                if (bar.borderRadius > 0 && !bar.isZeroChange) {
                    const d = buildRoundedRectPath(bar.bounds.x, bar.bounds.y, bar.bounds.width, bar.bounds.height, {
                        bottomLeft: bar.borderRadius,
                        bottomRight: bar.borderRadius,
                        topLeft: bar.borderRadius,
                        topRight: bar.borderRadius
                    });
                    setSvgAttribute(element, "d", d);
                } else {
                    setSvgAttribute(element, "x", bar.bounds.x);
                    setSvgAttribute(element, "y", bar.bounds.y);
                    setSvgAttribute(element, "width", bar.bounds.width);
                    setSvgAttribute(element, "height", bar.bounds.height);
                }

                setSvgAttribute(element, "fill", bar.color);
                setSvgAttribute(element, "opacity", item.alpha);

                if (item.strokeWidth > 0 && item.strokeColor) {
                    setSvgAttribute(element, "stroke", item.strokeColor);
                    setSvgAttribute(element, "stroke-width", item.strokeWidth);
                } else {
                    setSvgAttribute(element, "stroke", "none");
                    setSvgAttribute(element, "stroke-width", 0);
                }
            }
        });

        // 3. Axes
        const axisLineColor =
            styleResolver.resolveCssVariable("--mona-chart-axis-line-color") ||
            styleResolver.resolveCssVariable("--color-border-control") ||
            "rgba(148, 163, 184, 0.45)";

        const axisSegments: string[] = [];
        for (const axisScene of axes) {
            if (!axisScene.visible || !axisScene.axisLine) continue;
            if (axisScene.axis === "y") {
                const x =
                    axisScene.position === "right"
                        ? Math.round(plotRect.x + plotRect.width)
                        : Math.round(plotRect.x);
                axisSegments.push(`M ${x} ${plotRect.y} V ${plotRect.y + plotRect.height}`);
            } else if (axisScene.axis === "x") {
                const y =
                    axisScene.position === "top"
                        ? Math.round(plotRect.y)
                        : Math.round(plotRect.y + plotRect.height);
                axisSegments.push(`M ${plotRect.x} ${y} H ${plotRect.x + plotRect.width}`);
            }
        }
        if (axisSegments.length > 0) {
            if (!this.#axisPath) {
                this.#axisPath = createSvgElement("path");
                this.#axesGroup.appendChild(this.#axisPath);
            }
            setSvgAttribute(this.#axisPath, "d", axisSegments.join(" "));
            setSvgAttribute(this.#axisPath, "fill", "none");
            setSvgAttribute(this.#axisPath, "stroke", axisLineColor);
            setSvgAttribute(this.#axisPath, "stroke-width", 1);
            setSvgAttribute(this.#axisPath, "shape-rendering", "crispEdges");
        } else if (this.#axisPath) {
            this.#axisPath.remove();
            this.#axisPath = null;
        }

        // 4. Highlight
        while (this.#highlightGroup.firstChild) this.#highlightGroup.firstChild.remove();
        if (interactionState) {
            const isKeyboard = interactionState.source === "keyboard";
            const hit = interactionState.activeHitTarget ?? interactionState.activeHits[0];
            if (hit && hit.seriesType === "waterfall" && hit.bounds) {
                const b = hit.visualBounds ?? hit.bounds;
                const radius = hit.borderRadius ?? 4;

                const highlightEl = radius > 0 ? createSvgElement("path") : createSvgElement("rect");
                if (radius > 0) {
                    const d = buildRoundedRectPath(b.x, b.y, b.width, b.height, {
                        bottomLeft: radius,
                        bottomRight: radius,
                        topLeft: radius,
                        topRight: radius
                    });
                    setSvgAttribute(highlightEl, "d", d);
                } else {
                    setSvgAttribute(highlightEl, "x", b.x);
                    setSvgAttribute(highlightEl, "y", b.y);
                    setSvgAttribute(highlightEl, "width", b.width);
                    setSvgAttribute(highlightEl, "height", b.height);
                }

                if (isKeyboard) {
                    const focusColor =
                        styleResolver.resolveCssVariable("--color-ring") ||
                        styleResolver.resolveCssVariable("--color-focus-indicator") ||
                        styleResolver.resolveCssVariable("--color-primary") ||
                        "#3b82f6";
                    setSvgAttribute(highlightEl, "fill", "none");
                    setSvgAttribute(highlightEl, "stroke", focusColor);
                    setSvgAttribute(highlightEl, "stroke-width", 2.5);
                } else {
                    const hoverColor =
                        styleResolver.resolveCssVariable("--mona-chart-waterfall-hover-outline-color") ||
                        styleResolver.resolveCssVariable("--color-border-control") ||
                        "rgba(255, 255, 255, 0.85)";
                    setSvgAttribute(highlightEl, "fill", "none");
                    setSvgAttribute(highlightEl, "stroke", hoverColor);
                    setSvgAttribute(highlightEl, "stroke-width", 1.5);
                }

                this.#highlightGroup.appendChild(highlightEl);
            }
        }
    }

    public clear(): void {
        this.#connectorKeyedGroup.clear();
        this.#barKeyedGroup.clear();
        if (this.#gridPath) {
            this.#gridPath.remove();
            this.#gridPath = null;
        }
        if (this.#axisPath) {
            this.#axisPath.remove();
            this.#axisPath = null;
        }
        while (this.#highlightGroup.firstChild) this.#highlightGroup.firstChild.remove();
    }

    public destroy(): void {
        this.clear();
        this.#connectorKeyedGroup.destroy();
        this.#barKeyedGroup.destroy();
        this.#gridGroup.remove();
        this.#connectorsGroup.remove();
        this.#barsGroup.remove();
        this.#axesGroup.remove();
        this.#highlightGroup.remove();
    }
}
