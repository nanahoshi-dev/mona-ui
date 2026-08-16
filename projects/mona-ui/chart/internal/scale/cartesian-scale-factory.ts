import { scaleBand, scaleLinear, scaleTime, scaleUtc } from "d3-scale";
import type { ChartBandScale, ChartContinuousScale } from "./chart-scale";

export class LinearScale implements ChartContinuousScale<number> {
    readonly #scale = scaleLinear();

    public constructor(domain: readonly [number, number], range: readonly [number, number]) {
        this.#scale.domain(domain).range(range);
    }

    public domain(): readonly [number, number] {
        return this.#scale.domain() as [number, number];
    }

    public invert(pixel: number): number {
        return this.#scale.invert(pixel);
    }

    public map(value: number): number {
        return this.#scale(value);
    }

    public nice(count?: number): this {
        this.#scale.nice(count);
        return this;
    }

    public range(): readonly [number, number] {
        return this.#scale.range() as [number, number];
    }

    public ticks(count: number = 5): readonly number[] {
        return this.#scale.ticks(count);
    }
}

export class TimeScale implements ChartContinuousScale<Date> {
    readonly #scale = scaleTime();

    public constructor(domain: readonly [Date, Date], range: readonly [number, number]) {
        this.#scale.domain(domain).range(range);
    }

    public domain(): readonly [Date, Date] {
        return this.#scale.domain() as [Date, Date];
    }

    public invert(pixel: number): Date {
        return this.#scale.invert(pixel);
    }

    public map(value: Date): number {
        return this.#scale(value);
    }

    public nice(count?: number): this {
        this.#scale.nice(count);
        return this;
    }

    public range(): readonly [number, number] {
        return this.#scale.range() as [number, number];
    }

    public ticks(count: number = 5): readonly Date[] {
        return this.#scale.ticks(count);
    }
}

export class UtcScale implements ChartContinuousScale<Date> {
    readonly #scale = scaleUtc();

    public constructor(domain: readonly [Date, Date], range: readonly [number, number]) {
        this.#scale.domain(domain).range(range);
    }

    public domain(): readonly [Date, Date] {
        return this.#scale.domain() as [Date, Date];
    }

    public invert(pixel: number): Date {
        return this.#scale.invert(pixel);
    }

    public map(value: Date): number {
        return this.#scale(value);
    }

    public nice(count?: number): this {
        this.#scale.nice(count);
        return this;
    }

    public range(): readonly [number, number] {
        return this.#scale.range() as [number, number];
    }

    public ticks(count: number = 5): readonly Date[] {
        return this.#scale.ticks(count);
    }
}

export class BandScale<T extends { toString(): string } = string> implements ChartBandScale<T> {
    readonly #scale = scaleBand<T>();

    public constructor(
        domain: readonly T[],
        range: readonly [number, number],
        paddingInner: number = 0.2,
        paddingOuter: number = 0.1
    ) {
        this.#scale.domain(domain).range(range).paddingInner(paddingInner).paddingOuter(paddingOuter);
    }

    public bandwidth(): number {
        return this.#scale.bandwidth();
    }

    public domain(): readonly T[] {
        return this.#scale.domain();
    }

    public map(value: T): number | undefined {
        return this.#scale(value);
    }

    public range(): readonly [number, number] {
        return this.#scale.range() as [number, number];
    }

    public step(): number {
        return this.#scale.step();
    }
}

export class CartesianScaleFactory {
    public static createBandScale<T extends { toString(): string } = string>(
        domain: readonly T[],
        range: readonly [number, number],
        paddingInner: number = 0.2,
        paddingOuter: number = 0.1
    ): BandScale<T> {
        return new BandScale(domain, range, paddingInner, paddingOuter);
    }

    public static createLinearScale(
        domain: readonly [number, number],
        range: readonly [number, number],
        nice: boolean = true,
        tickCount?: number
    ): LinearScale {
        const scale = new LinearScale(domain, range);
        if (nice) {
            scale.nice(tickCount);
        }
        return scale;
    }

    public static createTimeScale(
        domain: readonly [Date, Date],
        range: readonly [number, number],
        nice: boolean = true,
        tickCount?: number
    ): TimeScale {
        const scale = new TimeScale(domain, range);
        if (nice) {
            scale.nice(tickCount);
        }
        return scale;
    }

    public static createUtcScale(
        domain: readonly [Date, Date],
        range: readonly [number, number],
        nice: boolean = true,
        tickCount?: number
    ): UtcScale {
        const scale = new UtcScale(domain, range);
        if (nice) {
            scale.nice(tickCount);
        }
        return scale;
    }
}
