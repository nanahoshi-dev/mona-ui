import { Component, signal } from "@angular/core";
import { type ComponentFixture, DeferBlockState, TestBed } from "@angular/core/testing";
import type { PageChangeEvent } from "@nanahoshi/mona-ui/pager";
import type { SortDescriptor } from "@nanahoshi/mona-ui/query";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridDetailTemplateDirective } from "../directives/grid-detail-template.directive";
import { GridGroupableDirective } from "../directives/grid-groupable.directive";
import { GridSelectableDirective } from "../directives/grid-selectable.directive";
import { GridSortableDirective } from "../directives/grid-sortable.directive";
import { GridToolbarTemplateDirective } from "../directives/grid-toolbar-template.directive";
import type { ColumnSortComparator } from "../models/Column";
import type { GroupDescriptor } from "../models/GroupDescriptor";
import { GridService } from "../services/grid.service";

const byLength: ColumnSortComparator = (left, right) => String(left).length - String(right).length;

@Component({
    imports: [
        GridColumnComponent,
        GridComponent,
        GridDetailTemplateDirective,
        GridGroupableDirective,
        GridSelectableDirective,
        GridSortableDirective,
        GridToolbarTemplateDirective
    ],
    template: `
        <mona-grid
            rowKey="id"
            [data]="data()"
            [resizeMethod]="120"
            [(pageSize)]="pageSize"
            [(skip)]="skip"
            [(expandedKeys)]="expanded"
            (pageChange)="pages.push($event)"
            monaGridSortable
            [(sort)]="sort"
            monaGridGroupable
            [group]="group()"
            (groupChange)="groupEvents.push($event)"
            monaGridSelectable
            [selectedKeys]="selected()"
            (selectedKeysChange)="selectionEvents.push($event)">
            <ng-template monaGridToolbarTemplate let-context let-keys="selectedKeys">
                <span data-toolbar [attr.data-keys]="keys.length" [attr.data-skip]="context.dataState.skip"></span>
            </ng-template>
            <ng-template monaGridDetailTemplate let-row>
                <span data-detail>{{ row.id }}</span>
            </ng-template>
            <mona-grid-column field="id" title="Id" [width]="100"></mona-grid-column>
            <mona-grid-column field="name" title="Name" [width]="100" [sortComparator]="byLength"></mona-grid-column>
        </mona-grid>
    `
})
class HostComponent {
    public readonly byLength = byLength;
    public readonly data = signal(createRows(25));
    public readonly expanded = signal<unknown[]>([]);
    public readonly group = signal<GroupDescriptor[]>([]);
    public readonly groupEvents: GroupDescriptor[][] = [];
    public readonly pageSize = signal<number | undefined>(10);
    public readonly pages: PageChangeEvent[] = [];
    public readonly selected = signal<unknown[]>([]);
    public readonly selectionEvents: unknown[][] = [];
    public readonly skip = signal(0);
    public readonly sort = signal<SortDescriptor[]>([]);
}

function createRows(count: number): Array<{ id: number; name: string }> {
    return Array.from({ length: count }, (_, index) => ({ id: index + 1, name: "x".repeat((index % 4) + 1) }));
}

describe("grid state bindings", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let service: GridService;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        for (const block of await fixture.getDeferBlocks()) {
            await block.render(DeferBlockState.Complete);
        }
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function ids(): number[] {
        return service
            .viewPageRows()
            .select(row => row.data["id"] as number)
            .toArray();
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        await settle();
        service = fixture.debugElement.children[0].injector.get(GridService);
    });

    describe("paging", () => {
        it("pages from [(skip)] and doesn't report a value set from code", async () => {
            host.skip.set(10);
            await settle();
            expect(ids()[0]).toBe(11);
            expect(host.pages).toEqual([]);
        });

        it("moves to the last page when the data shrinks and reports it (GD2)", async () => {
            host.skip.set(20);
            await settle();
            host.data.set(createRows(15));
            await settle();
            expect(ids()).toEqual([11, 12, 13, 14, 15]);
            expect(host.skip()).toBe(10);
            expect(host.pages.at(-1)).toEqual({ page: 2, skip: 10, take: 10 });
            expect(fixture.nativeElement.querySelector("mona-pager")).not.toBeNull();
        });

        it("keeps the first row in view when the page size changes from code (GD8)", async () => {
            host.skip.set(20);
            await settle();
            host.pageSize.set(15);
            await settle();
            expect(ids()[0]).toBe(16);
            host.pageSize.set(0);
            await settle();
            expect(service.paginationState().take).toBe(15);
        });

        it("reports a user page change through pageChange and the models", async () => {
            const next = fixture.nativeElement.querySelector("button[aria-label='Next page']") as HTMLButtonElement;
            next.click();
            await settle();
            expect(host.pages).toEqual([{ page: 2, skip: 10, take: 10 }]);
            expect(host.skip()).toBe(10);
        });
    });

    describe("outputs only for user changes (GS3)", () => {
        it("doesn't echo [group] or [selectedKeys] set from code", async () => {
            host.group.set([{ field: "name" }]);
            host.selected.set([1, 2]);
            await settle();
            expect(service.groupColumns().length).toBe(1);
            expect(service.selectedKeys().toArray()).toEqual([1, 2]);
            expect(host.groupEvents).toEqual([]);
            expect(host.selectionEvents).toEqual([]);
        });

        it("reports a user grouping change once", async () => {
            const column = service.columns().first();
            service.addGroupColumn(column);
            await settle();
            expect(host.groupEvents).toEqual([[{ field: "id", dir: "asc" }]]);
        });

        it("reports a user selection change", async () => {
            service.setRowSelected(service.rows().first(), true);
            await settle();
            expect(host.selectionEvents).toEqual([[1]]);
        });
    });

    describe("sorting", () => {
        it("updates [(sort)] when a state is restored (GS4)", async () => {
            service.applyState({
                columns: [],
                filter: [],
                group: [],
                sort: [{ dir: "desc", field: "id" }],
                version: 1
            });
            await settle();
            expect(host.sort()).toEqual([{ dir: "desc", field: "id" }]);
            expect(ids()[0]).toBe(25);
        });

        it("keeps the column's comparator when the header is clicked (GD9)", async () => {
            const header = Array.from(fixture.nativeElement.querySelectorAll("th") as NodeListOf<HTMLElement>).find(
                th => th.textContent?.includes("Name")
            );
            header?.querySelector<HTMLElement>("[title='Name']")?.click();
            await settle();
            expect(host.sort()[0]?.sort).toBe(byLength);
            expect(
                service
                    .viewRows()
                    .select(row => String(row.data["name"]).length)
                    .take(7)
                    .toArray()
            ).toEqual([1, 1, 1, 1, 1, 1, 1]);
        });

        it("goes back to the first page when the user sorts, and reports it", async () => {
            host.skip.set(10);
            await settle();
            const header = Array.from(fixture.nativeElement.querySelectorAll("th") as NodeListOf<HTMLElement>).find(
                th => th.textContent?.includes("Id")
            );
            header?.querySelector<HTMLElement>("[title='Id']")?.click();
            await settle();
            expect(host.skip()).toBe(0);
            expect(host.pages).toEqual([{ page: 1, skip: 0, take: 10 }]);
            expect(ids()[0]).toBe(1);
        });

        it("keeps the page when sort is set from code", async () => {
            host.skip.set(10);
            await settle();
            host.sort.set([{ dir: "desc", field: "id" }]);
            await settle();
            expect(host.skip()).toBe(10);
            expect(ids()[0]).toBe(15);
            expect(host.pages).toEqual([]);
        });
    });

    it("gives the toolbar the grid state, not the service (GS8)", async () => {
        host.selected.set([3]);
        host.skip.set(10);
        await settle();
        const toolbar = fixture.nativeElement.querySelector("[data-toolbar]") as HTMLElement;
        expect(toolbar.dataset["keys"]).toBe("1");
        expect(toolbar.dataset["skip"]).toBe("10");
    });

    it("binds the open detail rows by rowKey with [(expandedKeys)] (GS8)", async () => {
        host.expanded.set([2]);
        await settle();
        expect(
            Array.from(fixture.nativeElement.querySelectorAll("[data-detail]"), (el: Element) => el.textContent)
        ).toEqual(["2"]);
        service.setRowExpanded(service.rows().first(), true);
        await settle();
        expect(host.expanded()).toEqual([2, 1]);
    });
});
