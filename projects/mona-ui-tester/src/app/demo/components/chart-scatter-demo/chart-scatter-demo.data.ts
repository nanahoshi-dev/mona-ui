/** One car of the Scatter & Bubble playground: its weight on X, its fuel use on Y and its power as the bubble size. */
export interface CarPoint {
    readonly consumption: number;
    readonly power: number;
    readonly weight: number;
}

export type CarDataSet = "dense" | "empty" | "sample";

/** The rows of both series: the chart's `data` for the first, and the second series' own `data`. */
export interface CarData {
    readonly hybrid: readonly CarPoint[];
    readonly petrol: readonly CarPoint[];
}

/** A small seeded generator, so the sample data is the same on every load. */
function random(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function round(value: number, digits: number): number {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

function cars(
    count: number,
    seed: number,
    weight: readonly [number, number],
    base: number,
    perKg: number,
    spread: number
): CarPoint[] {
    const next = random(seed);
    return Array.from({ length: count }, () => {
        const kg = weight[0] + next() * (weight[1] - weight[0]);
        return {
            consumption: round(base + kg * perKg + (next() - 0.5) * spread, 1),
            power: Math.round(kg * 0.065 + next() * 70),
            weight: Math.round(kg)
        };
    });
}

/** Forty cars, readable one by one. */
export const SAMPLE_CARS: CarData = {
    hybrid: cars(16, 7, [1200, 2200], 1.9, 0.0017, 0.9),
    petrol: cars(24, 3, [950, 2100], 3.3, 0.0027, 1.4)
};

/** Eleven thousand cars, more than the plot has room for, so the chart reduces what it draws. */
export const DENSE_CARS: CarData = {
    hybrid: cars(3000, 17, [1100, 2400], 1.9, 0.0017, 1.6),
    petrol: cars(8000, 13, [850, 2400], 3.3, 0.0027, 2.4)
};

const NO_CARS: CarData = { hybrid: [], petrol: [] };

export function carData(set: CarDataSet): CarData {
    switch (set) {
        case "dense":
            return DENSE_CARS;
        case "empty":
            return NO_CARS;
        case "sample":
            return SAMPLE_CARS;
    }
}
