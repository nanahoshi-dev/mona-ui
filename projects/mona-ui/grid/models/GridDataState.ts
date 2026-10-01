import type { CompositeFilterDescriptor, SortDescriptor } from "@nanahoshi/mona-ui/query";

/** The paging, sorting, and filtering requested by a server-bound Grid. */
export interface GridDataState {
    readonly skip: number;
    readonly take: number;
    readonly sort: readonly SortDescriptor[];
    readonly filter: readonly CompositeFilterDescriptor[];
}
