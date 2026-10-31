import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ImmutableList } from "@mirei/ts-collections";
import type { Column } from "../../models/Column";
import type { GridViewGroupRow } from "../../models/GridGroup";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridService } from "../../services/grid.service";
import { GridGroupRowComponent } from "./grid-group-row.component";

@Component({
    template: `<table>
        <tbody>
            <tr monaGridGroupRow [group]="group()" [rowIndex]="0"></tr>
        </tbody>
    </table>`,
    imports: [GridGroupRowComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
class TestHostComponent {
    public readonly group = signal<GridViewGroupRow>({
        count: 1,
        depth: 1,
        field: "city",
        groupKey: "country:NL/city:Delft",
        groupValue: "Delft",
        key: "group:country:NL/city:Delft",
        title: "City",
        type: "group"
    });
}

function createColumn(field: string): Column {
    return { field, id: field, hidden: false, calculatedWidth: 100, locked: false } as Column;
}

describe("GridGroupRowComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let gridService: GridService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [GridService, GridNavigationService]
        });
        gridService = TestBed.inject(GridService);
        gridService.columns.set(
            ImmutableList.create([createColumn("country"), createColumn("city"), createColumn("name")])
        );
        gridService.addGroupColumn(gridService.columns().get(0));
        gridService.addGroupColumn(gridService.columns().get(1));
        fixture = TestBed.createComponent(TestHostComponent);
    });

    function getCells(): HTMLTableCellElement[] {
        return Array.from(fixture.nativeElement.querySelectorAll("tr[monaGridGroupRow] > td"));
    }

    it("indents by its depth and spans the title across every remaining layout column", () => {
        fixture.detectChanges();

        const cells = getCells();
        expect(cells.length).toBe(2);
        expect(Number(cells[1].getAttribute("colspan")) + 1).toBe(gridService.layout().length);
    });

    it("keeps the row exactly as wide as the layout with a reorder placeholder", () => {
        gridService.setRowReorderableOptions({ enabled: true });
        fixture.detectChanges();

        const cells = getCells();
        expect(cells.length).toBe(3);
        expect(Number(cells[2].getAttribute("colspan")) + 2).toBe(gridService.layout().length);
    });

    it("reports its level and expansion state", () => {
        fixture.detectChanges();
        const row = fixture.nativeElement.querySelector("tr[monaGridGroupRow]") as HTMLElement;
        expect(row.getAttribute("aria-level")).toBe("2");
        expect(row.getAttribute("aria-expanded")).toBe("true");

        gridService.toggleGroupCollapse("country:NL/city:Delft");
        fixture.detectChanges();
        expect(row.getAttribute("aria-expanded")).toBe("false");
    });
});
