import type { FilterLogic, FilterOperators, SortDirection } from "@nanahoshi/mona-ui/query";
import type { GroupDescriptor } from "./GroupDescriptor";

export type GridStateVersion = 1;

export type GridStateFilterValue = boolean | number | string | null | readonly (boolean | number | string | null)[];

export interface GridStateFilterDescriptor {
    field: string;
    operator: Exclude<FilterOperators, "function">;
    value?: GridStateFilterValue;
}

export interface GridStateCompositeFilterDescriptor {
    filters: readonly (GridStateFilterDescriptor | GridStateCompositeFilterDescriptor)[];
    logic: FilterLogic;
}

export interface GridStateSortDescriptor {
    dir: SortDirection;
    field: string;
}

export interface GridColumnState {
    hidden: boolean;
    id: string;
    order: number;
    width: number | null;
}

export interface GridState {
    columns: readonly GridColumnState[];
    filter: readonly GridStateCompositeFilterDescriptor[];
    group: readonly GroupDescriptor[];
    pageSize?: number;
    schemaVersion?: number | string;
    sort: readonly GridStateSortDescriptor[];
    version: GridStateVersion;
}

export interface GridStatePersistenceOptions {
    enabled?: boolean;
    persistPageSize?: boolean;
    schemaVersion?: number | string;
}

/**
 * The outcome of loading a state. `rejected-invalid`: the state isn't a well-formed `GridState` (a missing
 * array, a duplicate column id, an unknown filter operator, a page size or width that isn't a positive
 * number), and nothing was changed.
 */
export type GridStateLoadStatus = "applied" | "empty" | "rejected-invalid" | "rejected-schema" | "rejected-version";

export interface GridStateLoadResult {
    ignoredColumns: readonly string[];
    missingColumns: readonly string[];
    status: GridStateLoadStatus;
}
