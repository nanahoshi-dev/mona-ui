import type { ChartCrossfadeRenderFrame, ChartRenderFrame } from "./chart-render-frame";

export type ChartRenderBackendKind = "canvas" | "svg";

export interface ChartRenderViewport {
    readonly width: number;
    readonly height: number;
    readonly devicePixelRatio: number;
}

export interface ChartRenderBackend {
    readonly kind: ChartRenderBackendKind;

    resize(viewport: ChartRenderViewport): void;

    render(frame: ChartRenderFrame): void;

    renderCrossfade(frame: ChartCrossfadeRenderFrame): void;

    clear(): void;

    destroy(): void;
}
