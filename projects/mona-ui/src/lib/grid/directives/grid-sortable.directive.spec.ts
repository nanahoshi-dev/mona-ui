import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ImmutableList } from "@mirei/ts-collections";
import type { SortDescriptor } from "../../query/sort/SortDescriptor";
import type { Column } from "../models/Column";
import { ColumnSortEvent } from "../models/ColumnSortEvent";
import type { SortableOptions } from "../models/SortableOptions";
import { GridService } from "../services/grid.service";
import { GridSortableDirective } from "./grid-sortable.directive";

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
        [monaGridSortable]="options"
        [(sort)]="sort"
        (columnSort)="onColumnSort($event)"></mona-grid>`,
    imports: [GridSortableDirective],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
class HostComponent {
    public options: SortableOptions | "" = "";
    public sort: SortDescriptor[] = [];
    public onColumnSort: (event: ColumnSortEvent) => void = vi.fn();
}

describe("GridSortableDirective", () => {
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
        // Set columns after the directive's initial effects (which reconcile against
        // the empty content-children query in this headless test) have already run,
        // otherwise setColumnDefinitions([]) wipes them back out.
        gridService.columns.set(
            ImmutableList.create([createColumn({ field: "name" }), createColumn({ field: "age" })])
        );
    });

    function getColumn(field: string): Column {
        return gridService.columns().firstOrDefault(c => c.field === field)!;
    }

    it("should create an instance", () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it("enables sorting via the empty-string shorthand by default", () => {
        expect(gridService.sortableOptions().enabled).toBe(true);
    });

    it("merges an explicit options object into sortableOptions", () => {
        const localFixture = TestBed.createComponent(HostComponent);
        localFixture.componentInstance.options = { enabled: true, mode: "multiple", allowUnsort: false };
        localFixture.detectChanges();

        expect(gridService.sortableOptions()).toEqual({
            enabled: true,
            mode: "multiple",
            allowUnsort: false,
            showIndices: true
        });
    });

    it("cycles asc -> desc -> unsort when allowUnsort is true", () => {
        gridService.columnSort$.next(new ColumnSortEvent(getColumn("name")));
        expect(getColumn("name").columnSortDirection).toBe("asc");

        gridService.columnSort$.next(new ColumnSortEvent(getColumn("name")));
        expect(getColumn("name").columnSortDirection).toBe("desc");

        gridService.columnSort$.next(new ColumnSortEvent(getColumn("name")));
        expect(getColumn("name").columnSortDirection).toBeNull();
    });

    it("cycles asc -> desc -> asc when allowUnsort is false", () => {
        gridService.setSortableOptions({ enabled: true, allowUnsort: false });

        gridService.columnSort$.next(new ColumnSortEvent(getColumn("name")));
        expect(getColumn("name").columnSortDirection).toBe("asc");

        gridService.columnSort$.next(new ColumnSortEvent(getColumn("name")));
        expect(getColumn("name").columnSortDirection).toBe("desc");

        gridService.columnSort$.next(new ColumnSortEvent(getColumn("name")));
        expect(getColumn("name").columnSortDirection).toBe("asc");
    });

    it("clears other columns' sort in single mode", () => {
        gridService.setSortableOptions({ enabled: true, mode: "single" });

        gridService.columnSort$.next(new ColumnSortEvent(getColumn("name")));
        gridService.columnSort$.next(new ColumnSortEvent(getColumn("age")));

        expect(getColumn("age").columnSortDirection).toBe("asc");
        expect(getColumn("name").columnSortDirection).toBeNull();
    });

    it("keeps existing sorts in multiple mode", () => {
        gridService.setSortableOptions({ enabled: true, mode: "multiple" });

        gridService.columnSort$.next(new ColumnSortEvent(getColumn("name")));
        gridService.columnSort$.next(new ColumnSortEvent(getColumn("age")));

        expect(getColumn("age").columnSortDirection).toBe("asc");
        expect(getColumn("name").columnSortDirection).toBe("asc");
    });

    it("updates the sort model with the applied sort descriptors", () => {
        gridService.columnSort$.next(new ColumnSortEvent(getColumn("name")));

        expect(fixture.componentInstance.sort).toEqual([{ field: "name", dir: "asc" }]);
    });

    it("skips applying the sort when the columnSort event is cancelled", () => {
        fixture.componentInstance.onColumnSort = (event: ColumnSortEvent) => event.preventDefault();

        gridService.columnSort$.next(new ColumnSortEvent(getColumn("name")));

        expect(getColumn("name").columnSortDirection).toBeNull();
    });
});
