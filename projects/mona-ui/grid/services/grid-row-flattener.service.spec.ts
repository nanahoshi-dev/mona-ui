import { Dictionary } from "@mirei/ts-collections";
import type { Column } from "../models/Column";
import type { GridGroupAggregate } from "../models/GridAggregate";
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
        sortable: true,
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

    it("honors different nested directions and keeps each leaf stable", () => {
        const rows = [
            { category: "B", level: 1, id: 1 },
            { category: "A", level: 1, id: 2 },
            { category: "A", level: 2, id: 3 },
            { category: "B", level: 2, id: 4 },
            { category: "A", level: 2, id: 5 }
        ].map(data => new Row(data));
        const result = service.flatten(
            rows,
            [
                createColumn({ field: "category", groupSortDirection: "asc" }),
                createColumn({ field: "level", groupSortDirection: "desc", dataType: "number" })
            ],
            new Set(),
            false
        );
        expect(result.filter(row => row.type === "group").map(row => [row.depth, row.groupValue])).toEqual([
            [0, "A"],
            [1, 2],
            [1, 1],
            [0, "B"],
            [1, 2],
            [1, 1]
        ]);
        expect(result.filter(row => row.type === "data").map(row => row.row.data["id"])).toEqual([3, 5, 2, 4, 1]);
    });

    it.each(["asc", "desc"] as const)("orders dates chronologically with one empty group (%s)", dir => {
        const early = new Date("2020-01-01");
        const late = new Date("2025-01-01");
        const values = [late, null, early, undefined, new Date("2020-01-01")];
        const rows = values.map((value, id) => new Row({ value, id }));
        const result = service.flatten(
            rows,
            [createColumn({ field: "value", dataType: "date", groupSortDirection: dir })],
            new Set(),
            false
        );
        expect(result.filter(row => row.type === "group").map(row => row.groupValue)).toEqual(
            dir === "asc" ? [null, early, late] : [late, early, null]
        );
        expect(result.filter(row => row.type === "data").map(row => row.row.data["id"])).toEqual(
            dir === "asc" ? [1, 3, 2, 4, 0] : [0, 2, 4, 1, 3]
        );
    });

    it.each([
        [
            [10, 2, 1],
            [1, 2, 10]
        ],
        [
            [true, false],
            [false, true]
        ],
        [
            [3n, 1n, 2n],
            [1n, 2n, 3n]
        ]
    ])("uses comparable primitive semantics for %s", (values, ordered) => {
        const result = service.flatten(
            values.map(value => new Row({ value })),
            [createColumn({ field: "value", groupSortDirection: "asc" })],
            new Set(),
            false
        );
        expect(result.filter(row => row.type === "group").map(row => row.groupValue)).toEqual(ordered);
    });

    it("keeps values with no natural order first, in encounter order", () => {
        const first = { id: 1 };
        const symbol = Symbol("group");
        const second = { id: 2 };
        const result = service.flatten(
            [first, symbol, 0, second, false].map(value => new Row({ value })),
            [createColumn({ field: "value", groupSortDirection: "asc" })],
            new Set(),
            false
        );
        expect(result.filter(row => row.type === "group").map(row => row.groupValue)).toEqual([
            first,
            symbol,
            second,
            false,
            0
        ]);
    });

    it("preserves preordered client buckets when ordering is disabled", () => {
        const result = service.flatten(
            source.map(data => new Row(data)),
            [createColumn({ field: "category", groupSortDirection: "asc" })],
            new Set(),
            false,
            new Dictionary(),
            false
        );
        expect(result.filter(row => row.type === "group").map(row => row.groupValue)).toEqual(["B", "A"]);
    });
});

describe("body row keys", () => {
    const service = new GridRowFlattenerService();

    it("wraps ungrouped rows as data rows keyed by row uid", () => {
        const rows = [new Row({ id: 1 }), new Row({ id: 2 })];

        const result = service.toDataRows(rows);

        expect(result.map(row => row.key)).toEqual(rows.map(row => `row:${row.uid}`));
        expect(result.every(row => row.type === "data" && row.groupKey === null && row.depth === 0)).toBe(true);
    });

    it("gives group, data and footer rows distinct keys", () => {
        const rows = [new Row({ category: "A", id: 1 }), new Row({ category: "B", id: 2 })];
        const aggregates = new Dictionary<string, GridGroupAggregate>();
        aggregates.put("category:s:A", { groupKey: "category:s:A" } as GridGroupAggregate);
        aggregates.put("category:s:B", { groupKey: "category:s:B" } as GridGroupAggregate);

        const result = service.flatten(rows, [createColumn({ field: "category" })], new Set(), false, aggregates);
        const keys = result.map(row => row.key);

        expect(keys).toEqual([
            "group:category:s:A",
            `row:${rows[0].uid}`,
            "groupFooter:category:s:A",
            "group:category:s:B",
            `row:${rows[1].uid}`,
            "groupFooter:category:s:B"
        ]);
        expect(new Set(keys).size).toBe(keys.length);
    });
});
