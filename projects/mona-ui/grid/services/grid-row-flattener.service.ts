import { Injectable } from "@angular/core";
import { Dictionary } from "@mirei/ts-collections";
import { compareValues, type QueryOptions } from "@nanahoshi/mona-ui/query";
import type { Column } from "../models/Column";
import type { GridGroupAggregate } from "../models/GridAggregate";
import type { GridViewDataRow, GridViewGroupFooterRow, GridViewGroupRow, GridViewRow } from "../models/GridGroup";
import type { Row } from "../models/Row";
import { buildGroupKey, groupRowsByField } from "./grid-group-key";

/** Looks up a group's aggregates by group key (a `Dictionary` or an `ImmutableDictionary`). */
export interface GridGroupAggregateLookup {
    get(groupKey: string): GridGroupAggregate | null | undefined;
}

/**
 * A stateless service that groups and flattens rows into a linear `GridViewRow[]`
 * suitable for rendering by both paginated and virtual-scrolled grid list components.
 */
@Injectable({ providedIn: "root" })
export class GridRowFlattenerService {
    /**
     * Builds a deterministic, hierarchical group key. Values are typed, so `1` and `"1"` get different keys,
     * while `null`, `undefined` and `""` share the empty group.
     *
     * @example
     * buildGroupKey(null, "Country", "USA") // => "Country:s:USA"
     * buildGroupKey("Country:s:USA", "City", "NYC") // => "Country:s:USA/City:s:NYC"
     */
    public buildGroupKey(parentKey: string | null, field: string, value: unknown): string {
        return buildGroupKey(parentKey, field, value);
    }

    /**
     * Groups rows by the given columns and flattens them into a linear `GridViewRow[]`.
     *
     * @param rows - The source data rows.
     * @param groupColumns - The ordered list of columns to group by.
     * @param collapsedKeys - The set of group keys that are currently collapsed.
     * @param groupAggregates - The dictionary of group aggregates.
     * @param orderGroups - Orders buckets by direction. Disable for client rows already ordered by Query.
     * @param options - The locale used to order string group values.
     * @returns A flat array of `GridViewRow` items.
     */
    public flatten(
        rows: Iterable<Row>,
        groupColumns: Iterable<Column>,
        collapsedKeys: ReadonlySet<string>,
        showFooter: boolean,
        groupAggregates: GridGroupAggregateLookup = new Dictionary<string, GridGroupAggregate>(),
        orderGroups = true,
        options: QueryOptions = {}
    ): GridViewRow[] {
        const columnArray = [...groupColumns];
        if (columnArray.length === 0) {
            return [];
        }
        const result: GridViewRow[] = [];
        this.#flattenRecursive(
            [...rows],
            columnArray,
            groupAggregates,
            0,
            null,
            collapsedKeys,
            showFooter,
            orderGroups ? options : null,
            result
        );
        return result;
    }

    /**
     * Wraps ungrouped rows as data view rows, so grouped and ungrouped bodies render from the same shape.
     */
    public toDataRows(rows: Iterable<Row>): GridViewDataRow[] {
        return Array.from(rows, row => this.#createDataRow(row, 0, null));
    }

    #createDataRow(row: Row, depth: number, groupKey: string | null): GridViewDataRow {
        return { depth, groupKey, key: `row:${row.uid}`, row, type: "data" };
    }

    #flattenRecursive(
        rows: Row[],
        groupColumns: Column[],
        groupAggregates: GridGroupAggregateLookup,
        depth: number,
        parentKey: string | null,
        collapsedKeys: ReadonlySet<string>,
        showFooter: boolean,
        groupOrder: QueryOptions | null,
        result: GridViewRow[]
    ): void {
        const column = groupColumns[depth];
        if (column == null) {
            return;
        }
        const field = column.field;
        const entries = groupRowsByField(rows, field).map((group, index) => ({ ...group, index }));
        const direction = column.groupSortDirection;
        if (groupOrder != null && direction != null) {
            entries.sort((left, right) => {
                const comparison = compareValues(left.value, right.value, groupOrder);
                return (direction === "asc" ? comparison : -comparison) || left.index - right.index;
            });
        }

        for (const { rows: groupRows, value: groupValue } of entries) {
            const groupKey = buildGroupKey(parentKey, field, groupValue);

            const groupRow: GridViewGroupRow = {
                count: groupRows.length,
                depth,
                field,
                groupKey,
                groupValue,
                key: `group:${groupKey}`,
                title: column.title,
                type: "group"
            };
            result.push(groupRow);

            const isCollapsed = collapsedKeys.has(groupKey);
            if (!isCollapsed) {
                if (depth < groupColumns.length - 1) {
                    this.#flattenRecursive(
                        groupRows,
                        groupColumns,
                        groupAggregates,
                        depth + 1,
                        groupKey,
                        collapsedKeys,
                        showFooter,
                        groupOrder,
                        result
                    );
                } else {
                    for (const row of groupRows) {
                        result.push(this.#createDataRow(row, depth, groupKey));
                    }
                }
            }

            const groupAggregate = groupAggregates.get(groupKey);
            if (groupAggregate != null && (!isCollapsed || showFooter)) {
                const groupFooterRow: GridViewGroupFooterRow = {
                    depth,
                    groupAggregate,
                    key: `groupFooter:${groupKey}`,
                    type: "groupFooter"
                };
                result.push(groupFooterRow);
            }
        }
    }
}
