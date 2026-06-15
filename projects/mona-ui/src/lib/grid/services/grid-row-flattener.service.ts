import { Injectable } from "@angular/core";
import { Dictionary } from "@mirei/ts-collections";
import type { Column } from "../models/Column";
import type { GridGroupAggregate } from "../models/GridAggregate";
import type { GridViewDataRow, GridViewGroupFooterRow, GridViewGroupRow, GridViewRow } from "../models/GridGroup";
import type { Row } from "../models/Row";

/**
 * A stateless service that groups and flattens rows into a linear `GridViewRow[]`
 * suitable for rendering by both paginated and virtual-scrolled grid list components.
 */
@Injectable()
export class GridRowFlattenerService {
    /**
     * Groups rows by the given columns and flattens them into a linear `GridViewRow[]`.
     *
     * @param rows - The source data rows.
     * @param groupColumns - The ordered list of columns to group by.
     * @param collapsedKeys - The set of group keys that are currently collapsed.
     * @param groupAggregates - The dictionary of group aggregates.
     * @returns A flat array of `GridViewRow` items.
     */
    public flatten(
        rows: Iterable<Row>,
        groupColumns: Iterable<Column>,
        collapsedKeys: ReadonlySet<string>,
        showFooter: boolean,
        groupAggregates: Dictionary<string, GridGroupAggregate> = new Dictionary<string, GridGroupAggregate>()
    ): GridViewRow[] {
        const columnArray = [...groupColumns];
        if (columnArray.length === 0) {
            return [];
        }
        const result: GridViewRow[] = [];
        this.#flattenRecursive([...rows], columnArray, groupAggregates, 0, null, collapsedKeys, showFooter, result);
        return result;
    }

    /**
     * Builds a deterministic, hierarchical group key.
     *
     * @example
     * buildGroupKey(null, "Country", "USA") // => "Country:USA"
     * buildGroupKey("Country:USA", "City", "NYC") // => "Country:USA/City:NYC"
     */
    public buildGroupKey(parentKey: string | null, field: string, value: unknown): string {
        const segment = `${field}:${String(value ?? "")}`;
        return parentKey != null ? `${parentKey}/${segment}` : segment;
    }

    #flattenRecursive(
        rows: Row[],
        groupColumns: Column[],
        groupAggregates: Dictionary<string, GridGroupAggregate>,
        depth: number,
        parentKey: string | null,
        collapsedKeys: ReadonlySet<string>,
        showFooter: boolean,
        result: GridViewRow[]
    ): void {
        const column = groupColumns[depth];
        if (column == null) {
            return;
        }
        const field = column.field;
        const isDate = column.dataType === "date" || column.dataType === "datetime" || column.dataType === "time";

        const groupMap = new Map<unknown, Row[]>();
        const keyOrder: unknown[] = [];

        for (const row of rows) {
            const rawValue = row.data[field];
            const mapKey = isDate && rawValue instanceof Date ? rawValue.toISOString() : rawValue;
            if (!groupMap.has(mapKey)) {
                groupMap.set(mapKey, []);
                keyOrder.push(mapKey);
            }
            groupMap.get(mapKey)!.push(row);
        }

        for (const mapKey of keyOrder) {
            const groupRows = groupMap.get(mapKey)!;
            const groupValue = groupRows[0].data[field];
            const groupKey = this.buildGroupKey(parentKey, field, groupValue);

            const groupRow: GridViewGroupRow = {
                type: "group",
                depth,
                field,
                groupKey,
                groupValue,
                count: groupRows.length,
                title: column.title
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
                        result
                    );
                } else {
                    for (const row of groupRows) {
                        const dataRow: GridViewDataRow = {
                            type: "data",
                            depth,
                            row,
                            groupKey
                        };
                        result.push(dataRow);
                    }
                }

            }

            const groupAggregate = groupAggregates.get(groupKey);
            if (groupAggregate != null && (!isCollapsed || showFooter)) {
                const groupFooterRow: GridViewGroupFooterRow = {
                    type: "groupFooter",
                    depth,
                    groupAggregate
                };
                result.push(groupFooterRow);
            }
        }
    }
}
