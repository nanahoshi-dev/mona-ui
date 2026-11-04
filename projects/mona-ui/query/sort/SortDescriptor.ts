export interface SortDescriptor<TValue = unknown> {
    dir: SortDirection;
    field: string;

    /**
     * Compares two values of `field` (not two rows). Return a negative number when `left` comes first
     * in ascending order; `dir: "desc"` reverses the result. Empty values are passed in as they are.
     */
    sort?(left: TValue, right: TValue): number;
}

export type SortDirection = "asc" | "desc";
