import { Component, signal } from "@angular/core";
import { ComponentFixture, DeferBlockState, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { PagerComponent } from "@nanahoshi/mona-ui/pager";
import type { CompositeFilterDescriptor, SortDescriptor } from "@nanahoshi/mona-ui/query";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridFilterRowCellComponent } from "../components/grid-filter-row-cell/grid-filter-row-cell.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridFilterableDirective } from "../directives/grid-filterable.directive";
import { GridServerBindingDirective } from "../directives/grid-server-binding.directive";
import { GridSortableDirective } from "../directives/grid-sortable.directive";
import { GridStatePersistenceDirective } from "../directives/grid-state-persistence.directive";
import type { GridState } from "../models/GridState";
import type { GridDataState } from "../models/GridDataState";

@Component({
    imports: [
        GridComponent,
        GridColumnComponent,
        GridServerBindingDirective,
        GridSortableDirective,
        GridFilterableDirective,
        GridStatePersistenceDirective
    ],
    template: `<mona-grid
        [data]="data()"
        monaGridServerBinding
        [total]="total()"
        [skip]="skip()"
        [loading]="loading()"
        [pageSize]="take()"
        [pageSizeValues]="[10, 20, 50]"
        [responsivePager]="false"
        [resizeMethod]="150"
        monaGridSortable
        [(sort)]="sort"
        (columnSort)="cancelSort && $event.preventDefault()"
        [monaGridFilterable]="{ enabled: true, type: 'row' }"
        [(filter)]="filter"
        (dataStateChange)="events.push($event)"
        monaGridStatePersistence
        [(state)]="state">
        <mona-grid-column field="name" title="Name" [width]="150" />
    </mona-grid>`
})
class HostComponent {
    public readonly data = signal([{ name: "Zoe" }, { name: "Ada" }]);
    public readonly events: GridDataState[] = [];
    public readonly filter = signal<CompositeFilterDescriptor[]>([]);
    public readonly loading = signal(false);
    public readonly skip = signal(40);
    public readonly sort = signal<SortDescriptor[]>([]);
    public readonly state = signal<GridState | null>(null);
    public readonly take = signal(10);
    public readonly total = signal(137);
    public cancelSort = false;
}

describe("server-bound grid interactions", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        await fixture.whenRenderingDone();
        for (const block of await fixture.getDeferBlocks()) {
            await block.render(DeferBlockState.Complete);
        }
        fixture.detectChanges();
        await fixture.whenStable();
    }
    function element(selector: string): HTMLElement {
        const result = fixture.nativeElement.querySelector(selector);
        if (!(result instanceof HTMLElement)) {
            throw new Error(`Expected ${selector}`);
        }
        return result;
    }
    function names(): string[] {
        return Array.from(
            fixture.nativeElement.querySelectorAll("mona-grid-cell"),
            (cell: Element) => cell.textContent?.trim() ?? ""
        );
    }
    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        await settle();
    });

    it("renders the current server page and its global row indices without an initial request", () => {
        expect(names()).toEqual(["Zoe", "Ada"]);
        expect(element("tr[data-row-view-index='0']").getAttribute("aria-rowindex")).toBe("42");
        expect(element("mona-pager").textContent).toContain("137");
        expect(host.events).toEqual([]);
    });

    it("requests one page on navigation", async () => {
        element("button[aria-label='Next page']").click();
        await settle();
        expect(host.events).toEqual([{ skip: 50, take: 10, sort: [], filter: [] }]);
        expect(names()).toEqual(["Zoe", "Ada"]);
    });

    it("requests one final first-page state after page-size selection", async () => {
        const pager = fixture.debugElement.query(By.directive(PagerComponent));
        const dropdown = pager.query(By.directive(DropdownListComponent));
        dropdown.triggerEventHandler("ngModelChange", 20);
        await settle();
        expect(host.events).toEqual([{ skip: 0, take: 20, sort: [], filter: [] }]);
    });

    it("sorts the UI and requests data without changing the loaded page order", async () => {
        element("th [title='Name']").click();
        await settle();
        expect(host.events).toEqual([{ skip: 0, take: 10, sort: [{ field: "name", dir: "asc" }], filter: [] }]);
        expect(host.sort()).toEqual([{ field: "name", dir: "asc" }]);
        expect(names()).toEqual(["Zoe", "Ada"]);
    });

    it("applies and clears filters without removing the loaded rows", async () => {
        const filter: CompositeFilterDescriptor = {
            logic: "and",
            filters: [{ field: "name", operator: "eq", value: "Ada" }]
        };
        fixture.debugElement.query(By.directive(GridFilterRowCellComponent)).triggerEventHandler("apply", { filter });
        await settle();
        expect(host.events).toEqual([{ skip: 0, take: 10, sort: [], filter: [filter] }]);
        expect(host.filter()).toEqual([filter]);
        expect(names()).toEqual(["Zoe", "Ada"]);
        fixture.debugElement
            .query(By.directive(GridFilterRowCellComponent))
            .triggerEventHandler("apply", { filter: null });
        await settle();
        expect(host.events[1]).toEqual({ skip: 0, take: 10, sort: [], filter: [] });
    });

    it("does not request or change state when sorting is canceled", async () => {
        host.cancelSort = true;
        element("th [title='Name']").click();
        await settle();
        expect(host.events).toEqual([]);
        expect(host.sort()).toEqual([]);
        expect(element("tr[data-row-view-index='0']").getAttribute("aria-rowindex")).toBe("42");
    });

    it("synchronizes parent state without feedback requests", async () => {
        host.skip.set(60);
        host.take.set(20);
        host.total.set(201);
        host.sort.set([{ field: "name", dir: "desc" }]);
        host.filter.set([{ logic: "and", filters: [{ field: "name", operator: "eq", value: "missing" }] }]);
        host.loading.set(true);
        await settle();
        expect(host.events).toEqual([]);
        expect(names()).toEqual(["Zoe", "Ada"]);
        expect(element("tr[data-row-view-index='0']").getAttribute("aria-rowindex")).toBe("62");
    });

    it("preserves rows during loading and suppresses the empty state for an empty loading page", async () => {
        host.loading.set(true);
        await settle();
        expect(element("mona-grid").getAttribute("aria-busy")).toBe("true");
        expect(element("[data-grid-loading] mona-spinner").getAttribute("aria-label")).toBe("Loading");
        expect(names()).toEqual(["Zoe", "Ada"]);
        host.data.set([]);
        await settle();
        expect(fixture.nativeElement.textContent).not.toContain("No data");
        expect(element("mona-pager")).toBeTruthy();
        host.loading.set(false);
        host.total.set(0);
        await settle();
        expect(element("mona-grid").hasAttribute("aria-busy")).toBe(false);
        expect(fixture.nativeElement.textContent).toContain("No data");
    });

    it("requests one refresh after initial persisted query restoration", async () => {
        fixture.destroy();
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        const filter: CompositeFilterDescriptor = {
            logic: "and",
            filters: [{ field: "name", operator: "eq", value: "Ada" }]
        };
        host.state.set({
            version: 1,
            columns: [],
            group: [],
            sort: [{ field: "name", dir: "desc" }],
            filter: [{ logic: "and", filters: [{ field: "name", operator: "eq", value: "Ada" }] }],
            pageSize: 20
        });
        await settle();
        expect(host.events).toEqual([{ skip: 0, take: 20, sort: [{ field: "name", dir: "desc" }], filter: [filter] }]);
        await settle();
        expect(host.events).toHaveLength(1);
    });
});
