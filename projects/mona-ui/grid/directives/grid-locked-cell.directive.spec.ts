import { Component, inject } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { ImmutableList } from "@mirei/ts-collections";
import type { Column } from "../models/Column";
import type { GridColumnLockedPosition } from "../models/GridColumnLockedPosition";
import { GridService } from "../services/grid.service";
import { GridLockedCellDirective } from "./grid-locked-cell.directive";

const EDGE_BORDER = "1px solid var(--color-border)";

@Component({
    template: `
        <table>
            <tbody>
                <tr>
                    <td id="reorder" monaGridLockedCell="structural:reorder"></td>
                    <td id="detail" monaGridLockedCell="structural:detail"></td>
                    <td id="selection" monaGridLockedCell="structural:selection"></td>
                    <td id="unknown" monaGridLockedCell="structural:missing"></td>
                </tr>
            </tbody>
        </table>
    `,
    imports: [GridLockedCellDirective]
})
class StructuralColumnHostComponent {
    protected readonly gridService = inject(GridService);

    public constructor() {
        this.gridService.setRowReorderableOptions({ enabled: true });
        this.gridService.masterDetailTemplate.set({} as never);
        this.gridService.setSelectableOptions({
            enabled: true,
            mode: "multiple",
            selectAllScope: "page",
            selectOnRowClick: false,
            showCheckboxes: true,
            showSelectAll: true
        });
    }
}

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
        filterable: true,
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
        sortable: true,
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
                        monaGridLockedCell="column:leftNonEdge"></td>
                    <td
                        id="left-edge"
                        class="border-r border-r-border border-b border-b-border"
                        monaGridLockedCell="column:leftEdge"></td>
                    <td
                        id="unlocked"
                        class="border-r border-r-border border-b border-b-border"
                        monaGridLockedCell="column:unlocked"></td>
                    <td
                        id="right-edge"
                        class="border-r border-r-border border-b border-b-border"
                        monaGridLockedCell="column:rightEdge"></td>
                    <td
                        id="right-non-edge"
                        class="border-r border-r-border border-b border-b-border"
                        monaGridLockedCell="column:rightNonEdge"></td>
                </tr>
            </tbody>
        </table>
    `,
    imports: [GridLockedCellDirective]
})
class GridLockedCellHostComponent {
    protected readonly gridService = inject(GridService);

    public constructor() {
        this.gridService.columns.set(
            ImmutableList.create([
                createColumn("leftNonEdge", true, "left"),
                createColumn("leftEdge", true, "left"),
                createColumn("unlocked", false),
                createColumn("rightEdge", true, "right"),
                createColumn("rightNonEdge", true, "right")
            ])
        );
    }
}

function getCell(fixture: ComponentFixture<unknown>, id: string): HTMLTableCellElement {
    const cell = (fixture.nativeElement as HTMLElement).querySelector(`#${id}`);
    expect(cell).not.toBeNull();
    return cell as HTMLTableCellElement;
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

    it("pins start-locked columns with logical start offsets", () => {
        expect(getCell(fixture, "left-non-edge").style.position).toBe("sticky");
        expect(getCell(fixture, "left-non-edge").style.insetInlineStart).toBe("0px");
        expect(getCell(fixture, "left-edge").style.insetInlineStart).toBe("80px");
    });

    it("pins end-locked columns with logical end offsets", () => {
        expect(getCell(fixture, "right-non-edge").style.insetInlineEnd).toBe("0px");
        expect(getCell(fixture, "right-edge").style.insetInlineEnd).toBe("80px");
    });

    it("never sets physical left or right offsets", () => {
        for (const id of ["left-non-edge", "left-edge", "right-edge", "right-non-edge"]) {
            const cell = getCell(fixture, id);
            expect(cell.style.left).toBe("");
            expect(cell.style.right).toBe("");
        }
    });

    it("draws the separator on the inner side of each pinned boundary only", () => {
        expect(getCell(fixture, "left-edge").style.borderInlineEnd).toBe(EDGE_BORDER);
        expect(getCell(fixture, "left-non-edge").style.borderInlineEnd).toBe("");
        expect(getCell(fixture, "right-edge").style.borderInlineStart).toBe(EDGE_BORDER);
        expect(getCell(fixture, "right-non-edge").style.borderInlineStart).toBe("");
    });

    it("leaves unlocked columns in normal flow", () => {
        const cell = getCell(fixture, "unlocked");
        expect(cell.style.position).toBe("");
        expect(cell.style.insetInlineStart).toBe("");
        expect(cell.style.zIndex).toBe("");
    });

    it("keeps the cell's own gridline border classes", () => {
        for (const id of ["left-non-edge", "left-edge", "right-edge", "right-non-edge"]) {
            const cell = getCell(fixture, id);
            expect(cell.classList.contains("border-r")).toBe(true);
            expect(cell.classList.contains("border-r-border")).toBe(true);
            expect(cell.classList.contains("border-b")).toBe(true);
            expect(cell.classList.contains("border-b-border")).toBe(true);
            expect(cell.style.boxShadow).toBe("");
        }
    });
});

describe("GridLockedCellDirective structural columns", () => {
    let fixture: ComponentFixture<StructuralColumnHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StructuralColumnHostComponent],
            providers: [GridService]
        }).compileComponents();

        fixture = TestBed.createComponent(StructuralColumnHostComponent);
        fixture.detectChanges();
    });

    it("resolves each structural column's offset from the layout", () => {
        expect(getCell(fixture, "reorder").style.insetInlineStart).toBe("0px");
        expect(getCell(fixture, "detail").style.insetInlineStart).toBe("36px");
        expect(getCell(fixture, "selection").style.insetInlineStart).toBe("72px");
    });

    it("treats the last visible structural column as the sticky edge", () => {
        expect(getCell(fixture, "reorder").style.borderInlineEnd).toBe("");
        expect(getCell(fixture, "selection").style.borderInlineEnd).toBe(EDGE_BORDER);
    });

    it("leaves a cell unpinned when its layout key is not in the layout", () => {
        expect(getCell(fixture, "unknown").style.position).toBe("");
    });
});
