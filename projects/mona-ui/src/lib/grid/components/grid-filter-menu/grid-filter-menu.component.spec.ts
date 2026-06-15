import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ButtonDirective } from "../../../buttons/button/directives/button.directive";
import { FilterMenuComponent } from "../../../filter/components/filter-menu/filter-menu.component";
import type { FilterMenuDateOptions } from "../../../filter/models/FilterMenuDateOptions";
import { FilterService } from "../../../filter/services/filter.service";
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

    it("creates default date options for datetime columns", () => {
        setColumnInput({
            ...createColumn(),
            dataType: "datetime"
        });
        fixture.detectChanges();

        expect(readDateOptions()).toEqual({
            format: "dd/MM/yyyy HH:mm",
            type: "datetime"
        });
    });

    it("creates default date options for time columns", () => {
        setColumnInput({
            ...createColumn(),
            dataType: "time"
        });
        fixture.detectChanges();

        expect(readDateOptions()).toEqual({
            format: "HH:mm",
            type: "time"
        });
    });

    it("uses the column string format for date options", () => {
        setColumnInput({
            ...createColumn(),
            dataType: "date",
            format: "yyyy-MM-dd"
        });
        fixture.detectChanges();

        expect(readDateOptions()).toEqual({
            format: "yyyy-MM-dd",
            type: "date"
        });
    });

    function readDateOptions(): FilterMenuDateOptions | null {
        type DateOptionsReader = { createDateOptions(): FilterMenuDateOptions | null };
        return (component as unknown as DateOptionsReader).createDateOptions();
    }

    function setColumnInput(column: Column): void {
        fixture.componentRef.setInput("column", column);
        fixture.componentRef.setInput("type", column.dataType);
    }
});
