export interface BenchmarkScalarPoint {
    readonly x: number | Date;
    readonly y: number | null;
}

export interface BenchmarkRangePoint {
    readonly from: number | null;
    readonly to: number | null;
    readonly x: number | Date;
}

export interface BenchmarkMarkerPoint {
    readonly size?: number;
    readonly x: number;
    readonly y: number;
}

export type SeededRandom = () => number;

export function createSeededRandom(seed: number): SeededRandom {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const defaultStartMs = Date.UTC(2025, 0, 1);

export function generateSineWave(count: number, options?: { readonly startMs?: number; readonly stepMs?: number }): BenchmarkScalarPoint[] {
    const startMs = options?.startMs ?? defaultStartMs;
    const stepMs = options?.stepMs ?? 1000;
    const points: BenchmarkScalarPoint[] = new Array(count);
    for (let i = 0; i < count; i++) {
        points[i] = {
            x: new Date(startMs + i * stepMs),
            y: Math.sin(i / 500) * 20 + Math.sin(i / 17) * 2
        };
    }
    return points;
}

export function generateSpikedSeries(
    count: number,
    options?: {
        readonly negativeEvery?: number;
        readonly positiveEvery?: number;
        readonly startMs?: number;
        readonly stepMs?: number;
    }
): BenchmarkScalarPoint[] {
    const startMs = options?.startMs ?? defaultStartMs;
    const stepMs = options?.stepMs ?? 1000;
    const positiveEvery = options?.positiveEvery ?? 100_000;
    const negativeEvery = options?.negativeEvery ?? 250_000;
    const points: BenchmarkScalarPoint[] = new Array(count);
    for (let i = 0; i < count; i++) {
        let value = Math.sin(i / 500) * 20 + Math.sin(i / 17) * 2;
        if (positiveEvery > 0 && i % positiveEvery === 0) {
            value += 100;
        }
        if (negativeEvery > 0 && i % negativeEvery === negativeEvery - 1) {
            value -= 80;
        }
        points[i] = { x: new Date(startMs + i * stepMs), y: value };
    }
    return points;
}

export function generateRandomWalk(count: number, seed: number, options?: { readonly stepMs?: number; readonly startMs?: number }): BenchmarkScalarPoint[] {
    const random = createSeededRandom(seed);
    const startMs = options?.startMs ?? defaultStartMs;
    const stepMs = options?.stepMs ?? 1000;
    const points: BenchmarkScalarPoint[] = new Array(count);
    let value = 0;
    for (let i = 0; i < count; i++) {
        value += (random() - 0.5) * 2;
        points[i] = { x: new Date(startMs + i * stepMs), y: value };
    }
    return points;
}

export function generateStepSignal(count: number, options?: { readonly runLength?: number; readonly stepMs?: number; readonly startMs?: number }): BenchmarkScalarPoint[] {
    const startMs = options?.startMs ?? defaultStartMs;
    const stepMs = options?.stepMs ?? 1000;
    const runLength = options?.runLength ?? 50;
    const points: BenchmarkScalarPoint[] = new Array(count);
    let value = 0;
    for (let i = 0; i < count; i++) {
        if (i > 0 && i % runLength === 0) {
            value = value >= 10 ? -5 : 10;
        }
        points[i] = { x: new Date(startMs + i * stepMs), y: value };
    }
    return points;
}

export function generateNullGapSeries(count: number, options?: { readonly gapStart?: number; readonly gapLength?: number; readonly stepMs?: number; readonly startMs?: number }): BenchmarkScalarPoint[] {
    const startMs = options?.startMs ?? defaultStartMs;
    const stepMs = options?.stepMs ?? 1000;
    const gapStart = options?.gapStart ?? Math.floor(count / 3);
    const gapLength = options?.gapLength ?? Math.max(1, Math.floor(count / 5));
    const points: BenchmarkScalarPoint[] = new Array(count);
    for (let i = 0; i < count; i++) {
        const inGap = i >= gapStart && i < gapStart + gapLength;
        points[i] = {
            x: new Date(startMs + i * stepMs),
            y: inGap ? null : Math.cos(i / 300) * 15
        };
    }
    return points;
}

export function generateIrregularTimestamps(count: number, seed: number, options?: { readonly startMs?: number }): BenchmarkScalarPoint[] {
    const random = createSeededRandom(seed);
    const startMs = options?.startMs ?? defaultStartMs;
    const points: BenchmarkScalarPoint[] = new Array(count);
    let time = startMs;
    for (let i = 0; i < count; i++) {
        const denseBurst = i < count / 2 ? 10 : 60_000;
        time += Math.max(1, Math.floor(random() * denseBurst));
        points[i] = { x: new Date(time), y: random() * 50 };
    }
    return points;
}

export function generateDuplicateXSeries(count: number, options?: { readonly startMs?: number; readonly stepMs?: number }): BenchmarkScalarPoint[] {
    const startMs = options?.startMs ?? defaultStartMs;
    const stepMs = options?.stepMs ?? 2000;
    const points: BenchmarkScalarPoint[] = new Array(count);
    for (let i = 0; i < count; i++) {
        const bucket = Math.floor(i / 2);
        points[i] = {
            x: new Date(startMs + bucket * stepMs),
            y: i % 2 === 0 ? -10 : 10
        };
    }
    return points;
}

export function generateDescendingSeries(count: number, options?: { readonly stepMs?: number; readonly startMs?: number }): BenchmarkScalarPoint[] {
    const startMs = options?.startMs ?? defaultStartMs;
    const stepMs = options?.stepMs ?? 1000;
    const points: BenchmarkScalarPoint[] = new Array(count);
    for (let i = 0; i < count; i++) {
        points[i] = {
            x: new Date(startMs + (count - 1 - i) * stepMs),
            y: Math.sin(i / 250) * 12
        };
    }
    return points;
}

export function generateUnsortedSeries(count: number, seed: number, options?: { readonly startMs?: number; readonly stepMs?: number }): BenchmarkScalarPoint[] {
    const random = createSeededRandom(seed);
    const startMs = options?.startMs ?? defaultStartMs;
    const stepMs = options?.stepMs ?? 1000;
    const points: BenchmarkScalarPoint[] = new Array(count);
    for (let i = 0; i < count; i++) {
        const jitter = Math.floor(random() * 5) - 2;
        points[i] = {
            x: new Date(startMs + (i + jitter) * stepMs),
            y: Math.sin(i / 300) * 10
        };
    }
    return points;
}

export function generateScatterClusters(
    count: number,
    seed: number,
    options?: {
        readonly clusterCenters?: readonly (readonly [number, number])[];
        readonly outlierCount?: number;
    }
): BenchmarkMarkerPoint[] {
    const random = createSeededRandom(seed);
    const centers = options?.clusterCenters ?? [[25, 25], [75, 75], [50, 10]];
    const outlierCount = options?.outlierCount ?? Math.max(1, Math.floor(count / 10_000));
    const points: BenchmarkMarkerPoint[] = new Array(count);
    const bodyCount = count - outlierCount;
    for (let i = 0; i < bodyCount; i++) {
        const center = centers[i % centers.length];
        points[i] = {
            x: center[0] + (random() - 0.5) * 10,
            y: center[1] + (random() - 0.5) * 10
        };
    }
    for (let i = bodyCount; i < count; i++) {
        points[i] = { x: random() * 100, y: random() * 100 };
    }
    return points;
}

export function generateBubbleSizeOutliers(count: number, seed: number): BenchmarkMarkerPoint[] {
    const random = createSeededRandom(seed);
    const points: BenchmarkMarkerPoint[] = new Array(count);
    const outlierEvery = Math.max(1, Math.floor(count / 1000));
    for (let i = 0; i < count; i++) {
        const isOutlier = i % outlierEvery === 0;
        points[i] = {
            size: isOutlier ? 500 : random() * 5 + 1,
            x: random() * 100,
            y: random() * 100
        };
    }
    return points;
}

export interface BenchmarkStackedSeries {
    readonly data: readonly { readonly x: number | Date; readonly positive: number | null; readonly negative: number | null }[];
}

export function generateStackedAreaSeries(
    count: number,
    seed: number,
    options?: { readonly percent?: boolean; readonly startMs?: number; readonly stepMs?: number }
): BenchmarkStackedSeries {
    const random = createSeededRandom(seed);
    const startMs = options?.startMs ?? defaultStartMs;
    const stepMs = options?.stepMs ?? 1000;
    const positive: BenchmarkScalarPoint[] = new Array(count);
    const negative: BenchmarkScalarPoint[] = new Array(count);
    for (let i = 0; i < count; i++) {
        positive[i] = { x: new Date(startMs + i * stepMs), y: random() * 40 + 5 };
        negative[i] = { x: new Date(startMs + i * stepMs), y: -(random() * 20 + 2) };
    }
    return { data: positive.map((p, i) => ({ x: p.x, negative: negative[i].y, positive: p.y })) };
}

export function assertDeterministic<T>(factory: () => readonly T[]): readonly T[] {
    const first = JSON.stringify(factory());
    const second = JSON.stringify(factory());
    if (first !== second) {
        throw new Error("Fixture generator is not deterministic");
    }
    return factory();
}
