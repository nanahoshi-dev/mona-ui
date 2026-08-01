import { TestBed } from "@angular/core/testing";

import { GridNavigationService, NavigationData } from "./grid-navigation.service";

function createElement(): HTMLTableCellElement {
    const element = document.createElement("td");
    element.focus = vi.fn();
    element.scrollIntoView = vi.fn();
    return element;
}

function createData(
    overrides: Partial<NavigationData> & Pick<NavigationData, "rowIndex" | "colIndex">
): NavigationData {
    return {
        cellKind: "data",
        editable: false,
        element: createElement(),
        firstInRow: false,
        groupHeader: false,
        lastInRow: false,
        section: "body",
        ...overrides
    };
}

describe("GridNavigationService", () => {
    let service: GridNavigationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [GridNavigationService]
        });
        service = TestBed.inject(GridNavigationService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("horizontal navigation", () => {
        it("moves focus to the next cell in the row on ArrowRight", () => {
            const first = createData({ rowIndex: 0, colIndex: 0, firstInRow: true });
            const second = createData({ rowIndex: 0, colIndex: 1, lastInRow: true });
            const firstKey = service.registerCell(first);
            service.registerCell(second);

            const moved = service.navigate(firstKey, "ArrowRight");

            expect(moved).toBe(true);
            expect(second.element.focus).toHaveBeenCalledTimes(1);
            expect(service.isFocused(firstKey)).toBe(false);
        });

        it("does not move past the last cell in the row on ArrowRight", () => {
            const only = createData({ rowIndex: 0, colIndex: 0, firstInRow: true, lastInRow: true });
            const key = service.registerCell(only);

            const moved = service.navigate(key, "ArrowRight");

            expect(moved).toBe(false);
            expect(only.element.focus).not.toHaveBeenCalled();
        });

        it("does not move before the first cell in the row on ArrowLeft", () => {
            const only = createData({ rowIndex: 0, colIndex: 0, firstInRow: true, lastInRow: true });
            const key = service.registerCell(only);

            const moved = service.navigate(key, "ArrowLeft");

            expect(moved).toBe(false);
        });

        it("does not navigate horizontally out of a group header row", () => {
            const groupHeader = createData({ rowIndex: 0, colIndex: 0, groupHeader: true });
            const key = service.registerCell(groupHeader);

            expect(service.navigate(key, "ArrowRight")).toBe(false);
            expect(service.navigate(key, "ArrowLeft")).toBe(false);
        });
    });

    describe("vertical navigation", () => {
        it("moves focus to the cell below on ArrowDown", () => {
            const top = createData({ rowIndex: 0, colIndex: 0, firstInRow: true, lastInRow: true });
            const bottom = createData({ rowIndex: 1, colIndex: 0, firstInRow: true, lastInRow: true });
            const topKey = service.registerCell(top);
            service.registerCell(bottom);

            const moved = service.navigate(topKey, "ArrowDown");

            expect(moved).toBe(true);
            expect(bottom.element.focus).toHaveBeenCalledTimes(1);
        });

        it("returns false when there is no row below/above", () => {
            const only = createData({ rowIndex: 0, colIndex: 0, firstInRow: true, lastInRow: true });
            const key = service.registerCell(only);

            expect(service.navigate(key, "ArrowDown")).toBe(false);
            expect(service.navigate(key, "ArrowUp")).toBe(false);
        });

        it("remembers the last non-group column when moving through a group header row", () => {
            const dataRowAbove = createData({ rowIndex: 0, colIndex: 2, firstInRow: false, lastInRow: true });
            const groupHeader = createData({ rowIndex: 1, colIndex: 0, groupHeader: true });
            const dataRowBelow = createData({ rowIndex: 2, colIndex: 2, firstInRow: false, lastInRow: true });
            // Register the column-0 cell of the below row too, since column memory falls back to it otherwise.
            const dataRowBelowCol0 = createData({ rowIndex: 2, colIndex: 0, firstInRow: true, lastInRow: false });

            const aboveKey = service.registerCell(dataRowAbove);
            const groupKey = service.registerCell(groupHeader);
            service.registerCell(dataRowBelow);
            service.registerCell(dataRowBelowCol0);

            const movedToGroup = service.navigate(aboveKey, "ArrowDown");
            expect(movedToGroup).toBe(true);
            expect(groupHeader.element.focus).toHaveBeenCalledTimes(1);

            const movedToBelow = service.navigate(groupKey, "ArrowDown");
            expect(movedToBelow).toBe(true);
            expect(dataRowBelow.element.focus).toHaveBeenCalledTimes(1);
        });
    });

    describe("row edge navigation", () => {
        it("moves to the first cell in the row on Home", () => {
            const first = createData({ rowIndex: 0, colIndex: 0, firstInRow: true });
            const middle = createData({ rowIndex: 0, colIndex: 1 });
            const last = createData({ rowIndex: 0, colIndex: 2, lastInRow: true });
            service.registerCell(first);
            const middleKey = service.registerCell(middle);
            service.registerCell(last);

            expect(service.navigate(middleKey, "Home")).toBe(true);
            expect(first.element.focus).toHaveBeenCalledTimes(1);
        });

        it("moves to the last cell in the row on End", () => {
            const first = createData({ rowIndex: 0, colIndex: 0, firstInRow: true });
            const middle = createData({ rowIndex: 0, colIndex: 1 });
            const last = createData({ rowIndex: 0, colIndex: 2, lastInRow: true });
            service.registerCell(first);
            const middleKey = service.registerCell(middle);
            service.registerCell(last);

            expect(service.navigate(middleKey, "End")).toBe(true);
            expect(last.element.focus).toHaveBeenCalledTimes(1);
        });

        it("returns false when already at the requested edge", () => {
            const first = createData({ rowIndex: 0, colIndex: 0, firstInRow: true, lastInRow: false });
            const last = createData({ rowIndex: 0, colIndex: 1, lastInRow: true });
            const firstKey = service.registerCell(first);
            service.registerCell(last);

            expect(service.navigate(firstKey, "Home")).toBe(false);
        });

        it("does not navigate to a row edge from a group header", () => {
            const groupHeader = createData({ rowIndex: 0, colIndex: 0, groupHeader: true });
            const key = service.registerCell(groupHeader);

            expect(service.navigate(key, "Home")).toBe(false);
            expect(service.navigate(key, "End")).toBe(false);
        });
    });

    describe("grid edge navigation", () => {
        it("moves to the first cell in the whole grid on CtrlHome", () => {
            const first = createData({ rowIndex: 0, colIndex: 0 });
            const last = createData({ rowIndex: 5, colIndex: 3 });
            service.registerCell(first);
            const lastKey = service.registerCell(last);

            expect(service.navigate(lastKey, "CtrlHome")).toBe(true);
            expect(first.element.focus).toHaveBeenCalledTimes(1);
        });

        it("moves to the last cell in the whole grid on CtrlEnd", () => {
            const first = createData({ rowIndex: 0, colIndex: 0 });
            const last = createData({ rowIndex: 5, colIndex: 3 });
            const firstKey = service.registerCell(first);
            service.registerCell(last);

            expect(service.navigate(firstKey, "CtrlEnd")).toBe(true);
            expect(last.element.focus).toHaveBeenCalledTimes(1);
        });

        it("returns false when the grid has no registered cells", () => {
            expect(service.navigate("missing", "CtrlHome")).toBe(false);
            expect(service.navigate("missing", "CtrlEnd")).toBe(false);
        });
    });

    describe("focus tracking", () => {
        it("focuses the first cell in the grid via focusFirstCell", () => {
            const first = createData({ rowIndex: -1, colIndex: 0, cellKind: "header", section: "header" });
            const second = createData({ rowIndex: 1, colIndex: 0 });
            service.registerCell(second);
            service.registerCell(first);

            service.focusFirstCell();

            expect(first.element.focus).toHaveBeenCalledTimes(1);
        });

        it("tracks the last focused cell via setLastFocusedCellKey/isFocused", () => {
            const first = createData({ rowIndex: 0, colIndex: 0 });
            const second = createData({ rowIndex: 0, colIndex: 1 });
            const firstKey = service.registerCell(first);
            const secondKey = service.registerCell(second);

            service.setLastFocusedCellKey(secondKey);

            expect(service.isFocused(firstKey)).toBe(false);
            expect(service.isFocused(secondKey)).toBe(true);
        });

        it("stops returning a cell from navigation after it is unregistered", () => {
            const first = createData({ rowIndex: 0, colIndex: 0 });
            const second = createData({ rowIndex: 0, colIndex: 1, lastInRow: true });
            const firstKey = service.registerCell(first);
            const secondKey = service.registerCell(second);

            service.unregisterCell(secondKey);

            expect(service.navigate(firstKey, "ArrowRight")).toBe(false);
        });

        it("restores the remembered cell when focus returns to the grid", () => {
            const header = createData({ rowIndex: -1, colIndex: 0, cellKind: "header", section: "header" });
            const body = createData({ rowIndex: 0, colIndex: 0, rowUid: "row-1", columnId: "name" });
            service.registerCell(header);
            const bodyKey = service.registerCell(body);
            service.setLastFocusedCellKey(bodyKey);

            const focused = service.focusActiveCellOrFirstHeader();

            expect(focused).toBe(true);
            expect(body.element.focus).toHaveBeenCalledTimes(1);
            expect(body.element.scrollIntoView).toHaveBeenCalledTimes(1);
        });

        it("falls back to the nearest registered cell when the remembered row disappears", () => {
            const first = createData({ rowIndex: 0, colIndex: 1, rowUid: "row-1", columnId: "name" });
            const second = createData({ rowIndex: 1, colIndex: 1, rowUid: "row-2", columnId: "name" });
            const firstKey = service.registerCell(first);
            service.registerCell(second);
            service.setLastFocusedCellKey(firstKey);

            service.unregisterCell(firstKey);
            const focused = service.focusActiveCellOrFirstHeader();

            expect(focused).toBe(true);
            expect(second.element.focus).toHaveBeenCalledTimes(1);
        });
    });

    describe("adjacent editable cell navigation", () => {
        function createEditableRow(rowIndex: number, rowUid: string): NavigationData[] {
            return [
                createData({
                    rowIndex,
                    colIndex: 0,
                    rowUid,
                    columnId: "name",
                    editable: true,
                    startEdit: vi.fn(),
                    firstInRow: true
                }),
                createData({
                    rowIndex,
                    colIndex: 1,
                    rowUid,
                    columnId: "amount",
                    editable: true,
                    startEdit: vi.fn(),
                    lastInRow: true
                })
            ];
        }

        it("moves to the next editable cell in the same row", () => {
            const [name, amount] = createEditableRow(0, "row-1");
            service.registerCell(name);
            service.registerCell(amount);

            expect(service.focusAdjacentEditableCell("row-1", "name", "next")).toBe(true);
            expect(amount.element.focus).toHaveBeenCalledTimes(1);
        });

        it("moves to the previous editable cell in the same row", () => {
            const [name, amount] = createEditableRow(0, "row-1");
            service.registerCell(name);
            service.registerCell(amount);

            expect(service.focusAdjacentEditableCell("row-1", "amount", "previous")).toBe(true);
            expect(name.element.focus).toHaveBeenCalledTimes(1);
        });

        it("moves from the last editable cell of a row to the first editable cell of the next row", () => {
            const [firstName, firstAmount] = createEditableRow(0, "row-1");
            const [secondName, secondAmount] = createEditableRow(1, "row-2");
            [firstName, firstAmount, secondName, secondAmount].forEach(cell => service.registerCell(cell));

            expect(service.focusAdjacentEditableCell("row-1", "amount", "next")).toBe(true);
            expect(secondName.element.focus).toHaveBeenCalledTimes(1);
        });

        it("moves from the first editable cell of a row to the last editable cell of the previous row", () => {
            const [firstName, firstAmount] = createEditableRow(0, "row-1");
            const [secondName, secondAmount] = createEditableRow(1, "row-2");
            [firstName, firstAmount, secondName, secondAmount].forEach(cell => service.registerCell(cell));

            expect(service.focusAdjacentEditableCell("row-2", "name", "previous")).toBe(true);
            expect(firstAmount.element.focus).toHaveBeenCalledTimes(1);
        });

        it("skips non-editable data cells", () => {
            const name = createData({
                rowIndex: 0,
                colIndex: 0,
                rowUid: "row-1",
                columnId: "name",
                editable: true,
                startEdit: vi.fn()
            });
            const readOnly = createData({ rowIndex: 0, colIndex: 1, rowUid: "row-1", columnId: "id" });
            const amount = createData({
                rowIndex: 0,
                colIndex: 2,
                rowUid: "row-1",
                columnId: "amount",
                editable: true,
                startEdit: vi.fn()
            });
            [name, readOnly, amount].forEach(cell => service.registerCell(cell));

            expect(service.focusAdjacentEditableCell("row-1", "name", "next")).toBe(true);
            expect(readOnly.element.focus).not.toHaveBeenCalled();
            expect(amount.element.focus).toHaveBeenCalledTimes(1);
        });

        it("skips command and structural cells", () => {
            const name = createData({
                rowIndex: 0,
                colIndex: 0,
                rowUid: "row-1",
                columnId: "name",
                editable: true,
                startEdit: vi.fn()
            });
            const detail = createData({
                rowIndex: 0,
                colIndex: 1,
                rowUid: "row-1",
                columnId: "detail",
                cellKind: "detail",
                editable: true,
                startEdit: vi.fn()
            });
            const command = createData({
                rowIndex: 0,
                colIndex: 2,
                rowUid: "row-1",
                columnId: "commands",
                cellKind: "command",
                editable: true,
                startEdit: vi.fn()
            });
            const nextRowName = createData({
                rowIndex: 1,
                colIndex: 0,
                rowUid: "row-2",
                columnId: "name",
                editable: true,
                startEdit: vi.fn()
            });
            [name, detail, command, nextRowName].forEach(cell => service.registerCell(cell));

            expect(service.focusAdjacentEditableCell("row-1", "name", "next")).toBe(true);
            expect(detail.element.focus).not.toHaveBeenCalled();
            expect(command.element.focus).not.toHaveBeenCalled();
            expect(nextRowName.element.focus).toHaveBeenCalledTimes(1);
        });

        it("returns false after the last editable cell without wrapping", () => {
            const [name, amount] = createEditableRow(0, "row-1");
            service.registerCell(name);
            service.registerCell(amount);

            expect(service.focusAdjacentEditableCell("row-1", "amount", "next")).toBe(false);
            expect(name.element.focus).not.toHaveBeenCalled();
        });

        it("returns false before the first editable cell without wrapping", () => {
            const [name, amount] = createEditableRow(0, "row-1");
            service.registerCell(name);
            service.registerCell(amount);

            expect(service.focusAdjacentEditableCell("row-1", "name", "previous")).toBe(false);
            expect(amount.element.focus).not.toHaveBeenCalled();
        });

        it("returns false when the source cell is not a registered editable cell", () => {
            const [name, amount] = createEditableRow(0, "row-1");
            service.registerCell(name);
            service.registerCell(amount);

            expect(service.focusAdjacentEditableCell("row-9", "name", "next")).toBe(false);
        });

        it("ignores add-row cells", () => {
            const addCell = createData({
                rowIndex: -1,
                colIndex: 0,
                rowUid: "add-row",
                columnId: "name",
                section: "add",
                editable: true,
                startEdit: vi.fn()
            });
            const [name, amount] = createEditableRow(0, "row-1");
            [addCell, name, amount].forEach(cell => service.registerCell(cell));

            expect(service.focusAdjacentEditableCell("row-1", "name", "previous")).toBe(false);
            expect(addCell.element.focus).not.toHaveBeenCalled();
        });

        it("invokes the destination startEdit callback", () => {
            const [name, amount] = createEditableRow(0, "row-1");
            service.registerCell(name);
            service.registerCell(amount);

            service.focusAdjacentEditableCell("row-1", "name", "next");

            expect(amount.startEdit).toHaveBeenCalledTimes(1);
            expect(name.startEdit).not.toHaveBeenCalled();
        });
    });

    it("returns false for an unknown navigation key", () => {
        const first = createData({ rowIndex: 0, colIndex: 0 });
        const key = service.registerCell(first);

        expect(service.navigate(key, "Escape")).toBe(false);
    });
});
