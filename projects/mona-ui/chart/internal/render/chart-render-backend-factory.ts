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
    switch (mode) {
        case "canvas":
            if (!canvas) {
                throw new Error(`Unable to create ChartRenderBackend for mode "canvas": canvas element not found.`);
            }
            return new CanvasChartRenderBackend(canvas);
        case "svg":
            if (!svg) {
                throw new Error(`Unable to create ChartRenderBackend for mode "svg": svg element not found.`);
            }
            return new SvgChartRenderBackend(svg, instanceId);
    }
}
