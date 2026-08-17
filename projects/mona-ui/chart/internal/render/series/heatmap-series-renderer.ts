import type { ChartHeatmapSeriesScene } from "../../../models/chart-heatmap.models";
import { drawBarRectOutline, drawRoundedRectCorners } from "../../utils/canvas-utils";

export class HeatmapSeriesRenderer {
    public static render(context: CanvasRenderingContext2D, series: ChartHeatmapSeriesScene): void {
        const { cells, showLabels } = series;
        if (!cells || cells.length === 0) {
            return;
        }

        context.save();

        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            if (cell.width <= 0 || cell.height <= 0) {
                continue;
            }

            const alpha = Math.max(0, Math.min(1, cell.opacity ?? 1));
            context.globalAlpha = alpha;

            // 1. Draw cell fill
            context.fillStyle = cell.backgroundColor;

            if (cell.borderRadius <= 0) {
                context.fillRect(cell.x, cell.y, cell.width, cell.height);
            } else {
                drawRoundedRectCorners(context, cell.x, cell.y, cell.width, cell.height, {
                    bottomLeft: cell.borderRadius,
                    bottomRight: cell.borderRadius,
                    topLeft: cell.borderRadius,
                    topRight: cell.borderRadius
                });
            }

            // 2. Draw cell border
            if (cell.borderWidth > 0 && cell.borderColor) {
                context.strokeStyle = cell.borderColor;
                context.lineWidth = cell.borderWidth;
                drawBarRectOutline(context, cell.x, cell.y, cell.width, cell.height, cell.borderRadius, true, {
                    bottomLeft: cell.borderRadius,
                    bottomRight: cell.borderRadius,
                    topLeft: cell.borderRadius,
                    topRight: cell.borderRadius
                });
            }

            // 3. Draw text label
            if (showLabels || cell.showLabel) {
                if (cell.width >= 20 && cell.height >= 12 && cell.formattedValue) {
                    context.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
                    context.textAlign = "center";
                    context.textBaseline = "middle";

                    const textMetrics = context.measureText(cell.formattedValue);
                    if (cell.width >= textMetrics.width + 4 && cell.height >= 12) {
                        context.globalAlpha = 1;
                        context.fillStyle = cell.labelColor || "#ffffff";
                        context.fillText(
                            cell.formattedValue,
                            cell.x + cell.width / 2,
                            cell.y + cell.height / 2
                        );
                    }
                }
            }
        }

        context.restore();
    }
}
