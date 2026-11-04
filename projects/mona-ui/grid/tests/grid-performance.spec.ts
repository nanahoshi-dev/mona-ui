import { Component, signal } from "@angular/core";
import { type ComponentFixture, DeferBlockState, TestBed } from "@angular/core/testing";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridGroupableDirective } from "../directives/grid-groupable.directive";
import { GridStatePersistenceDirective } from "../directives/grid-state-persistence.directive";
import type { GridState } from "../models/GridState";
import type { GroupDescriptor } from "../models/GroupDescriptor";
import { observeGridCellTabStops } from "../services/grid-cell-tab-stops";
import { GridService } from "../services/grid.service";

@Component({
    imports: [GridColumnComponent, GridComponent, GridGroupableDirective, GridStatePersistenceDirective],
    template: `
        <mona-grid
            [data]="data"
            [resizeMethod]="120"
            monaGridGroupable
            [group]="group()"
            monaGridStatePersistence
            [(state)]="state">
            <mona-grid-column field="id" title="Id" [width]="100"></mona-grid-column>
            <mona-grid-column field="team" title="Team" [width]="100"></mona-grid-column>
            <mona-grid-column field="name" title="Name" [width]="100"></mona-grid-column>
        </mona-grid>
    `
})
class HostComponent {
    public readonly data = Array.from({ length: 6 }, (_, index) => ({
        id: index + 1,
        name: `Name ${index + 1}`,
        team: index % 2 === 0 ? "A" : "B"
    }));
    public readonly group = signal<GroupDescriptor[]>([{ field: "team" }]);
    public readonly state = signal<GridState | null>(null);
}

describe("grid performance", () => {
    let fixture: ComponentFixture<HostComponent>;
    let service: GridService;

    function idOf(field: string): string {
        const column = service.columns().firstOrDefault(c => c.field === field);
        if (column == null) {
            throw new Error(`No column ${field}`);
        }
        return column.id;
    }

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        for (const block of await fixture.getDeferBlocks()) {
            await block.render(DeferBlockState.Complete);
        }
        fixture.detectChanges();
        await fixture.whenStable();
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
        fixture = TestBed.createComponent(HostComponent);
        await settle();
        service = fixture.debugElement.children[0].injector.get(GridService);
    });

    describe("column changes (GP1)", () => {
        it("doesn't re-run the rows, the grouping or the aggregates for a width or visibility change", () => {
            const rows = service.viewRows();
            const groups = service.groupColumns();
            const aggregates = service.aggregateMap();
            service.setCalculatedWidth(idOf("name"), 240);
            service.setColumnHidden(idOf("name"), true);
            expect(service.viewRows()).toBe(rows);
            expect(service.groupColumns()).toBe(groups);
            expect(service.aggregateMap()).toBe(aggregates);
        });

        it("keeps unchanged columns, and the list for an update that changes nothing", () => {
            const columns = service.columns();
            const [id, team] = columns.toArray();
            service.updateColumn(idOf("name"), { title: "Name" });
            expect(service.columns()).toBe(columns);
            service.setCalculatedWidth(idOf("name"), 300);
            expect(service.columns()).not.toBe(columns);
            expect(service.columns().toArray()[0]).toBe(id);
            expect(service.columns().toArray()[1]).toBe(team);
        });

        it("doesn't reload sorts that didn't change", () => {
            service.loadSorts([{ field: "id", dir: "desc" }]);
            const columns = service.columns();
            const rows = service.viewRows();
            service.loadSorts([{ field: "id", dir: "desc" }]);
            expect(service.columns()).toBe(columns);
            expect(service.viewRows()).toBe(rows);
        });
    });

    it("reports a column drag to state persistence once, when it ends (GP1)", async () => {
        const widthOf = (): number | null | undefined =>
            fixture.componentInstance.state()?.columns.find(column => column.id === "name")?.width;
        const before = widthOf();
        service.columnResizeActive.set(true);
        for (const width of [150, 160, 170]) {
            service.setCalculatedWidth(idOf("name"), width);
            await settle();
        }
        expect(widthOf()).toBe(before);
        service.columnResizeActive.set(false);
        await settle();
        expect(widthOf()).toBe(170);
    });

    it("renders no drag directives and one row component per row without row reorder (GP4)", () => {
        const root = fixture.nativeElement as HTMLElement;
        expect(root.querySelectorAll("tr[monagridrow]").length).toBe(6);
        expect(root.querySelector("tbody .cdk-drag")).toBeNull();
    });
});

describe("observeGridCellTabStops (GP3)", () => {
    it("keeps controls inside cells out of the Tab order, including ones added later", async () => {
        const root = document.createElement("div");
        root.innerHTML = `
            <button class="toolbar">Toolbar</button>
            <table><tbody><tr>
                <td monaGridLogicalCell tabindex="0"><button class="inner">Edit</button></td>
            </tr></tbody></table>`;
        document.body.appendChild(root);
        const stop = observeGridCellTabStops(root);
        const cell = root.querySelector("td") as HTMLElement;
        try {
            expect(root.querySelector(".inner")?.getAttribute("tabindex")).toBe("-1");
            expect(root.querySelector(".toolbar")?.hasAttribute("tabindex")).toBe(false);
            expect(cell.getAttribute("tabindex")).toBe("0");

            const added = document.createElement("a");
            added.href = "#details";
            cell.appendChild(added);
            await Promise.resolve();
            expect(added.getAttribute("tabindex")).toBe("-1");

            root.querySelector(".inner")?.setAttribute("tabindex", "0");
            await Promise.resolve();
            expect(root.querySelector(".inner")?.getAttribute("tabindex")).toBe("-1");
        } finally {
            stop();
            root.remove();
        }
    });
});
