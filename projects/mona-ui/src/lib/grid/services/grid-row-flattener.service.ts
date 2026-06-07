import { Injectable } from "@angular/core";
import type { Column } from "../models/Column";
import type { GridViewDataRow, GridViewGroupRow, GridViewRow } from "../models/GridGroup";
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
     * @returns A flat array of `GridViewRow` items.
     */
    public flatten(
        rows: Iterable<Row>,
        groupColumns: Iterable<Column>,
        collapsedKeys: ReadonlySet<string>
    ): GridViewRow[] {
        const columnArray = [...groupColumns];
        if (columnArray.length === 0) {
            return [];
        }
        const result: GridViewRow[] = [];
        this.#flattenRecursive([...rows], columnArray, 0, null, collapsedKeys, result);
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
        depth: number,
        parentKey: string | null,
        collapsedKeys: ReadonlySet<string>,
        result: GridViewRow[]
    ): void {
        const column = groupColumns[depth];
        if (column == null) {
            return;
        }
        const field = column.field();
        const isDate = column.dataType() === "date" || column.dataType() === "datetime" || column.dataType() === "time";

        // Native Map gives O(n) grouping per level. The ts-collections groupBy with an
        // EqualityComparator is O(n×g) — it compares each row against all existing group
        // keys — which compounds badly across nested levels on large datasets.
        const groupMap = new Map<unknown, Row[]>();
        const keyOrder: unknown[] = [];

        for (const row of rows) {
            const rawValue = row.data[field];
            // Normalize Date values to a string key so that two Date objects representing
            // the same second hash to the same Map entry (mirrors cellComparer behaviour).
            const mapKey =
                isDate && rawValue instanceof Date
                    ? `${rawValue.getFullYear()}-${rawValue.getMonth()}-${rawValue.getDate()}-${rawValue.getHours()}-${rawValue.getMinutes()}-${rawValue.getSeconds()}`
                    : rawValue;
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
                column,
                groupKey,
                groupValue,
                count: groupRows.length
            };
            result.push(groupRow);

            if (!collapsedKeys.has(groupKey)) {
                if (depth < groupColumns.length - 1) {
                    this.#flattenRecursive(groupRows, groupColumns, depth + 1, groupKey, collapsedKeys, result);
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
        }
    }
}
