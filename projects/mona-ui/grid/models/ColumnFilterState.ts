import { CompositeFilterDescriptor } from "@nanahoshi/mona-ui/query";
import { FilterMenuValue } from "@nanahoshi/mona-ui/filter";

export interface ColumnFilterState {
    filter?: CompositeFilterDescriptor;
    filterMenuValue?: FilterMenuValue;
}
