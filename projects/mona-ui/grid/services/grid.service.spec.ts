import { TestBed } from "@angular/core/testing";
import { validate, type FieldTree } from "@angular/forms/signals";
import { ImmutableList } from "@mirei/ts-collections";
import type { Column } from "../models/Column";
import type { GridEditSchemaFactory } from "../models/GridEditFormContext";
import type { GridEditSession } from "../models/GridEditSession";
import type { GridSaveEvent } from "../models/GridSaveEvent";
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

function createRowData(
    count: number,
    valueFactory: (index: number) => Record<string, unknown> = i => ({ id: i })
): Record<string, unknown>[] {
    return Array.from({ length: count }, (_, i) => valueFactory(i));
}

function getSessionField(session: GridEditSession, field: string): FieldTree<unknown> {
    const fieldTree = session.form[field];
    if (fieldTree == null) {
        throw new Error(`Expected form field: ${field}`);
    }
    return fieldTree as FieldTree<unknown>;
}

const requiredNameSchema: GridEditSchemaFactory = () => row => {
    validate(row, ({ value }) => {
        const name = value()["name"];
        return typeof name === "string" && name.trim() !== ""
            ? undefined
            : { kind: "required", message: "Name is required." };
    });
};

describe("GridService", () => {
    let service: GridService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [GridService]
        });
        service = TestBed.inject(GridService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("row identity", () => {
        it("uses deterministic row uids when a row key is provided", () => {
            service.setRows([{ id: 1, name: "Jane" }], "id");
            const initialUid = service.rows().firstOrDefault()?.uid;

            service.setRows([{ id: 1, name: "Jane updated" }], "id");
            const updatedUid = service.rows().firstOrDefault()?.uid;

            expect(updatedUid).toBe(initialUid);
        });

        it("reuses fallback row uids for unchanged data object references", () => {
            const row = { id: 1, name: "Jane" };
            service.setRows([row]);
            const initialUid = service.rows().firstOrDefault()?.uid;

            service.setRows([row]);
            const updatedUid = service.rows().firstOrDefault()?.uid;

            expect(updatedUid).toBe(initialUid);
        });
    });

    describe("sorting", () => {
        beforeEach(() => {
            service.columns.set(
                ImmutableList.create([createColumn({ field: "name" }), createColumn({ field: "age" })])
            );
            service.setRows([
                { name: "Charlie", age: 40 },
                { name: "Alice", age: 30 },
                { name: "Bob", age: 30 }
            ]);
        });

        it("applies a single sort and reflects it in appliedSorts and viewRows", () => {
            service.loadSorts([{ field: "name", dir: "asc" }]);

            expect(service.appliedSorts().containsKey("name")).toBe(true);
            const names = service
                .viewRows()
                .select(r => r.data["name"])
                .toArray();
            expect(names).toEqual(["Alice", "Bob", "Charlie"]);
        });

        it("marks the sorted column's columnSortDirection and sortIndex", () => {
            service.loadSorts([{ field: "name", dir: "desc" }]);

            const column = service.columns().firstOrDefault(c => c.field === "name");
            expect(column?.columnSortDirection).toBe("desc");
            expect(column?.sortIndex).toBe(1);
        });

        it("supports multi-column sort ordering", () => {
            service.loadSorts([
                { field: "age", dir: "asc" },
                { field: "name", dir: "asc" }
            ]);

            const names = service
                .viewRows()
                .select(r => r.data["name"])
                .toArray();
            expect(names).toEqual(["Alice", "Bob", "Charlie"]);
        });

        it("clears sort state when loadSorts is called with an empty array", () => {
            service.loadSorts([{ field: "name", dir: "asc" }]);
            service.loadSorts([]);

            expect(service.appliedSorts().isEmpty()).toBe(true);
            const column = service.columns().firstOrDefault(c => c.field === "name");
            expect(column?.columnSortDirection).toBeNull();
        });
    });

    describe("filtering", () => {
        beforeEach(() => {
            service.columns.set(ImmutableList.create([createColumn({ field: "name" })]));
            service.setRows([{ name: "Charlie" }, { name: "Alice" }, { name: "Bob" }]);
        });

        it("filters viewRows based on loadFilters", () => {
            service.loadFilters([
                {
                    logic: "and",
                    filters: [{ field: "name", operator: "eq", value: "Alice" }]
                }
            ]);

            const names = service
                .viewRows()
                .select(r => r.data["name"])
                .toArray();
            expect(names).toEqual(["Alice"]);
        });

        it("marks the filtered column as filtered", () => {
            service.loadFilters([
                {
                    logic: "and",
                    filters: [{ field: "name", operator: "eq", value: "Alice" }]
                }
            ]);

            const column = service.columns().firstOrDefault(c => c.field === "name");
            expect(column?.filtered).toBe(true);
        });

        it("clears filter state when loadFilters is called with an empty array", () => {
            service.loadFilters([
                {
                    logic: "and",
                    filters: [{ field: "name", operator: "eq", value: "Alice" }]
                }
            ]);
            service.loadFilters([]);

            expect(service.appliedFilters().isEmpty()).toBe(true);
            expect(service.viewRows().size()).toBe(3);
        });
    });

    describe("grouping", () => {
        beforeEach(() => {
            service.columns.set(
                ImmutableList.create([createColumn({ field: "name" }), createColumn({ field: "team" })])
            );
        });

        it("adds a group column via addGroupColumn", () => {
            const teamColumn = service.columns().firstOrDefault(c => c.field === "team")!;

            service.addGroupColumn(teamColumn);

            expect(
                service
                    .groupColumns()
                    .select(c => c.field)
                    .toArray()
            ).toEqual(["team"]);
        });

        it("does not add a group column twice", () => {
            const teamColumn = service.columns().firstOrDefault(c => c.field === "team")!;

            service.addGroupColumn(teamColumn);
            service.addGroupColumn(teamColumn);

            expect(service.groupColumns().length).toBe(1);
        });

        it("removes a group column via clearColumnGrouping", () => {
            const teamColumn = service.columns().firstOrDefault(c => c.field === "team")!;
            service.addGroupColumn(teamColumn);

            service.clearColumnGrouping(teamColumn);

            expect(service.groupColumns().length).toBe(0);
        });
    });

    describe("pagination", () => {
        beforeEach(() => {
            service.columns.set(ImmutableList.create([createColumn({ field: "id" })]));
            service.setRows(createRowData(25));
        });

        it("slices viewRows into a page according to paginationState", () => {
            service.setPageState({ skip: 10, take: 5 });

            expect(service.viewPageRows().size()).toBe(5);
        });

        it("returns an empty page when there are no rows", () => {
            service.setRows([]);

            expect(service.viewPageRows().size()).toBe(0);
        });

        it("merges partial updates into paginationState", () => {
            service.setPageState({ skip: 5 });

            expect(service.paginationState()).toEqual({ page: 1, skip: 5, take: 10 });
        });
    });

    describe("editing", () => {
        beforeEach(() => {
            service.columns.set(
                ImmutableList.create([createColumn({ field: "id" }), createColumn({ field: "name", editable: true })])
            );
            service.setRows([{ id: 1, name: "Jane" }]);
        });

        it("saves a signal-form-backed cell edit through the existing save event", () => {
            const saveEvents: GridSaveEvent[] = [];
            service.save$.subscribe(event => saveEvents.push(event));
            service.setEditableOptions({ enabled: true, mode: "cell" });
            const row = service.rows().firstOrDefault();
            const column = service.columns().firstOrDefault(c => c.field === "name");
            if (row == null || column == null) {
                throw new Error("Expected row and column");
            }

            expect(service.startCellEdit(`${row.uid}_name`, row, column)).toBe(true);
            const session = service.editSession();
            if (session == null) {
                throw new Error("Expected edit session");
            }
            getSessionField(session, "name")().value.set("Janet");

            expect(service.stopCellEdit()).toBe(true);

            expect(saveEvents).toHaveLength(1);
            expect(saveEvents[0].operation).toBe("update");
            expect(saveEvents[0].rowData["name"]).toBe("Janet");
            expect(saveEvents[0].session).toBe(session);
            expect(service.editSession()).toBeNull();
        });

        it("blocks row save and keeps the session open when signal-form validation fails", () => {
            const saveEvents: GridSaveEvent[] = [];
            service.save$.subscribe(event => saveEvents.push(event));
            service.setEditableOptions({ enabled: true, mode: "row", schema: requiredNameSchema });
            const row = service.rows().firstOrDefault();
            if (row == null) {
                throw new Error("Expected row");
            }

            expect(service.startRowEdit(row)).toBe(true);
            const session = service.editSession();
            if (session == null) {
                throw new Error("Expected edit session");
            }
            getSessionField(session, "name")().value.set("");

            expect(service.commitRowEdit()).toBe(false);

            expect(saveEvents).toHaveLength(0);
            expect(service.editSession()).toBe(session);
            expect(session.form().touched()).toBe(true);
            expect(session.form().invalid()).toBe(true);
        });

        it("creates and saves add rows through the same edit session", () => {
            const saveEvents: GridSaveEvent[] = [];
            service.save$.subscribe(event => saveEvents.push(event));
            service.setEditableOptions({ enabled: true, mode: "row", schema: requiredNameSchema });
            service.setNewRowFactory(() => ({ id: 2, name: "" }));

            expect(service.startAddRow()).toBe(true);
            const session = service.editSession();
            if (session == null) {
                throw new Error("Expected edit session");
            }
            getSessionField(session, "name")().value.set("New row");

            expect(service.saveAddRow()).toBe(true);

            expect(saveEvents).toHaveLength(1);
            expect(saveEvents[0].operation).toBe("create");
            expect(saveEvents[0].rowData["name"]).toBe("New row");
            expect(saveEvents[0].session).toBe(session);
            expect(service.editSession()).toBeNull();
        });

        it("enforces the configured edit mode at the service boundary", () => {
            const row = service.rows().firstOrDefault();
            const column = service.columns().firstOrDefault(c => c.field === "name");
            if (row == null || column == null) {
                throw new Error("Expected row and column");
            }

            service.setEditableOptions({ enabled: true, mode: "cell" });
            expect(service.startRowEdit(row)).toBe(false);

            service.setEditableOptions({ enabled: true, mode: "row" });
            expect(service.startCellEdit(`${row.uid}_name`, row, column)).toBe(false);
        });
    });

    describe("selection", () => {
        beforeEach(() => {
            service.setRows(createRowData(3));
            service.setSelectableOptions({ enabled: true, mode: "single" });
        });

        it("selects a row and reports it as selected", () => {
            const row = service.rows().firstOrDefault()!;

            service.selectRow(row);

            expect(service.isRowSelected(row)).toBe(true);
        });

        it("deselects all rows via deselectAllRows", () => {
            const row = service.rows().firstOrDefault()!;
            service.selectRow(row);

            service.deselectAllRows();

            expect(service.isRowSelected(row)).toBe(false);
        });

        it("replaces the current selection in single mode via handleRowClick", () => {
            const [first, second] = service.rows().toArray();
            const event = new MouseEvent("click");

            service.handleRowClick(event, first);
            service.handleRowClick(event, second);

            expect(service.isRowSelected(first)).toBe(false);
            expect(service.isRowSelected(second)).toBe(true);
        });

        it("does nothing on handleRowClick when the grid is not selectable", () => {
            service.setSelectableOptions({ enabled: false, mode: "single" });
            const row = service.rows().firstOrDefault()!;

            service.handleRowClick(new MouseEvent("click"), row);

            expect(service.isRowSelected(row)).toBe(false);
        });

        it("supports additive multi-selection via ctrl/meta click", () => {
            service.setSelectableOptions({ enabled: true, mode: "multiple" });
            const [first, second] = service.rows().toArray();
            const ctrlClick = new MouseEvent("click", { ctrlKey: true });

            service.handleRowClick(ctrlClick, first);
            service.handleRowClick(ctrlClick, second);

            expect(service.isRowSelected(first)).toBe(true);
            expect(service.isRowSelected(second)).toBe(true);
        });
    });

    describe("aggregation", () => {
        it("reports hasFooter and aggregateColumns when a column has an aggregate", () => {
            service.columns.set(
                ImmutableList.create([
                    createColumn({ field: "id" }),
                    createColumn({ field: "amount", aggregate: "sum" })
                ])
            );

            expect(service.hasFooter()).toBe(true);
            expect(
                service
                    .aggregateColumns()
                    .select(c => c.field)
                    .toArray()
            ).toEqual(["amount"]);
        });

        it("reports no footer when no column has an aggregate", () => {
            service.columns.set(ImmutableList.create([createColumn({ field: "id" })]));

            expect(service.hasFooter()).toBe(false);
            expect(service.aggregateColumns().length).toBe(0);
        });
    });

    describe("column width", () => {
        it("normalizes and clamps rendered widths to a non-negative finite integer", () => {
            expect(service.normalizeRenderedWidth(-5)).toBe(0);
            expect(service.normalizeRenderedWidth(Number.NaN)).toBe(0);
            expect(service.normalizeRenderedWidth(Number.POSITIVE_INFINITY)).toBe(0);
            expect(service.normalizeRenderedWidth(120.4)).toBe(120);
        });

        it("falls back through calculatedWidth, width, then minWidth in getColumnWidth", () => {
            const column = createColumn({ field: "id", calculatedWidth: null, width: 80, minWidth: 40 });

            expect(service.getColumnWidth(column)).toBe(80);
            expect(service.getColumnWidth({ ...column, width: null })).toBe(40);
            expect(service.getColumnWidth({ ...column, calculatedWidth: 200 })).toBe(200);
        });

        it("updates a column's calculatedWidth via setCalculatedWidth", () => {
            service.columns.set(ImmutableList.create([createColumn({ field: "id" })]));

            service.setCalculatedWidth("id", 150);

            const column = service.columns().firstOrDefault(c => c.field === "id");
            expect(column?.calculatedWidth).toBe(150);
        });
    });

    describe("resizable/reorderable options", () => {
        it("defaults resizableOptions and reorderableOptions to disabled", () => {
            expect(service.resizableOptions().enabled).toBe(false);
            expect(service.reorderableOptions().enabled).toBe(false);
        });

        it("merges partial updates via setResizableOptions", () => {
            service.setResizableOptions({ enabled: true });

            expect(service.resizableOptions()).toEqual({ enabled: true });
        });

        it("merges partial updates via setReorderableOptions", () => {
            service.setReorderableOptions({ enabled: true });

            expect(service.reorderableOptions()).toEqual({ enabled: true });
        });
    });

    describe("setRows", () => {
        it("wraps each data record in a Row and populates the rows signal", () => {
            service.setRows([{ id: 1 }, { id: 2 }]);

            const values = service
                .rows()
                .select(r => r.data["id"])
                .toArray();
            expect(values).toEqual([1, 2]);
        });

        it("replaces the previous rows on subsequent calls", () => {
            service.setRows([{ id: 1 }]);
            service.setRows([{ id: 2 }, { id: 3 }]);

            expect(service.rows().size()).toBe(2);
        });
    });
});
