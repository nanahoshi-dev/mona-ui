import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Row } from "../../models/Row";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridService } from "../../services/grid.service";
import { gridListTableRowThemeVariants } from "../../styles/grid.styles";
import { GridRowComponent } from "./grid-row.component";

@Component({
    template: `<table>
        <tbody>
            <tr monaGridRow [row]="row()" [index]="0" [ariaRowIndex]="2"></tr>
        </tbody>
    </table>`,
    imports: [GridRowComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
class TestHostComponent {
    protected readonly gridService = inject(GridService);
    public readonly row = signal(new Row({ id: 1, name: "Ada" }));
}

describe("GridRowComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let gridService: GridService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [GridService, GridNavigationService]
        });
        gridService = TestBed.inject(GridService);
        fixture = TestBed.createComponent(TestHostComponent);
    });

    function getRow(): HTMLTableRowElement {
        return fixture.nativeElement.querySelector("tr[monaGridRow]") as HTMLTableRowElement;
    }

    it("renders one cell per layout column", () => {
        gridService.setRowReorderableOptions({ enabled: true });
        gridService.setSelectableOptions({ enabled: true, mode: "multiple", showCheckboxes: true });
        fixture.detectChanges();

        const cells = getRow().querySelectorAll(":scope > td");
        expect(cells.length).toBe(gridService.layout().length);
        expect(cells[0].querySelector("mona-grid-row-reorder-handle")).not.toBeNull();
        expect(cells[1].querySelector("mona-grid-selection-checkbox")).not.toBeNull();
    });

    it("exposes row identity and position for navigation and assistive technology", () => {
        fixture.detectChanges();

        const row = getRow();
        expect(row.getAttribute("role")).toBe("row");
        expect(row.getAttribute("data-ruid")).toBe(fixture.componentInstance.row().uid);
        expect(row.getAttribute("data-row-view-index")).toBe("0");
        expect(row.getAttribute("aria-rowindex")).toBe("2");
    });

    it("uses neutral hover and persistent selection instead of primary fills", () => {
        const restingClasses = gridListTableRowThemeVariants({ selected: false });
        const selectedClasses = gridListTableRowThemeVariants({ selected: true });

        expect(restingClasses).toContain("bg-surface");
        expect(restingClasses).toContain("hover:bg-hover");
        expect(selectedClasses).toContain("bg-(--color-selected)");
        expect(selectedClasses).toContain("text-(--color-selected-foreground)");
        expect(selectedClasses).not.toContain("bg-primary");
    });
});
