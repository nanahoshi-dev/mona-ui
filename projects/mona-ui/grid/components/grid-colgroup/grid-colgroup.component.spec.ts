import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GridService } from "../../services/grid.service";
import { GridColgroupComponent } from "./grid-colgroup.component";

@Component({
    template: `<table>
        <colgroup monaGridColgroup></colgroup>
    </table>`,
    imports: [GridColgroupComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
class TestHostComponent {}

describe("GridColgroupComponent", () => {
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

    function getColWidths(): string[] {
        const cols = Array.from(fixture.nativeElement.querySelectorAll("col") as NodeListOf<HTMLElement>);
        return cols.map(col => col.style.width);
    }

    it("renders one col per layout column with its width", () => {
        gridService.setColumnDefinitions([]);
        gridService.setRowReorderableOptions({ enabled: true });
        gridService.masterDetailTemplate.set({} as never);
        fixture.detectChanges();

        expect(getColWidths()).toEqual(["36px", "36px"]);
    });

    it("updates when structural columns change", () => {
        gridService.setRowReorderableOptions({ enabled: true });
        fixture.detectChanges();
        expect(getColWidths()).toEqual(["36px"]);

        gridService.setRowReorderableOptions({ enabled: false });
        fixture.detectChanges();
        expect(getColWidths()).toEqual([]);
    });
});
