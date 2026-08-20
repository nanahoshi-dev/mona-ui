import type { ChartInteractionState } from "../../../interaction/chart-interaction-state";
import type { TreemapChartScene } from "../../../scene/hierarchical-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import { buildRoundedRectPath } from "../../geometry/rounded-rect-path-builder";
import { setSvgAttribute } from "../svg-attribute-utils";
import { createSvgElement } from "../svg-element-utils";

export class SvgTreemapRenderer {
    readonly #container: SVGGElement;
    readonly #nodesGroup: SVGGElement;
    readonly #highlightGroup: SVGGElement;

    public constructor(container: SVGGElement) {
        this.#container = container;

        this.#nodesGroup = createSvgElement("g");
        this.#nodesGroup.setAttribute("data-treemap-layer", "nodes");
        this.#container.appendChild(this.#nodesGroup);

        this.#highlightGroup = createSvgElement("g");
        this.#highlightGroup.setAttribute("data-treemap-layer", "highlight");
        this.#container.appendChild(this.#highlightGroup);
    }

    public render(
        scene: TreemapChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { plotRect, series } = scene;
        if (plotRect.width <= 0 || plotRect.height <= 0 || series.length === 0) {
            this.clear();
            return;
        }

        // 1. Nodes
        while (this.#nodesGroup.firstChild) this.#nodesGroup.firstChild.remove();
        for (const s of series) {
            const { nodes, renderOpacity = 1, style } = s;
            if (nodes.length === 0 || renderOpacity <= 0) continue;

            const borderRadius = style.borderRadius ?? 0;
            const strokeWidth = style.strokeWidth ?? 0;
            const strokeColor = style.strokeColor;
            const parentFillOpacity = style.parentFillOpacity ?? 0.15;
            const leafFillOpacity = style.fillOpacity ?? 1;

            for (const node of nodes) {
                const nodeOpacity = node.renderOpacity ?? 1;
                if (nodeOpacity <= 0 || node.bounds.width <= 0 || node.bounds.height <= 0) continue;

                const isRenderTerminal = node.isLeaf || node.isCollapsed;
                const fillAlpha = isRenderTerminal ? leafFillOpacity : parentFillOpacity;
                const alpha = renderOpacity * nodeOpacity * fillAlpha;

                const rectEl = borderRadius > 0 ? createSvgElement("path") : createSvgElement("rect");
                if (borderRadius > 0) {
                    const d = buildRoundedRectPath(node.bounds.x, node.bounds.y, node.bounds.width, node.bounds.height, {
                        bottomLeft: borderRadius,
                        bottomRight: borderRadius,
                        topLeft: borderRadius,
                        topRight: borderRadius
                    });
                    setSvgAttribute(rectEl, "d", d);
                } else {
                    setSvgAttribute(rectEl, "x", node.bounds.x);
                    setSvgAttribute(rectEl, "y", node.bounds.y);
                    setSvgAttribute(rectEl, "width", node.bounds.width);
                    setSvgAttribute(rectEl, "height", node.bounds.height);
                }

                setSvgAttribute(rectEl, "fill", node.fillColor);
                setSvgAttribute(rectEl, "opacity", alpha);

                if (strokeWidth > 0 && strokeColor) {
                    setSvgAttribute(rectEl, "stroke", strokeColor);
                    setSvgAttribute(rectEl, "stroke-width", strokeWidth);
                } else {
                    setSvgAttribute(rectEl, "stroke", "none");
                    setSvgAttribute(rectEl, "stroke-width", 0);
                }
                this.#nodesGroup.appendChild(rectEl);

                // Parent header bar if present
                if (!isRenderTerminal && node.headerBounds && node.headerBounds.width > 0 && node.headerBounds.height > 0) {
                    const headerAlpha = renderOpacity * nodeOpacity * (parentFillOpacity * 2);
                    const headerEl = borderRadius > 0 ? createSvgElement("path") : createSvgElement("rect");
                    if (borderRadius > 0) {
                        const d = buildRoundedRectPath(
                            node.headerBounds.x,
                            node.headerBounds.y,
                            node.headerBounds.width,
                            node.headerBounds.height,
                            {
                                bottomLeft: borderRadius,
                                bottomRight: borderRadius,
                                topLeft: borderRadius,
                                topRight: borderRadius
                            }
                        );
                        setSvgAttribute(headerEl, "d", d);
                    } else {
                        setSvgAttribute(headerEl, "x", node.headerBounds.x);
                        setSvgAttribute(headerEl, "y", node.headerBounds.y);
                        setSvgAttribute(headerEl, "width", node.headerBounds.width);
                        setSvgAttribute(headerEl, "height", node.headerBounds.height);
                    }
                    setSvgAttribute(headerEl, "fill", node.fillColor);
                    setSvgAttribute(headerEl, "opacity", headerAlpha);
                    this.#nodesGroup.appendChild(headerEl);
                }
            }
        }

        // 2. Highlight
        while (this.#highlightGroup.firstChild) this.#highlightGroup.firstChild.remove();
        if (interactionState) {
            const isKeyboard = interactionState.source === "keyboard";
            const hit = interactionState.activeHitTarget ?? interactionState.activeHits[0];
            if (hit && hit.seriesType === "treemap" && hit.bounds) {
                const b = hit.visualBounds ?? hit.bounds;
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
                        styleResolver.resolveCssVariable("--mona-chart-treemap-hover-outline-color") ||
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
        while (this.#nodesGroup.firstChild) this.#nodesGroup.firstChild.remove();
        while (this.#highlightGroup.firstChild) this.#highlightGroup.firstChild.remove();
    }

    public destroy(): void {
        this.clear();
        this.#nodesGroup.remove();
        this.#highlightGroup.remove();
    }
}
