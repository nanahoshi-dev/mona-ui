import type { FilterLogic, FilterOperators } from "@nanahoshi/mona-ui/query";

export type FilterDescriptorBuildArgs<TValue, TOperator extends FilterOperators> = {
    field: string;
    operator1: TOperator;
    value1: TValue;
} & (
    | {
          logic: null;
      }
    | {
          logic: FilterLogic;
          operator2: TOperator;
          value2: TValue;
      }
);
