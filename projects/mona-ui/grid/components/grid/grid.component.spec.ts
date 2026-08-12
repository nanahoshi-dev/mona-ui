import type { CdkDragStart } from "@angular/cdk/drag-drop";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ImmutableList } from "@mirei/ts-collections";
import { PagerComponent } from "@nanahoshi/mona-ui/pager";
import type { SortDescriptor } from "@nanahoshi/mona-ui/query";
import { GridSortableDirective } from "../../directives/grid-sortable.directive";
import type { Column } from "../../models/Column";
import type { ColumnReorderEvent } from "../../models/ColumnReorderEvent";
import type { ColumnResizeEvent } from "../../models/ColumnResizeEvent";
import type { ColumnSortEvent } from "../../models/ColumnSortEvent";
import { GridService } from "../../services/grid.service";
import {
    gridBaseThemeVariants,
    gridFilterRowCellThemeVariants,
    gridHeaderTableCellThemeVariants
} from "../../styles/grid.styles";
import { GridColumnComponent } from "../grid-column/grid-column.component";

import { GridComponent } from "./grid.component";

@Component({
    template: `
        <mona-grid>
            <mona-grid-column field="name" title="Name"></mona-grid-column>
            <mona-grid-column field="age" title="Age"></mona-grid-column>
        </mona-grid>
    `,
    imports: [GridComponent, GridColumnComponent]
})
class GridWithColumnsTestComponent {}

@Component({
    template: `
        <mona-grid monaGridSortable [sort]="sort">
            <mona-grid-column field="name" title="Name"></mona-grid-column>
        </mona-grid>
    `,
    imports: [GridComponent, GridColumnComponent, GridSortableDirective]
})
class SortableGridWithColumnsTestComponent {
    protected readonly sort: SortDescriptor[] = [{ field: "name", dir: "asc" }];
}

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
        filterable: true,
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

    it("registers projected columns without requiring a feature directive", async () => {
        const hostFixture = TestBed.createComponent(GridWithColumnsTestComponent);

        hostFixture.detectChanges();
        await hostFixture.whenStable();
        hostFixture.detectChanges();

        const gridElement = hostFixture.nativeElement as HTMLElement;
        const headers = Array.from(gridElement.querySelectorAll<HTMLElement>('[role="columnheader"]'), header =>
            header.textContent?.trim()
        );
        expect(headers).toEqual(["Name", "Age"]);
    });

    it("applies initial sorts after the grid registers its projected columns", async () => {
        const hostFixture = TestBed.createComponent(SortableGridWithColumnsTestComponent);

        hostFixture.detectChanges();
        await hostFixture.whenStable();
        hostFixture.detectChanges();

        const gridElement = hostFixture.nativeElement as HTMLElement;
        expect(gridElement.querySelector<HTMLElement>('[role="columnheader"]')?.getAttribute("aria-sort")).toBe(
            "ascending"
        );
    });

    it("uses a neutral surface, quiet boundary, and semantic header focus", () => {
        const gridClasses = gridBaseThemeVariants();
        const headerCellClasses = gridHeaderTableCellThemeVariants();

        expect(gridClasses).toContain("bg-surface");
        expect(gridClasses).toContain("border-border");
        expect(headerCellClasses).toContain("border-r-border-subtle");
        expect(headerCellClasses).toContain("focus:after:ring-focus-indicator/35");
        expect(headerCellClasses).not.toContain("ring-primary");
    });

    it("lifts filter-row controls onto the theme's raised surface", () => {
        const filterRowCellClasses = gridFilterRowCellThemeVariants();

        expect(filterRowCellClasses).toContain(
            "[--mona-effect-control-background-color:var(--mona-effect-raised-background-color,var(--color-surface-raised))]"
        );
        expect(filterRowCellClasses).toContain(
            "[--mona-effect-control-fallback-background-color:var(--mona-effect-raised-fallback-background-color,var(--color-surface-raised))]"
        );
        expect(filterRowCellClasses).toContain(
            "[--mona-effect-control-background-image:var(--mona-effect-raised-background-image,none)]"
        );
        expect(filterRowCellClasses).toContain(
            "[--mona-effect-control-backdrop-filter:var(--mona-effect-raised-backdrop-filter,none)]"
        );
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
