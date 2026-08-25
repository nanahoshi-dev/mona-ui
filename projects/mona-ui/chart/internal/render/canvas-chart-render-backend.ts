import { CanvasChartRenderer } from "./canvas-chart-renderer";
import type { ChartRenderBackend, ChartRenderBackendKind, ChartRenderViewport } from "./chart-render-backend";
import type { ChartCrossfadeRenderFrame, ChartRenderFrame } from "./chart-render-frame";

export class CanvasChartRenderBackend implements ChartRenderBackend {
    #canvas: HTMLCanvasElement | null;
    #context: CanvasRenderingContext2D | null = null;
    #viewport: ChartRenderViewport = {
        devicePixelRatio: 1,
        height: 0,
        width: 0
    };
    public readonly kind: ChartRenderBackendKind = "canvas";

    public constructor(canvas: HTMLCanvasElement) {
        this.#canvas = canvas;
        this.#context = canvas.getContext("2d");
    }

    public get context(): CanvasRenderingContext2D | null {
        return this.#context;
    }

    public clear(): void {
        if (!this.#context) {
            return;
        }
        CanvasChartRenderer.clear(this.#context, this.#viewport.width, this.#viewport.height);
    }

    public destroy(): void {
        this.#canvas = null;
        this.#context = null;
    }

    public render(frame: ChartRenderFrame): void {
        if (!this.#context) {
            return;
        }
        CanvasChartRenderer.render(this.#context, frame.scene, frame.presentation, frame.styleResolver);
    }

    public renderCrossfade(frame: ChartCrossfadeRenderFrame): void {
        if (!this.#context) {
            return;
        }
        CanvasChartRenderer.renderCrossfade(
            this.#context,
            frame.fromScene,
            frame.toScene,
            frame.progress,
            frame.presentation,
            frame.styleResolver
        );
    }

    public resize(viewport: ChartRenderViewport): void {
        this.#viewport = viewport;
        const canvas = this.#canvas;
        if (!canvas) {
            return;
        }

        const dpr = viewport.devicePixelRatio || (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
        canvas.width = Math.round(viewport.width * dpr);
        canvas.height = Math.round(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        if (this.#context) {
            this.#context.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
    }

    public setContext(context: CanvasRenderingContext2D | null): void {
        this.#context = context;
    }
}
