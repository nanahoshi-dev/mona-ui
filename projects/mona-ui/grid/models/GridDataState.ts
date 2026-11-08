import type { CompositeFilterDescriptor, SortDescriptor } from "@nanahoshi/mona-ui/query";

/** The paging, sorting, and filtering requested by a server-bound Grid. */
export interface GridDataState {
    /** Applied composite filter descriptors. */
    readonly filter: readonly CompositeFilterDescriptor[];
    /** Requested zero-based offset. */
    readonly skip: number;
    /** Sort descriptors in priority order. */
    readonly sort: readonly SortDescriptor[];
    /** Requested page size. */
    readonly take: number;
}
