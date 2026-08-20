import type { ChartRendererMode } from "../../models/chart-renderer.models";
import { CanvasChartRenderBackend } from "./canvas-chart-render-backend";
import type { ChartRenderBackend } from "./chart-render-backend";
import { SvgChartRenderBackend } from "./svg-chart-render-backend";

export function createChartRenderBackend(
    mode: ChartRendererMode,
    canvas: HTMLCanvasElement | null,
    svg: SVGSVGElement | null,
    instanceId?: number
): ChartRenderBackend {
    if (mode === "svg" && svg) {
        return new SvgChartRenderBackend(svg, instanceId);
    }
    if (canvas) {
        return new CanvasChartRenderBackend(canvas);
    }
    throw new Error(`Unable to create ChartRenderBackend for mode "${mode}": required DOM element not found.`);
}
