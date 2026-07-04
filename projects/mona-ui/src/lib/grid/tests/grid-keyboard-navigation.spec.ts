import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ButtonDirective } from "../../buttons/button/directives/button.directive";
import { GridCommandColumnComponent } from "../components/grid-command-column/grid-command-column.component";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridToolbarTemplateDirective } from "../directives/grid-toolbar-template.directive";
import { GridEditableDirective } from "../directives/grid-editable.directive";
import { GridSortableDirective } from "../directives/grid-sortable.directive";
import { EditableOptions } from "../models/EditableOptions";
import { GridComponent } from "../components/grid/grid.component";

@Component({
    imports: [
        ButtonDirective,
        GridCommandColumnComponent,
        GridColumnComponent,
        GridComponent,
        GridEditableDirective,
        GridSortableDirective,
        GridToolbarTemplateDirective
    ],
    template: `
        <button class="before-grid">Before</button>
        <mona-grid
            [data]="rows()"
            [monaGridEditable]="editableOptions()"
            [pageSize]="10"
            [pageSizeValues]="[]"
            [resizeMethod]="120"
            [responsivePager]="false"
            [monaGridSortable]="{ enabled: false }">
            @if (showToolbar()) {
                <ng-template monaGridToolbarTemplate>
                    <button monaButton class="toolbar-primary">Toolbar primary</button>
                    <button monaButton class="toolbar-secondary">Toolbar secondary</button>
                </ng-template>
            }
            <mona-grid-column field="name" title="Name" [editable]="true" [width]="120"></mona-grid-column>
            <mona-grid-column field="active" title="Active" type="boolean" [editable]="true" [width]="120">
            </mona-grid-column>
            <mona-grid-command-column [width]="80"></mona-grid-command-column>
        </mona-grid>
        <button class="after-grid">After</button>
    `
})
class GridKeyboardHostComponent {
    public readonly editableOptions = signal<EditableOptions>({ enabled: true, mode: "cell" });
    public readonly rows = signal([
        { active: true, name: "Jane" },
        { active: false, name: "John" }
    ]);
    public readonly showToolbar = signal(true);
}

function dispatchKeydown(element: HTMLElement, key: string, shiftKey = false): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, shiftKey });
    element.dispatchEvent(event);
    return event;
}

function getRequiredElement(root: ParentNode, selector: string): HTMLElement {
    const element = root.querySelector(selector);
    if (!(element instanceof HTMLElement)) {
        throw new Error(`Expected element for selector: ${selector}`);
    }
    return element;
}

function getRequiredTableCell(root: ParentNode, selector: string): HTMLTableCellElement {
    const element = root.querySelector(selector);
    if (!(element instanceof HTMLTableCellElement)) {
        throw new Error(`Expected table cell for selector: ${selector}`);
    }
    return element;
}

function getRequiredButton(root: ParentNode, selector: string): HTMLButtonElement {
    const element = root.querySelector(selector);
    if (!(element instanceof HTMLButtonElement)) {
        throw new Error(`Expected button for selector: ${selector}`);
    }
    return element;
}

async function settleFixture(fixture: ComponentFixture<GridKeyboardHostComponent>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenRenderingDone();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

describe("GridComponent keyboard navigation", () => {
    let fixture: ComponentFixture<GridKeyboardHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridKeyboardHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(GridKeyboardHostComponent);
        await settleFixture(fixture);
    });

    it("keeps only the active toolbar control in the page Tab order", () => {
        const root = fixture.nativeElement as ParentNode;
        const primary = getRequiredButton(root, ".toolbar-primary");
        const secondary = getRequiredButton(root, ".toolbar-secondary");

        expect(primary.getAttribute("tabindex")).toBe("0");
        expect(secondary.getAttribute("tabindex")).toBe("-1");

        dispatchKeydown(primary, "ArrowRight");
        fixture.detectChanges();

        expect(primary.getAttribute("tabindex")).toBe("-1");
        expect(secondary.getAttribute("tabindex")).toBe("0");
        expect(document.activeElement).toBe(secondary);
    });

    it("makes the first header cell the table Tab stop when there is no remembered cell", async () => {
        fixture.componentInstance.showToolbar.set(false);
        await settleFixture(fixture);

        const root = fixture.nativeElement as ParentNode;
        const firstHeader = getRequiredTableCell(root, "thead tr:first-child th[role='columnheader']");

        expect(firstHeader.getAttribute("tabindex")).toBe("0");
    });

    it("moves page Tab focus from a header cell to the pager", async () => {
        fixture.componentInstance.showToolbar.set(false);
        await settleFixture(fixture);

        const root = fixture.nativeElement as ParentNode;
        const firstHeader = getRequiredTableCell(root, "thead tr:first-child th[role='columnheader']");
        const pager = getRequiredElement(root, "mona-pager");

        firstHeader.focus();
        const event = dispatchKeydown(firstHeader, "Tab");
        fixture.detectChanges();

        expect(event.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(pager);
    });

    it("keeps the last navigated body cell as the roving Tab stop", () => {
        const root = fixture.nativeElement as ParentNode;
        const firstHeader = getRequiredTableCell(root, "thead tr:first-child th[role='columnheader']");
        const firstBodyCell = getRequiredTableCell(root, "tbody tr[role='row'] td[monaGridLogicalCell]");

        firstHeader.focus();
        dispatchKeydown(firstHeader, "ArrowDown");
        fixture.detectChanges();

        expect(firstHeader.getAttribute("tabindex")).toBe("-1");
        expect(firstBodyCell.getAttribute("tabindex")).toBe("0");
        expect(document.activeElement).toBe(firstBodyCell);
    });

    it("removes built-in command buttons from the natural Tab order", () => {
        const root = fixture.nativeElement as ParentNode;
        const editButton = getRequiredButton(root, 'tbody button[aria-label="Edit row"]');
        const removeButton = getRequiredButton(root, 'tbody button[aria-label="Remove row"]');

        expect(editButton.getAttribute("tabindex")).toBe("-1");
        expect(removeButton.getAttribute("tabindex")).toBe("-1");
    });

    it("enters command-cell inner navigation with Enter", () => {
        const root = fixture.nativeElement as ParentNode;
        const commandCell = getRequiredTableCell(root, "tbody tr[role='row'] td[monaGridLogicalCell]:last-child");
        const editButton = getRequiredButton(commandCell, 'button[aria-label="Edit row"]');

        commandCell.focus();
        dispatchKeydown(commandCell, "Enter");
        fixture.detectChanges();

        expect(document.activeElement).toBe(editButton);
    });

    it("keeps editor inputs out of the natural Tab order after entering cell edit mode", async () => {
        const root = fixture.nativeElement as ParentNode;
        const firstBodyCell = getRequiredTableCell(root, "tbody tr[role='row'] td[monaGridLogicalCell]");

        firstBodyCell.focus();
        dispatchKeydown(firstBodyCell, "Enter");
        await settleFixture(fixture);

        const editorInput = getRequiredElement(firstBodyCell, "input");
        expect(editorInput.getAttribute("tabindex")).toBe("-1");
    });
});
