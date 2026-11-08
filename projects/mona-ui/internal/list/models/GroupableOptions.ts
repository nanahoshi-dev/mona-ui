import type { Selector } from "@mirei/ts-collections";

/** How the items within each group are ordered. Leave both out to keep their order. */
export type OrderByOptions<T, R> =
    | { orderBy?: never; orderByDirection?: never }
    | {
          /**
           * The field to order the items of per group. If not specified, the items of the group will not be ordered.
           */
          orderBy: string | Selector<T, R>;

          /**
           * The direction to order the items of per group.
           */
          orderByDirection?: "asc" | "desc";
      };

export type GroupableOptions<T = unknown, R = unknown> = {
    /**
     * Whether to group the items. If not specified, the items will not be grouped.
     */
    enabled?: boolean;

    /**
     * The direction to order the group headers.
     * If not specified, the group headers will be ordered in ascending order.
     */
    headerOrder?: "asc" | "desc";

    /**
     * Text of a group's header, from the group's value (the first item's value when several values form one group,
     * such as two `Date` objects for the same moment). Defaults to dates in the locale's medium date format,
     * numbers in the locale's digits, and `String(value)` for everything else.
     */
    headerText?: (value: unknown) => string;
} & OrderByOptions<T, R>;
