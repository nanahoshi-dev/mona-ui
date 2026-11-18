import type { Column } from "../models/Column";
import type { ColumnGroup } from "../models/ColumnGroup";
import type { GridLayoutColumn, GridLayoutDataColumn } from "../models/GridLayoutColumn";
import type { GridStickyState } from "../models/GridStickyState";
import {
    buildHeaderGroupRows,
    getColumnStepTarget,
    getSiblingRuns,
    type GridHeaderGroupTitleCell,
    orderColumnsByGroup,
    resolveColumnMoveIndex
} from "./grid-column-groups";

type TestColumn = Pick<Column, "groups" | "hidden" | "id">;

const contact: ColumnGroup = { id: "contact", title: "Contact" };
const address: ColumnGroup = { id: "address", title: "Address" };
const stats: ColumnGroup = { id: "stats", title: "Stats" };

function column(id: string, groups: readonly ColumnGroup[] = [], hidden = false): TestColumn {
    return { groups, hidden, id };
}

/** Id | Contact: Email, Address: City, Country | Stats: Age */
function people(): TestColumn[] {
    return [
        column("id"),
        column("email", [contact]),
        column("city", [contact, address]),
        column("country", [contact, address]),
        column("age", [stats])
    ];
}

function ids(columns: readonly TestColumn[]): string[] {
    return columns.map(candidate => candidate.id);
}

function layoutColumn(
    id: string,
    groups: readonly ColumnGroup[],
    logicalIndex: number,
    width: number | null = 100,
    sticky: GridStickyState | null = null
): GridLayoutDataColumn {
    return {
        column: { groups, id, title: id } as Column,
        columnIndex: logicalIndex,
        firstInRow: false,
        key: `column:${id}`,
        kind: "column",
        lastInRow: false,
        logicalIndex,
        sticky,
        width
    };
}

function titles(row: ReturnType<typeof buildHeaderGroupRows>[number]): (string | null)[] {
    return row.map(cell => (cell.kind === "group" ? cell.group.title : null));
}

describe("column groups", () => {
    describe("orderColumnsByGroup", () => {
        it("puts each group's columns together where its first column is, nested groups too", () => {
            const [id, email, city, country, age] = people();

            expect(ids(orderColumnsByGroup([city, id, email, age, country]))).toEqual([
                "city",
                "country",
                "email",
                "id",
                "age"
            ]);
        });

        it("leaves columns without groups as they are", () => {
            const columns = [column("b"), column("a"), column("c")];

            expect(ids(orderColumnsByGroup(columns))).toEqual(["b", "a", "c"]);
        });
    });

    describe("getSiblingRuns", () => {
        it("treats a top-level group as one run among the top-level columns", () => {
            const columns = people();

            expect(getSiblingRuns(columns, columns[0])).toEqual([
                { end: 1, start: 0 },
                { end: 4, start: 1 },
                { end: 5, start: 4 }
            ]);
        });

        it("gives a grouped column its group's columns, with a nested group as one run", () => {
            const columns = people();

            expect(getSiblingRuns(columns, columns[1])).toEqual([
                { end: 2, start: 1 },
                { end: 4, start: 2 }
            ]);
        });
    });

    describe("resolveColumnMoveIndex", () => {
        it("allows places among the column's siblings and refuses places inside other groups", () => {
            const columns = people();

            expect(resolveColumnMoveIndex(columns, columns[0], 4)).toBe(4);
            expect(resolveColumnMoveIndex(columns, columns[0], 2)).toBeNull();
            expect(resolveColumnMoveIndex(columns, columns[2], 4)).toBe(4);
            expect(resolveColumnMoveIndex(columns, columns[2], 1)).toBeNull();
            expect(resolveColumnMoveIndex(columns, columns[1], 4)).toBe(4);
            expect(resolveColumnMoveIndex(columns, columns[1], 3)).toBeNull();
        });

        it("moves past hidden columns to the nearest place allowed", () => {
            const columns = [column("a"), column("b", [contact], true), column("c", [contact]), column("d")];

            // Before "c" is inside Contact, but only a hidden Contact column stands between it and the group's start.
            expect(resolveColumnMoveIndex(columns, columns[3], 2)).toBe(1);
        });
    });

    describe("getColumnStepTarget", () => {
        it("steps a column past a whole nested group, and stops at the end of its own group", () => {
            const columns = people();

            expect(getColumnStepTarget(columns, columns[1], 1)).toEqual({ beforeIndex: 4, neighbor: columns[3] });
            expect(getColumnStepTarget(columns, columns[1], -1)).toBeNull();
            expect(getColumnStepTarget(columns, columns[3], 1)).toBeNull();
            expect(getColumnStepTarget(columns, columns[0], 1)).toEqual({ beforeIndex: 4, neighbor: columns[3] });
        });

        it("skips runs whose columns are all hidden", () => {
            const columns = [column("a"), column("b", [], true), column("c")];

            expect(getColumnStepTarget(columns, columns[0], 1)).toEqual({ beforeIndex: 3, neighbor: columns[2] });
        });
    });

    describe("buildHeaderGroupRows", () => {
        it("builds a row per level, with a cell per group and space over the other columns", () => {
            const layout: GridLayoutColumn[] = [
                {
                    firstInRow: true,
                    key: "structural:selection",
                    kind: "selection",
                    lastInRow: false,
                    logicalIndex: 0,
                    sticky: null,
                    width: 40
                },
                layoutColumn("id", [], 1, 60),
                layoutColumn("email", [contact], 2, 160),
                layoutColumn("city", [contact, address], 3),
                layoutColumn("country", [contact, address], 4),
                layoutColumn("age", [stats], 5, 60)
            ];

            const rows = buildHeaderGroupRows(layout);

            expect(rows.map(titles)).toEqual([
                [null, null, "Contact", "Stats"],
                [null, null, null, "Address", null]
            ]);
            const contactCell = rows[0][2] as GridHeaderGroupTitleCell;
            expect(contactCell).toMatchObject({
                ariaColIndex: 3,
                colIndex: 2,
                colSpan: 3,
                firstInRow: true,
                lastInRow: false,
                sticky: null,
                width: 360
            });
            expect(rows[0][3]).toMatchObject({ colSpan: 1, firstInRow: false, lastInRow: true, width: 60 });
            expect(rows[0][0]).toEqual({
                key: "spacer:structural:selection",
                kind: "spacer",
                layoutKey: "structural:selection",
                width: 40
            });
            expect(rows[1][3]).toMatchObject({
                ariaColIndex: 4,
                colIndex: 3,
                colSpan: 2,
                firstInRow: true,
                lastInRow: true
            });
        });

        it("returns no rows without groups", () => {
            expect(buildHeaderGroupRows([layoutColumn("id", [], 0)])).toEqual([]);
        });

        it("gives a group's pinned columns a cell of their own, pinned where they are", () => {
            const layout = [
                layoutColumn("email", [contact], 0, 160, { edge: true, offset: 40, side: "start" }),
                layoutColumn("city", [contact], 1),
                layoutColumn("phone", [contact], 2, 120, { edge: true, offset: 0, side: "end" })
            ];

            const [row] = buildHeaderGroupRows(layout);

            expect(row.map(cell => (cell.kind === "group" ? [cell.colSpan, cell.sticky] : null))).toEqual([
                [1, { edge: true, offset: 40, side: "start" }],
                [1, null],
                [1, { edge: true, offset: 0, side: "end" }]
            ]);
        });

        it("has no width until all its columns are measured", () => {
            const [row] = buildHeaderGroupRows([
                layoutColumn("a", [contact], 0, null),
                layoutColumn("b", [contact], 1)
            ]);

            expect((row[0] as GridHeaderGroupTitleCell).width).toBeNull();
        });
    });
});
