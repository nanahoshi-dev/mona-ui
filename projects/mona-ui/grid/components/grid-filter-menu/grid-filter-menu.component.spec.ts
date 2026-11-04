import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { FilterMenuComponent, FilterService } from "@nanahoshi/mona-ui/filter";
import type { Column } from "../../models/Column";
import { GridService } from "../../services/grid.service";

import { GridFilterMenuComponent } from "./grid-filter-menu.component";

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
        filterable: true,
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
        sortable: true,
        sortIndex: null,
        stateKey: null,
        title: "Test",
        titleTemplate: null,
        width: null
    };
}

describe("GridFilterMenuComponent", () => {
    let component: GridFilterMenuComponent;
    let fixture: ComponentFixture<GridFilterMenuComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [GridFilterMenuComponent, ButtonDirective, FilterMenuComponent],
            providers: [FilterService, GridService]
        });
        fixture = TestBed.createComponent(GridFilterMenuComponent);
        component = fixture.componentInstance;
        setColumnInput(createColumn());
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("names the icon-only filter button after its column", () => {
        const button: HTMLButtonElement = fixture.nativeElement.querySelector("button");
        expect(button.getAttribute("aria-label")).toBe("Filter by Test");
    });

    function setColumnInput(column: Column): void {
        fixture.componentRef.setInput("column", column);
        fixture.componentRef.setInput("type", column.dataType);
    }
});
