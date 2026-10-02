import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import type { SortDescriptor } from "@nanahoshi/mona-ui/query";
import { GridSortableDirective } from "../../directives/grid-sortable.directive";
import type { ColumnSortEvent } from "../../models/ColumnSortEvent";
import type { SortableOptions } from "../../models/SortableOptions";
import { GridColumnComponent } from "../grid-column/grid-column.component";
import { GridComponent } from "./grid.component";

@Component({
    template: `
        <mona-grid [monaGridSortable]="options()" [(sort)]="sort" (columnSort)="onColumnSort($event)">
            <mona-grid-column field="name" title="Name" />
            <mona-grid-column field="age" title="Age" [sortable]="ageSortable()" />
        </mona-grid>
    `,
    imports: [GridComponent, GridColumnComponent, GridSortableDirective]
})
class SortingHostComponent {
    readonly ageSortable = signal(true);
    readonly onColumnSort = vi.fn<(event: ColumnSortEvent) => void>();
    readonly options = signal<SortableOptions>({ enabled: true, mode: "multiple" });
    readonly sort = signal<SortDescriptor[]>([]);
}

describe("Grid header sorting", () => {
    let fixture: ComponentFixture<SortingHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [SortingHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(SortingHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
    });

    function header(index: number): HTMLElement {
        const element = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="columnheader"]')[
            index
        ];
        if (!element) {
            throw new Error(`Missing column header ${index}`);
        }
        return element;
    }

    async function clickTitle(index: number): Promise<void> {
        const title = header(index).querySelector<HTMLElement>("span[title]");
        if (!title) {
            throw new Error("Missing column title");
        }
        title.click();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function priority(index: number): string | undefined {
        return header(index).querySelector("[data-column-actions] span")?.textContent?.trim();
    }

    it("shows descriptor priorities beside the sort icons in activation order", async () => {
        await clickTitle(1);
        await clickTitle(0);

        expect(fixture.componentInstance.sort()).toEqual([
            { field: "age", dir: "asc" },
            { field: "name", dir: "asc" }
        ]);
        expect(priority(1)).toBe("1");
        expect(priority(0)).toBe("2");
        expect(header(0).querySelector("[data-column-actions] svg")).not.toBeNull();
        expect(header(1).querySelector("[data-column-actions] svg")).not.toBeNull();
    });

    it("keeps priority when direction changes and renumbers after unsorting", async () => {
        await clickTitle(1);
        await clickTitle(0);
        await clickTitle(1);
        expect(header(1).getAttribute("aria-sort")).toBe("descending");
        expect(priority(1)).toBe("1");
        expect(priority(0)).toBe("2");

        await clickTitle(1);
        expect(priority(1)).toBeUndefined();
        expect(priority(0)).toBe("1");
        expect(fixture.componentInstance.sort()).toEqual([{ field: "name", dir: "asc" }]);

        await clickTitle(1);
        expect(priority(0)).toBe("1");
        expect(priority(1)).toBe("2");
    });

    it("renders initial and externally updated descriptor order", async () => {
        fixture.componentInstance.sort.set([
            { field: "age", dir: "desc" },
            { field: "name", dir: "asc" }
        ]);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(priority(1)).toBe("1");
        expect(priority(0)).toBe("2");

        fixture.componentInstance.sort.set([
            { field: "name", dir: "asc" },
            { field: "age", dir: "desc" }
        ]);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(priority(0)).toBe("1");
        expect(priority(1)).toBe("2");
    });

    it("hides priorities with showIndices false while retaining direction icons", async () => {
        fixture.componentInstance.options.set({ enabled: true, mode: "multiple", showIndices: false });
        fixture.detectChanges();
        await clickTitle(0);
        await clickTitle(1);
        expect(priority(0)).toBeUndefined();
        expect(priority(1)).toBeUndefined();
        expect(header(0).querySelector("[data-column-actions] svg")).not.toBeNull();
        expect(header(1).querySelector("[data-column-actions] svg")).not.toBeNull();
    });

    it("hides priorities in single-sort mode", async () => {
        fixture.componentInstance.options.set({ enabled: true, mode: "single" });
        fixture.detectChanges();
        await clickTitle(0);
        expect(priority(0)).toBeUndefined();
        expect(header(0).querySelector("[data-column-actions] svg")).not.toBeNull();
    });

    it("blocks mouse and keyboard sorting for a disabled column and allows reenabling it", async () => {
        fixture.componentInstance.ageSortable.set(false);
        fixture.detectChanges();
        await fixture.whenStable();

        await clickTitle(1);
        header(1).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.componentInstance.sort()).toEqual([]);
        expect(fixture.componentInstance.onColumnSort).not.toHaveBeenCalled();

        fixture.componentInstance.ageSortable.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        header(1).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.componentInstance.sort()).toEqual([{ field: "age", dir: "asc" }]);
        expect(fixture.componentInstance.onColumnSort).toHaveBeenCalledTimes(1);
    });

    it("blocks sorting when the grid disables it even for sortable columns", async () => {
        fixture.componentInstance.options.set({ enabled: false });
        fixture.detectChanges();
        await clickTitle(0);
        header(0).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.componentInstance.sort()).toEqual([]);
        expect(fixture.componentInstance.onColumnSort).not.toHaveBeenCalled();
    });

    it("preserves applied sorting when disabling header interaction on a column", async () => {
        await clickTitle(1);
        fixture.componentInstance.ageSortable.set(false);
        fixture.detectChanges();
        await fixture.whenStable();
        await clickTitle(1);
        expect(fixture.componentInstance.sort()).toEqual([{ field: "age", dir: "asc" }]);
        expect(header(1).getAttribute("aria-sort")).toBe("ascending");
        expect(priority(1)).toBe("1");
        expect(fixture.componentInstance.onColumnSort).toHaveBeenCalledTimes(1);
    });
});
