import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, signal } from "@angular/core";
import { type ComponentFixture, DeferBlockState, TestBed } from "@angular/core/testing";
import { PagerComponent } from "@nanahoshi/mona-ui/pager";
import axe from "axe-core";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridCommandColumnComponent } from "../components/grid-command-column/grid-command-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridDetailTemplateDirective } from "../directives/grid-detail-template.directive";
import { GridEditableDirective } from "../directives/grid-editable.directive";
import { GridFilterableDirective } from "../directives/grid-filterable.directive";
import { GridGroupableDirective } from "../directives/grid-groupable.directive";
import { GridSelectableDirective } from "../directives/grid-selectable.directive";
import { GridSortableDirective } from "../directives/grid-sortable.directive";
import type { EditableOptions } from "../models/EditableOptions";
import type { FilterableOptions } from "../models/FilterableOptions";
import type { GroupDescriptor } from "../models/GroupDescriptor";
import type { SelectableOptions } from "../models/SelectableOptions";
import { GridService } from "../services/grid.service";

interface AxeRow {
    amount: number;
    id: number;
    name: string;
    shipped: Date;
    team: string;
}

const ROWS: AxeRow[] = [
    { amount: 10, id: 1, name: "Ann", shipped: new Date(2024, 0, 3), team: "Red" },
    { amount: 20, id: 2, name: "Bob", shipped: new Date(2024, 1, 3), team: "Blue" },
    { amount: 30, id: 3, name: "Cid", shipped: new Date(2024, 2, 3), team: "Red" }
];

@Component({
    imports: [
        GridColumnComponent,
        GridCommandColumnComponent,
        GridComponent,
        GridEditableDirective,
        GridFilterableDirective,
        GridGroupableDirective,
        GridSelectableDirective,
        GridSortableDirective
    ],
    template: `
        <mona-grid
            ariaLabel="Orders"
            [data]="rows()"
            [rowKey]="'id'"
            [pageSize]="10"
            [pageSizeValues]="[10, 20]"
            [responsivePager]="false"
            monaGridSortable
            [monaGridEditable]="editable()"
            [monaGridFilterable]="filterable()"
            [monaGridGroupable]="{ enabled: group().length > 0 }"
            [(group)]="group"
            [monaGridSelectable]="selectable()">
            <mona-grid-column field="id" title="Id" type="number" [width]="80"></mona-grid-column>
            <mona-grid-column field="name" title="Name" [width]="140"></mona-grid-column>
            <mona-grid-column field="team" title="Team" [width]="120"></mona-grid-column>
            <mona-grid-column field="amount" title="Amount" type="number" [width]="120"></mona-grid-column>
            <mona-grid-column field="shipped" title="Shipped" type="date" [width]="160"></mona-grid-column>
            <mona-grid-command-column [width]="120"></mona-grid-command-column>
        </mona-grid>
    `
})
class GridHostComponent {
    public readonly editable = signal<EditableOptions>({ enabled: false, mode: "row" });
    public readonly filterable = signal<Partial<FilterableOptions>>({ enabled: false });
    public readonly group = signal<GroupDescriptor[]>([]);
    public readonly rows = signal<AxeRow[]>(ROWS);
    public readonly selectable = signal<SelectableOptions>({ enabled: false, mode: "multiple" });
}

@Component({
    imports: [GridColumnComponent, GridComponent, GridDetailTemplateDirective],
    template: `
        <mona-grid ariaLabel="Orders" [data]="rows" [rowKey]="'id'" [pageSizeValues]="[]" [responsivePager]="false">
            <mona-grid-column field="id" title="Id" type="number" [width]="80"></mona-grid-column>
            <mona-grid-column field="name" title="Name" [width]="140"></mona-grid-column>
            <ng-template monaGridDetailTemplate let-row>
                <p>Details for {{ row.name }}</p>
            </ng-template>
        </mona-grid>
    `
})
class DetailHostComponent {
    public readonly rows = ROWS;
}

@Component({
    imports: [PagerComponent],
    template: `<mona-pager aria-label="Orders pages" [total]="95" [pageSize]="10" [skip]="30" [pageInput]="true" />`
})
class PagerHostComponent {}

/** jsdom has no layout, so contrast can't be measured; a component alone is not a page with landmarks. */
const AXE_OPTIONS: axe.RunOptions = {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
};

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    for (const block of await fixture.getDeferBlocks()) {
        await block.render(DeferBlockState.Complete);
    }
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

async function violations(fixture: ComponentFixture<unknown>): Promise<string[]> {
    const results = await axe.run(fixture.nativeElement as HTMLElement, AXE_OPTIONS);
    // Rules that passed show the run reached the grid; an empty run would also have no violations.
    expect(results.passes.some(rule => rule.id.startsWith("aria-"))).toBe(true);
    return results.violations.map(
        violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(" ")).join(", ")}`
    );
}

describe("grid and pager AXE checks", () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: LiveAnnouncer, useValue: { announce: vi.fn().mockResolvedValue(undefined) } }]
        });
    });

    describe("grid", () => {
        let fixture: ComponentFixture<GridHostComponent>;
        let host: GridHostComponent;

        beforeEach(async () => {
            fixture = TestBed.createComponent(GridHostComponent);
            host = fixture.componentInstance;
            await settle(fixture);
        });

        it("has no violations with plain sortable data", async () => {
            expect(await violations(fixture)).toEqual([]);
        });

        it("has no violations when grouped", async () => {
            host.group.set([{ field: "team" }]);
            await settle(fixture);
            expect(fixture.nativeElement.querySelector("[role='treegrid']")).not.toBeNull();
            expect(await violations(fixture)).toEqual([]);
        });

        it("has no violations with the filter menu and filter row", async () => {
            host.filterable.set({ type: "menu, row" });
            await settle(fixture);
            expect(fixture.nativeElement.querySelector("mona-grid-filter-row-cell")).not.toBeNull();
            expect(await violations(fixture)).toEqual([]);
        });

        it("has no violations while a row is edited", async () => {
            host.editable.set({ mode: "row" });
            await settle(fixture);
            const service = fixture.debugElement.children[0].injector.get(GridService);
            service.startRowEdit(service.rows().first());
            await settle(fixture);
            expect(fixture.nativeElement.querySelector("mona-grid-editor")).not.toBeNull();
            expect(await violations(fixture)).toEqual([]);
        });

        it("has no violations with selection check boxes", async () => {
            host.selectable.set({ enabled: true, mode: "multiple", showCheckboxes: true });
            await settle(fixture);
            expect(fixture.nativeElement.querySelector("[aria-selected]")).not.toBeNull();
            expect(await violations(fixture)).toEqual([]);
        });

        it("has no violations without data", async () => {
            host.rows.set([]);
            await settle(fixture);
            expect(await violations(fixture)).toEqual([]);
        });
    });

    it("has no violations with an open detail row", async () => {
        const fixture = TestBed.createComponent(DetailHostComponent);
        await settle(fixture);
        const toggle = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>("button[aria-expanded]");
        expect(toggle).not.toBeNull();
        toggle?.click();
        await settle(fixture);
        expect((fixture.nativeElement as HTMLElement).textContent).toContain("Details for Ann");
        expect(await violations(fixture)).toEqual([]);
    });

    it("has no violations in a pager", async () => {
        const fixture = TestBed.createComponent(PagerHostComponent);
        await settle(fixture);
        expect(await violations(fixture)).toEqual([]);
    });
});
