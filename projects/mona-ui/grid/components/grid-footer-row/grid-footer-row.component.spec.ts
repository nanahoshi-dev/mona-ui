import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GridService } from "../../services/grid.service";
import { GridFooterRowComponent } from "./grid-footer-row.component";

@Component({
    template: `<table>
        <tfoot>
            <tr monaGridFooterRow></tr>
        </tfoot>
    </table>`,
    imports: [GridFooterRowComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
class TestHostComponent {}

describe("GridFooterRowComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let gridService: GridService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [GridService]
        });
        gridService = TestBed.inject(GridService);
        fixture = TestBed.createComponent(TestHostComponent);
    });

    it("renders one footer cell per layout column", () => {
        gridService.setRowReorderableOptions({ enabled: true });
        gridService.setColumnDefinitions([]);
        fixture.detectChanges();

        const row = fixture.nativeElement.querySelector("tr[monaGridFooterRow]") as HTMLElement;
        expect(row.getAttribute("role")).toBe("row");
        expect(row.querySelectorAll(":scope > td").length).toBe(gridService.layout().length);
        expect(row.querySelectorAll("mona-grid-footer-cell").length).toBe(0);
    });
});
