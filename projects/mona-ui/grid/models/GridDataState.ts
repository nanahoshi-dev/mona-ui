import type { CompositeFilterDescriptor, SortDescriptor } from "@nanahoshi/mona-ui/query";

/** The paging, sorting, and filtering requested by a server-bound Grid. */
export interface GridDataState {
    readonly filter: readonly CompositeFilterDescriptor[];
    readonly skip: number;
    readonly sort: readonly SortDescriptor[];
    readonly take: number;
}
