export type CommonFilterOperators = "eq" | "neq";
export type NullFilterOperators = "isnull" | "isnotnull";
export type EmptyFilterOperators = "isempty" | "isnotempty";
export type NullOrEmptyFilterOperators = "isnullorempty" | "isnotnullorempty";

export type BooleanFilterOperators = "istrue" | "isfalse" | NullFilterOperators;

export type NumericFilterOperators = CommonFilterOperators | "gt" | "gte" | "lt" | "lte" | NullFilterOperators;

export type StringFilterOperators =
    | CommonFilterOperators
    | "startswith"
    | "endswith"
    | "contains"
    | "doesnotcontain"
    | NullFilterOperators
    | EmptyFilterOperators
    | NullOrEmptyFilterOperators;

export type DateFilterOperators = NumericFilterOperators | NullFilterOperators;

export type ArrayFilterOperators = "in" | "notin";

export type RangeFilterOperators = "between" | "notbetween";

export type FunctionFilterOperators = "function";

export type FilterOperators =
    | CommonFilterOperators
    | BooleanFilterOperators
    | NumericFilterOperators
    | StringFilterOperators
    | DateFilterOperators
    | NullFilterOperators
    | EmptyFilterOperators
    | NullOrEmptyFilterOperators
    | ArrayFilterOperators
    | RangeFilterOperators
    | FunctionFilterOperators;

export type FieldDefinition = { field: string };
export type CommonFilterDescriptor = FieldDefinition & { operator: CommonFilterOperators; value: unknown };
export type NullFilterDescriptor = FieldDefinition & { operator: NullFilterOperators };
export type EmptyFilterDescriptor = FieldDefinition & { operator: EmptyFilterOperators };
export type NullOrEmptyFilterDescriptor = FieldDefinition & { operator: NullOrEmptyFilterOperators };

export type BooleanFilterDescriptor = FieldDefinition & ({ operator: BooleanFilterOperators } | NullFilterDescriptor);

export type NumericFilterDescriptor = FieldDefinition &
    (
        | {
              operator: NumericFilterOperators;
              value: number;
          }
        | NullFilterDescriptor
    );

export type StringFilterDescriptor = FieldDefinition &
    (
        | {
              operator: StringFilterOperators;
              value: string;
          }
        | NullFilterDescriptor
        | EmptyFilterDescriptor
        | NullOrEmptyFilterDescriptor
    );

export type DateFilterDescriptor = FieldDefinition &
    (
        | {
              operator: DateFilterOperators;
              value: Date;
          }
        | NullFilterDescriptor
    );

export type ArrayFilterDescriptor = FieldDefinition & { operator: ArrayFilterOperators; value: readonly unknown[] };

/** A bound of a range filter. `null` leaves that end open. */
export type RangeFilterBound = number | Date | string | null;

/** `between` and `notbetween` include both bounds. */
export type RangeFilterDescriptor = FieldDefinition & {
    operator: RangeFilterOperators;
    value: readonly [from: RangeFilterBound, to: RangeFilterBound];
};

export type FunctionFilterDescriptor = FieldDefinition & {
    operator: FunctionFilterOperators;

    /** Receives the value of `field`, not the row. */
    predicate(value: unknown): boolean;
};

export type FilterDescriptor =
    | CommonFilterDescriptor
    | BooleanFilterDescriptor
    | NumericFilterDescriptor
    | StringFilterDescriptor
    | DateFilterDescriptor
    | NullFilterDescriptor
    | EmptyFilterDescriptor
    | NullOrEmptyFilterDescriptor
    | ArrayFilterDescriptor
    | RangeFilterDescriptor
    | FunctionFilterDescriptor;

export type FilterLogic = "and" | "or";

/** An empty `filters` list matches every item, whatever the logic. */
export interface CompositeFilterDescriptor {
    filters: Array<FilterDescriptor | CompositeFilterDescriptor>;
    logic: FilterLogic;
}
