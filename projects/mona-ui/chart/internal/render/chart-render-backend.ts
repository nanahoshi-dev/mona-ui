import type { ChartCrossfadeRenderFrame, ChartRenderFrame } from "./chart-render-frame";

export type ChartRenderBackendKind = "canvas" | "svg";

export interface ChartRenderViewport {
    readonly devicePixelRatio: number;
    readonly height: number;
    readonly width: number;
}

export interface ChartRenderBackend {
    clear(): void;
    destroy(): void;
    readonly kind: ChartRenderBackendKind;
    render(frame: ChartRenderFrame): void;
    renderCrossfade(frame: ChartCrossfadeRenderFrame): void;
    resize(viewport: ChartRenderViewport): void;
}
