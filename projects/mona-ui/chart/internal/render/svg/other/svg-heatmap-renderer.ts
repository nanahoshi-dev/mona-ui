import type { ChartInteractionState } from "../../../interaction/chart-interaction-state";
import type { CartesianHeatmapChartScene } from "../../../scene/chart-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import type { SceneHeatmapCell } from "../../../../models/chart-heatmap.models";
import { buildRoundedRectPath } from "../../geometry/rounded-rect-path-builder";
import { setSvgAttribute } from "../svg-attribute-utils";
import { createSvgElement } from "../svg-element-utils";
import { SvgKeyedGroup } from "../svg-keyed-group";

interface HeatmapRenderCellItem {
    readonly cell: SceneHeatmapCell;
    readonly key: string;
    readonly seriesId: string;
}

export class SvgHeatmapRenderer {
    readonly #container: SVGGElement;
    readonly #gridGroup: SVGGElement;
    readonly #cellsGroup: SVGGElement;
    readonly #labelsGroup: SVGGElement;
    readonly #axesGroup: SVGGElement;
    readonly #highlightGroup: SVGGElement;

    #gridPath: SVGPathElement | null = null;
    #axisPath: SVGPathElement | null = null;

    readonly #cellKeyedGroup: SvgKeyedGroup<HeatmapRenderCellItem, SVGElement>;
    readonly #labelKeyedGroup: SvgKeyedGroup<HeatmapRenderCellItem, SVGTextElement>;

    public constructor(container: SVGGElement) {
        this.#container = container;

        this.#gridGroup = createSvgElement("g");
        this.#gridGroup.setAttribute("data-heatmap-layer", "grid");
        this.#container.appendChild(this.#gridGroup);

        this.#cellsGroup = createSvgElement("g");
        this.#cellsGroup.setAttribute("data-heatmap-layer", "cells");
        this.#container.appendChild(this.#cellsGroup);

        this.#labelsGroup = createSvgElement("g");
        this.#labelsGroup.setAttribute("data-heatmap-layer", "labels");
        this.#container.appendChild(this.#labelsGroup);

        this.#axesGroup = createSvgElement("g");
        this.#axesGroup.setAttribute("data-heatmap-layer", "axes");
        this.#container.appendChild(this.#axesGroup);

        this.#highlightGroup = createSvgElement("g");
        this.#highlightGroup.setAttribute("data-heatmap-layer", "highlight");
        this.#container.appendChild(this.#highlightGroup);

        this.#cellKeyedGroup = new SvgKeyedGroup<HeatmapRenderCellItem, SVGElement>(this.#cellsGroup);
        this.#labelKeyedGroup = new SvgKeyedGroup<HeatmapRenderCellItem, SVGTextElement>(this.#labelsGroup);
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

        // 2. Cells
        const allCells: HeatmapRenderCellItem[] = [];
        const labelCells: HeatmapRenderCellItem[] = [];

        for (const s of series) {
            for (const cell of s.cells) {
                if (cell.width <= 0 || cell.height <= 0) continue;
                const key = `${s.id}:${cell.animationKey || `${cell.xIndex}:${cell.yIndex}`}`;
                const item: HeatmapRenderCellItem = { cell, key, seriesId: s.id };
                allCells.push(item);
                if ((s.showLabels || cell.showLabel) && cell.width >= 20 && cell.height >= 12 && Boolean(cell.formattedValue)) {
                    labelCells.push({ cell, key: `lbl:${key}`, seriesId: s.id });
                }
            }
        }

        this.#cellKeyedGroup.reconcile(allCells, {
            key: item => item.key,
            tag: item => (item.cell.borderRadius > 0 ? "path" : "rect"),
            update: (element, item) => {
                const cell = item.cell;
                const alpha = Math.max(0, Math.min(1, cell.opacity ?? 1));
                if (cell.borderRadius <= 0) {
                    setSvgAttribute(element, "x", cell.x);
                    setSvgAttribute(element, "y", cell.y);
                    setSvgAttribute(element, "width", cell.width);
                    setSvgAttribute(element, "height", cell.height);
                } else {
                    const d = buildRoundedRectPath(cell.x, cell.y, cell.width, cell.height, {
                        bottomLeft: cell.borderRadius,
                        bottomRight: cell.borderRadius,
                        topLeft: cell.borderRadius,
                        topRight: cell.borderRadius
                    });
                    setSvgAttribute(element, "d", d);
                }
                setSvgAttribute(element, "fill", cell.backgroundColor);
                setSvgAttribute(element, "opacity", alpha);
                if (cell.borderWidth > 0 && cell.borderColor) {
                    setSvgAttribute(element, "stroke", cell.borderColor);
                    setSvgAttribute(element, "stroke-width", cell.borderWidth);
                } else {
                    setSvgAttribute(element, "stroke", "none");
                    setSvgAttribute(element, "stroke-width", 0);
                }
            }
        });

        // 2b. Labels
        this.#labelKeyedGroup.reconcile(labelCells, {
            key: item => item.key,
            tag: "text",
            update: (text, item) => {
                const cell = item.cell;
                const alpha = Math.max(0, Math.min(1, cell.opacity ?? 1));
                text.textContent = cell.formattedValue;
                setSvgAttribute(text, "x", cell.x + cell.width / 2);
                setSvgAttribute(text, "y", cell.y + cell.height / 2);
                setSvgAttribute(text, "text-anchor", "middle");
                setSvgAttribute(text, "dominant-baseline", "middle");
                setSvgAttribute(text, "fill", cell.labelColor || "#ffffff");
                setSvgAttribute(text, "opacity", alpha);
                text.style.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
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
            const b = hit?.visualBounds ?? hit?.bounds ?? (hit as any)?.rect;
            if (hit && b) {
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
                    const hoverColor =
                        styleResolver.resolveCssVariable("--mona-chart-heatmap-hover-outline-color") ||
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
        this.#cellKeyedGroup.clear();
        this.#labelKeyedGroup.clear();
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
        this.#cellKeyedGroup.destroy();
        this.#labelKeyedGroup.destroy();
        this.#gridGroup.remove();
        this.#cellsGroup.remove();
        this.#labelsGroup.remove();
        this.#axesGroup.remove();
        this.#highlightGroup.remove();
    }
}
