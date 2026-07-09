import { FilterOperators } from "@nanahoshi/mona-ui/query";

export interface FilterMenuValue {
    logic?: "and" | "or";
    operator1?: FilterOperators;
    operator2?: FilterOperators;
    value1?: any;
    value2?: any;
}
