import { Injectable } from "@angular/core";
import {
    type BooleanFilterDescriptor,
    type BooleanFilterOperators,
    type CompositeFilterDescriptor,
    type DateFilterDescriptor,
    type DateFilterOperators,
    type NumericFilterDescriptor,
    type NumericFilterOperators,
    type StringFilterDescriptor,
    type StringFilterOperators
} from "@mirei/mona-ui/query";
import type { FilterDescriptorBuildArgs } from "../models/FilterDescriptorBuildArgs";
import type { FilterMenuDataItem } from "../models/FilterMenuDataItem";

@Injectable()
export class FilterService {
    public readonly booleanFilterMenuItems: FilterMenuDataItem[] = [
        { text: "Is true", value: "istrue" },
        { text: "Is false", value: "isfalse" },
        { text: "Is null", value: "isnull" },
        { text: "Is not null", value: "isnotnull" }
    ];
    public readonly dateFilterMenuItems: FilterMenuDataItem[] = [
        { text: "Is equal to", value: "eq" },
        { text: "Is not equal to", value: "neq" },
        { text: "Is after", value: "gt" },
        { text: "Is after or equal to", value: "gte" },
        { text: "Is before", value: "lt" },
        { text: "Is before or equal to", value: "lte" },
        { text: "Is null", value: "isnull" },
        { text: "Is not null", value: "isnotnull" }
    ];
    // TODO: Add null and empty filter operators
    public readonly numericFilterMenuItems: FilterMenuDataItem[] = [
        { text: "Is equal to", value: "eq" },
        { text: "Is not equal to", value: "neq" },
        { text: "Is greater than", value: "gt" },
        { text: "Is greater than or equal to", value: "gte" },
        { text: "Is less than", value: "lt" },
        { text: "Is less than or equal to", value: "lte" },
        { text: "Is null", value: "isnull" },
        { text: "Is not null", value: "isnotnull" }
    ];
    public readonly stringFilterMenuItems: FilterMenuDataItem[] = [
        { text: "Contains", value: "contains" },
        { text: "Does not contain", value: "doesnotcontain" },
        { text: "Ends with", value: "endswith" },
        { text: "Starts with", value: "startswith" },
        { text: "Is equal to", value: "eq" },
        { text: "Is not equal to", value: "neq" },
        { text: "Is empty", value: "isempty" },
        { text: "Is not empty", value: "isnotempty" },
        { text: "Is null", value: "isnull" },
        { text: "Is not null", value: "isnotnull" },
        { text: "Is null or empty", value: "isnullorempty" },
        { text: "Is not null or empty", value: "isnotnullorempty" }
    ];

    public buildBooleanFilterDescriptor(
        args: FilterDescriptorBuildArgs<boolean | null, BooleanFilterOperators>
    ): CompositeFilterDescriptor {
        const descriptors: BooleanFilterDescriptor[] = [];
        const descriptor1 = this.getBooleanDescriptor(args.operator1, args.field);
        if (descriptor1) {
            descriptors.push(descriptor1);
        }
        if (args.logic) {
            const descriptor2 = this.getBooleanDescriptor(args.operator2, args.field);
            if (descriptor2) {
                descriptors.push(descriptor2);
            }
        }
        return {
            logic: args.logic || "and",
            filters: descriptors
        };
    }

    public buildDateFilterDescriptor(
        args: FilterDescriptorBuildArgs<Date | null, DateFilterOperators>
    ): CompositeFilterDescriptor {
        const descriptors: DateFilterDescriptor[] = [];
        const descriptor1 = this.getDateDescriptor(args.operator1, args.field, args.value1);
        if (descriptor1) {
            descriptors.push(descriptor1);
        }
        if (args.logic) {
            const descriptor2 = this.getDateDescriptor(args.operator2, args.field, args.value2);
            if (descriptor2) {
                descriptors.push(descriptor2);
            }
        }
        return {
            logic: args.logic || "and",
            filters: descriptors
        };
    }

    public buildNumberFilterDescriptor(
        args: FilterDescriptorBuildArgs<number | null, NumericFilterOperators>
    ): CompositeFilterDescriptor {
        const descriptors: NumericFilterDescriptor[] = [];
        const descriptor1 = this.getNumberDescriptor(args.operator1, args.field, args.value1);
        if (descriptor1) {
            descriptors.push(descriptor1);
        }
        if (args.logic) {
            const descriptor2 = this.getNumberDescriptor(args.operator2, args.field, args.value2);
            if (descriptor2) {
                descriptors.push(descriptor2);
            }
        }
        return {
            logic: args.logic || "and",
            filters: descriptors
        };
    }

    public buildStringFilterDescriptor(
        args: FilterDescriptorBuildArgs<string, StringFilterOperators>
    ): CompositeFilterDescriptor {
        const descriptors: StringFilterDescriptor[] = [];
        const descriptor1 = this.getStringDescriptor(args.operator1, args.field, args.value1);
        if (descriptor1) {
            descriptors.push(descriptor1);
        }
        if (args.logic) {
            const descriptor2 = this.getStringDescriptor(args.operator2, args.field, args.value2);
            if (descriptor2) {
                descriptors.push(descriptor2);
            }
        }
        return {
            logic: args.logic || "and",
            filters: descriptors
        };
    }

    public getBooleanDescriptor(operator: BooleanFilterOperators, field: string): BooleanFilterDescriptor | null {
        if (operator === "isnotnull" || operator === "isnull") {
            return { field, operator };
        } else if (operator === "istrue") {
            return { field, operator };
        } else if (operator === "isfalse") {
            return { field, operator };
        }
        return null;
    }

    public getDateDescriptor(
        operator: DateFilterOperators,
        field: string,
        value: Date | null
    ): DateFilterDescriptor | null {
        if (operator === "isnotnull" || operator === "isnull") {
            return { field, operator };
        } else if (value != null) {
            return { field, operator, value };
        }
        return null;
    }

    public getNumberDescriptor(
        operator: NumericFilterOperators,
        field: string,
        value: number | null
    ): NumericFilterDescriptor | null {
        if (operator === "isnotnull" || operator === "isnull") {
            return { field, operator };
        } else if (value != null) {
            return { field, operator, value };
        }
        return null;
    }

    public getStringDescriptor(
        operator: StringFilterOperators,
        field: string,
        value: string
    ): StringFilterDescriptor | null {
        if (operator === "isnotnull" || operator === "isnull") {
            return { field, operator };
        } else if (operator === "isempty" || operator === "isnotempty") {
            return { field, operator };
        } else if (operator === "isnullorempty" || operator === "isnotnullorempty") {
            return { field, operator };
        } else if (value != null) {
            return { field, operator, value };
        }
        return null;
    }
}
