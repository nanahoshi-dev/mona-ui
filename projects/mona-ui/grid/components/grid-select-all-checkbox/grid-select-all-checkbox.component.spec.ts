import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GridService } from "../../services/grid.service";
import { GridSelectAllCheckboxComponent } from "./grid-select-all-checkbox.component";

describe("GridSelectAllCheckboxComponent", () => {
    let fixture: ComponentFixture<GridSelectAllCheckboxComponent>;
    let gridService: GridService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridSelectAllCheckboxComponent],
            providers: [GridService]
        }).compileComponents();
        fixture = TestBed.createComponent(GridSelectAllCheckboxComponent);
        gridService = TestBed.inject(GridService);
        gridService.setRows([{ id: 1 }, { id: 2 }, { id: 3 }]);
        gridService.setSelectableOptions({ enabled: true, mode: "multiple", showCheckboxes: true });
        fixture.detectChanges();
    });

    function checkboxInput(): HTMLInputElement {
        const input = fixture.nativeElement.querySelector("input[type='checkbox']") as HTMLInputElement;
        if (input == null) {
            throw new Error("Expected checkbox input");
        }
        return input;
    }

    function checkboxHost(): HTMLElement {
        const host = fixture.nativeElement.querySelector("mona-check-box") as HTMLElement;
        if (host == null) {
            throw new Error("Expected mona-check-box host");
        }
        return host;
    }

    it("reports unchecked when the scope is empty", () => {
        gridService.setRows([]);
        fixture.detectChanges();

        expect(checkboxInput().checked).toBe(false);
        expect(checkboxHost().getAttribute("data-indeterminate")).toBe("false");
    });

    it("reports checked when every scope row is selected", () => {
        for (const row of gridService.viewPageRows()) {
            gridService.selectRow(row);
        }
        fixture.detectChanges();

        expect(checkboxInput().checked).toBe(true);
        expect(checkboxHost().getAttribute("data-indeterminate")).toBe("false");
    });

    it("reports indeterminate when only some scope rows are selected", () => {
        const row = gridService.viewPageRows().firstOrDefault()!;
        gridService.selectRow(row);
        fixture.detectChanges();

        expect(checkboxInput().checked).toBe(false);
        expect(checkboxHost().getAttribute("data-indeterminate")).toBe("true");
    });

    it("selects the whole scope when toggled on", () => {
        checkboxInput().click();
        fixture.detectChanges();

        expect(gridService.selectedKeys().size()).toBe(3);
        expect(gridService.allBulkSelectionRowsSelected()).toBe(true);
    });

    it("deselects the whole scope when toggled off", () => {
        checkboxInput().click();
        fixture.detectChanges();
        checkboxInput().click();
        fixture.detectChanges();

        expect(gridService.selectedKeys().isEmpty()).toBe(true);
    });

    it("does nothing in single mode", () => {
        gridService.setSelectableOptions({ enabled: true, mode: "single", showCheckboxes: true });
        fixture.detectChanges();

        checkboxInput().click();
        fixture.detectChanges();

        expect(gridService.selectedKeys().isEmpty()).toBe(true);
    });

    it("exposes an accessible select-all label", () => {
        const label = fixture.nativeElement.querySelector("label");
        expect(label?.textContent).toContain("Select all rows");
    });
});
