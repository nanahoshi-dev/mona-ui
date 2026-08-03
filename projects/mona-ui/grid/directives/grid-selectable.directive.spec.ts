import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { SelectableOptions } from "../models/SelectableOptions";
import { GridService } from "../services/grid.service";
import { GridSelectableDirective } from "./grid-selectable.directive";

@Component({
    template: ` <mona-grid
        [monaGridSelectable]="options()"
        [selectBy]="selectBy()"
        [selectedKeys]="selectedKeys()"
        (selectedKeysChange)="onSelectedKeysChange($event)">
        <mona-grid-column field="id" title="ID"></mona-grid-column>
    </mona-grid>`,
    imports: [GridComponent, GridColumnComponent, GridSelectableDirective]
})
class HostComponent {
    public readonly options = signal<SelectableOptions | "">("");
    public readonly selectBy = signal("id");
    public readonly selectedKeys = signal<unknown[]>([]);
    public emitted: unknown[][] = [];
    public onSelectedKeysChange(keys: unknown[]): void {
        this.emitted.push(keys);
    }
}

describe("GridSelectableDirective", () => {
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

    it("loads initial external keys into the service", async () => {
        host.selectedKeys.set([1, 2]);
        await apply();

        expect(gridService.selectedKeys().toArray()).toEqual([1, 2]);
    });

    it("does not reload when the same set is provided in a different iteration order", async () => {
        host.selectedKeys.set([1, 2, 3]);
        await apply();
        const loadSpy = vi.spyOn(gridService, "loadSelectedKeys");

        host.selectedKeys.set([3, 1, 2]);
        await apply();

        expect(loadSpy).not.toHaveBeenCalled();
    });

    it("compares keys by set equality without sorting arbitrary keys", async () => {
        const objectKey = { id: 1 };
        host.selectedKeys.set([objectKey, "two", 3]);
        await apply();
        const loadSpy = vi.spyOn(gridService, "loadSelectedKeys");

        host.selectedKeys.set([3, objectKey, "two"]);
        await apply();

        expect(loadSpy).not.toHaveBeenCalled();
    });

    it("emits selectedKeysChange once per actual state change", async () => {
        gridService.setRows([{ id: 1 }, { id: 2 }]);
        gridService.setSelectableOptions({ enabled: true, mode: "multiple" });
        const rows = gridService.rows().toArray();

        gridService.selectRow(rows[0]);
        fixture.detectChanges();
        await new Promise<void>(resolve => setTimeout(resolve));

        expect(host.emitted).toHaveLength(1);
        expect(host.emitted[0]).toEqual([1]);

        gridService.selectRow(rows[1]);
        fixture.detectChanges();
        await new Promise<void>(resolve => setTimeout(resolve));

        expect(host.emitted).toHaveLength(2);
        expect(host.emitted[1].sort()).toEqual([1, 2]);
    });

    it("reflects internal changes through the output", async () => {
        gridService.setRows([{ id: 1 }]);
        gridService.setSelectableOptions({ enabled: true, mode: "multiple" });
        const row = gridService.rows().firstOrDefault()!;

        gridService.selectRow(row);
        fixture.detectChanges();
        await new Promise<void>(resolve => setTimeout(resolve));

        expect(host.emitted.at(-1)).toEqual([1]);
    });

    it("merges option defaults when partial options are provided", async () => {
        host.options.set({ enabled: true, mode: "multiple" });
        await apply();

        expect(gridService.selectableOptions()).toEqual({
            enabled: true,
            mode: "multiple",
            selectAllScope: "page",
            selectOnRowClick: true,
            showCheckboxes: false,
            showSelectAll: true
        });
    });

    it("enables selection for bare monaGridSelectable usage", async () => {
        host.options.set("");
        await apply();

        expect(gridService.selectableOptions().enabled).toBe(true);
    });
});
