import { FilterMenuValue } from "@nanahoshi/mona-ui/filter";
import { CompositeFilterDescriptor } from "@nanahoshi/mona-ui/query";

export interface ColumnFilterState {
    filter?: CompositeFilterDescriptor;
    filterMenuValue?: FilterMenuValue;
}
