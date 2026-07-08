import { ComponentFixture, TestBed } from "@angular/core/testing";
import type { Column } from "../../models/Column";
import { Row } from "../../models/Row";
import { GridService } from "../../services/grid.service";

import { GridCellComponent } from "./grid-cell.component";

function createColumn(): Column {
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
        field: "test",
        filtered: false,
        format: null,
        footerTemplate: null,
        groupFooterTemplate: null,
        headerTemplate: null,
        groupSortDirection: null,
        hidden: false,
        id: "test",
        index: 0,
        kind: "data",
        locked: false,
        lockedPosition: "left",
        maxWidth: null,
        minWidth: 10,
        removeConfirmation: false,
        sortIndex: null,
        stateKey: null,
        title: "Test",
        titleTemplate: null,
        width: null
    };
}

describe("GridCellComponent", () => {
    let component: GridCellComponent;
    let fixture: ComponentFixture<GridCellComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [GridCellComponent],
            providers: [GridService]
        });
        fixture = TestBed.createComponent(GridCellComponent);
        component = fixture.componentInstance;
        setCellInputs(createColumn(), new Row({ test: "test" }));
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("formats date columns with the column format string", () => {
        setCellInputs(
            {
                ...createColumn(),
                dataType: "date",
                format: "yyyy-MM-dd"
            },
            new Row({ test: new Date(2026, 5, 24) })
        );
        fixture.detectChanges();

        expect(getCellText()).toBe("2026-06-24");
    });

    it("ignores string formats for non-date columns", () => {
        setCellInputs(
            {
                ...createColumn(),
                dataType: "number",
                format: "yyyy-MM-dd"
            },
            new Row({ test: 42 })
        );
        fixture.detectChanges();

        expect(getCellText()).toBe("42");
    });

    it("uses formatter function output for the cell text", () => {
        setCellInputs(
            {
                ...createColumn(),
                format: column => `formatted ${column.field}`
            },
            new Row({ test: "test" })
        );
        fixture.detectChanges();

        expect(getCellText()).toBe("formatted test");
    });

    function getCellText(): string {
        const hostElement = fixture.nativeElement as HTMLElement;
        return hostElement.textContent?.trim() ?? "";
    }

    function setCellInputs(column: Column, row: Row): void {
        fixture.componentRef.setInput("column", column);
        fixture.componentRef.setInput("row", row);
    }
});
