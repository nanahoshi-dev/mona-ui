import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import type { Column } from "../models/Column";
import type { ColumnResizeEvent } from "../models/ColumnResizeEvent";
import type { ResizableOptions } from "../models/ResizableOptions";
import { GridService } from "../services/grid.service";
import { GridResizableDirective } from "./grid-resizable.directive";

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

@Component({
    template: ` <mona-grid [monaGridResizable]="options" (columnResize)="onColumnResize($event)"></mona-grid>`,
    imports: [GridResizableDirective],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
class HostComponent {
    public options: ResizableOptions | "" = "";
    public onColumnResize = vi.fn();
}

describe("GridResizableDirective", () => {
    let fixture: ComponentFixture<HostComponent>;
    let gridService: GridService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HostComponent],
            providers: [GridService]
        }).compileComponents();

        fixture = TestBed.createComponent(HostComponent);
        gridService = fixture.debugElement.injector.get(GridService);
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("should create an instance", () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it("enables resizing via the empty-string shorthand by default", () => {
        expect(gridService.resizableOptions().enabled).toBe(true);
    });

    it("merges an explicit options object into resizableOptions", () => {
        const localFixture = TestBed.createComponent(HostComponent);
        localFixture.componentInstance.options = { enabled: false };
        localFixture.detectChanges();

        expect(gridService.resizableOptions()).toEqual({ enabled: false });
    });

    it("forwards columnResize$ events emitted from the grid service", () => {
        const column = createColumn({ field: "name" });
        const event: ColumnResizeEvent = { column, oldWidth: 80, newWidth: 120 };

        gridService.columnResize$.next(event);

        expect(fixture.componentInstance.onColumnResize).toHaveBeenCalledWith(event);
    });
});
