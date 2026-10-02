import { Dictionary } from "@mirei/ts-collections";
import type { Column } from "../models/Column";
import { Row } from "../models/Row";
import { GridRowFlattenerService } from "./grid-row-flattener.service";
function createColumn(overrides: Partial<Column> & Pick<Column, "field">): Column {
    return {
        aggregate: null,
        calculatedWidth: null,
        cellTemplate: null,
        columnSortDirection: null,
        commandTemplate: null,
        configuredHidden: false,
        dataType: "string",
        editTemplate: null,
        editable: false,
        filterable: true,
        filtered: false,
        format: null,
        footerTemplate: null,
        groupFooterTemplate: null,
        headerTemplate: null,
        groupSortDirection: null,
        hidden: false,
        id: overrides.field,
        index: 0,
        kind: "data",
        locked: false,
        lockedPosition: "left",
        maxWidth: null,
        minWidth: 40,
        removeConfirmation: false,
        sortIndex: null,
        stateKey: null,
        title: overrides.field,
        titleTemplate: null,
        width: 80,
        ...overrides
    };
}

describe("page-local group bucket ordering", () => {
    const service = new GridRowFlattenerService();
    const source = [
        { category: "B", id: 1 },
        { category: "A", id: 2 },
        { category: "B", id: 3 },
        { category: "A", id: 4 }
    ];
    it.each([
        ["asc", ["A", "B"], [2, 4, 1, 3]],
        ["desc", ["B", "A"], [1, 3, 2, 4]],
        [null, ["B", "A"], [1, 3, 2, 4]]
    ] as const)("orders %s groups while preserving leaf row order", (dir, groups, ids) => {
        const rows = source.map(data => new Row(data));
        const result = service.flatten(
            rows,
            [createColumn({ field: "category", groupSortDirection: dir })],
            new Set(),
            false,
            new Dictionary()
        );
        expect(result.filter(row => row.type === "group").map(row => row.groupValue)).toEqual(groups);
        expect(result.filter(row => row.type === "data").map(row => row.row.data["id"])).toEqual(ids);
        expect(rows.map(row => row.data)).toEqual(source);
    });
});
