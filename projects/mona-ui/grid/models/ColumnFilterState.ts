import { CompositeFilterDescriptor } from "@mirei/mona-ui/query";
import { FilterMenuValue } from "@mirei/mona-ui/filter";

export interface ColumnFilterState {
    filter?: CompositeFilterDescriptor;
    filterMenuValue?: FilterMenuValue;
}
