import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ButtonDirective } from "@mirei/mona-ui/button";
import type { FilterMenuDateOptions } from "@mirei/mona-ui/filter";
import { FilterMenuComponent, FilterService } from "@mirei/mona-ui/filter";
import { PopupRef, PopupService } from "@mirei/mona-ui/popup";
import { EMPTY, Subject } from "rxjs";
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
    let popupService: PopupService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [GridFilterMenuComponent, ButtonDirective, FilterMenuComponent],
            providers: [FilterService, GridService]
        });
        fixture = TestBed.createComponent(GridFilterMenuComponent);
        component = fixture.componentInstance;
        popupService = TestBed.inject(PopupService);
        setColumnInput(createColumn());
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
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
        const setInputSpy = vi.fn();
        vi.spyOn(popupService, "create").mockReturnValue({
            close: vi.fn(),
            component: {
                changeDetectorRef: { detectChanges: vi.fn() },
                instance: {
                    apply: new Subject(),
                    field: { set: vi.fn() },
                    type: { set: vi.fn() },
                    value: { set: vi.fn() }
                },
                setInput: setInputSpy
            },
            overlayRef: { backdropClick: () => EMPTY }
        } as unknown as PopupRef);

        (component as unknown as { openPopup(): void }).openPopup();

        const dateOptionsCall = setInputSpy.mock.calls.find(call => call[0] === "dateOptions");
        return dateOptionsCall ? (dateOptionsCall[1] as FilterMenuDateOptions) : null;
    }

    function setColumnInput(column: Column): void {
        fixture.componentRef.setInput("column", column);
        fixture.componentRef.setInput("type", column.dataType);
    }
});
