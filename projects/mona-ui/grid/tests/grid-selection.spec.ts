import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridGroupableDirective } from "../directives/grid-groupable.directive";
import { GridSelectableDirective } from "../directives/grid-selectable.directive";
import { GridVirtualScrollDirective } from "../directives/grid-virtual-scroll.directive";
import { SelectableOptions } from "../models/SelectableOptions";
import { GridService } from "../services/grid.service";

interface SelectionRow {
    id: number;
    team: string;
    name: string;
}

function createRows(count: number): SelectionRow[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        team: `Team ${(i % 3) + 1}`,
        name: `Row ${i + 1}`
    }));
}

@Component({
    imports: [GridColumnComponent, GridComponent, GridGroupableDirective, GridSelectableDirective],
    template: `
        <mona-grid
            [data]="rows()"
            [monaGridSelectable]="selectable()"
            selectBy="id"
            [selectedKeys]="selectedKeys()"
            (selectedKeysChange)="selectedKeys.set($event)"
            [pageSize]="pageSize()"
            [pageSizeValues]="[]"
            [resizeMethod]="120"
            [responsivePager]="false"
            [monaGridGroupable]="groupable()">
            <mona-grid-column field="name" title="Name" [width]="120"></mona-grid-column>
            <mona-grid-column field="team" title="Team" [width]="120"></mona-grid-column>
        </mona-grid>
    `
})
class SelectionHostComponent {
    public readonly groupable = signal({ enabled: false, showFooter: false });
    public readonly pageSize = signal(10);
    public readonly rows = signal(createRows(25));
    public readonly selectable = signal<SelectableOptions>({ enabled: true, mode: "multiple", showCheckboxes: true });
    public readonly selectedKeys = signal<unknown[]>([]);
}

@Component({
    imports: [GridColumnComponent, GridComponent, GridSelectableDirective, GridVirtualScrollDirective],
    template: `
        <mona-grid
            [data]="rows()"
            [monaGridSelectable]="selectable()"
            selectBy="id"
            [monaGridVirtualScroll]="{ enabled: true, height: 32 }"
            [resizeMethod]="120"
            [responsivePager]="false">
            <mona-grid-column field="name" title="Name" [width]="120"></mona-grid-column>
            <mona-grid-column field="team" title="Team" [width]="120"></mona-grid-column>
        </mona-grid>
    `
})
class VirtualSelectionHostComponent {
    public readonly rows = signal(createRows(50));
    public readonly selectable = signal<SelectableOptions>({ enabled: true, mode: "multiple", showCheckboxes: true });
}

async function settleFixture(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenRenderingDone();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function gridServiceOf(fixture: ComponentFixture<unknown>): GridService {
    const gridDebugElement = fixture.debugElement.query(
        de => de.nativeElement instanceof HTMLElement && de.nativeElement.tagName === "MONA-GRID"
    );
    if (gridDebugElement == null) {
        throw new Error("Expected mona-grid element");
    }
    return gridDebugElement.injector.get(GridService);
}

function getRequiredElement(root: ParentNode, selector: string): HTMLElement {
    const element = root.querySelector<HTMLElement>(selector);
    if (element == null) {
        throw new Error(`Expected element: ${selector}`);
    }
    return element;
}

describe("grid selection integration", () => {
    let fixture: ComponentFixture<SelectionHostComponent>;
    let host: SelectionHostComponent;
    let gridService: GridService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SelectionHostComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(SelectionHostComponent);
        host = fixture.componentInstance;
        await settleFixture(fixture);
        gridService = gridServiceOf(fixture);
    });

    it("hides the selection column by default", async () => {
        host.selectable.set({ enabled: true, mode: "multiple", showCheckboxes: false });
        await settleFixture(fixture);

        expect(fixture.nativeElement.querySelector("thead mona-grid-select-all-checkbox")).toBeNull();
        expect(
            fixture.nativeElement.querySelectorAll("tbody mona-grid-selection-checkbox").length
        ).toBe(0);
    });

    it("renders the selection column when showCheckboxes is enabled", () => {
        const selectionHeader = fixture.nativeElement.querySelectorAll("thead th").length;
        expect(selectionHeader).toBeGreaterThan(0);
        const bodyCheckboxes = fixture.nativeElement.querySelectorAll(
            "tbody mona-grid-selection-checkbox input[type='checkbox']"
        );
        expect(bodyCheckboxes.length).toBe(10);
    });

    it("selects exactly once when the row checkbox is clicked", () => {
        const firstCheckbox = getRequiredElement(
            fixture.nativeElement,
            "tbody mona-grid-selection-checkbox input[type='checkbox']"
        ) as HTMLInputElement;
        firstCheckbox.click();
        fixture.detectChanges();

        expect(gridService.selectedKeys().size()).toBe(1);
        expect(gridService.selectedKeys().firstOrDefault()).toBe(1);
        expect(firstCheckbox.checked).toBe(true);
    });

    it("does not select via row click by default", () => {
        const firstRow = getRequiredElement(fixture.nativeElement, "tbody tr[monaGridRow]");
        firstRow.click();
        fixture.detectChanges();

        expect(gridService.selectedKeys().isEmpty()).toBe(true);
    });

    it("selects via row click when selectOnRowClick is explicitly enabled", async () => {
        host.selectable.set({ enabled: true, mode: "multiple", showCheckboxes: true, selectOnRowClick: true });
        await settleFixture(fixture);

        const firstRow = getRequiredElement(fixture.nativeElement, "tbody tr[monaGridRow]");
        firstRow.click();
        fixture.detectChanges();

        expect(gridService.selectedKeys().size()).toBe(1);
    });

    it("keeps the row checkbox in sync with controlled selectedKeys", async () => {
        host.selectedKeys.set([1]);
        await settleFixture(fixture);

        const firstCheckbox = getRequiredElement(
            fixture.nativeElement,
            "tbody mona-grid-selection-checkbox input[type='checkbox']"
        ) as HTMLInputElement;
        expect(firstCheckbox.checked).toBe(true);
    });

    it("selects only the current page with page scope", () => {
        const headerCheckbox = getRequiredElement(
            fixture.nativeElement,
            "thead mona-grid-select-all-checkbox input[type='checkbox']"
        ) as HTMLInputElement;
        headerCheckbox.click();
        fixture.detectChanges();

        expect(gridService.selectedKeys().size()).toBe(10);
        expect(gridService.selectedKeys().contains(1)).toBe(true);
        expect(gridService.selectedKeys().contains(11)).toBe(false);
    });

    it("preserves selections from previous pages", async () => {
        const headerCheckbox = getRequiredElement(
            fixture.nativeElement,
            "thead mona-grid-select-all-checkbox input[type='checkbox']"
        ) as HTMLInputElement;
        headerCheckbox.click();
        fixture.detectChanges();

        host.pageSize.set(5);
        await settleFixture(fixture);

        expect(gridService.selectedKeys().size()).toBe(10);
    });

    it("updates header state when changing pages", async () => {
        const headerCheckbox = getRequiredElement(
            fixture.nativeElement,
            "thead mona-grid-select-all-checkbox input[type='checkbox']"
        ) as HTMLInputElement;
        headerCheckbox.click();
        fixture.detectChanges();

        gridService.setPageState({ page: 2, skip: 10, take: 10 });
        fixture.detectChanges();
        await fixture.whenStable();

        expect(gridService.selectedKeys().size()).toBe(10);
        const headerAfterPageChange = getRequiredElement(
            fixture.nativeElement,
            "thead mona-grid-select-all-checkbox input[type='checkbox']"
        ) as HTMLInputElement;
        expect(headerAfterPageChange.checked).toBe(false);
    });

    it("selects the filtered view with view scope", async () => {
        host.selectable.set({ enabled: true, mode: "multiple", showCheckboxes: true, selectAllScope: "view" });
        await settleFixture(fixture);

        const headerCheckbox = getRequiredElement(
            fixture.nativeElement,
            "thead mona-grid-select-all-checkbox input[type='checkbox']"
        ) as HTMLInputElement;
        headerCheckbox.click();
        fixture.detectChanges();

        expect(gridService.selectedKeys().size()).toBe(25);
    });

    it("renders checkboxes only for data rows when grouping", async () => {
        host.groupable.set({ enabled: true, showFooter: false });
        await settleFixture(fixture);

        const dataRows = fixture.nativeElement.querySelectorAll("tbody tr[monaGridRow]");
        expect(dataRows.length).toBeGreaterThan(0);

        const bodyCheckboxes = fixture.nativeElement.querySelectorAll(
            "tbody tr[monaGridRow] mona-grid-selection-checkbox input[type='checkbox']"
        );
        expect(bodyCheckboxes.length).toBe(dataRows.length);

        const totalCheckboxes = fixture.nativeElement.querySelectorAll(
            "tbody mona-grid-selection-checkbox"
        ).length;
        expect(totalCheckboxes).toBe(dataRows.length);
    });

    it("keeps the selection column locked to the left", () => {
        const row = getRequiredElement(fixture.nativeElement, "tbody tr[monaGridRow]");
        const cells = Array.from(row.querySelectorAll("td"));
        expect(cells[0].style.position).toBe("sticky");
        expect(cells[1].style.position).toBe("");
    });

    it("exposes aria-selected on data rows matching the checkbox state", () => {
        const firstCheckbox = getRequiredElement(
            fixture.nativeElement,
            "tbody mona-grid-selection-checkbox input[type='checkbox']"
        ) as HTMLInputElement;
        firstCheckbox.click();
        fixture.detectChanges();

        const selectedRow = getRequiredElement(fixture.nativeElement, "tbody tr[monaGridRow]");
        expect(selectedRow.getAttribute("aria-selected")).toBe("true");
    });
});

describe("virtual grid selection integration", () => {
    let fixture: ComponentFixture<VirtualSelectionHostComponent>;
    let gridService: GridService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [VirtualSelectionHostComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(VirtualSelectionHostComponent);
        await settleFixture(fixture);
        gridService = gridServiceOf(fixture);
    });

    it("renders checkboxes in virtual rows", () => {
        const bodyCheckboxes = fixture.nativeElement.querySelectorAll(
            "tbody mona-grid-selection-checkbox input[type='checkbox']"
        );
        expect(bodyCheckboxes.length).toBeGreaterThan(0);
    });

    it("includes the selection column in the virtual body colgroup", () => {
        const bodyTable = getRequiredElement(fixture.nativeElement, "cdk-virtual-scroll-viewport table");
        const colgroup = getRequiredElement(bodyTable, "colgroup");
        const cols = Array.from(colgroup.querySelectorAll("col"));
        const widths = cols.map(col => col.style.width);
        expect(widths).toContain("40px");
        expect(widths).toHaveLength(3);
    });

    it("bulk selection over virtual rows selects the whole view", () => {
        const headerCheckbox = getRequiredElement(
            fixture.nativeElement,
            "thead mona-grid-select-all-checkbox input[type='checkbox']"
        ) as HTMLInputElement;
        headerCheckbox.click();
        fixture.detectChanges();

        expect(gridService.selectedKeys().size()).toBe(50);
    });

    it("does not leak selection state between recycled rows", () => {
        const firstCheckbox = getRequiredElement(
            fixture.nativeElement,
            "tbody mona-grid-selection-checkbox input[type='checkbox']"
        ) as HTMLInputElement;
        firstCheckbox.click();
        fixture.detectChanges();

        expect(gridService.selectedKeys().firstOrDefault()).toBe(1);
    });
});
