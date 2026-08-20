import type { ChartInteractionState } from "../../../interaction/chart-interaction-state";
import type { SceneTreemapNode, TreemapChartScene } from "../../../scene/hierarchical-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import { buildRoundedRectPath } from "../../geometry/rounded-rect-path-builder";
import { setSvgAttribute } from "../svg-attribute-utils";
import { createSvgElement } from "../svg-element-utils";
import { SvgKeyedGroup } from "../svg-keyed-group";

interface TreemapRenderNodeItem {
    readonly alpha: number;
    readonly borderRadius: number;
    readonly fillColor: string;
    readonly isHeader: boolean;
    readonly key: string;
    readonly node: SceneTreemapNode;
    readonly rect: { readonly height: number; readonly width: number; readonly x: number; readonly y: number };
    readonly strokeColor?: string;
    readonly strokeWidth: number;
}

export class SvgTreemapRenderer {
    readonly #container: SVGGElement;
    readonly #nodesGroup: SVGGElement;
    readonly #highlightGroup: SVGGElement;

    readonly #nodeKeyedGroup: SvgKeyedGroup<TreemapRenderNodeItem, SVGElement>;

    public constructor(container: SVGGElement) {
        this.#container = container;

        this.#nodesGroup = createSvgElement("g");
        this.#nodesGroup.setAttribute("data-treemap-layer", "nodes");
        this.#container.appendChild(this.#nodesGroup);

        this.#highlightGroup = createSvgElement("g");
        this.#highlightGroup.setAttribute("data-treemap-layer", "highlight");
        this.#container.appendChild(this.#highlightGroup);

        this.#nodeKeyedGroup = new SvgKeyedGroup<TreemapRenderNodeItem, SVGElement>(this.#nodesGroup);
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

        // 1. Collect render items
        const renderItems: TreemapRenderNodeItem[] = [];

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

                renderItems.push({
                    alpha,
                    borderRadius,
                    fillColor: node.fillColor,
                    isHeader: false,
                    key: node.animationKey || node.nodeId,
                    node,
                    rect: node.bounds,
                    strokeColor,
                    strokeWidth
                });

                if (!isRenderTerminal && node.headerBounds && node.headerBounds.width > 0 && node.headerBounds.height > 0) {
                    const headerAlpha = renderOpacity * nodeOpacity * (parentFillOpacity * 2);
                    renderItems.push({
                        alpha: headerAlpha,
                        borderRadius,
                        fillColor: node.fillColor,
                        isHeader: true,
                        key: `hdr:${node.animationKey || node.nodeId}`,
                        node,
                        rect: node.headerBounds,
                        strokeColor: undefined,
                        strokeWidth: 0
                    });
                }
            }
        }

        this.#nodeKeyedGroup.reconcile(renderItems, {
            key: item => item.key,
            tag: item => (item.borderRadius > 0 ? "path" : "rect"),
            update: (element, item) => {
                if (item.borderRadius > 0) {
                    const d = buildRoundedRectPath(item.rect.x, item.rect.y, item.rect.width, item.rect.height, {
                        bottomLeft: item.borderRadius,
                        bottomRight: item.borderRadius,
                        topLeft: item.borderRadius,
                        topRight: item.borderRadius
                    });
                    setSvgAttribute(element, "d", d);
                } else {
                    setSvgAttribute(element, "x", item.rect.x);
                    setSvgAttribute(element, "y", item.rect.y);
                    setSvgAttribute(element, "width", item.rect.width);
                    setSvgAttribute(element, "height", item.rect.height);
                }

                setSvgAttribute(element, "fill", item.fillColor);
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
        this.#nodeKeyedGroup.clear();
        while (this.#highlightGroup.firstChild) this.#highlightGroup.firstChild.remove();
    }

    public destroy(): void {
        this.clear();
        this.#nodeKeyedGroup.destroy();
        this.#nodesGroup.remove();
        this.#highlightGroup.remove();
    }
}
