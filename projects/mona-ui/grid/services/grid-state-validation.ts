import type { GridState } from "../models/GridState";
import { isKnownFilterOperator } from "./grid-filter-state";

/**
 * Checks the shape of a persisted grid state before any of it is applied, so a malformed state can be
 * rejected as a whole instead of being half applied.
 */
export function isWellFormedGridState(state: unknown): state is GridState {
    if (!isRecord(state)) {
        return false;
    }
    const { columns, filter, group, pageSize, sort } = state;
    if (!Array.isArray(columns) || !Array.isArray(filter) || !Array.isArray(group) || !Array.isArray(sort)) {
        return false;
    }
    if (pageSize !== undefined && !(Number.isSafeInteger(pageSize) && (pageSize as number) > 0)) {
        return false;
    }
    const columnIds = new Set<string>();
    for (const column of columns as unknown[]) {
        if (
            !isRecord(column) ||
            typeof column["id"] !== "string" ||
            column["id"] === "" ||
            columnIds.has(column["id"])
        ) {
            return false;
        }
        columnIds.add(column["id"]);
        const width = column["width"];
        if (
            !Number.isFinite(column["order"]) ||
            typeof column["hidden"] !== "boolean" ||
            !(width == null || (typeof width === "number" && Number.isFinite(width) && width >= 0))
        ) {
            return false;
        }
    }
    const isSort = (value: unknown, dirRequired: boolean): boolean =>
        isRecord(value) &&
        typeof value["field"] === "string" &&
        value["field"] !== "" &&
        (value["dir"] === "asc" || value["dir"] === "desc" || (!dirRequired && value["dir"] == null));
    return (
        (sort as unknown[]).every(item => isSort(item, true)) &&
        (group as unknown[]).every(item => isSort(item, false)) &&
        (filter as unknown[]).every(isStateCompositeFilter)
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value != null && typeof value === "object" && !Array.isArray(value);
}

function isStateCompositeFilter(value: unknown): boolean {
    if (!isRecord(value) || (value["logic"] !== "and" && value["logic"] !== "or") || !Array.isArray(value["filters"])) {
        return false;
    }
    return (value["filters"] as unknown[]).every(child => {
        if (isRecord(child) && "filters" in child) {
            return isStateCompositeFilter(child);
        }
        return (
            isRecord(child) &&
            typeof child["field"] === "string" &&
            child["field"] !== "" &&
            child["operator"] !== "function" &&
            isKnownFilterOperator(child["operator"])
        );
    });
}
