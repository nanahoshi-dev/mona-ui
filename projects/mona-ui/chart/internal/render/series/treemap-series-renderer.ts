import type { ChartTreemapSeriesScene, SceneTreemapNode } from "../../scene/hierarchical-scene";
import { drawBarRect, drawCellRectOutline } from "../../utils/canvas-utils";

export class TreemapSeriesRenderer {
    public static render(context: CanvasRenderingContext2D, series: ChartTreemapSeriesScene): void {
        const { nodes, renderOpacity = 1, style } = series;
        if (nodes.length === 0 || renderOpacity <= 0) {
            return;
        }

        const borderRadius = style.borderRadius ?? 0;
        const strokeWidth = style.strokeWidth ?? 0;
        const strokeColor = style.strokeColor;
        const parentFillOpacity = style.parentFillOpacity ?? 0.15;
        const leafFillOpacity = style.fillOpacity ?? 1;

        // Render nodes in pre-order (parents first, then leaves on top)
        for (const node of nodes) {
            const nodeOpacity = node.renderOpacity ?? 1;
            if (nodeOpacity <= 0 || node.bounds.width <= 0 || node.bounds.height <= 0) {
                continue;
            }

            context.save();

            if (!node.isLeaf) {
                // Parent background
                context.globalAlpha = renderOpacity * nodeOpacity * parentFillOpacity;
                context.fillStyle = node.fillColor;

                if (borderRadius > 0) {
                    drawBarRect(context, node.bounds.x, node.bounds.y, node.bounds.width, node.bounds.height, borderRadius);
                } else {
                    context.fillRect(node.bounds.x, node.bounds.y, node.bounds.width, node.bounds.height);
                }

                // Parent header bar if present
                if (node.headerBounds && node.headerBounds.width > 0 && node.headerBounds.height > 0) {
                    context.globalAlpha = renderOpacity * nodeOpacity * (parentFillOpacity * 2);
                    context.fillStyle = node.fillColor;
                    if (borderRadius > 0) {
                        drawBarRect(
                            context,
                            node.headerBounds.x,
                            node.headerBounds.y,
                            node.headerBounds.width,
                            node.headerBounds.height,
                            borderRadius
                        );
                    } else {
                        context.fillRect(
                            node.headerBounds.x,
                            node.headerBounds.y,
                            node.headerBounds.width,
                            node.headerBounds.height
                        );
                    }
                }
            } else {
                // Terminal leaf rectangle
                context.globalAlpha = renderOpacity * nodeOpacity * leafFillOpacity;
                context.fillStyle = node.fillColor;

                if (borderRadius > 0) {
                    drawBarRect(context, node.bounds.x, node.bounds.y, node.bounds.width, node.bounds.height, borderRadius);
                } else {
                    context.fillRect(node.bounds.x, node.bounds.y, node.bounds.width, node.bounds.height);
                }
            }

            // Node stroke border
            if (strokeWidth > 0 && strokeColor) {
                context.globalAlpha = renderOpacity * nodeOpacity;
                context.strokeStyle = strokeColor;
                context.lineWidth = strokeWidth;
                if (borderRadius > 0) {
                    drawCellRectOutline(
                        context,
                        node.bounds.x,
                        node.bounds.y,
                        node.bounds.width,
                        node.bounds.height,
                        borderRadius
                    );
                } else {
                    context.strokeRect(node.bounds.x, node.bounds.y, node.bounds.width, node.bounds.height);
                }
            }

            context.restore();
        }
    }
}
