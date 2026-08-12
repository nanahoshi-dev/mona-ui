import { TestBed } from "@angular/core/testing";
import { type FieldTree, type SchemaPathTree, validate } from "@angular/forms/signals";
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

const requiredNameFieldSchema: GridEditSchemaFactory = () => row => {
    validate(row["name"] as SchemaPathTree<unknown>, ({ value }) => {
        const name = value();
        return typeof name === "string" && name.trim() !== ""
            ? undefined
            : { kind: "required", message: "Name is required." };
    });
};

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

        it("preserves row uids when rebinding reordered objects with the same row key", () => {
            const first = { id: 1, name: "Jane" };
            const second = { id: 2, name: "John" };
            service.setRows([first, second], "id");
            const uidByKey = new Map(
                service
                    .rows()
                    .select(row => [row.data["id"], row.uid] as const)
                    .toArray()
            );

            service.setRows([{ id: 2, name: "John moved" }, { id: 1, name: "Jane moved" }], "id");

            const reordered = service.rows().toArray();
            expect(reordered.map(row => row.data["id"])).toEqual([2, 1]);
            expect(reordered[0]?.uid).toBe(uidByKey.get(2));
            expect(reordered[1]?.uid).toBe(uidByKey.get(1));
        });

        it("derives row identity from rowKey without any editing configuration", () => {
            service.setRows([{ id: 1, name: "Jane" }], "id");
            const initialUid = service.rows().firstOrDefault()?.uid;

            service.setRows([{ id: 1, name: "Jane updated" }], "id");

            expect(service.rows().firstOrDefault()?.uid).toBe(initialUid);
        });
    });

    describe("ordered row model", () => {
        it("preserves the iterable order of setRows", () => {
            service.setRows(createRowData(5, i => ({ order: 5 - i })));

            expect(
                service
                    .rows()
                    .select(row => row.data["order"])
                    .toArray()
            ).toEqual([5, 4, 3, 2, 1]);
        });

        it("keeps duplicate data objects as separate rows", () => {
            const duplicate = { id: 1, name: "Jane" };
            service.setRows([duplicate, duplicate, { id: 2, name: "John" }]);

            expect(service.rows().size()).toBe(3);
            expect(
                service
                    .rows()
                    .select(row => row.data["id"])
                    .toArray()
            ).toEqual([1, 1, 2]);
        });

        it("preserves source order in viewRows without sorting", () => {
            service.setRows([{ id: 3 }, { id: 1 }, { id: 2 }]);

            expect(
                service
                    .viewRows()
                    .select(row => row.data["id"])
                    .toArray()
            ).toEqual([3, 1, 2]);
        });

        it("returns the correct ordered page slice", () => {
            service.setRows(createRowData(10));
            service.setPageState({ skip: 3, take: 4 });

            expect(
                service
                    .viewPageRows()
                    .select(row => row.data["id"])
                    .toArray()
            ).toEqual([3, 4, 5, 6]);
        });

        it("preserves relative order when filtering without sorting", () => {
            service.columns.set(ImmutableList.create([createColumn({ field: "name" })]));
            service.setRows([{ name: "Charlie" }, { name: "Alice" }, { name: "Bob" }, { name: "Alice" }]);
            service.loadFilters([
                {
                    logic: "and",
                    filters: [{ field: "name", operator: "eq", value: "Alice" }]
                }
            ]);

            expect(
                service
                    .viewRows()
                    .select(row => row.data["name"])
                    .toArray()
            ).toEqual(["Alice", "Alice"]);
        });
    });

    describe("expansion identity", () => {
        beforeEach(() => {
            service.setRows([{ id: 1, name: "Jane" }, { id: 2, name: "John" }], "id");
        });

        it("keys expansion state by row uid instead of the selection key", () => {
            const [first] = service.rows().toArray();
            service.selectBy.set("name");
            service.setRowExpanded(first, true);

            expect(service.isRowExpanded(first)).toBe(true);
            expect(service.expandedKeys().contains("Jane")).toBe(false);
            expect(service.expandedKeys().contains(first.uid)).toBe(true);
        });

        it("keeps expansion state when the selection configuration changes", () => {
            const [first] = service.rows().toArray();
            service.setRowExpanded(first, true);
            service.selectBy.set("name");

            expect(service.isRowExpanded(first)).toBe(true);
        });

        it("keeps expansion state on the reordered row after a data rebind", () => {
            const rows = service.rows().toArray();
            const second = rows[1]!;
            service.setRowExpanded(second, true);
            const expandedUid = second.uid;

            service.setRows([{ id: 2, name: "John" }, { id: 1, name: "Jane" }], "id");

            const reordered = service.rows().toArray();
            expect(reordered[0]?.uid).toBe(expandedUid);
            expect(service.isRowExpanded(reordered[0]!)).toBe(true);
            expect(service.isRowExpanded(reordered[1]!)).toBe(false);
        });

        it("collapses a row when setRowExpanded is called with false", () => {
            const [first] = service.rows().toArray();
            service.setRowExpanded(first, true);
            service.setRowExpanded(first, false);

            expect(service.isRowExpanded(first)).toBe(false);
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

        it("blocks a cell save when the edited field itself is invalid", () => {
            service.setEditableOptions({ enabled: true, mode: "cell", schema: requiredNameFieldSchema });
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
            getSessionField(session, "name")().value.set("");

            expect(service.stopCellEdit()).toBe(false);
            expect(service.editSession()).toBe(session);
        });

        it("saves a valid cell even when another field in the row is invalid", () => {
            const saveEvents: GridSaveEvent[] = [];
            service.save$.subscribe(event => saveEvents.push(event));
            service.setRows([{ id: 1, name: "" }]);
            service.setEditableOptions({ enabled: true, mode: "cell", schema: requiredNameFieldSchema });
            const row = service.rows().firstOrDefault();
            const column = service.columns().firstOrDefault(c => c.field === "id");
            if (row == null || column == null) {
                throw new Error("Expected row and column");
            }

            expect(service.startCellEdit(`${row.uid}_id`, row, column)).toBe(true);
            const session = service.editSession();
            if (session == null) {
                throw new Error("Expected edit session");
            }
            getSessionField(session, "id")().value.set(2);

            expect(service.stopCellEdit()).toBe(true);

            expect(saveEvents).toHaveLength(1);
            expect(saveEvents[0].rowData["id"]).toBe(2);
            expect(service.editSession()).toBeNull();
        });

        it("blocks a cell save when a row-level validator reports an error", () => {
            service.setRows([{ id: 1, name: "" }]);
            service.setEditableOptions({ enabled: true, mode: "cell", schema: requiredNameSchema });
            const row = service.rows().firstOrDefault();
            const column = service.columns().firstOrDefault(c => c.field === "id");
            if (row == null || column == null) {
                throw new Error("Expected row and column");
            }

            expect(service.startCellEdit(`${row.uid}_id`, row, column)).toBe(true);
            const session = service.editSession();

            expect(service.stopCellEdit()).toBe(false);
            expect(service.editSession()).toBe(session);
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
            service.setSelectableOptions({ selectOnRowClick: true });
            const [first, second] = service.rows().toArray();
            const event = new MouseEvent("click");

            service.handleRowClick(event, first);
            service.handleRowClick(event, second);

            expect(service.isRowSelected(first)).toBe(false);
            expect(service.isRowSelected(second)).toBe(true);
        });

        it("does nothing on handleRowClick by default, since selectOnRowClick defaults to false", () => {
            service.setSelectableOptions({ enabled: true, mode: "single" });
            const row = service.rows().firstOrDefault()!;

            service.handleRowClick(new MouseEvent("click"), row);

            expect(service.isRowSelected(row)).toBe(false);
        });

        it("does nothing on handleRowClick when the grid is not selectable", () => {
            service.setSelectableOptions({ enabled: false, mode: "single" });
            const row = service.rows().firstOrDefault()!;

            service.handleRowClick(new MouseEvent("click"), row);

            expect(service.isRowSelected(row)).toBe(false);
        });

        it("supports additive multi-selection via ctrl/meta click", () => {
            service.setSelectableOptions({ enabled: true, mode: "multiple", selectOnRowClick: true });
            const [first, second] = service.rows().toArray();
            const ctrlClick = new MouseEvent("click", { ctrlKey: true });

            service.handleRowClick(ctrlClick, first);
            service.handleRowClick(ctrlClick, second);

            expect(service.isRowSelected(first)).toBe(true);
            expect(service.isRowSelected(second)).toBe(true);
        });

        it("replaces the selection on a plain click in multiple mode", () => {
            service.setSelectableOptions({ enabled: true, mode: "multiple", selectOnRowClick: true });
            const [first, second] = service.rows().toArray();
            const plainClick = new MouseEvent("click");

            service.handleRowClick(plainClick, first);
            service.handleRowClick(plainClick, second);

            expect(service.isRowSelected(first)).toBe(false);
            expect(service.isRowSelected(second)).toBe(true);
            expect(service.selectedKeys().size()).toBe(1);
        });

        it("toggles an individual row without disturbing others via ctrl/meta click", () => {
            service.setSelectableOptions({ enabled: true, mode: "multiple", selectOnRowClick: true });
            const [first, second] = service.rows().toArray();
            const ctrlClick = new MouseEvent("click", { ctrlKey: true });

            service.handleRowClick(ctrlClick, first);
            service.handleRowClick(ctrlClick, second);
            service.handleRowClick(ctrlClick, first);

            expect(service.isRowSelected(first)).toBe(false);
            expect(service.isRowSelected(second)).toBe(true);
        });

        it("range-selects between the anchor and target row via shift-click", () => {
            service.setSelectableOptions({ enabled: true, mode: "multiple", selectOnRowClick: true });
            service.setRows(createRowData(5));
            const [first, , third, , fifth] = service.rows().toArray();
            const plainClick = new MouseEvent("click");
            const shiftClick = new MouseEvent("click", { shiftKey: true });

            service.handleRowClick(plainClick, first);
            service.handleRowClick(shiftClick, third);

            expect(service.selectedKeys().size()).toBe(3);
            expect(service.isRowSelected(third)).toBe(true);
            expect(service.isRowSelected(fifth)).toBe(false);
        });

        it("recomputes the shift-click range from the last plain- or ctrl-clicked anchor", () => {
            service.setSelectableOptions({ enabled: true, mode: "multiple", selectOnRowClick: true });
            service.setRows(createRowData(5));
            const rows = service.rows().toArray();
            const [first, second, third, fourth, fifth] = rows;
            const plainClick = new MouseEvent("click");
            const shiftClick = new MouseEvent("click", { shiftKey: true });

            service.handleRowClick(plainClick, third);
            service.handleRowClick(shiftClick, first);
            expect(service.selectedKeys().size()).toBe(3);

            service.handleRowClick(plainClick, fourth);
            service.handleRowClick(shiftClick, fifth);

            expect(service.isRowSelected(first)).toBe(false);
            expect(service.isRowSelected(second)).toBe(false);
            expect(service.isRowSelected(third)).toBe(false);
            expect(service.isRowSelected(fourth)).toBe(true);
            expect(service.isRowSelected(fifth)).toBe(true);
            expect(service.selectedKeys().size()).toBe(2);
        });

        it("does nothing on handleRowClick when selectOnRowClick is false", () => {
            service.setSelectableOptions({ enabled: true, mode: "single", selectOnRowClick: false });
            const row = service.rows().firstOrDefault()!;

            service.handleRowClick(new MouseEvent("click"), row);

            expect(service.isRowSelected(row)).toBe(false);
        });

        it("selects one row via setRowSelected", () => {
            const row = service.rows().firstOrDefault()!;

            service.setRowSelected(row, true);

            expect(service.isRowSelected(row)).toBe(true);
            expect(service.selectedKeys().size()).toBe(1);
        });

        it("deselects one row via setRowSelected", () => {
            const row = service.rows().firstOrDefault()!;
            service.selectRow(row);

            service.setRowSelected(row, false);

            expect(service.isRowSelected(row)).toBe(false);
            expect(service.selectedKeys().isEmpty()).toBe(true);
        });

        it("deselects one row via deselectRow", () => {
            const row = service.rows().firstOrDefault()!;
            service.selectRow(row);

            service.deselectRow(row);

            expect(service.isRowSelected(row)).toBe(false);
        });

        it("clears the previous selection in single mode when selecting a row", () => {
            const [first, second] = service.rows().toArray();
            service.selectRow(first);

            service.setRowSelected(second, true);

            expect(service.isRowSelected(first)).toBe(false);
            expect(service.isRowSelected(second)).toBe(true);
        });

        it("preserves prior selections in multiple mode", () => {
            service.setSelectableOptions({ enabled: true, mode: "multiple" });
            const [first, second] = service.rows().toArray();
            service.setRowSelected(first, true);

            service.setRowSelected(second, true);

            expect(service.isRowSelected(first)).toBe(true);
            expect(service.isRowSelected(second)).toBe(true);
        });

        it("derives selectedRows only from currently available rows", () => {
            service.selectBy.set("id");
            service.setRows(createRowData(3));
            const [first, second] = service.rows().toArray();
            service.setSelectableOptions({ enabled: true, mode: "multiple" });
            service.setRowSelected(first, true);
            service.setRowSelected(second, true);

            service.setRows(createRowData(1));

            expect(service.selectedRows().size()).toBe(1);
            expect(service.selectedKeys().size()).toBe(2);
        });
    });

    describe("selection key resolution", () => {
        it("uses a string selectBy to derive selection keys", () => {
            service.selectBy.set("id");
            service.setRows(createRowData(2));
            service.setSelectableOptions({ enabled: true, mode: "multiple" });
            const row = service.rows().firstOrDefault()!;

            service.selectRow(row);

            expect(service.isRowSelected(row)).toBe(true);
            expect(service.selectedKeys().firstOrDefault()).toBe(0);
        });

        it("uses a selector function to derive selection keys", () => {
            service.selectBy.set(data => (data as Record<PropertyKey, unknown>)["id"]);
            service.setRows(createRowData(2));
            service.setSelectableOptions({ enabled: true, mode: "multiple" });
            const row = service.rows().firstOrDefault()!;

            service.selectRow(row);

            expect(service.isRowSelected(row)).toBe(true);
            expect(service.selectedKeys().firstOrDefault()).toBe(0);
        });
    });

    describe("bulk selection", () => {
        beforeEach(() => {
            service.columns.set(ImmutableList.create([createColumn({ field: "id" })]));
            service.setRows(createRowData(25));
            service.setSelectableOptions({ enabled: true, mode: "multiple", showCheckboxes: true });
        });

        it("selects all rows on the current page via setBulkSelection", () => {
            service.setPageState({ page: 1, skip: 0, take: 10 });
            service.setBulkSelection(true);

            expect(service.selectedKeys().size()).toBe(10);
            expect(service.allBulkSelectionRowsSelected()).toBe(true);
        });

        it("deselects only the current page via setBulkSelection", () => {
            service.setPageState({ page: 1, skip: 0, take: 10 });
            service.setBulkSelection(true);
            const pageOneKeys = service.selectedKeys();

            service.setPageState({ page: 2, skip: 10, take: 10 });
            service.setBulkSelection(false);

            expect(service.selectedKeys().size()).toBe(10);
            expect(service.selectedKeys().all(key => pageOneKeys.contains(key))).toBe(true);
        });

        it("preserves keys selected on other pages when selecting the current page", () => {
            service.setPageState({ page: 2, skip: 10, take: 10 });
            service.setBulkSelection(true);
            const pageTwoKeys = service.selectedKeys();

            service.setPageState({ page: 1, skip: 0, take: 10 });
            service.setBulkSelection(true);

            expect(service.selectedKeys().size()).toBe(20);
            expect(pageTwoKeys.all(key => service.selectedKeys().contains(key))).toBe(true);
        });

        it("affects only the filtered view for view scope", () => {
            service.setSelectableOptions({ enabled: true, mode: "multiple", showCheckboxes: true, selectAllScope: "view" });
            service.loadFilters([
                {
                    logic: "and",
                    filters: [{ field: "id", operator: "gte", value: 10 }]
                }
            ]);

            service.setBulkSelection(true);

            expect(service.viewRows().size()).toBe(15);
            expect(service.selectedKeys().size()).toBe(15);
            expect(service.allBulkSelectionRowsSelected()).toBe(true);
        });

        it("reports indeterminate state when only some scope rows are selected", () => {
            service.setPageState({ page: 1, skip: 0, take: 10 });
            const row = service.viewPageRows().firstOrDefault()!;

            service.selectRow(row);

            expect(service.someBulkSelectionRowsSelected()).toBe(true);
            expect(service.allBulkSelectionRowsSelected()).toBe(false);
        });

        it("reports empty scope as not checked and not indeterminate", () => {
            service.setRows([]);

            expect(service.allBulkSelectionRowsSelected()).toBe(false);
            expect(service.someBulkSelectionRowsSelected()).toBe(false);
        });

        it("reports all rows selected only when every scope row is selected", () => {
            service.setPageState({ page: 1, skip: 0, take: 10 });
            const rows = service.viewPageRows().toArray();
            rows.forEach(row => service.selectRow(row));

            expect(service.allBulkSelectionRowsSelected()).toBe(true);
            expect(service.someBulkSelectionRowsSelected()).toBe(false);
        });

        it("keeps header state correct as individual rows are toggled in and out", () => {
            service.setSelectableOptions({
                enabled: true,
                mode: "multiple",
                showCheckboxes: true,
                selectAllScope: "view"
            });
            const rows = service.viewRows().toArray();

            for (const row of rows) {
                service.selectRow(row);
            }
            expect(service.allBulkSelectionRowsSelected()).toBe(true);
            expect(service.someBulkSelectionRowsSelected()).toBe(false);

            service.deselectRow(rows[0]);
            expect(service.allBulkSelectionRowsSelected()).toBe(false);
            expect(service.someBulkSelectionRowsSelected()).toBe(true);

            for (const row of rows) {
                service.deselectRow(row);
            }
            expect(service.allBulkSelectionRowsSelected()).toBe(false);
            expect(service.someBulkSelectionRowsSelected()).toBe(false);
        });

        it("resolves page scope to the full view in virtual mode", () => {
            service.setVirtualScrollOptions({ enabled: true, height: 32 });
            service.setPageState({ page: 1, skip: 0, take: 5 });
            service.setBulkSelection(true);

            expect(service.selectedKeys().size()).toBe(25);
        });

        it("does nothing in single mode", () => {
            service.setSelectableOptions({ enabled: true, mode: "single", showCheckboxes: true });
            service.setBulkSelection(true);

            expect(service.selectedKeys().isEmpty()).toBe(true);
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

    describe("structural columns", () => {
        it("keeps reorder, detail, and selection in a fixed left-to-right order", () => {
            service.setRowReorderableOptions({ enabled: true });
            service.masterDetailTemplate.set({} as never);
            service.setSelectableOptions({
                enabled: true,
                mode: "multiple",
                selectAllScope: "page",
                selectOnRowClick: false,
                showCheckboxes: true,
                showSelectAll: true
            });

            expect(service.visibleStructuralColumns().map(c => c.kind)).toEqual(["reorder", "detail", "selection"]);
            expect(service.rowReorderColumnOffset()).toBe(0);
            expect(service.detailColumnOffset()).toBe(36);
            expect(service.selectionColumnOffset()).toBe(72);
        });

        it("omits invisible structural columns from the offset chain", () => {
            service.setRowReorderableOptions({ enabled: false });
            service.setSelectableOptions({
                enabled: true,
                mode: "multiple",
                selectAllScope: "page",
                selectOnRowClick: false,
                showCheckboxes: true,
                showSelectAll: true
            });

            expect(service.visibleStructuralColumns().map(c => c.kind)).toEqual(["selection"]);
            expect(service.selectionColumnOffset()).toBe(0);
        });

        it("offsets structuralColumnOffset by an explicit group-prefix width, independent of the full group width", () => {
            service.setRowReorderableOptions({ enabled: true });
            service.columns.set(
                ImmutableList.create([createColumn({ field: "a" }), createColumn({ field: "b" })])
            );
            service.addGroupColumn(service.columns().get(0));
            service.addGroupColumn(service.columns().get(1));

            expect(service.groupStructuralWidth()).toBe(72);
            expect(service.structuralColumnOffset("reorder", 0)).toBe(0);
            expect(service.structuralColumnOffset("reorder", service.groupColumnWidth)).toBe(36);
            expect(service.rowReorderColumnOffset()).toBe(72);
        });

        it("derives colIndex/firstInRow/lastInRow from the same memoized registry", () => {
            service.setRowReorderableOptions({ enabled: true });
            service.masterDetailTemplate.set({} as never);

            expect(service.structuralColIndexMap().get("reorder")).toBe(0);
            expect(service.structuralColIndexMap().get("detail")).toBe(1);
            expect(service.structuralColIndexMap().get("reorder") === 0).toBe(true);
            expect(service.structuralColIndexMap().get("detail") === 0).toBe(false);
            expect(service.structuralLastKind()).toBe("detail");
        });

        it("keeps the structuralColIndexMap reference stable across reads when nothing structural changed", () => {
            service.setRowReorderableOptions({ enabled: true });

            const first = service.structuralColIndexMap();
            const second = service.structuralColIndexMap();

            expect(first).toBe(second);
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
