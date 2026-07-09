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

    it("returns false for an unknown navigation key", () => {
        const first = createData({ rowIndex: 0, colIndex: 0 });
        const key = service.registerCell(first);

        expect(service.navigate(key, "Escape")).toBe(false);
    });
});
