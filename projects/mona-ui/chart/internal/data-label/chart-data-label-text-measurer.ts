export interface ChartMeasuredText {
    readonly ascent: number;
    readonly descent: number;
    readonly height: number;
    readonly width: number;
}

export class ChartDataLabelTextMeasurer {
    static readonly #MAX_CACHE_ENTRIES = 4096;
    static readonly #cache = new Map<string, ChartMeasuredText>();
    static #context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;

    static #getContext(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null {
        if (ChartDataLabelTextMeasurer.#context) {
            return ChartDataLabelTextMeasurer.#context;
        }

        if (typeof OffscreenCanvas !== "undefined") {
            const canvas = new OffscreenCanvas(1, 1);
            ChartDataLabelTextMeasurer.#context = canvas.getContext("2d");
            return ChartDataLabelTextMeasurer.#context;
        }

        if (typeof document !== "undefined") {
            const canvas = document.createElement("canvas");
            canvas.width = 1;
            canvas.height = 1;
            ChartDataLabelTextMeasurer.#context = canvas.getContext("2d");
            return ChartDataLabelTextMeasurer.#context;
        }

        return null;
    }

    public static measure(
        text: string,
        font: string = "500 11px system-ui, sans-serif"
    ): ChartMeasuredText {
        if (!text) {
            return { ascent: 0, descent: 0, height: 0, width: 0 };
        }

        const cacheKey = `${font}__${text}`;
        const cached = ChartDataLabelTextMeasurer.#cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const ctx = ChartDataLabelTextMeasurer.#getContext();
        let width = text.length * 7;
        let height = 14;
        let ascent = 10;
        let descent = 4;

        if (ctx) {
            ctx.font = font;
            const metrics = ctx.measureText(text);
            width = metrics.width;
            if (
                typeof metrics.actualBoundingBoxAscent === "number" &&
                typeof metrics.actualBoundingBoxDescent === "number"
            ) {
                ascent = metrics.actualBoundingBoxAscent;
                descent = metrics.actualBoundingBoxDescent;
                height = Math.max(12, ascent + descent);
            } else {
                const match = /(\d+(?:\.\d+)?)px/.exec(font);
                const fontSize = match ? parseFloat(match[1]) : 11;
                height = fontSize * 1.2;
                ascent = fontSize * 0.9;
                descent = fontSize * 0.3;
            }
        }

        const result: ChartMeasuredText = {
            ascent,
            descent,
            height: Math.ceil(height),
            width: Math.ceil(width)
        };

        if (ChartDataLabelTextMeasurer.#cache.size >= ChartDataLabelTextMeasurer.#MAX_CACHE_ENTRIES) {
            const keysToRemove = Array.from(ChartDataLabelTextMeasurer.#cache.keys()).slice(
                0,
                Math.floor(ChartDataLabelTextMeasurer.#MAX_CACHE_ENTRIES / 2)
            );
            for (const k of keysToRemove) {
                ChartDataLabelTextMeasurer.#cache.delete(k);
            }
        }

        ChartDataLabelTextMeasurer.#cache.set(cacheKey, result);
        return result;
    }

    public static clearCache(): void {
        ChartDataLabelTextMeasurer.#cache.clear();
    }
}
