import {
    scaleBand,
    scaleLinear,
    scaleLog,
    scalePow,
    scaleSqrt,
    scaleSymlog,
    scaleTime,
    scaleUtc
} from "d3-scale";
import type {
    ChartBandPositionScale,
    ChartContinuousPositionScale,
    ChartPositionScale,
    ResolvedChartCartesianAxisType
} from "./chart-scale";
import { formatCompactNumber } from "../utils/number-utils";
import { formatTimeRange } from "../utils/chart-formatter";

export class LinearScale implements ChartContinuousPositionScale<number> {
    public readonly type = "linear" as const;
    readonly #scale = scaleLinear();

    public constructor(domain: readonly [number, number], range: readonly [number, number]) {
        let min = domain[0];
        let max = domain[1];
        if (min === max) {
            const pad = min === 0 ? 1 : Math.abs(min) * 0.1;
            min -= pad;
            max += pad;
        }
        this.#scale.domain([min, max]).range(range);
    }

    public domain(): readonly [number, number] {
        return this.#scale.domain() as [number, number];
    }

    public formatTick(value: number, _count: number = 5): string {
        return formatCompactNumber(value);
    }

    public invert(pixel: number): number {
        return this.#scale.invert(pixel);
    }

    public map(value: number): number | undefined {
        const res = this.#scale(value);
        return Number.isFinite(res) ? res : undefined;
    }

    public nice(count?: number): this {
        this.#scale.nice(count);
        return this;
    }

    public range(): readonly [number, number] {
        return this.#scale.range() as [number, number];
    }

    public setDomain(domain: readonly [number, number]): this {
        this.#scale.domain(domain);
        return this;
    }

    public ticks(count: number = 5): readonly number[] {
        return this.#scale.ticks(count);
    }
}

export class LogScale implements ChartContinuousPositionScale<number> {
    public readonly type = "log" as const;
    readonly #scale = scaleLog();
    readonly #logBase: number;
    readonly #sign: "negative" | "positive";

    public constructor(
        domain: readonly [number, number],
        range: readonly [number, number],
        logBase: number = 10
    ) {
        const validBase = Number.isFinite(logBase) && logBase > 0 && logBase !== 1 ? logBase : 10;
        this.#logBase = validBase;
        this.#scale.base(validBase);

        let min = domain[0];
        let max = domain[1];

        if (min < 0 && max < 0) {
            this.#sign = "negative";
            if (min === max) {
                min = min * 10;
                max = max * 0.1;
            }
        } else if (min > 0 && max > 0) {
            this.#sign = "positive";
            if (min === max) {
                min = min * 0.1;
                max = max * 10;
            }
        } else {
            // Default fallback if domain is not strictly signed
            if (min >= 0 && max >= 0) {
                this.#sign = "positive";
                min = 1;
                max = 10;
            } else {
                this.#sign = "negative";
                min = -10;
                max = -1;
            }
        }

        this.#scale.domain([min, max]).range(range);
    }

    public get logBase(): number {
        return this.#logBase;
    }

    public get sign(): "negative" | "positive" {
        return this.#sign;
    }

    public domain(): readonly [number, number] {
        return this.#scale.domain() as [number, number];
    }

    public formatTick(value: number, count: number = 5): string {
        const d3Formatted = this.#scale.tickFormat(count)(value);
        if (d3Formatted === "") {
            return "";
        }
        return formatCompactNumber(value);
    }

    public invert(pixel: number): number {
        return this.#scale.invert(pixel);
    }

    public map(value: number): number | undefined {
        if (this.#sign === "positive" && value <= 0) {
            return undefined;
        }
        if (this.#sign === "negative" && value >= 0) {
            return undefined;
        }
        const res = this.#scale(value);
        return Number.isFinite(res) ? res : undefined;
    }

    public nice(_count?: number): this {
        this.#scale.nice();
        return this;
    }

    public range(): readonly [number, number] {
        return this.#scale.range() as [number, number];
    }

    public setDomain(domain: readonly [number, number]): this {
        this.#scale.domain(domain);
        return this;
    }

    public ticks(count: number = 5): readonly number[] {
        return this.#scale.ticks(count);
    }
}

export class SymlogScale implements ChartContinuousPositionScale<number> {
    public readonly type = "symlog" as const;
    readonly #scale = scaleSymlog();
    readonly #constant: number;

    public constructor(
        domain: readonly [number, number],
        range: readonly [number, number],
        constant: number = 1
    ) {
        const validConstant = Number.isFinite(constant) && constant > 0 ? constant : 1;
        this.#constant = validConstant;
        this.#scale.constant(validConstant);

        let min = domain[0];
        let max = domain[1];
        if (min === max) {
            const pad = min === 0 ? 1 : Math.abs(min) * 0.1;
            min -= pad;
            max += pad;
        }

        this.#scale.domain([min, max]).range(range);
    }

    public get constant(): number {
        return this.#constant;
    }

    public domain(): readonly [number, number] {
        return this.#scale.domain() as [number, number];
    }

    public formatTick(value: number, _count: number = 5): string {
        return formatCompactNumber(value);
    }

    public invert(pixel: number): number {
        return this.#scale.invert(pixel);
    }

    public map(value: number): number | undefined {
        const res = this.#scale(value);
        return Number.isFinite(res) ? res : undefined;
    }

    public nice(count?: number): this {
        this.#scale.nice(count);
        return this;
    }

    public range(): readonly [number, number] {
        return this.#scale.range() as [number, number];
    }

    public setDomain(domain: readonly [number, number]): this {
        this.#scale.domain(domain);
        return this;
    }

    public ticks(count: number = 5): readonly number[] {
        return this.#scale.ticks(count);
    }
}

export class PowScale implements ChartContinuousPositionScale<number> {
    public readonly type = "pow" as const;
    readonly #scale = scalePow();
    readonly #exponent: number;

    public constructor(
        domain: readonly [number, number],
        range: readonly [number, number],
        exponent: number = 1
    ) {
        const validExp = Number.isFinite(exponent) && exponent > 0 ? exponent : 1;
        this.#exponent = validExp;
        this.#scale.exponent(validExp);

        let min = domain[0];
        let max = domain[1];
        if (min === max) {
            const pad = min === 0 ? 1 : Math.abs(min) * 0.1;
            min -= pad;
            max += pad;
        }

        this.#scale.domain([min, max]).range(range);
    }

    public get exponent(): number {
        return this.#exponent;
    }

    public domain(): readonly [number, number] {
        return this.#scale.domain() as [number, number];
    }

    public formatTick(value: number, _count: number = 5): string {
        return formatCompactNumber(value);
    }

    public invert(pixel: number): number {
        return this.#scale.invert(pixel);
    }

    public map(value: number): number | undefined {
        const res = this.#scale(value);
        return Number.isFinite(res) ? res : undefined;
    }

    public nice(count?: number): this {
        this.#scale.nice(count);
        return this;
    }

    public range(): readonly [number, number] {
        return this.#scale.range() as [number, number];
    }

    public setDomain(domain: readonly [number, number]): this {
        this.#scale.domain(domain);
        return this;
    }

    public ticks(count: number = 5): readonly number[] {
        return this.#scale.ticks(count);
    }
}

export class SqrtScale implements ChartContinuousPositionScale<number> {
    public readonly type = "sqrt" as const;
    readonly #scale = scaleSqrt();

    public constructor(domain: readonly [number, number], range: readonly [number, number]) {
        let min = domain[0];
        let max = domain[1];
        if (min === max) {
            const pad = min === 0 ? 1 : Math.abs(min) * 0.1;
            min -= pad;
            max += pad;
        }

        this.#scale.domain([min, max]).range(range);
    }

    public domain(): readonly [number, number] {
        return this.#scale.domain() as [number, number];
    }

    public formatTick(value: number, _count: number = 5): string {
        return formatCompactNumber(value);
    }

    public invert(pixel: number): number {
        return this.#scale.invert(pixel);
    }

    public map(value: number): number | undefined {
        const res = this.#scale(value);
        return Number.isFinite(res) ? res : undefined;
    }

    public nice(count?: number): this {
        this.#scale.nice(count);
        return this;
    }

    public range(): readonly [number, number] {
        return this.#scale.range() as [number, number];
    }

    public setDomain(domain: readonly [number, number]): this {
        this.#scale.domain(domain);
        return this;
    }

    public ticks(count: number = 5): readonly number[] {
        return this.#scale.ticks(count);
    }
}

export class TimeScale implements ChartContinuousPositionScale<Date> {
    public readonly type = "time" as const;
    readonly #scale = scaleTime();

    public constructor(domain: readonly [Date, Date], range: readonly [number, number]) {
        let min = domain[0];
        let max = domain[1];
        if (min.getTime() === max.getTime()) {
            min = new Date(min.getTime() - 3600000);
            max = new Date(max.getTime() + 3600000);
        }
        this.#scale.domain([min, max]).range(range);
    }

    public domain(): readonly [Date, Date] {
        return this.#scale.domain() as [Date, Date];
    }

    public formatTick(value: Date, _count: number = 5): string {
        const d = this.#scale.domain();
        const spanMs = Math.abs(d[1].getTime() - d[0].getTime());
        return formatTimeRange(value, spanMs, false);
    }

    public invert(pixel: number): Date {
        return this.#scale.invert(pixel);
    }

    public map(value: Date): number | undefined {
        const res = this.#scale(value);
        return Number.isFinite(res) ? res : undefined;
    }

    public nice(count?: number): this {
        this.#scale.nice(count);
        return this;
    }

    public range(): readonly [number, number] {
        return this.#scale.range() as [number, number];
    }

    public setDomain(domain: readonly [Date, Date]): this {
        this.#scale.domain(domain);
        return this;
    }

    public ticks(count: number = 5): readonly Date[] {
        return this.#scale.ticks(count);
    }
}

export class UtcScale implements ChartContinuousPositionScale<Date> {
    public readonly type = "utc" as const;
    readonly #scale = scaleUtc();

    public constructor(domain: readonly [Date, Date], range: readonly [number, number]) {
        let min = domain[0];
        let max = domain[1];
        if (min.getTime() === max.getTime()) {
            min = new Date(min.getTime() - 3600000);
            max = new Date(max.getTime() + 3600000);
        }
        this.#scale.domain([min, max]).range(range);
    }

    public domain(): readonly [Date, Date] {
        return this.#scale.domain() as [Date, Date];
    }

    public formatTick(value: Date, _count: number = 5): string {
        const d = this.#scale.domain();
        const spanMs = Math.abs(d[1].getTime() - d[0].getTime());
        return formatTimeRange(value, spanMs, true);
    }

    public invert(pixel: number): Date {
        return this.#scale.invert(pixel);
    }

    public map(value: Date): number | undefined {
        const res = this.#scale(value);
        return Number.isFinite(res) ? res : undefined;
    }

    public nice(count?: number): this {
        this.#scale.nice(count);
        return this;
    }

    public range(): readonly [number, number] {
        return this.#scale.range() as [number, number];
    }

    public setDomain(domain: readonly [Date, Date]): this {
        this.#scale.domain(domain);
        return this;
    }

    public ticks(count: number = 5): readonly Date[] {
        return this.#scale.ticks(count);
    }
}

export class BandScale<T extends { toString(): string } = string> implements ChartBandPositionScale<T> {
    public readonly type = "category" as const;
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

export interface NumericScaleOptions {
    domain: readonly [number, number];
    explicitMax?: number;
    explicitMin?: number;
    exponent?: number;
    logBase?: number;
    nice?: boolean;
    range: readonly [number, number];
    symlogConstant?: number;
    tickCount?: number;
    type: "linear" | "log" | "symlog" | "pow" | "sqrt";
}

export interface TemporalScaleOptions {
    domain: readonly [Date, Date];
    explicitMax?: Date | number;
    explicitMin?: Date | number;
    nice?: boolean;
    range: readonly [number, number];
    tickCount?: number;
    type: "time" | "utc";
}

export interface BandScaleOptions<T extends { toString(): string } = string> {
    domain: readonly T[];
    paddingInner?: number;
    paddingOuter?: number;
    range: readonly [number, number];
}

export class CartesianScaleFactory {
    public static createNumericScale(options: NumericScaleOptions): ChartContinuousPositionScale<number> {
        const { type, domain, range, nice = true, tickCount, explicitMin, explicitMax } = options;
        let scale: ChartContinuousPositionScale<number>;

        switch (type) {
            case "log":
                scale = new LogScale(domain, range, options.logBase ?? 10);
                break;
            case "symlog":
                scale = new SymlogScale(domain, range, options.symlogConstant ?? 1);
                break;
            case "pow":
                scale = new PowScale(domain, range, options.exponent ?? 1);
                break;
            case "sqrt":
                scale = new SqrtScale(domain, range);
                break;
            case "linear":
            default:
                scale = new LinearScale(domain, range);
                break;
        }

        if (nice) {
            scale.nice(tickCount);
            if (explicitMin !== undefined || explicitMax !== undefined) {
                const current = scale.domain();
                let min = current[0];
                let max = current[1];

                if (type === "log") {
                    const isPositive = current[0] > 0;
                    if (isPositive) {
                        if (explicitMin !== undefined && explicitMin > 0) min = explicitMin;
                        if (explicitMax !== undefined && explicitMax > 0) max = explicitMax;
                    } else {
                        if (explicitMin !== undefined && explicitMin < 0) min = explicitMin;
                        if (explicitMax !== undefined && explicitMax < 0) max = explicitMax;
                    }
                } else {
                    if (explicitMin !== undefined) min = explicitMin;
                    if (explicitMax !== undefined) max = explicitMax;
                }

                if (min > max) {
                    const temp = min;
                    min = max;
                    max = temp;
                }

                if (min === max) {
                    if (type === "log") {
                        if (min > 0) {
                            min = min * 0.1;
                            max = max * 10;
                        } else {
                            min = min * 10;
                            max = max * 0.1;
                        }
                    } else {
                        const pad = min === 0 ? 1 : Math.abs(min) * 0.1;
                        min -= pad;
                        max += pad;
                    }
                }
                scale.setDomain?.([min, max]);
            }
        }

        return scale;
    }

    public static createTemporalScale(options: TemporalScaleOptions): ChartContinuousPositionScale<Date> {
        const { type, domain, range, nice = true, tickCount, explicitMin, explicitMax } = options;
        const scale = type === "utc" ? new UtcScale(domain, range) : new TimeScale(domain, range);

        if (nice) {
            scale.nice(tickCount);
            if (explicitMin !== undefined || explicitMax !== undefined) {
                const current = scale.domain();
                let minD = explicitMin !== undefined ? (explicitMin instanceof Date ? explicitMin : new Date(explicitMin)) : current[0];
                let maxD = explicitMax !== undefined ? (explicitMax instanceof Date ? explicitMax : new Date(explicitMax)) : current[1];
                if (minD.getTime() === maxD.getTime()) {
                    minD = new Date(minD.getTime() - 3600000);
                    maxD = new Date(maxD.getTime() + 3600000);
                }
                scale.setDomain?.([minD, maxD]);
            }
        }

        return scale;
    }

    public static createBandScale<T extends { toString(): string } = string>(
        options: BandScaleOptions<T> | readonly T[],
        range?: readonly [number, number],
        paddingInner: number = 0.2,
        paddingOuter: number = 0.1
    ): BandScale<T> {
        if (Array.isArray(options)) {
            return new BandScale(options, range ?? [0, 1], paddingInner, paddingOuter);
        }
        const opt = options as BandScaleOptions<T>;
        return new BandScale(
            opt.domain,
            opt.range,
            opt.paddingInner ?? 0.2,
            opt.paddingOuter ?? 0.1
        );
    }

    public static createLinearScale(
        domain: readonly [number, number],
        range: readonly [number, number],
        nice: boolean = true,
        tickCount?: number,
        explicitMin?: number,
        explicitMax?: number
    ): LinearScale {
        return CartesianScaleFactory.createNumericScale({
            domain,
            explicitMax,
            explicitMin,
            nice,
            range,
            tickCount,
            type: "linear"
        }) as LinearScale;
    }

    public static createTimeScale(
        domain: readonly [Date, Date],
        range: readonly [number, number],
        nice: boolean = true,
        tickCount?: number,
        explicitMin?: Date | number,
        explicitMax?: Date | number
    ): TimeScale {
        return CartesianScaleFactory.createTemporalScale({
            domain,
            explicitMax,
            explicitMin,
            nice,
            range,
            tickCount,
            type: "time"
        }) as TimeScale;
    }

    public static createUtcScale(
        domain: readonly [Date, Date],
        range: readonly [number, number],
        nice: boolean = true,
        tickCount?: number,
        explicitMin?: Date | number,
        explicitMax?: Date | number
    ): UtcScale {
        return CartesianScaleFactory.createTemporalScale({
            domain,
            explicitMax,
            explicitMin,
            nice,
            range,
            tickCount,
            type: "utc"
        }) as UtcScale;
    }

    public static createExactPositionScale(options: {
        domain: readonly unknown[];
        exponent?: number;
        logBase?: number;
        paddingInner?: number;
        paddingOuter?: number;
        range: readonly [number, number];
        symlogConstant?: number;
        type: ResolvedChartCartesianAxisType;
    }): ChartPositionScale<unknown> {
        const { type, domain, range } = options;
        if (type === "category") {
            return CartesianScaleFactory.createBandScale({
                domain: domain as readonly string[],
                paddingInner: options.paddingInner ?? 0.2,
                paddingOuter: options.paddingOuter ?? 0.1,
                range
            }) as ChartPositionScale<unknown>;
        }

        if (type === "time") {
            const minD = domain[0] instanceof Date ? domain[0] : new Date(Number(domain[0]));
            const maxD = domain[1] instanceof Date ? domain[1] : new Date(Number(domain[1]));
            return new TimeScale([minD, maxD], range) as ChartPositionScale<unknown>;
        }

        if (type === "utc") {
            const minD = domain[0] instanceof Date ? domain[0] : new Date(Number(domain[0]));
            const maxD = domain[1] instanceof Date ? domain[1] : new Date(Number(domain[1]));
            return new UtcScale([minD, maxD], range) as ChartPositionScale<unknown>;
        }

        const numDomain: [number, number] = [Number(domain[0]), Number(domain[1])];
        switch (type) {
            case "log":
                return new LogScale(numDomain, range, options.logBase ?? 10) as ChartPositionScale<unknown>;
            case "symlog":
                return new SymlogScale(numDomain, range, options.symlogConstant ?? 1) as ChartPositionScale<unknown>;
            case "pow":
                return new PowScale(numDomain, range, options.exponent ?? 1) as ChartPositionScale<unknown>;
            case "sqrt":
                return new SqrtScale(numDomain, range) as ChartPositionScale<unknown>;
            case "linear":
            default:
                return new LinearScale(numDomain, range) as ChartPositionScale<unknown>;
        }
    }
}


