import type { ChartInteractionState } from "../../../interaction/chart-interaction-state";
import type { CartesianHeatmapChartScene } from "../../../scene/chart-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import { buildRoundedRectPath } from "../../geometry/rounded-rect-path-builder";
import { setSvgAttribute } from "../svg-attribute-utils";
import { createSvgElement } from "../svg-element-utils";

export class SvgHeatmapRenderer {
    readonly #container: SVGGElement;
    readonly #gridGroup: SVGGElement;
    readonly #cellsGroup: SVGGElement;
    readonly #axesGroup: SVGGElement;
    readonly #highlightGroup: SVGGElement;

    public constructor(container: SVGGElement) {
        this.#container = container;

        this.#gridGroup = createSvgElement("g");
        this.#gridGroup.setAttribute("data-heatmap-layer", "grid");
        this.#container.appendChild(this.#gridGroup);

        this.#cellsGroup = createSvgElement("g");
        this.#cellsGroup.setAttribute("data-heatmap-layer", "cells");
        this.#container.appendChild(this.#cellsGroup);

        this.#axesGroup = createSvgElement("g");
        this.#axesGroup.setAttribute("data-heatmap-layer", "axes");
        this.#container.appendChild(this.#axesGroup);

        this.#highlightGroup = createSvgElement("g");
        this.#highlightGroup.setAttribute("data-heatmap-layer", "highlight");
        this.#container.appendChild(this.#highlightGroup);
    }

    public render(
        scene: CartesianHeatmapChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { axes, plotRect, series, xCategories, yCategories } = scene;
        if (plotRect.width <= 0 || plotRect.height <= 0) {
            this.clear();
            return;
        }

        // 1. Grid
        while (this.#gridGroup.firstChild) this.#gridGroup.firstChild.remove();
        const gridColor =
            styleResolver.resolveCssVariable("--mona-chart-grid-color") ||
            "rgba(148, 163, 184, 0.2)";

        const gridSegments: string[] = [];
        const xAxisScene = axes.find(a => a.axis === "x");
        const yAxisScene = axes.find(a => a.axis === "y");

        if (yAxisScene?.visible && yAxisScene.gridLines && yCategories.length > 0) {
            const bandHeight = plotRect.height / yCategories.length;
            for (let i = 0; i <= yCategories.length; i++) {
                const y = Math.round(plotRect.y + i * bandHeight);
                gridSegments.push(`M ${plotRect.x} ${y} H ${plotRect.x + plotRect.width}`);
            }
        }
        if (xAxisScene?.visible && xAxisScene.gridLines && xCategories.length > 0) {
            const bandWidth = plotRect.width / xCategories.length;
            for (let i = 0; i <= xCategories.length; i++) {
                const x = Math.round(plotRect.x + i * bandWidth);
                gridSegments.push(`M ${x} ${plotRect.y} V ${plotRect.y + plotRect.height}`);
            }
        }
        if (gridSegments.length > 0) {
            const gridPath = createSvgElement("path");
            setSvgAttribute(gridPath, "d", gridSegments.join(" "));
            setSvgAttribute(gridPath, "fill", "none");
            setSvgAttribute(gridPath, "stroke", gridColor);
            setSvgAttribute(gridPath, "stroke-width", 1);
            setSvgAttribute(gridPath, "shape-rendering", "crispEdges");
            this.#gridGroup.appendChild(gridPath);
        }

        // 2. Cells
        while (this.#cellsGroup.firstChild) this.#cellsGroup.firstChild.remove();
        for (const s of series) {
            for (const cell of s.cells) {
                if (cell.width <= 0 || cell.height <= 0) continue;

                const alpha = Math.max(0, Math.min(1, cell.opacity ?? 1));

                if (cell.borderRadius <= 0) {
                    const rect = createSvgElement("rect");
                    setSvgAttribute(rect, "x", cell.x);
                    setSvgAttribute(rect, "y", cell.y);
                    setSvgAttribute(rect, "width", cell.width);
                    setSvgAttribute(rect, "height", cell.height);
                    setSvgAttribute(rect, "fill", cell.backgroundColor);
                    setSvgAttribute(rect, "opacity", alpha);
                    if (cell.borderWidth > 0 && cell.borderColor) {
                        setSvgAttribute(rect, "stroke", cell.borderColor);
                        setSvgAttribute(rect, "stroke-width", cell.borderWidth);
                    }
                    this.#cellsGroup.appendChild(rect);
                } else {
                    const path = createSvgElement("path");
                    const d = buildRoundedRectPath(cell.x, cell.y, cell.width, cell.height, {
                        bottomLeft: cell.borderRadius,
                        bottomRight: cell.borderRadius,
                        topLeft: cell.borderRadius,
                        topRight: cell.borderRadius
                    });
                    setSvgAttribute(path, "d", d);
                    setSvgAttribute(path, "fill", cell.backgroundColor);
                    setSvgAttribute(path, "opacity", alpha);
                    if (cell.borderWidth > 0 && cell.borderColor) {
                        setSvgAttribute(path, "stroke", cell.borderColor);
                        setSvgAttribute(path, "stroke-width", cell.borderWidth);
                    }
                    this.#cellsGroup.appendChild(path);
                }

                if ((s.showLabels || cell.showLabel) && cell.width >= 20 && cell.height >= 12 && cell.formattedValue) {
                    const text = createSvgElement("text");
                    text.textContent = cell.formattedValue;
                    setSvgAttribute(text, "x", cell.x + cell.width / 2);
                    setSvgAttribute(text, "y", cell.y + cell.height / 2);
                    setSvgAttribute(text, "text-anchor", "middle");
                    setSvgAttribute(text, "dominant-baseline", "middle");
                    setSvgAttribute(text, "fill", cell.labelColor || "#ffffff");
                    setSvgAttribute(text, "opacity", alpha);
                    text.style.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
                    this.#cellsGroup.appendChild(text);
                }
            }
        }

        // 3. Axes
        while (this.#axesGroup.firstChild) this.#axesGroup.firstChild.remove();
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
            const axisPath = createSvgElement("path");
            setSvgAttribute(axisPath, "d", axisSegments.join(" "));
            setSvgAttribute(axisPath, "fill", "none");
            setSvgAttribute(axisPath, "stroke", axisLineColor);
            setSvgAttribute(axisPath, "stroke-width", 1);
            setSvgAttribute(axisPath, "shape-rendering", "crispEdges");
            this.#axesGroup.appendChild(axisPath);
        }

        // 4. Highlight
        while (this.#highlightGroup.firstChild) this.#highlightGroup.firstChild.remove();
        if (interactionState) {
            const isKeyboard = interactionState.source === "keyboard";
            const hit = interactionState.activeHitTarget;
            if (hit?.bounds) {
                const b = hit.bounds;
                const radius = hit.borderRadius ?? 0;
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
                    const focusIndicatorColor =
                        styleResolver.resolveCssVariable("--color-focus-indicator") ||
                        styleResolver.resolveCssVariable("--color-ring") ||
                        "#3b82f6";
                    setSvgAttribute(highlightEl, "fill", "none");
                    setSvgAttribute(highlightEl, "stroke", focusIndicatorColor);
                    setSvgAttribute(highlightEl, "stroke-width", 2.5);
                } else {
                    setSvgAttribute(highlightEl, "fill", "none");
                    setSvgAttribute(highlightEl, "stroke", "rgba(255, 255, 255, 0.9)");
                    setSvgAttribute(highlightEl, "stroke-width", 2);
                }

                this.#highlightGroup.appendChild(highlightEl);
            }
        }
    }

    public clear(): void {
        while (this.#gridGroup.firstChild) this.#gridGroup.firstChild.remove();
        while (this.#cellsGroup.firstChild) this.#cellsGroup.firstChild.remove();
        while (this.#axesGroup.firstChild) this.#axesGroup.firstChild.remove();
        while (this.#highlightGroup.firstChild) this.#highlightGroup.firstChild.remove();
    }

    public destroy(): void {
        this.clear();
        this.#gridGroup.remove();
        this.#cellsGroup.remove();
        this.#axesGroup.remove();
        this.#highlightGroup.remove();
    }
}
