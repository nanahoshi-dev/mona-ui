import type { FilterLogic } from "../../query/filter/FilterDescriptor";

export interface FilterMenuConnectorItem {
    text: string;
    value: FilterLogic;
}
