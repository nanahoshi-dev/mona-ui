import type { CdkDragStart } from "@angular/cdk/drag-drop";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ImmutableList } from "@mirei/ts-collections";
import { PagerComponent } from "@nanahoshi/mona-ui/pager";
import type { Column } from "../../models/Column";
import type { ColumnReorderEvent } from "../../models/ColumnReorderEvent";
import type { ColumnResizeEvent } from "../../models/ColumnResizeEvent";
import type { ColumnSortEvent } from "../../models/ColumnSortEvent";
import { GridService } from "../../services/grid.service";
import { gridBaseVariants, gridHeaderTableCellVariants } from "../../styles/grid.mona.styles";

import { GridComponent } from "./grid.component";

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

function createDragStart(column: Column): CdkDragStart<Column> {
    return { source: { data: column } } as unknown as CdkDragStart<Column>;
}

describe("GridComponent", () => {
    let component: GridComponent<unknown>;
    let fixture: ComponentFixture<GridComponent<unknown>>;
    let gridService: GridService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridComponent, PagerComponent],
            providers: []
        }).compileComponents();
        fixture = TestBed.createComponent(GridComponent);
        component = fixture.componentInstance;
        gridService = fixture.debugElement.injector.get(GridService);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("uses a neutral surface, quiet boundary, and semantic header focus", () => {
        const gridClasses = gridBaseVariants();
        const headerCellClasses = gridHeaderTableCellVariants();

        expect(gridClasses).toContain("bg-surface");
        expect(gridClasses).toContain("border-border");
        expect(headerCellClasses).toContain("border-r-border-subtle");
        expect(headerCellClasses).toContain("focus:after:ring-focus-indicator/35");
        expect(headerCellClasses).not.toContain("ring-primary");
    });

    describe("onColumnSort", () => {
        it("emits a ColumnSortEvent for the column when sorting is enabled", () => {
            gridService.setSortableOptions({ enabled: true });
            const column = createColumn({ field: "name" });
            let received: ColumnSortEvent | undefined;
            gridService.columnSort$.subscribe(event => (received = event));

            component["onColumnSort"](column);

            expect(received?.column).toBe(column);
        });

        it("does not emit when sorting is disabled", () => {
            gridService.setSortableOptions({ enabled: false });
            const column = createColumn({ field: "name" });
            const spy = vi.fn();
            gridService.columnSort$.subscribe(spy);

            component["onColumnSort"](column);

            expect(spy).not.toHaveBeenCalled();
        });

        it("does not emit for command columns", () => {
            gridService.setSortableOptions({ enabled: true });
            const column = createColumn({ field: "", kind: "command" });
            const spy = vi.fn();
            gridService.columnSort$.subscribe(spy);

            component["onColumnSort"](column);

            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe("onColumnResizeEnd", () => {
        it("forwards the resize event to gridService.columnResize$", () => {
            const column = createColumn({ field: "name" });
            const resizeEvent: ColumnResizeEvent = { column, oldWidth: 80, newWidth: 120 };
            let received: ColumnResizeEvent | undefined;
            gridService.columnResize$.subscribe(event => (received = event));

            component["onColumnResizeEnd"](resizeEvent);

            expect(received).toEqual(resizeEvent);
        });
    });

    describe("onColumnDrop", () => {
        function setupColumns(): Column[] {
            const columns = [
                createColumn({ field: "a", index: 0 }),
                createColumn({ field: "b", index: 1 }),
                createColumn({ field: "c", index: 2 })
            ];
            gridService.columns.set(ImmutableList.create(columns));
            return columns;
        }

        it("reorders columns when dropped in a new position", () => {
            const [colA, , colC] = setupColumns();
            gridService.setReorderableOptions({ enabled: true });

            component["onColumnDragStart"](createDragStart(colA));
            component["onColumnMouseEnter"](colC);
            component["onColumnDrop"]();

            const fields = gridService
                .columns()
                .select(c => c.field)
                .toArray();
            expect(fields).toEqual(["b", "a", "c"]);
        });

        it("does nothing when reordering is disabled", () => {
            const [colA, , colC] = setupColumns();
            gridService.setReorderableOptions({ enabled: false });

            component["onColumnDragStart"](createDragStart(colA));
            component["onColumnMouseEnter"](colC);
            component["onColumnDrop"]();

            const fields = gridService
                .columns()
                .select(c => c.field)
                .toArray();
            expect(fields).toEqual(["a", "b", "c"]);
        });

        it("aborts the reorder when the columnReorder$ event is cancelled", () => {
            const [colA, , colC] = setupColumns();
            gridService.setReorderableOptions({ enabled: true });
            gridService.columnReorder$.subscribe((event: ColumnReorderEvent) => event.preventDefault());

            component["onColumnDragStart"](createDragStart(colA));
            component["onColumnMouseEnter"](colC);
            component["onColumnDrop"]();

            const fields = gridService
                .columns()
                .select(c => c.field)
                .toArray();
            expect(fields).toEqual(["a", "b", "c"]);
        });
    });

    describe("isColumnDragDisabled", () => {
        function isDragDisabled(column: Column): boolean {
            return (component as unknown as { isColumnDragDisabled(column: Column): boolean }).isColumnDragDisabled(
                column
            );
        }

        it("is always disabled for locked columns", () => {
            gridService.setReorderableOptions({ enabled: true });
            const column = createColumn({ field: "a", locked: true });

            expect(isDragDisabled(column)).toBe(true);
        });

        it("is enabled when reordering is enabled", () => {
            gridService.setReorderableOptions({ enabled: true });
            gridService.setGroupableOptions({ enabled: false });
            const column = createColumn({ field: "a" });

            expect(isDragDisabled(column)).toBe(false);
        });

        it("is enabled when grouping is enabled even if reordering is not", () => {
            gridService.setReorderableOptions({ enabled: false });
            gridService.setGroupableOptions({ enabled: true });
            const column = createColumn({ field: "a" });

            expect(isDragDisabled(column)).toBe(false);
        });

        it("is disabled when neither reordering nor grouping is enabled", () => {
            gridService.setReorderableOptions({ enabled: false });
            gridService.setGroupableOptions({ enabled: false });
            const column = createColumn({ field: "a" });

            expect(isDragDisabled(column)).toBe(true);
        });
    });
});
