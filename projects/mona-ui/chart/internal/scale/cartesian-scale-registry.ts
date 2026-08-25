import type { ChartPositionScale } from "./chart-scale";

export interface CartesianScaleRegistryOptions {
    primaryXAxisId: string;
    primaryYAxisId: string;
    xScales: ReadonlyMap<string, ChartPositionScale>;
    yScales: ReadonlyMap<string, ChartPositionScale>;
}

export class CartesianScaleRegistry {
    readonly #primaryXAxisId: string;
    readonly #primaryYAxisId: string;
    readonly #xScales: ReadonlyMap<string, ChartPositionScale>;
    readonly #yScales: ReadonlyMap<string, ChartPositionScale>;

    public constructor(options: CartesianScaleRegistryOptions) {
        this.#primaryXAxisId = options.primaryXAxisId;
        this.#primaryYAxisId = options.primaryYAxisId;
        this.#xScales = new Map(options.xScales);
        this.#yScales = new Map(options.yScales);
    }

    public get primaryXAxisId(): string {
        return this.#primaryXAxisId;
    }

    public get primaryYAxisId(): string {
        return this.#primaryYAxisId;
    }

    public get primaryXScale(): ChartPositionScale | undefined {
        return this.#xScales.get(this.#primaryXAxisId);
    }

    public get primaryYScale(): ChartPositionScale | undefined {
        return this.#yScales.get(this.#primaryYAxisId);
    }

    public getAllXScales(): ReadonlyMap<string, ChartPositionScale> {
        return this.#xScales;
    }

    public getAllYScales(): ReadonlyMap<string, ChartPositionScale> {
        return this.#yScales;
    }

    public getScale(axisId: string): ChartPositionScale | undefined {
        return this.#xScales.get(axisId) ?? this.#yScales.get(axisId);
    }

    public getXScale(axisId?: string): ChartPositionScale | undefined {
        if (!axisId) {
            return this.primaryXScale;
        }
        return this.#xScales.get(axisId);
    }

    public getYScale(axisId?: string): ChartPositionScale | undefined {
        if (!axisId) {
            return this.primaryYScale;
        }
        return this.#yScales.get(axisId);
    }
}
