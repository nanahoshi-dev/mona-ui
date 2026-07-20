import { Component, inject } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { ImmutableList } from "@mirei/ts-collections";
import type { Column } from "../models/Column";
import type { GridColumnLockedPosition } from "../models/GridColumnLockedPosition";
import { GridService } from "../services/grid.service";
import { GridLockedCellDirective } from "./grid-locked-cell.directive";

function createColumn(field: string, locked: boolean, lockedPosition: GridColumnLockedPosition = "left"): Column {
    return {
        aggregate: null,
        calculatedWidth: null,
        cellTemplate: null,
        columnSortDirection: null,
        commandTemplate: null,
        configuredHidden: false,
        dataType: "string",
        editTemplate: null,
        editable: false,
        field,
        filtered: false,
        format: null,
        footerTemplate: null,
        groupFooterTemplate: null,
        headerTemplate: null,
        groupSortDirection: null,
        hidden: false,
        id: field,
        index: 0,
        kind: "data",
        locked,
        lockedPosition,
        maxWidth: null,
        minWidth: 40,
        removeConfirmation: false,
        sortIndex: null,
        stateKey: null,
        title: field,
        titleTemplate: null,
        width: 80
    };
}

@Component({
    template: `
        <table>
            <tbody>
                <tr>
                    <td
                        id="left-non-edge"
                        class="border-r border-r-border border-b border-b-border"
                        monaGridLockedCell
                        [column]="leftNonEdgeColumn"></td>
                    <td
                        id="left-edge"
                        class="border-r border-r-border border-b border-b-border"
                        monaGridLockedCell
                        [column]="leftEdgeColumn"></td>
                    <td
                        id="unlocked"
                        class="border-r border-r-border border-b border-b-border"
                        monaGridLockedCell
                        [column]="unlockedColumn"></td>
                    <td
                        id="right-edge"
                        class="border-r border-r-border border-b border-b-border"
                        monaGridLockedCell
                        [column]="rightEdgeColumn"></td>
                    <td
                        id="right-non-edge"
                        class="border-r border-r-border border-b border-b-border"
                        monaGridLockedCell
                        [column]="rightNonEdgeColumn"></td>
                </tr>
            </tbody>
        </table>
    `,
    imports: [GridLockedCellDirective]
})
class GridLockedCellHostComponent {
    protected readonly gridService = inject(GridService);
    protected readonly leftEdgeColumn = createColumn("leftEdge", true, "left");
    protected readonly leftNonEdgeColumn = createColumn("leftNonEdge", true, "left");
    protected readonly rightEdgeColumn = createColumn("rightEdge", true, "right");
    protected readonly rightNonEdgeColumn = createColumn("rightNonEdge", true, "right");
    protected readonly unlockedColumn = createColumn("unlocked", false);

    public constructor() {
        this.gridService.columns.set(
            ImmutableList.create([
                this.leftNonEdgeColumn,
                this.leftEdgeColumn,
                this.unlockedColumn,
                this.rightEdgeColumn,
                this.rightNonEdgeColumn
            ])
        );
    }
}

describe("GridLockedCellDirective", () => {
    let fixture: ComponentFixture<GridLockedCellHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridLockedCellHostComponent],
            providers: [GridService]
        }).compileComponents();

        fixture = TestBed.createComponent(GridLockedCellHostComponent);
        fixture.detectChanges();
    });

    it("preserves the existing right border for the left locked boundary", () => {
        const cell = getCell("left-edge");

        expect(cell.classList.contains("border-r")).toBe(true);
        expect(cell.classList.contains("border-r-border")).toBe(true);
        expect(cell.classList.contains("border-b")).toBe(true);
        expect(cell.classList.contains("border-b-border")).toBe(true);
        expect(cell.classList.contains("border-l")).toBe(false);
        expect(cell.classList.contains("border-l-border")).toBe(false);
    });

    it("does not remove gridline borders from the right locked boundary", () => {
        const cell = getCell("right-edge");

        expect(cell.classList.contains("border-r")).toBe(true);
        expect(cell.classList.contains("border-r-border")).toBe(true);
        expect(cell.classList.contains("border-b")).toBe(true);
        expect(cell.classList.contains("border-b-border")).toBe(true);
    });

    it("does not remove gridline borders from non-edge locked cells", () => {
        const leftCell = getCell("left-non-edge");
        const rightCell = getCell("right-non-edge");

        expect(leftCell.classList.contains("border-l")).toBe(false);
        expect(leftCell.classList.contains("border-l-border")).toBe(false);
        expect(leftCell.classList.contains("border-r")).toBe(true);
        expect(leftCell.classList.contains("border-r-border")).toBe(true);
        expect(leftCell.classList.contains("border-b")).toBe(true);
        expect(leftCell.classList.contains("border-b-border")).toBe(true);
        expect(leftCell.style.boxShadow).toBe("");

        expect(rightCell.classList.contains("border-l")).toBe(false);
        expect(rightCell.classList.contains("border-l-border")).toBe(false);
        expect(rightCell.classList.contains("border-r")).toBe(true);
        expect(rightCell.classList.contains("border-r-border")).toBe(true);
        expect(rightCell.classList.contains("border-b")).toBe(true);
        expect(rightCell.classList.contains("border-b-border")).toBe(true);
        expect(rightCell.style.boxShadow).toBe("");
    });

    function getCell(id: string): HTMLTableCellElement {
        const hostElement = fixture.nativeElement as HTMLElement;
        const cell = hostElement.querySelector(`#${id}`);
        expect(cell).not.toBeNull();
        return cell as HTMLTableCellElement;
    }
});
