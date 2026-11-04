import { PLATFORM_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import type { CompositeFilterDescriptor } from "@nanahoshi/mona-ui/query";
import type { Column } from "../models/Column";
import type { GridState } from "../models/GridState";
import { Row } from "../models/Row";
import { GridExportService } from "./grid-export.service";
import { partitionFilters } from "./grid-filter-state";
import { buildGroupKey, groupKeyHasField, groupRowsByField } from "./grid-group-key";
import { GridService } from "./grid.service";

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
        footerTemplate: null,
        format: null,
        groupFooterTemplate: null,
        groupSortDirection: null,
        headerTemplate: null,
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
        sortable: true,
        stateKey: null,
        title: overrides.field,
        titleTemplate: null,
        width: 80,
        ...overrides
    };
}

function field(service: GridService, name: string): unknown[] {
    return service
        .viewRows()
        .select(row => row.data[name])
        .toArray();
}

function column(service: GridService, name: string): Column {
    const result = service.columns().firstOrDefault(c => c.field === name);
    if (result == null) {
        throw new Error(`No column ${name}`);
    }
    return result;
}

function and(...filters: CompositeFilterDescriptor["filters"]): CompositeFilterDescriptor {
    return { logic: "and", filters };
}

describe("GridService data state", () => {
    let service: GridService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [GridService] });
        service = TestBed.inject(GridService);
        service.setColumnDefinitions([
            createColumn({ field: "c" }),
            createColumn({ field: "id", dataType: "number" }),
            createColumn({ field: "name" }),
            createColumn({ field: "price", dataType: "number" })
        ]);
    });

    describe("grouped and sorted rows (GD1)", () => {
        beforeEach(() => {
            service.setRows([
                { c: "A", id: 1 },
                { c: "B", id: 0 },
                { c: "A", id: 2 }
            ]);
            service.loadSorts([{ field: "id", dir: "asc" }]);
        });

        it("keeps the group order when a column is sorted", () => {
            service.loadGroupColumns([{ field: "c", dir: "asc" }]);
            expect(field(service, "c")).toEqual(["A", "A", "B"]);
            expect(field(service, "id")).toEqual([1, 2, 0]);
        });

        it("reverses the groups when the group direction changes", () => {
            service.loadGroupColumns([{ field: "c", dir: "desc" }]);
            expect(field(service, "c")).toEqual(["B", "A", "A"]);
        });
    });

    describe("repeated fields (GD4)", () => {
        beforeEach(() => {
            service.setRows([{ price: 5 }, { price: 15 }, { price: 25 }]);
        });

        it("combines two filters on one field instead of throwing", () => {
            expect(() =>
                service.loadFilters([
                    and({ field: "price", operator: "gte", value: 10 }),
                    and({ field: "price", operator: "lte", value: 20 })
                ])
            ).not.toThrow();
            expect(field(service, "price")).toEqual([15]);
            expect(column(service, "price").filtered).toBe(true);
        });

        it("keeps the last sort and the last group of a repeated field", () => {
            service.loadSorts([
                { field: "price", dir: "asc" },
                { field: "price", dir: "desc" }
            ]);
            expect(service.getSortDescriptors()).toEqual([{ field: "price", dir: "desc" }]);
            service.loadGroupColumns([
                { field: "price", dir: "asc" },
                { field: "price", dir: "desc" }
            ]);
            expect(service.getGroupDescriptors(service.groupColumns())).toEqual([{ field: "price", dir: "desc" }]);
        });
    });

    describe("filters from code (GD5, GD7)", () => {
        beforeEach(() => {
            service.setRows([
                { id: 1, name: "Ada" },
                { id: 2, name: "Bob" },
                { id: 3, name: "Cy" }
            ]);
        });

        it("splits an and across columns so each column shows its own filter", () => {
            service.loadFilters([
                and({ field: "name", operator: "neq", value: "Ada" }, { field: "id", operator: "lt", value: 3 })
            ]);
            expect(field(service, "name")).toEqual(["Bob"]);
            expect(column(service, "name").filtered).toBe(true);
            expect(column(service, "id").filtered).toBe(true);
            expect(service.appliedFilters().get("id")?.filterMenuValue).toEqual(
                expect.objectContaining({ operator1: "lt", value1: 3 })
            );
        });

        it("applies and reports an or across columns without marking a column", () => {
            const either: CompositeFilterDescriptor = {
                logic: "or",
                filters: [
                    { field: "name", operator: "eq", value: "Ada" },
                    { field: "id", operator: "eq", value: 3 }
                ]
            };
            service.loadFilters([either]);
            expect(field(service, "name")).toEqual(["Ada", "Cy"]);
            expect(service.getDataState().filter).toEqual([either]);
            expect(column(service, "name").filtered).toBe(false);
        });

        it("keeps a filter on a field with no column and marks the column when it appears", () => {
            service.loadFilters([and({ field: "later", operator: "isnotnull" })]);
            expect(service.getFilterDescriptors()).toHaveLength(1);
            expect(field(service, "name")).toEqual([]);
            service.setColumnDefinitions([...service.columns().toArray(), createColumn({ field: "later" })]);
            expect(column(service, "later").filtered).toBe(true);
        });

        it("drops conditions with an unknown operator", () => {
            service.loadFilters([
                and({ field: "name", operator: "bogus" as "eq", value: "Ada" }),
                and({ field: "id", operator: "gt", value: 1 })
            ]);
            expect(field(service, "name")).toEqual(["Bob", "Cy"]);
        });
    });

    describe("descriptors outlive columns (GD7)", () => {
        it("shows a sort on a column added later and keeps it when the column goes", () => {
            service.loadSorts([{ field: "later", dir: "desc" }]);
            service.setColumnDefinitions([...service.columns().toArray(), createColumn({ field: "later" })]);
            expect(column(service, "later").columnSortDirection).toBe("desc");
            expect(column(service, "later").sortIndex).toBe(1);
            service.setColumnDefinitions(
                service
                    .columns()
                    .where(c => c.field !== "later")
                    .toArray()
            );
            expect(service.getSortDescriptors()).toEqual([{ field: "later", dir: "desc" }]);
        });

        it("groups by a field once its column appears", () => {
            service.loadGroupColumns([{ field: "later" }]);
            expect(service.groupColumns().length).toBe(0);
            service.setColumnDefinitions([...service.columns().toArray(), createColumn({ field: "later" })]);
            expect(service.getGroupDescriptors(service.groupColumns())).toEqual([{ field: "later", dir: "asc" }]);
        });
    });

    describe("group keys (GD6, GD11)", () => {
        it("puts null, undefined and empty text in one group and keeps 1 and '1' apart", () => {
            const rows = [null, undefined, "", 1, "1"].map(value => new Row({ value }));
            const groups = groupRowsByField(rows, "value");
            expect(groups.map(group => group.rows.length)).toEqual([3, 1, 1]);
            expect(new Set(groups.map(group => buildGroupKey(null, "value", group.value))).size).toBe(3);
        });

        it("groups dates by time and escapes separators in fields and values", () => {
            const rows = [new Date(2024, 0, 1), new Date(2024, 0, 1)].map(value => new Row({ value }));
            expect(groupRowsByField(rows, "value")).toHaveLength(1);
            expect(buildGroupKey(null, "a/b", "x:y")).toBe("a%2Fb:s:x%3Ay");
        });

        it("matches a grouped field by its segment, not by substring", () => {
            const firstName = buildGroupKey(null, "firstname", "Ada");
            const name = buildGroupKey(null, "name", "Ada");
            expect(groupKeyHasField(firstName, "name")).toBe(false);
            expect(groupKeyHasField(`${firstName}/${name}`, "name")).toBe(true);
            service.setColumnDefinitions([...service.columns().toArray(), createColumn({ field: "firstname" })]);
            service.loadGroupColumns([{ field: "name" }]);
            service.toggleGroupCollapse(firstName);
            service.toggleGroupCollapse(name);
            service.clearColumnGrouping(column(service, "name"));
            expect(service.collapsedGroupKeys().toArray()).toEqual([firstName]);
        });

        it("reports user grouping changes and not grouping set from code", () => {
            const events: unknown[] = [];
            service.groupChange$.subscribe(groups => events.push(groups));
            service.loadGroupColumns([{ field: "name" }]);
            expect(events).toEqual([]);
            service.addGroupColumn(column(service, "c"));
            service.setGroupSortDirection(column(service, "c"), "desc");
            expect(events).toEqual([
                [
                    { field: "name", dir: "asc" },
                    { field: "c", dir: "asc" }
                ],
                [
                    { field: "name", dir: "asc" },
                    { field: "c", dir: "desc" }
                ]
            ]);
        });
    });

    describe("paging (GD8)", () => {
        it("ignores page sizes and offsets client paging can't use", () => {
            service.setPageState({ take: 0 });
            service.setPageState({ skip: Number.NaN });
            expect(service.paginationState()).toEqual({ page: 1, skip: 0, take: 10 });
        });
    });

    describe("aggregates (GD10)", () => {
        it("counts values that aren't empty, sums numeric strings and sums nothing to 0", () => {
            service.setColumnDefinitions([createColumn({ field: "price", aggregate: "sum" })]);
            service.setRows([{ price: "2" }, { price: 3 }, { price: null }, { price: "n/a" }]);
            const bucket = service.aggregateMap().get("price");
            expect(bucket?.count).toBe(3);
            expect(bucket?.sum).toBe(5);
            service.setRows([{ price: null }]);
            expect(service.aggregateMap().get("price")?.sum).toBe(0);
        });
    });

    describe("row identity (GD3)", () => {
        it("renders the same object twice without throwing", () => {
            const item = { id: 1 };
            service.setRows([item, item]);
            const [first, second] = service.rows().toArray();
            expect(first.uid).not.toBe(second.uid);
            service.setEditableOptions({ mode: "row" });
            expect(service.startRowEdit(second)).toBe(true);
            expect(service.editViewDict().get(second.uid)).toEqual(expect.objectContaining({ id: 1 }));
        });

        it("warns about a repeated rowKey and keeps rendering", () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
            service.setRows([{ id: 1 }, { id: 1 }], "id");
            expect(new Set(service.rows().select(row => row.uid)).size).toBe(2);
            expect(warn).toHaveBeenCalledTimes(1);
            warn.mockRestore();
        });
    });

    describe("persisted state (GS2)", () => {
        const valid: GridState = { columns: [], filter: [], group: [], sort: [], version: 1 };

        it.each([
            ["a missing array", { ...valid, sort: undefined }],
            [
                "a duplicate column id",
                { ...valid, columns: [0, 1].map(order => ({ hidden: false, id: "c", order, width: 80 })) }
            ],
            [
                "an unknown operator",
                { ...valid, filter: [{ logic: "and", filters: [{ field: "c", operator: "bogus" }] }] }
            ],
            ["a page size that isn't a positive integer", { ...valid, pageSize: "10" }],
            ["a negative width", { ...valid, columns: [{ hidden: false, id: "c", order: 0, width: -1 }] }]
        ])("rejects %s without changing anything", (_label, state) => {
            service.loadSorts([{ field: "name", dir: "asc" }]);
            const before = service.columns();
            const result = service.applyState(state as unknown as GridState);
            expect(result.status).toBe("rejected-invalid");
            expect(service.columns()).toBe(before);
            expect(service.getSortDescriptors()).toEqual([{ field: "name", dir: "asc" }]);
        });

        it("reports a restored sort and grouping for the models", () => {
            const sorts: unknown[] = [];
            const groups: unknown[] = [];
            service.sortChange$.subscribe(sort => sorts.push(sort));
            service.groupChange$.subscribe(group => groups.push(group));
            service.applyState({ ...valid, group: [{ field: "c" }], sort: [{ dir: "desc", field: "id" }] });
            expect(sorts).toEqual([[{ dir: "desc", field: "id" }]]);
            expect(groups).toEqual([[{ field: "c", dir: "asc" }]]);
        });
    });

    describe("options (GS6)", () => {
        it("enables a feature unless enabled is false, and replaces earlier options", () => {
            service.setSelectableOptions({ mode: "multiple" });
            expect(service.selectableOptions()).toEqual(expect.objectContaining({ enabled: true, mode: "multiple" }));
            service.setSelectableOptions({ enabled: false });
            expect(service.selectableOptions()).toEqual(expect.objectContaining({ enabled: false, mode: "single" }));
            service.setEditableOptions({ mode: "row", schema: () => () => undefined });
            service.setEditableOptions({ mode: "cell" });
            expect(service.editableOptions()).toEqual({ enabled: true, mode: "cell" });
        });
    });

    describe("selection keys (GS7)", () => {
        it("selects by the rowKey value without selectBy, so a refetch keeps the selection", () => {
            service.rowKey.set("id");
            service.setRows([{ id: 1 }, { id: 2 }], "id");
            service.setSelectableOptions({});
            service.setRowSelected(service.rows().first(), true);
            expect(service.selectedKeys().toArray()).toEqual([1]);
            service.setRows([{ id: 1 }, { id: 2 }], "id");
            expect(service.isRowSelected(service.rows().first())).toBe(true);
        });

        it("accepts a selector function", () => {
            service.selectBy.set((data: unknown) => `#${String((data as { id: number }).id)}`);
            service.setRows([{ id: 7 }]);
            service.setSelectableOptions({});
            service.setRowSelected(service.rows().first(), true);
            expect(service.selectedKeys().toArray()).toEqual(["#7"]);
        });
    });
});

describe("partitionFilters", () => {
    it("splits nested and groups and keeps an or across fields whole", () => {
        const across: CompositeFilterDescriptor = {
            logic: "or",
            filters: [
                { field: "a", operator: "eq", value: 1 },
                { field: "b", operator: "eq", value: 2 }
            ]
        };
        const { byField, external } = partitionFilters([
            and({ field: "a", operator: "gt", value: 0 }, and({ field: "b", operator: "lt", value: 5 }), across)
        ]);
        expect([...byField.keys()]).toEqual(["b", "a"]);
        expect(external).toEqual([across]);
    });
});

describe("GridExportService (GD12, GD13)", () => {
    it("writes local dates, neutralizes formulas and leaves hidden columns out", async () => {
        TestBed.configureTestingModule({
            providers: [GridService, GridExportService, { provide: PLATFORM_ID, useValue: "browser" }]
        });
        const service = TestBed.inject(GridService);
        service.setColumnDefinitions([
            createColumn({ field: "when", dataType: "date", title: "When" }),
            createColumn({ field: "note", title: "Note" }),
            createColumn({ field: "secret", hidden: true, title: "Secret" })
        ]);
        service.setRows([{ note: "=HYPERLINK(1)", secret: "x", when: new Date(2024, 0, 1, 0, 30) }]);
        const blobs: Blob[] = [];
        const url = document.defaultView!.URL;
        const { createObjectURL, revokeObjectURL } = url;
        url.createObjectURL = (value: Blob | MediaSource): string => {
            blobs.push(value as Blob);
            return "blob:export";
        };
        url.revokeObjectURL = (): void => undefined;
        try {
            TestBed.inject(GridExportService).exportCsv();
        } finally {
            url.createObjectURL = createObjectURL;
            url.revokeObjectURL = revokeObjectURL;
        }

        const text = await blobs[0].text();
        expect(text.replace(/^\uFEFF/, "").split("\r\n")).toEqual(["When,Note", "2024-01-01,'=HYPERLINK(1)"]);
    });
});
