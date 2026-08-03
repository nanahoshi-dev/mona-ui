import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GridService } from "../../services/grid.service";
import { GridSelectionCheckboxComponent } from "./grid-selection-checkbox.component";

describe("GridSelectionCheckboxComponent", () => {
    let fixture: ComponentFixture<GridSelectionCheckboxComponent>;
    let gridService: GridService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridSelectionCheckboxComponent],
            providers: [GridService]
        }).compileComponents();
        fixture = TestBed.createComponent(GridSelectionCheckboxComponent);
        gridService = TestBed.inject(GridService);
        gridService.setRows([{ id: 1 }, { id: 2 }]);
        gridService.setSelectableOptions({ enabled: true, mode: "multiple", showCheckboxes: true });
        const row = gridService.rows().firstOrDefault();
        if (row == null) {
            throw new Error("Expected rows");
        }
        fixture.componentRef.setInput("row", row);
        fixture.detectChanges();
    });

    function checkboxInput(): HTMLInputElement {
        const input = fixture.nativeElement.querySelector("input[type='checkbox']") as HTMLInputElement;
        if (input == null) {
            throw new Error("Expected checkbox input");
        }
        return input;
    }

    it("reflects the selected state of its row", () => {
        const row = gridService.rows().firstOrDefault()!;
        expect(checkboxInput().checked).toBe(false);

        gridService.selectRow(row);
        fixture.detectChanges();

        expect(checkboxInput().checked).toBe(true);
    });

    it("checks a row when toggled on", () => {
        const row = gridService.rows().firstOrDefault()!;

        checkboxInput().click();
        fixture.detectChanges();

        expect(gridService.isRowSelected(row)).toBe(true);
    });

    it("unchecks a row when toggled off", () => {
        const row = gridService.rows().firstOrDefault()!;
        gridService.selectRow(row);
        fixture.detectChanges();

        checkboxInput().click();
        fixture.detectChanges();

        expect(gridService.isRowSelected(row)).toBe(false);
    });

    it("clears prior selection in single mode when checking", () => {
        gridService.setSelectableOptions({ enabled: true, mode: "single", showCheckboxes: true });
        const [first, second] = gridService.rows().toArray();
        gridService.selectRow(first);
        fixture.componentRef.setInput("row", second);
        fixture.detectChanges();

        checkboxInput().click();
        fixture.detectChanges();

        expect(gridService.isRowSelected(first)).toBe(false);
        expect(gridService.isRowSelected(second)).toBe(true);
    });

    it("exposes an accessible row label", () => {
        const label = fixture.nativeElement.querySelector("label");
        expect(label?.textContent).toContain("Select row");
    });

    it("stops click propagation so the row handler does not run", () => {
        const input = checkboxInput();
        const spy = { called: false };
        const listener = (): void => {
            spy.called = true;
        };
        document.addEventListener("click", listener);
        try {
            input.click();
        } finally {
            document.removeEventListener("click", listener);
        }
        expect(spy.called).toBe(false);
    });
});
