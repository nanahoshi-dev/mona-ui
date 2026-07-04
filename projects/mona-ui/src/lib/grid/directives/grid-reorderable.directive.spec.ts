import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import type { Column } from "../models/Column";
import { ColumnReorderEvent } from "../models/ColumnReorderEvent";
import type { ReorderableOptions } from "../models/ReorderableOptions";
import { GridService } from "../services/grid.service";
import { GridReorderableDirective } from "./grid-reorderable.directive";

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
    template: ` <mona-grid
        [monaGridReorderable]="options"
        (columnReorder)="onColumnReorder($event)"></mona-grid>`,
    imports: [GridReorderableDirective],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
class HostComponent {
    public options: ReorderableOptions | "" = "";
    public onColumnReorder = vi.fn();
}

describe("GridReorderableDirective", () => {
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

    it("enables reordering via the empty-string shorthand by default", () => {
        expect(gridService.reorderableOptions().enabled).toBe(true);
    });

    it("merges an explicit options object into reorderableOptions", () => {
        const localFixture = TestBed.createComponent(HostComponent);
        localFixture.componentInstance.options = { enabled: false };
        localFixture.detectChanges();

        expect(gridService.reorderableOptions()).toEqual({ enabled: false });
    });

    it("forwards columnReorder$ events emitted from the grid service", () => {
        const column = createColumn({ field: "name" });
        const event = new ColumnReorderEvent(column, 0, 2);

        gridService.columnReorder$.next(event);

        expect(fixture.componentInstance.onColumnReorder).toHaveBeenCalledWith(event);
    });
});
