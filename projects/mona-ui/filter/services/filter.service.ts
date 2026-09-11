import { inject, Injectable } from "@angular/core";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { FILTER_DEFAULT_MESSAGES } from "../i18n/filter.default-messages";
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
} from "@nanahoshi/mona-ui/query";
import type { FilterDescriptorBuildArgs } from "../models/FilterDescriptorBuildArgs";
import type { FilterMenuDataItem } from "../models/FilterMenuDataItem";

@Injectable()
export class FilterService {
    readonly #i18n = inject(MonaI18nService);
    readonly #messages = this.#i18n.componentMessages("filter", FILTER_DEFAULT_MESSAGES);

    public get booleanFilterMenuItems(): FilterMenuDataItem[] {
        const m = this.#messages();
        return [
            { text: m.isTrue, value: "istrue" },
            { text: m.isFalse, value: "isfalse" },
            { text: m.isNull, value: "isnull" },
            { text: m.isNotNull, value: "isnotnull" }
        ];
    }

    public get dateFilterMenuItems(): FilterMenuDataItem[] {
        const m = this.#messages();
        return [
            { text: m.isEqualTo, value: "eq" },
            { text: m.isNotEqualTo, value: "neq" },
            { text: m.isAfter, value: "gt" },
            { text: m.isAfterOrEqualTo, value: "gte" },
            { text: m.isBefore, value: "lt" },
            { text: m.isBeforeOrEqualTo, value: "lte" },
            { text: m.isNull, value: "isnull" },
            { text: m.isNotNull, value: "isnotnull" }
        ];
    }

    // TODO: Add null and empty filter operators
    public get numericFilterMenuItems(): FilterMenuDataItem[] {
        const m = this.#messages();
        return [
            { text: m.isEqualTo, value: "eq" },
            { text: m.isNotEqualTo, value: "neq" },
            { text: m.isGreaterThan, value: "gt" },
            { text: m.isGreaterThanOrEqualTo, value: "gte" },
            { text: m.isLessThan, value: "lt" },
            { text: m.isLessThanOrEqualTo, value: "lte" },
            { text: m.isNull, value: "isnull" },
            { text: m.isNotNull, value: "isnotnull" }
        ];
    }

    public get stringFilterMenuItems(): FilterMenuDataItem[] {
        const m = this.#messages();
        return [
            { text: m.contains, value: "contains" },
            { text: m.doesNotContain, value: "doesnotcontain" },
            { text: m.endsWith, value: "endswith" },
            { text: m.startsWith, value: "startswith" },
            { text: m.isEqualTo, value: "eq" },
            { text: m.isNotEqualTo, value: "neq" },
            { text: m.isEmpty, value: "isempty" },
            { text: m.isNotEmpty, value: "isnotempty" },
            { text: m.isNull, value: "isnull" },
            { text: m.isNotNull, value: "isnotnull" },
            { text: m.isNullOrEmpty, value: "isnullorempty" },
            { text: m.isNotNullOrEmpty, value: "isnotnullorempty" }
        ];
    }

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
