import type { FilterLogic, FilterOperators } from "../../query/filter/FilterDescriptor";
import type { SortDirection } from "../../query/sort/SortDescriptor";
import type { GroupDescriptor } from "./GroupDescriptor";

export type GridStateVersion = 1;

export type GridStateFilterValue = boolean | number | string | null | readonly (boolean | number | string | null)[];

export interface GridStateFilterDescriptor {
    field: string;
    operator: Exclude<FilterOperators, "function">;
    value?: GridStateFilterValue;
}

export interface GridStateCompositeFilterDescriptor {
    logic: FilterLogic;
    filters: readonly (GridStateFilterDescriptor | GridStateCompositeFilterDescriptor)[];
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

export type GridStateLoadStatus = "applied" | "empty" | "rejected-schema" | "rejected-version";

export interface GridStateLoadResult {
    ignoredColumns: readonly string[];
    missingColumns: readonly string[];
    status: GridStateLoadStatus;
}
