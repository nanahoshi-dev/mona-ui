import type { FilterOperators } from "@nanahoshi/mona-ui/query";

export interface FilterMenuValue {
    logic?: "and" | "or";
    operator1?: FilterOperators;
    operator2?: FilterOperators;
    /** The first condition's value; `null` when its operator takes none. */
    value1?: unknown;
    /** The second condition's value; `null` when its operator takes none. */
    value2?: unknown;
}
