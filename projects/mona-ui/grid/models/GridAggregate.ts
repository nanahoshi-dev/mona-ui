import type { ImmutableDictionary } from "@mirei/ts-collections";

export interface GridAggregateBucket {
    readonly field: string;
    readonly avg?: number;
    readonly count?: number;
    readonly max?: unknown;
    readonly min?: unknown;
    readonly sum?: number;
}

export interface GridGroupAggregate {
    readonly aggregates: ImmutableDictionary<string, GridAggregateBucket>;
    readonly count: number;
    readonly depth: number;
    readonly groupKey: string;
    readonly groupValue: unknown;
    readonly rows: readonly Record<PropertyKey, unknown>[];
}
