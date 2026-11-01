import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridSelectableDirective } from "../directives/grid-selectable.directive";
import type { GridRowClass } from "../models/GridRowClass";

interface StatusRow {
    id: number;
    name: string;
    status: "ok" | "pending" | "failed";
}

const ROWS: readonly StatusRow[] = [
    { id: 1, name: "Alpha", status: "ok" },
    { id: 2, name: "Beta", status: "pending" },
    { id: 3, name: "Gamma", status: "failed" }
];

@Component({
    imports: [GridColumnComponent, GridComponent, GridSelectableDirective],
    template: `
        <mona-grid
            [data]="rows()"
            [rowClass]="rowClass()"
            [monaGridSelectable]="{ enabled: true, mode: 'single' }"
            selectBy="id"
            [selectedKeys]="selectedKeys()"
            [resizeMethod]="120"
            [responsivePager]="false">
            <mona-grid-column field="name" title="Name" [width]="120"></mona-grid-column>
        </mona-grid>
    `
})
class RowClassHostComponent {
    public readonly rowClass = signal<GridRowClass<StatusRow> | null>(row =>
        row.status === "pending" ? "pending-row text-muted-foreground" : null
    );
    public readonly rows = signal<readonly StatusRow[]>(ROWS);
    public readonly selectedKeys = signal<unknown[]>([]);
}

async function settleFixture(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenRenderingDone();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function dataRow(fixture: ComponentFixture<unknown>, name: string): HTMLTableRowElement {
    const host = fixture.nativeElement as HTMLElement;
    const row = Array.from(host.querySelectorAll<HTMLTableRowElement>("tr[monaGridRow]")).find(
        element => element.textContent?.includes(name) === true
    );
    if (row == null) {
        throw new Error(`Expected a data row for ${name}`);
    }
    return row;
}

describe("Grid rowClass", () => {
    let fixture: ComponentFixture<RowClassHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [RowClassHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(RowClassHostComponent);
        await settleFixture(fixture);
    });

    it("adds the returned classes to matching data rows only", () => {
        expect(dataRow(fixture, "Beta").classList).toContain("pending-row");
        expect(dataRow(fixture, "Beta").classList).toContain("text-muted-foreground");
        expect(dataRow(fixture, "Alpha").classList).not.toContain("pending-row");
        expect(dataRow(fixture, "Gamma").classList).not.toContain("pending-row");
    });

    it("keeps the row's own classes and lets returned classes override conflicting ones", async () => {
        fixture.componentInstance.rowClass.set(row => (row.status === "failed" ? ["failed-row", "bg-danger"] : null));
        await settleFixture(fixture);

        const failed = dataRow(fixture, "Gamma");
        expect(failed.classList).toContain("failed-row");
        expect(failed.classList).toContain("bg-danger");
        expect(failed.classList).not.toContain("bg-surface");
        expect(failed.classList).toContain("hover:bg-hover");
        expect(dataRow(fixture, "Alpha").classList).toContain("bg-surface");
    });

    it("runs again when an item is rebound", async () => {
        fixture.componentInstance.rows.set(
            ROWS.map(row => (row.id === 1 ? { ...row, status: "pending" } : row.id === 2 ? { ...row, status: "ok" } : row))
        );
        await settleFixture(fixture);

        expect(dataRow(fixture, "Alpha").classList).toContain("pending-row");
        expect(dataRow(fixture, "Beta").classList).not.toContain("pending-row");
    });

    it("removes the classes when the function is cleared", async () => {
        fixture.componentInstance.rowClass.set(null);
        await settleFixture(fixture);

        expect(dataRow(fixture, "Beta").classList).not.toContain("pending-row");
        expect(dataRow(fixture, "Beta").classList).toContain("bg-surface");
    });

    it("keeps the classes on selected rows", async () => {
        fixture.componentInstance.selectedKeys.set([2]);
        await settleFixture(fixture);

        const beta = dataRow(fixture, "Beta");
        expect(beta.getAttribute("aria-selected")).toBe("true");
        expect(beta.classList).toContain("pending-row");
    });
});
