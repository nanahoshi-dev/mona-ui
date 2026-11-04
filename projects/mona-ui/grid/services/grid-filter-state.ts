import type { FilterMenuValue } from "@nanahoshi/mona-ui/filter";
import type { CompositeFilterDescriptor, FilterDescriptor, FilterOperators } from "@nanahoshi/mona-ui/query";

const FILTER_OPERATORS: ReadonlySet<string> = new Set<FilterOperators>([
    "between",
    "contains",
    "doesnotcontain",
    "endswith",
    "eq",
    "function",
    "gt",
    "gte",
    "in",
    "isempty",
    "isfalse",
    "isnotempty",
    "isnotnull",
    "isnotnullorempty",
    "isnull",
    "isnullorempty",
    "istrue",
    "lt",
    "lte",
    "neq",
    "notbetween",
    "notin",
    "startswith"
]);

/** Whether `operator` is one the query engine runs. */
export function isKnownFilterOperator(operator: unknown): operator is FilterOperators {
    return typeof operator === "string" && FILTER_OPERATORS.has(operator);
}

/** Filters split into per-field column filters and the rest. */
export interface GridFilterPartition {
    /** Filters the column menus can show: every condition is on one field. Keyed by that field. */
    readonly byField: ReadonlyMap<string, CompositeFilterDescriptor>;
    /** Filters spanning several fields (an `or` across columns, for example). Still applied and reported. */
    readonly external: readonly CompositeFilterDescriptor[];
}

/**
 * Whether a value is a filter condition the query engine understands: a field name, a known operator,
 * and a predicate for `function` filters.
 */
export function isValidFilterDescriptor(value: unknown): value is FilterDescriptor {
    if (value == null || typeof value !== "object") {
        return false;
    }
    const descriptor = value as Partial<Record<"field" | "operator" | "predicate", unknown>>;
    if (typeof descriptor.field !== "string" || descriptor.field === "") {
        return false;
    }
    if (!isKnownFilterOperator(descriptor.operator)) {
        return false;
    }
    return descriptor.operator !== "function" || typeof descriptor.predicate === "function";
}

/**
 * Drops conditions the query engine can't run (no field, an unknown operator) and empty groups. A missing
 * `logic` counts as `and`. Returns `null` when nothing is left.
 */
export function sanitizeCompositeFilter(value: unknown): CompositeFilterDescriptor | null {
    if (value == null || typeof value !== "object") {
        return null;
    }
    const composite = value as Partial<CompositeFilterDescriptor>;
    if (!Array.isArray(composite.filters)) {
        return null;
    }
    const filters: Array<FilterDescriptor | CompositeFilterDescriptor> = [];
    for (const child of composite.filters as unknown[]) {
        if (isValidFilterDescriptor(child)) {
            filters.push(child);
            continue;
        }
        const nested = sanitizeCompositeFilter(child);
        if (nested != null) {
            filters.push(nested);
        }
    }
    if (filters.length === 0) {
        return null;
    }
    return { logic: composite.logic === "or" ? "or" : "and", filters };
}

/**
 * Splits filters into per-field filters and the rest. An `and` group is split by field (its conditions
 * all have to hold anyway); a group whose conditions are all on one field stays whole; anything else is
 * external. Filters on the same field are combined with `and`, so repeating a field never throws.
 */
export function partitionFilters(filters: Iterable<unknown> | null | undefined): GridFilterPartition {
    const partsByField = new Map<string, CompositeFilterDescriptor[]>();
    const external: CompositeFilterDescriptor[] = [];
    for (const value of filters ?? []) {
        const composite = sanitizeCompositeFilter(value);
        if (composite != null) {
            collectFieldParts(composite, partsByField, external);
        }
    }
    const byField = new Map<string, CompositeFilterDescriptor>();
    for (const [field, parts] of partsByField) {
        byField.set(field, parts.length === 1 ? parts[0] : combineWithAnd(parts));
    }
    return { byField, external };
}

/**
 * The column filter menu's value for a filter, when the menu can show it (at most two conditions, no
 * nested groups). Otherwise `undefined`: the menu starts empty and applying it replaces the filter.
 */
export function toFilterMenuValue(filter: CompositeFilterDescriptor): FilterMenuValue | undefined {
    const [first, second, ...rest] = filter.filters;
    if (rest.length > 0 || first == null || !isLeaf(first) || (second != null && !isLeaf(second))) {
        return undefined;
    }
    return {
        logic: filter.logic,
        operator1: first.operator,
        operator2: second?.operator,
        value1: "value" in first ? first.value : undefined,
        value2: second != null && "value" in second ? second.value : undefined
    };
}

function collectFieldParts(
    composite: CompositeFilterDescriptor,
    partsByField: Map<string, CompositeFilterDescriptor[]>,
    external: CompositeFilterDescriptor[]
): void {
    const fields = collectFields(composite, new Set<string>());
    if (fields.size === 1) {
        addPart(partsByField, [...fields][0], composite);
        return;
    }
    if (composite.logic !== "and") {
        external.push(composite);
        return;
    }
    const leavesByField = new Map<string, FilterDescriptor[]>();
    for (const child of composite.filters) {
        if (isLeaf(child)) {
            const leaves = leavesByField.get(child.field) ?? [];
            leaves.push(child);
            leavesByField.set(child.field, leaves);
        } else {
            collectFieldParts(child, partsByField, external);
        }
    }
    for (const [field, leaves] of leavesByField) {
        addPart(partsByField, field, { logic: "and", filters: leaves });
    }
}

function addPart(
    partsByField: Map<string, CompositeFilterDescriptor[]>,
    field: string,
    part: CompositeFilterDescriptor
): void {
    const parts = partsByField.get(field) ?? [];
    parts.push(part);
    partsByField.set(field, parts);
}

function collectFields(composite: CompositeFilterDescriptor, fields: Set<string>): Set<string> {
    for (const child of composite.filters) {
        if (isLeaf(child)) {
            fields.add(child.field);
        } else {
            collectFields(child, fields);
        }
    }
    return fields;
}

function combineWithAnd(parts: readonly CompositeFilterDescriptor[]): CompositeFilterDescriptor {
    return {
        logic: "and",
        filters: parts.flatMap(part => (part.logic === "and" ? part.filters : [part]))
    };
}

function isLeaf(filter: FilterDescriptor | CompositeFilterDescriptor): filter is FilterDescriptor {
    return !("filters" in filter);
}
