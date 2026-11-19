import { Clipboard } from "@angular/cdk/clipboard";
import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, signal, viewChild } from "@angular/core";
import { type ComponentFixture, DeferBlockState, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridEditableDirective } from "../directives/grid-editable.directive";
import { GridRangeSelectableDirective } from "../directives/grid-range-selectable.directive";
import type { EditableOptions } from "../models/EditableOptions";
import type { GridCellRange } from "../models/GridCellRange";
import type { GridRangePasteEvent } from "../models/GridRangePasteEvent";

interface Order {
    amount: number;
    id: number;
    name: string;
    shipped: Date;
}

const ORDERS: Order[] = [
    { amount: 10, id: 1, name: "Ann", shipped: new Date(2024, 0, 3) },
    { amount: 20, id: 2, name: "Bob\tby tab", shipped: new Date(2024, 1, 3) },
    { amount: 30, id: 3, name: "Cid", shipped: new Date(2024, 2, 3) }
];

@Component({
    imports: [GridColumnComponent, GridComponent, GridEditableDirective, GridRangeSelectableDirective],
    template: `
        <mona-grid
            aria-label="Orders"
            [data]="rows"
            [rowKey]="'id'"
            [pageSizeValues]="[]"
            [responsivePager]="false"
            [monaGridEditable]="editable()"
            monaGridRangeSelectable
            (rangeChange)="ranges.push($event)"
            (rangePaste)="pastes.push($event)">
            <mona-grid-column field="id" title="Id" type="number" [width]="60" />
            <mona-grid-column field="name" title="Name" [width]="140" />
            <mona-grid-column field="amount" title="Amount" type="number" [width]="100" />
            <mona-grid-column field="shipped" title="Shipped" type="date" [width]="140" />
        </mona-grid>
    `
})
class RangeHostComponent {
    public readonly editable = signal<EditableOptions>({ enabled: false, mode: "cell" });
    public readonly pastes: GridRangePasteEvent[] = [];
    public readonly range = viewChild.required(GridRangeSelectableDirective);
    public readonly ranges: (GridCellRange | null)[] = [];
    public readonly rows = ORDERS;
}

describe("grid range selection", () => {
    let announce: ReturnType<typeof vi.fn>;
    let copy: ReturnType<typeof vi.fn>;
    let fixture: ComponentFixture<RangeHostComponent>;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        for (const block of await fixture.getDeferBlocks()) {
            await block.render(DeferBlockState.Complete);
        }
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function cell(rowIndex: number, field: string): HTMLTableCellElement {
        const rows = (fixture.nativeElement as HTMLElement).querySelectorAll("tr[monaGridRow]");
        return rows[rowIndex].querySelector<HTMLElement>(`[data-field='${field}']`)!.closest("td")!;
    }

    /** The selected cells as `row:field`, in reading order. */
    function selectedCells(): string[] {
        return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("tr[monaGridRow]")).flatMap(
            (row, rowIndex) =>
                Array.from(row.querySelectorAll("td[aria-selected='true']")).map(
                    td => `${rowIndex}:${td.querySelector("[data-field]")?.getAttribute("data-field")}`
                )
        );
    }

    async function press(target: HTMLElement, key: string, init: KeyboardEventInit = {}): Promise<KeyboardEvent> {
        const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
        target.dispatchEvent(event);
        await settle();
        return event;
    }

    async function paste(target: HTMLElement, text: string): Promise<Event> {
        const event = new Event("paste", { bubbles: true, cancelable: true });
        Object.defineProperty(event, "clipboardData", { value: { getData: () => text } });
        target.dispatchEvent(event);
        await settle();
        return event;
    }

    function pointer(type: string, target: EventTarget, init: PointerEventInit = {}): void {
        target.dispatchEvent(
            new PointerEvent(type, { bubbles: true, button: 0, cancelable: true, pointerType: "mouse", ...init })
        );
    }

    beforeEach(async () => {
        announce = vi.fn().mockResolvedValue(undefined);
        copy = vi.fn().mockReturnValue(true);
        TestBed.configureTestingModule({
            providers: [
                { provide: LiveAnnouncer, useValue: { announce } },
                { provide: Clipboard, useValue: { copy } }
            ]
        });
        fixture = TestBed.createComponent(RangeHostComponent);
        document.body.append(fixture.nativeElement as HTMLElement);
        await settle();
    });

    afterEach(() => {
        fixture.destroy();
        (fixture.nativeElement as HTMLElement).remove();
        delete (document as Partial<Document>).elementFromPoint;
    });

    it("marks the grid as one with several selectable cells", () => {
        const grid = (fixture.nativeElement as HTMLElement).querySelector("[role='grid']");

        expect(grid?.getAttribute("aria-multiselectable")).toBe("true");
        expect(cell(0, "name").getAttribute("aria-selected")).toBe("false");
    });

    it("extends a range from the focused cell with Shift and the arrows, and reports it", async () => {
        cell(0, "name").focus();
        await press(cell(0, "name"), "ArrowRight", { shiftKey: true });
        await press(document.activeElement as HTMLElement, "ArrowDown", { shiftKey: true });

        expect(selectedCells()).toEqual(["0:name", "0:amount", "1:name", "1:amount"]);
        expect(document.activeElement).toBe(cell(1, "amount"));
        const last = fixture.componentInstance.ranges.at(-1);
        expect(last?.fields).toEqual(["name", "amount"]);
        expect(last?.rows.map(row => row["id"])).toEqual([1, 2]);
    });

    it("leaves the range behind when focus moves on without Shift, and clears it with Escape", async () => {
        cell(0, "name").focus();
        await press(cell(0, "name"), "ArrowDown", { shiftKey: true });
        await press(document.activeElement as HTMLElement, "ArrowRight");
        expect(selectedCells()).toEqual([]);
        expect(fixture.componentInstance.ranges.at(-1)).toBeNull();

        await press(document.activeElement as HTMLElement, "ArrowDown", { shiftKey: true });
        await press(document.activeElement as HTMLElement, "Escape");
        expect(selectedCells()).toEqual([]);
    });

    it("selects every cell with Ctrl+A", async () => {
        cell(1, "id").focus();
        await press(cell(1, "id"), "a", { code: "KeyA", ctrlKey: true });

        expect(selectedCells()).toHaveLength(12);
    });

    it("drags out a range with the mouse and moves focus to its far corner", async () => {
        const target = cell(2, "amount");
        Object.assign(document, { elementFromPoint: () => target });

        pointer("pointerdown", cell(0, "name"));
        pointer("pointermove", document, { clientX: 10, clientY: 10 });
        pointer("pointerup", document);
        await settle();

        expect(selectedCells()).toEqual(["0:name", "0:amount", "1:name", "1:amount", "2:name", "2:amount"]);
        expect(document.activeElement).toBe(target);
    });

    it("selects from the focused cell to a Shift+clicked one", async () => {
        cell(0, "id").focus();
        pointer("pointerdown", cell(1, "name"), { shiftKey: true });
        await settle();

        expect(selectedCells()).toEqual(["0:id", "0:name", "1:id", "1:name"]);
    });

    it("copies the range as tab-separated text, as the cells show it, and says how many cells it copied", async () => {
        cell(1, "name").focus();
        await press(cell(1, "name"), "ArrowRight", { shiftKey: true });
        await press(document.activeElement as HTMLElement, "ArrowRight", { shiftKey: true });
        await press(document.activeElement as HTMLElement, "ArrowDown", { shiftKey: true });

        const event = await press(document.activeElement as HTMLElement, "c", { code: "KeyC", ctrlKey: true });

        expect(event.defaultPrevented).toBe(true);
        expect(copy).toHaveBeenCalledWith('"Bob\tby tab"\t20\t02/03/2024\r\nCid\t30\t03/03/2024');
        expect(announce).toHaveBeenCalledWith("Copied 6 cells", "polite");
    });

    it("doesn't paste while the grid can't be edited", async () => {
        cell(0, "name").focus();
        await paste(cell(0, "name"), "Zed");

        expect(fixture.componentInstance.pastes).toEqual([]);
    });

    describe("with editing on", () => {
        beforeEach(async () => {
            fixture.componentInstance.editable.set({ enabled: true, mode: "cell" });
            await settle();
        });

        it("pastes a block from the focused cell, as values of each column's type", async () => {
            cell(0, "name").focus();

            const event = await paste(cell(0, "name"), "Zed\t15\t2024-05-06\r\nYan\t25\t2024-05-07\r\n");

            expect(event.defaultPrevented).toBe(true);
            const [result] = fixture.componentInstance.pastes;
            expect(result.skippedCells).toBe(0);
            expect(result.changes.map(change => change.rowData)).toEqual([
                { amount: 15, id: 1, name: "Zed", shipped: new Date(2024, 4, 6) },
                { amount: 25, id: 2, name: "Yan", shipped: new Date(2024, 4, 7) }
            ]);
            expect(result.changes[0].originalRowData).toBe(ORDERS[0]);
            expect(result.changes[0].fields).toEqual(["name", "amount", "shipped"]);
            // The grid doesn't change its data itself.
            expect(ORDERS[0].name).toBe("Ann");
            expect(selectedCells()).toEqual(["0:name", "0:amount", "0:shipped", "1:name", "1:amount", "1:shipped"]);
            expect(announce).toHaveBeenCalledWith("Pasted 6 cells", "polite");
        });

        it("fills the whole range with a single value", async () => {
            cell(0, "amount").focus();
            await press(cell(0, "amount"), "ArrowDown", { shiftKey: true });
            await press(document.activeElement as HTMLElement, "ArrowDown", { shiftKey: true });

            await paste(document.activeElement as HTMLElement, "99");

            expect(fixture.componentInstance.pastes[0].changes.map(change => change.rowData["amount"])).toEqual([
                99, 99, 99
            ]);
        });

        it("skips the cells whose column can't be edited or whose text doesn't fit", async () => {
            cell(2, "id").focus();

            await paste(cell(2, "id"), "7\tKay\tlots");

            const [result] = fixture.componentInstance.pastes;
            // Id is the rowKey, so it can't be edited; "lots" isn't a number.
            expect(result.skippedCells).toBe(2);
            expect(result.changes).toEqual([
                { fields: ["name"], originalRowData: ORDERS[2], rowData: { ...ORDERS[2], name: "Kay" } }
            ]);
        });

        it("stops at the last row instead of adding rows", async () => {
            cell(2, "name").focus();

            await paste(cell(2, "name"), "One\r\nTwo\r\nThree");

            expect(fixture.componentInstance.pastes[0].changes.map(change => change.rowData["name"])).toEqual(["One"]);
        });
    });

    it("passes axe with a range selected", async () => {
        cell(0, "name").focus();
        await press(cell(0, "name"), "ArrowDown", { shiftKey: true });

        const results = await axe.run(fixture.nativeElement as HTMLElement, {
            rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
        });

        expect(results.violations.map(violation => violation.id)).toEqual([]);
    });

    it("clears the range from code", async () => {
        cell(0, "name").focus();
        await press(cell(0, "name"), "ArrowDown", { shiftKey: true });

        fixture.componentInstance.range().clearRange();
        await settle();

        expect(selectedCells()).toEqual([]);
        expect(fixture.componentInstance.ranges.at(-1)).toBeNull();
    });
});
