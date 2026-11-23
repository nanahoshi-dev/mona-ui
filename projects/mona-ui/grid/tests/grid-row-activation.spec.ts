import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import type { MockInstance } from "vitest";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridCellTemplateDirective } from "../directives/grid-cell-template.directive";
import { GridDetailTemplateDirective } from "../directives/grid-detail-template.directive";
import { GridEditableDirective } from "../directives/grid-editable.directive";
import { GridGroupableDirective } from "../directives/grid-groupable.directive";
import { GridSelectableDirective } from "../directives/grid-selectable.directive";
import { GridSortableDirective } from "../directives/grid-sortable.directive";
import { GridVirtualScrollDirective } from "../directives/grid-virtual-scroll.directive";
import type { EditableOptions } from "../models/EditableOptions";
import type { GridEditEvent } from "../models/GridEditEvent";
import type { GridRowActivateEvent } from "../models/GridRowActivateEvent";
import type { GroupDescriptor } from "../models/GroupDescriptor";
import type { SelectableOptions } from "../models/SelectableOptions";

interface FileRow {
    id: number;
    name: string;
    size: number;
    type: string;
}

function createFiles(count: number): FileRow[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        name: `File ${i + 1}`,
        size: (i + 1) * 10,
        type: i % 2 === 0 ? "Folder" : "Document"
    }));
}

@Component({
    imports: [
        GridCellTemplateDirective,
        GridColumnComponent,
        GridComponent,
        GridDetailTemplateDirective,
        GridEditableDirective,
        GridGroupableDirective,
        GridSelectableDirective,
        GridSortableDirective
    ],
    template: `
        <mona-grid
            aria-label="Files"
            [data]="rows()"
            rowKey="id"
            [pageSize]="10"
            [pageSizeValues]="[]"
            [resizeMethod]="120"
            [responsivePager]="false"
            [monaGridEditable]="editable()"
            (edit)="onEdit($event)"
            monaGridGroupable
            [group]="group()"
            [monaGridSelectable]="selectable()"
            [(selectedKeys)]="selectedKeys"
            [monaGridSortable]="{ enabled: true }"
            (rowActivate)="onRowActivate($event)">
            <mona-grid-column field="name" title="Name" [width]="120" [editable]="true"></mona-grid-column>
            <mona-grid-column field="size" title="Size" type="number" [width]="100" [editable]="false" aggregate="sum">
            </mona-grid-column>
            <mona-grid-column field="type" title="Type" [width]="160" [editable]="false">
                <ng-template monaGridCellTemplate let-file>
                    <button type="button" class="open-button">Open {{ file.name }}</button>
                    <span class="handled-text" (dblclick)="$event.preventDefault()">{{ file.type }}</span>
                </ng-template>
            </mona-grid-column>
            @if (detail()) {
                <ng-template monaGridDetailTemplate let-file>
                    <span class="detail-text">Details of {{ file.name }}</span>
                </ng-template>
            }
        </mona-grid>
    `
})
class ActivationHostComponent {
    public readonly activations: GridRowActivateEvent<FileRow>[] = [];
    public readonly detail = signal(false);
    public readonly editable = signal<EditableOptions>({ enabled: false, mode: "cell" });
    public readonly group = signal<GroupDescriptor[]>([]);
    public readonly rows = signal(createFiles(4));
    public readonly selectable = signal<SelectableOptions>({ enabled: false });
    public preventEdit = false;
    public selectedKeys: unknown[] = [];

    public onEdit(event: GridEditEvent): void {
        if (this.preventEdit) {
            event.preventDefault();
        }
    }

    public onRowActivate(event: GridRowActivateEvent<FileRow>): void {
        this.activations.push(event);
    }
}

@Component({
    imports: [GridColumnComponent, GridComponent, GridVirtualScrollDirective],
    template: `
        <mona-grid
            aria-label="Files"
            [data]="rows"
            rowKey="id"
            [monaGridVirtualScroll]="{ height: 32 }"
            [resizeMethod]="120"
            (rowActivate)="activations.push($event)">
            <mona-grid-column field="name" title="Name" [width]="120"></mona-grid-column>
            <mona-grid-column field="size" title="Size" type="number" [width]="100"></mona-grid-column>
        </mona-grid>
    `
})
class VirtualActivationHostComponent {
    public readonly activations: GridRowActivateEvent<FileRow>[] = [];
    public readonly rows = createFiles(200);
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenRenderingDone();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function press(element: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    element.dispatchEvent(event);
    return event;
}

function doubleClick(element: Element): MouseEvent {
    const event = new MouseEvent("dblclick", { bubbles: true, cancelable: true, detail: 2 });
    element.dispatchEvent(event);
    return event;
}

function getRequired<E extends Element = HTMLElement>(root: ParentNode, selector: string): E {
    const element = root.querySelector<E>(selector);
    if (element == null) {
        throw new Error(`Expected element: ${selector}`);
    }
    return element;
}

/** The body cell of a data row, by the row's place among the data rows and the column's field. */
function dataCell(root: ParentNode, field: string, rowIndex = 0): HTMLTableCellElement {
    const content = root.querySelectorAll(`tbody [data-field="${field}"]`)[rowIndex];
    const cell = content?.closest("td");
    if (cell == null) {
        throw new Error(`Expected a ${field} cell in data row ${rowIndex}`);
    }
    return cell;
}

/** The text a data cell shows, where a pointer would double-click it. */
function cellText(root: ParentNode, field: string, rowIndex = 0): HTMLElement {
    return getRequired(dataCell(root, field, rowIndex), "[data-field] > span");
}

function headerCell(root: ParentNode, title: string): HTMLTableCellElement {
    const cell = Array.from(root.querySelectorAll<HTMLTableCellElement>("th[data-column-id]")).find(th =>
        th.textContent?.includes(title)
    );
    if (cell == null) {
        throw new Error(`Expected header ${title}`);
    }
    return cell;
}

describe("grid row activation", () => {
    let fixture: ComponentFixture<ActivationHostComponent>;
    let host: ActivationHostComponent;
    let root: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ActivationHostComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(ActivationHostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle(fixture);
    });

    afterEach(() => {
        root.remove();
    });

    it("emits the row's item and the double-click when a data row is double-clicked", () => {
        const event = doubleClick(cellText(root, "name", 1));

        expect(host.activations).toHaveLength(1);
        expect(host.activations[0].rowData).toBe(host.rows()[1]);
        expect(host.activations[0].originalEvent).toBe(event);
    });

    it("emits the key press when Enter is pressed on a focused cell of a read-only grid", () => {
        const cell = dataCell(root, "size", 2);
        cell.focus();
        const event = press(cell, "Enter");

        expect(host.activations).toHaveLength(1);
        expect(host.activations[0].rowData).toBe(host.rows()[2]);
        expect(host.activations[0].originalEvent).toBe(event);
    });

    it("activates from any cell of the row and passes modified keys through", () => {
        dataCell(root, "name").focus();
        press(dataCell(root, "name"), "Enter");
        dataCell(root, "size").focus();
        press(dataCell(root, "size"), "Enter", { altKey: true });

        expect(host.activations.map(activation => activation.rowData)).toEqual([host.rows()[0], host.rows()[0]]);
        expect(host.activations[1].originalEvent).toBeInstanceOf(KeyboardEvent);
        expect((host.activations[1].originalEvent as KeyboardEvent).altKey).toBe(true);
    });

    it("doesn't emit for header cells", () => {
        const header = headerCell(root, "Name");
        doubleClick(header);
        header.focus();
        press(header, "Enter");

        expect(host.activations).toHaveLength(0);
    });

    it("doesn't emit for group rows or group footer rows", async () => {
        host.group.set([{ field: "type" }]);
        await settle(fixture);

        const groupCell = getRequired(root, "tbody tr[monaGridGroupRow] td[aria-colindex]");
        const footerCell = getRequired(root, "tbody tr[monaGridFooterRow] td[aria-colindex]");
        doubleClick(groupCell);
        doubleClick(footerCell);
        footerCell.focus();
        press(footerCell, "Enter");
        groupCell.focus();
        press(groupCell, "Enter");

        expect(host.activations).toHaveLength(0);
        // The data rows under the groups still activate.
        doubleClick(cellText(root, "name"));
        expect(host.activations).toHaveLength(1);
    });

    it("keeps Enter on the detail toggle and doesn't emit for detail rows", async () => {
        host.detail.set(true);
        await settle(fixture);

        const toggleCell = getRequired(root, "tbody tr[monaGridRow] mona-grid-toggle").closest("td");
        if (toggleCell == null) {
            throw new Error("Expected the detail toggle cell");
        }
        toggleCell.focus();
        press(toggleCell, "Enter");
        await settle(fixture);

        const detailText = getRequired(root, "tbody tr[monaGridDetailRow] .detail-text");
        expect(detailText.textContent).toContain("Details of File 1");
        doubleClick(detailText);
        expect(host.activations).toHaveLength(0);
    });

    it("doesn't emit for a double-click or Enter on a control inside a cell", () => {
        const button = getRequired<HTMLButtonElement>(dataCell(root, "type"), ".open-button");
        doubleClick(button);
        button.focus();
        press(button, "Enter");

        expect(host.activations).toHaveLength(0);
    });

    it("moves into a cell's controls on Enter instead of activating", () => {
        const cell = dataCell(root, "type");
        cell.focus();
        press(cell, "Enter");

        expect(document.activeElement).toBe(getRequired(cell, ".open-button"));
        expect(host.activations).toHaveLength(0);
    });

    it("doesn't emit for a double-click whose default a cell template prevented", () => {
        doubleClick(getRequired(dataCell(root, "type"), ".handled-text"));

        expect(host.activations).toHaveLength(0);
    });

    describe("with cell editing", () => {
        beforeEach(async () => {
            host.editable.set({ enabled: true, mode: "cell" });
            await settle(fixture);
        });

        it("starts editing an editable cell on Enter instead of activating", async () => {
            const cell = dataCell(root, "name");
            cell.focus();
            press(cell, "Enter");
            await settle(fixture);

            expect(dataCell(root, "name").querySelector("mona-grid-editor")).not.toBeNull();
            expect(host.activations).toHaveLength(0);
        });

        it("starts editing an editable cell on a double-click instead of activating", async () => {
            doubleClick(cellText(root, "name"));
            await settle(fixture);

            expect(dataCell(root, "name").querySelector("mona-grid-editor")).not.toBeNull();
            expect(host.activations).toHaveLength(0);
        });

        it("keeps an editable cell's Enter and double-click when the app prevents the edit", async () => {
            host.preventEdit = true;
            const cell = dataCell(root, "name");
            cell.focus();
            press(cell, "Enter");
            doubleClick(cellText(root, "name"));
            await settle(fixture);

            expect(dataCell(root, "name").querySelector("mona-grid-editor")).toBeNull();
            expect(host.activations).toHaveLength(0);
        });

        it("still activates from a cell whose column isn't editable", () => {
            const cell = dataCell(root, "size", 1);
            cell.focus();
            press(cell, "Enter");
            doubleClick(cellText(root, "size", 1));

            expect(host.activations.map(activation => activation.rowData)).toEqual([host.rows()[1], host.rows()[1]]);
        });

        it("doesn't emit while an edit is open", async () => {
            const nameCell = dataCell(root, "name");
            nameCell.focus();
            press(nameCell, "Enter");
            await settle(fixture);
            expect(dataCell(root, "name").querySelector("mona-grid-editor")).not.toBeNull();

            const otherCell = dataCell(root, "size", 1);
            doubleClick(cellText(root, "size", 1));
            press(otherCell, "Enter");

            expect(host.activations).toHaveLength(0);
        });
    });

    describe("with row editing", () => {
        beforeEach(async () => {
            host.editable.set({ enabled: true, mode: "row" });
            await settle(fixture);
        });

        it("starts the row's edit on Enter, from any data cell, instead of activating", async () => {
            const cell = dataCell(root, "size");
            cell.focus();
            press(cell, "Enter");
            await settle(fixture);

            expect(dataCell(root, "name").querySelector("mona-grid-editor")).not.toBeNull();
            expect(host.activations).toHaveLength(0);
        });

        it("activates on a double-click, which doesn't edit in row mode", async () => {
            doubleClick(cellText(root, "name"));
            await settle(fixture);

            expect(dataCell(root, "name").querySelector("mona-grid-editor")).toBeNull();
            expect(host.activations).toHaveLength(1);
            expect(host.activations[0].rowData).toBe(host.rows()[0]);
        });
    });

    it("still selects the row on a double-click with selectOnRowClick", async () => {
        host.selectable.set({ enabled: true, mode: "single", selectOnRowClick: true });
        await settle(fixture);

        const text = cellText(root, "name", 2);
        text.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }));
        text.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 2 }));
        doubleClick(text);
        await settle(fixture);

        expect(host.selectedKeys).toEqual([3]);
        expect(dataCell(root, "name", 2).closest("tr")?.getAttribute("aria-selected")).toBe("true");
        expect(host.activations).toHaveLength(1);
        expect(host.activations[0].rowData).toBe(host.rows()[2]);
    });
});

describe("grid row activation with virtual scrolling", () => {
    let fixture: ComponentFixture<VirtualActivationHostComponent>;
    let host: VirtualActivationHostComponent;
    let root: HTMLElement;
    let clientHeight: MockInstance<() => number>;

    beforeEach(async () => {
        // jsdom has no layout: give the viewport a height, so it draws more than one row.
        clientHeight = vi.spyOn(Element.prototype, "clientHeight", "get").mockImplementation(function (this: Element) {
            return this.tagName === "CDK-VIRTUAL-SCROLL-VIEWPORT" ? 320 : 0;
        });
        await TestBed.configureTestingModule({
            imports: [VirtualActivationHostComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(VirtualActivationHostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle(fixture);
    });

    afterEach(() => {
        root.remove();
        clientHeight.mockRestore();
    });

    it("reports the item of the virtual row that was double-clicked or had Enter pressed", () => {
        const renderedRows = root.querySelectorAll("tbody tr[monaGridRow]");
        expect(renderedRows.length).toBeGreaterThan(2);

        doubleClick(cellText(root, "name", 2));
        const cell = dataCell(root, "size", 1);
        cell.focus();
        press(cell, "Enter");

        expect(host.activations.map(activation => activation.rowData)).toEqual([host.rows[2], host.rows[1]]);
        expect(cellText(root, "name", 2).textContent).toContain(host.activations[0].rowData.name);
    });
});
