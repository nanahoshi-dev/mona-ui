import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { RowReorderEvent } from "../models/RowReorderEvent";
import { GridService } from "../services/grid.service";
import { GridRowReorderableDirective } from "./grid-row-reorderable.directive";

@Component({
    template: `
        <mona-grid [data]="rows()" [rowKey]="'id'" [monaGridRowReorderable]="options()" (rowReorder)="onRowReorder($event)">
            <mona-grid-column field="id" title="ID"></mona-grid-column>
        </mona-grid>
    `,
    imports: [GridComponent, GridColumnComponent, GridRowReorderableDirective]
})
class HostComponent {
    public readonly options = signal<{ enabled?: boolean; canReorder?: (rowData: Record<PropertyKey, unknown>) => boolean } | "">("");
    public readonly rows = signal<Array<Record<PropertyKey, unknown>>>([
        { id: 1 },
        { id: 2 },
        { id: 3 }
    ]);
    public emitted: RowReorderEvent[] = [];
    public onRowReorder(event: RowReorderEvent): void {
        this.emitted.push(event);
    }
}

describe("GridRowReorderableDirective", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let gridService: GridService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
        await fixture.whenRenderingDone();
        const gridDebugElement = fixture.debugElement.query(
            de => de.nativeElement instanceof HTMLElement && de.nativeElement.tagName === "MONA-GRID"
        );
        if (gridDebugElement == null) {
            throw new Error("Expected mona-grid element");
        }
        gridService = gridDebugElement.injector.get(GridService);
    });

    async function apply(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
    }

    it("enables the feature for bare monaGridRowReorderable usage", () => {
        expect(gridService.rowReorderableOptions().enabled).toBe(true);
        expect(gridService.rowReorderColumnVisible()).toBe(true);
    });

    it("merges provided options into the service", async () => {
        const canReorder = (): boolean => true;
        host.options.set({ enabled: true, canReorder });
        await apply();

        expect(gridService.rowReorderableOptions().enabled).toBe(true);
        expect(gridService.rowReorderableOptions().canReorder).toBe(canReorder);
    });

    it("disables the feature when options set enabled to false", async () => {
        host.options.set({ enabled: false });
        await apply();

        expect(gridService.rowReorderableOptions().enabled).toBe(false);
        expect(gridService.rowReorderColumnVisible()).toBe(false);
    });

    it("reflects dynamic option changes", async () => {
        const canReorder = (rowData: Record<PropertyKey, unknown>): boolean => rowData["id"] !== 2;
        host.options.set({ enabled: true, canReorder });
        await apply();
        fixture.detectChanges();

        const [first, second, third] = gridService.rows().toArray();
        expect(gridService.canReorderRow(first)).toBe(true);
        expect(gridService.canReorderRow(second)).toBe(false);
        expect(gridService.canReorderRow(third)).toBe(true);
    });

    it("forwards rowReorder events through the output", async () => {
        fixture.detectChanges();
        const [first] = gridService.rows().toArray();

        const emitted = gridService.requestRowReorder(first, 0, 1);
        await apply();

        expect(emitted).toBe(true);
        expect(host.emitted).toHaveLength(1);
        expect(host.emitted[0]?.rowData).toEqual({ id: 1 });
        expect(host.emitted[0]?.previousIndex).toBe(0);
        expect(host.emitted[0]?.currentIndex).toBe(1);
        expect(host.emitted[0]?.previousPageIndex).toBe(0);
        expect(host.emitted[0]?.currentPageIndex).toBe(1);
        expect(host.emitted[0]?.reorderedData.map(data => data["id"])).toEqual([2, 1, 3]);
    });

    it("clears a previously-set canReorder predicate when options no longer include it", async () => {
        const canReorder = (rowData: Record<PropertyKey, unknown>): boolean => rowData["id"] !== 2;
        host.options.set({ enabled: true, canReorder });
        await apply();
        const [, second] = gridService.rows().toArray();
        expect(gridService.canReorderRow(second)).toBe(false);

        host.options.set({ enabled: true });
        await apply();

        expect(gridService.canReorderRow(second)).toBe(true);
        expect(gridService.rowReorderableOptions().canReorder).toBeUndefined();
    });

    it("stops forwarding rowReorder events after the fixture is destroyed", () => {
        fixture.destroy();

        expect(() =>
            gridService.rowReorder$.next(
                new RowReorderEvent({
                    currentIndex: 1,
                    currentPageIndex: 1,
                    previousIndex: 0,
                    previousPageIndex: 0,
                    reorderedData: [],
                    rowData: { id: 1 }
                })
            )
        ).not.toThrow();
        expect(host.emitted).toHaveLength(0);
    });
});
