import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { type SchemaPathTree, validate } from "@angular/forms/signals";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridCommandColumnComponent } from "../components/grid-command-column/grid-command-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridEditTemplateDirective } from "../directives/grid-edit-template.directive";
import { GridEditableDirective } from "../directives/grid-editable.directive";
import { GridSortableDirective } from "../directives/grid-sortable.directive";
import { GridToolbarTemplateDirective } from "../directives/grid-toolbar-template.directive";
import { GridVirtualScrollDirective } from "../directives/grid-virtual-scroll.directive";
import { EditableOptions } from "../models/EditableOptions";
import { GridSaveEvent } from "../models/GridSaveEvent";

interface GridKeyboardRow {
    active: boolean;
    amount: number | string;
    id: number;
    name: string;
}

@Component({
    imports: [
        ButtonDirective,
        GridCommandColumnComponent,
        GridColumnComponent,
        GridComponent,
        GridEditableDirective,
        GridEditTemplateDirective,
        GridSortableDirective,
        GridToolbarTemplateDirective
    ],
    template: `
        <button class="before-grid">Before</button>
        <mona-grid
            [data]="rows()"
            [monaGridEditable]="editableOptions()"
            [rowKey]="rowKey()"
            [pageSize]="10"
            [pageSizeValues]="[]"
            [resizeMethod]="120"
            [responsivePager]="false"
            (save)="onSave($event)"
            [monaGridSortable]="{ enabled: false }">
            @if (showToolbar()) {
                <ng-template monaGridToolbarTemplate>
                    <button monaButton class="toolbar-primary">Toolbar primary</button>
                    <button monaButton class="toolbar-secondary">Toolbar secondary</button>
                </ng-template>
            }
            <mona-grid-column field="name" title="Name" [editable]="true" [width]="120">
                @if (customEditTemplate()) {
                    <ng-template monaGridEditTemplate let-context>
                        <button class="custom-name-editor" (click)="context.setValue('Template Jane')">
                            {{ context.column }}:{{ context.value }}:{{ context.session.mode }}
                        </button>
                    </ng-template>
                }
            </mona-grid-column>
            <mona-grid-column field="active" title="Active" type="boolean" [editable]="true" [width]="120">
            </mona-grid-column>
            <mona-grid-column field="amount" title="Amount" type="number" [editable]="true" [width]="120">
            </mona-grid-column>
            <mona-grid-column field="id" title="Id" type="number" [editable]="false" [width]="80"> </mona-grid-column>
            <mona-grid-command-column [width]="80"></mona-grid-command-column>
        </mona-grid>
        <button class="after-grid">After</button>
    `
})
class GridKeyboardHostComponent {
    public readonly editableOptions = signal<EditableOptions>({ enabled: true, mode: "cell" });
    public readonly customEditTemplate = signal(false);
    public readonly rowKey = signal<string | null>("id");
    public readonly rows = signal<GridKeyboardRow[]>([
        { active: true, amount: 42, id: 1, name: "Jane" },
        { active: false, amount: "1,234", id: 2, name: "John" }
    ]);
    public readonly showToolbar = signal(true);

    public onSave(event: GridSaveEvent): void {
        const originalRowData = event.originalRowData;
        if (event.operation !== "update" || originalRowData == null) {
            return;
        }
        this.rows.update(rows =>
            rows.map(row =>
                Object.is(row, originalRowData)
                    ? {
                          active: event.rowData["active"] === true,
                          amount: this.toGridAmount(event.rowData["amount"]),
                          id: this.toGridId(event.rowData["id"]),
                          name: String(event.rowData["name"] ?? "")
                      }
                    : row
            )
        );
    }

    private toGridAmount(value: unknown): number | string {
        return typeof value === "number" || typeof value === "string" ? value : "";
    }

    private toGridId(value: unknown): number {
        return typeof value === "number" ? value : 0;
    }
}

@Component({
    imports: [GridColumnComponent, GridComponent, GridEditableDirective, GridVirtualScrollDirective],
    template: `
        <mona-grid
            [data]="rows()"
            [monaGridEditable]="{ enabled: true, mode: 'cell' }"
            [rowKey]="'id'"
            [monaGridVirtualScroll]="{ height: 32 }"
            [resizeMethod]="120">
            <mona-grid-column field="name" title="Name" [editable]="true" [width]="120"></mona-grid-column>
            <mona-grid-column field="id" title="Id" type="number" [editable]="false" [width]="80"> </mona-grid-column>
            <mona-grid-column field="amount" title="Amount" type="number" [editable]="true" [width]="120">
            </mona-grid-column>
        </mona-grid>
    `
})
class GridVirtualKeyboardHostComponent {
    public readonly rows = signal<GridKeyboardRow[]>([
        { active: true, amount: 42, id: 1, name: "Jane" },
        { active: false, amount: 7, id: 2, name: "John" }
    ]);
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

function getRequiredInput(root: ParentNode, selector: string): HTMLInputElement {
    const element = root.querySelector(selector);
    if (!(element instanceof HTMLInputElement)) {
        throw new Error(`Expected input for selector: ${selector}`);
    }
    return element;
}

function getRequiredDataCell(root: ParentNode, field: string, rowIndex = 0): HTMLTableCellElement {
    const cellContent = root.querySelectorAll<HTMLElement>(`[data-field="${field}"]`)[rowIndex];
    if (!(cellContent instanceof HTMLElement)) {
        throw new Error(`Expected grid cell content for field: ${field}`);
    }
    const tableCell = cellContent.closest("td");
    if (!(tableCell instanceof HTMLTableCellElement)) {
        throw new Error(`Expected table cell for field: ${field}`);
    }
    return tableCell;
}

function dispatchEditorKeydown(cell: ParentNode, key: string, shiftKey = false): KeyboardEvent {
    const editor = getRequiredElement(cell, "mona-grid-editor");
    const inner = editor.querySelector("input, button");
    return dispatchKeydown(inner instanceof HTMLElement ? inner : editor, key, shiftKey);
}

async function settleFixture(fixture: ComponentFixture<unknown>): Promise<void> {
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
            imports: [GridKeyboardHostComponent, GridVirtualKeyboardHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(GridKeyboardHostComponent);
        await settleFixture(fixture);
    });

    it("supplies editable metadata in the virtual grid template", async () => {
        const virtualFixture = TestBed.createComponent(GridVirtualKeyboardHostComponent);
        await settleFixture(virtualFixture);

        const root = virtualFixture.nativeElement as ParentNode;
        const nameCell = getRequiredDataCell(root, "name");
        nameCell.focus();
        dispatchKeydown(nameCell, "Enter");
        await settleFixture(virtualFixture);
        expect(nameCell.querySelector("mona-grid-editor")).not.toBeNull();

        dispatchEditorKeydown(nameCell, "Tab");
        await settleFixture(virtualFixture);

        expect(getRequiredDataCell(root, "name").querySelector("mona-grid-editor")).toBeNull();
        expect(getRequiredDataCell(root, "id").querySelector("mona-grid-editor")).toBeNull();
        expect(getRequiredDataCell(root, "amount").querySelector("mona-grid-editor")).not.toBeNull();
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

    it("hides the built-in row edit command in cell edit mode", () => {
        const root = fixture.nativeElement as ParentNode;

        expect(root.querySelector('tbody button[aria-label="Edit row"]')).toBeNull();
        expect(getRequiredButton(root, 'tbody button[aria-label="Remove row"]').getAttribute("tabindex")).toBe("-1");
    });

    it("removes built-in command buttons from the natural Tab order in row edit mode", async () => {
        fixture.componentInstance.editableOptions.set({ enabled: true, mode: "row" });
        await settleFixture(fixture);

        const root = fixture.nativeElement as ParentNode;
        const editButton = getRequiredButton(root, 'tbody button[aria-label="Edit row"]');
        const removeButton = getRequiredButton(root, 'tbody button[aria-label="Remove row"]');

        expect(editButton.getAttribute("tabindex")).toBe("-1");
        expect(removeButton.getAttribute("tabindex")).toBe("-1");
    });

    it("enters command-cell inner navigation with Enter in row edit mode", async () => {
        fixture.componentInstance.editableOptions.set({ enabled: true, mode: "row" });
        await settleFixture(fixture);

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

    it("does not enter edit mode on double-click when configured for row edit mode", async () => {
        fixture.componentInstance.editableOptions.set({ enabled: true, mode: "row" });
        await settleFixture(fixture);

        const root = fixture.nativeElement as ParentNode;
        const nameCell = getRequiredDataCell(root, "name");
        const cellText = getRequiredElement(nameCell, "span");

        cellText.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
        await settleFixture(fixture);

        expect(nameCell.querySelector("mona-grid-editor")).toBeNull();
        expect(getRequiredDataCell(root, "active").querySelector("mona-grid-editor")).toBeNull();
    });

    it("loads numeric cell values into the default numeric editor", async () => {
        const root = fixture.nativeElement as ParentNode;
        const amountCell = getRequiredDataCell(root, "amount");

        amountCell.focus();
        dispatchKeydown(amountCell, "Enter");
        await settleFixture(fixture);

        const numericInput = getRequiredInput(amountCell, "mona-numeric-text-box input");
        expect(numericInput.value).toBe("42");
    });

    it("coerces numeric string cell values before rendering the default numeric editor", async () => {
        const root = fixture.nativeElement as ParentNode;
        const amountCell = getRequiredDataCell(root, "amount", 1);

        amountCell.focus();
        dispatchKeydown(amountCell, "Enter");
        await settleFixture(fixture);

        const numericInput = getRequiredInput(amountCell, "mona-numeric-text-box input");
        expect(numericInput.value).toBe("1234");
    });

    it("passes signal-form edit context to custom edit templates", async () => {
        fixture.componentInstance.customEditTemplate.set(true);
        await settleFixture(fixture);
        const root = fixture.nativeElement as ParentNode;
        const nameCell = getRequiredDataCell(root, "name");

        nameCell.focus();
        dispatchKeydown(nameCell, "Enter");
        await settleFixture(fixture);

        const customEditor = getRequiredButton(nameCell, ".custom-name-editor");
        expect(customEditor.textContent?.trim()).toBe("name:Jane:cell");

        customEditor.click();
        await settleFixture(fixture);

        expect(getRequiredButton(nameCell, ".custom-name-editor").textContent?.trim()).toBe("name:Template Jane:cell");
    });

    it("keeps boolean cells in edit mode after checkbox changes until the checkbox blurs", async () => {
        const root = fixture.nativeElement as ParentNode;
        const activeCell = getRequiredDataCell(root, "active");

        activeCell.focus();
        dispatchKeydown(activeCell, "Enter");
        await settleFixture(fixture);

        const checkbox = getRequiredInput(activeCell, 'input[type="checkbox"]');
        const checkboxEditor = getRequiredElement(activeCell, "mona-check-box");
        expect(checkbox.checked).toBe(true);

        checkboxEditor.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
        checkbox.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: null }));
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        await settleFixture(fixture);

        expect(activeCell.querySelector("mona-grid-editor")).not.toBeNull();
        expect(getRequiredInput(activeCell, 'input[type="checkbox"]').checked).toBe(false);

        await new Promise<void>(resolve => setTimeout(resolve));
        getRequiredInput(activeCell, 'input[type="checkbox"]').dispatchEvent(
            new FocusEvent("focusout", { bubbles: true, relatedTarget: null })
        );
        await settleFixture(fixture);

        expect(activeCell.querySelector("mona-grid-editor")).toBeNull();
        expect(activeCell.textContent?.trim()).toBe("false");
    });

    describe("Tab navigation during cell editing", () => {
        async function startCellEdit(field: string, rowIndex = 0): Promise<HTMLTableCellElement> {
            const cell = getRequiredDataCell(fixture.nativeElement as ParentNode, field, rowIndex);
            cell.focus();
            dispatchKeydown(cell, "Enter");
            await settleFixture(fixture);
            return getRequiredDataCell(fixture.nativeElement as ParentNode, field, rowIndex);
        }

        function isEditing(field: string, rowIndex = 0): boolean {
            const cell = getRequiredDataCell(fixture.nativeElement as ParentNode, field, rowIndex);
            return cell.querySelector("mona-grid-editor") != null;
        }

        it("leaves the grid when Tab is pressed outside edit mode", () => {
            const root = fixture.nativeElement as ParentNode;
            const nameCell = getRequiredDataCell(root, "name");
            const pager = getRequiredElement(root, "mona-pager");

            nameCell.focus();
            const event = dispatchKeydown(nameCell, "Tab");
            fixture.detectChanges();

            expect(event.defaultPrevented).toBe(true);
            expect(document.activeElement).toBe(pager);
            expect(nameCell.querySelector("mona-grid-editor")).toBeNull();
        });

        it("starts cell editing with Enter", async () => {
            const nameCell = await startCellEdit("name");

            expect(nameCell.querySelector("mona-grid-editor")).not.toBeNull();
            expect(document.activeElement).toBe(getRequiredInput(nameCell, "mona-text-box input"));
        });

        it("commits the current cell and edits the next editable cell on Tab", async () => {
            const nameCell = await startCellEdit("name");
            const input = getRequiredInput(nameCell, "mona-text-box input");
            input.value = "Janet";
            input.dispatchEvent(new Event("input", { bubbles: true }));
            await settleFixture(fixture);

            const event = dispatchEditorKeydown(nameCell, "Tab");
            await settleFixture(fixture);

            expect(event.defaultPrevented).toBe(true);
            expect(isEditing("name")).toBe(false);
            expect(getRequiredDataCell(fixture.nativeElement as ParentNode, "name").textContent?.trim()).toBe("Janet");
            expect(isEditing("active")).toBe(true);
        });

        it("commits the current cell and edits the previous editable cell on Shift+Tab", async () => {
            const amountCell = await startCellEdit("amount");

            dispatchEditorKeydown(amountCell, "Tab", true);
            await settleFixture(fixture);

            expect(isEditing("amount")).toBe(false);
            expect(isEditing("active")).toBe(true);
        });

        it("focuses the destination editor input after Tab", async () => {
            const amountCell = await startCellEdit("amount");

            dispatchEditorKeydown(amountCell, "Tab");
            await settleFixture(fixture);

            const destination = getRequiredDataCell(fixture.nativeElement as ParentNode, "name", 1);
            expect(document.activeElement).toBe(getRequiredInput(destination, "mona-text-box input"));
        });

        it("focuses the destination editor input after Tab from a double-click edit", async () => {
            const root = fixture.nativeElement as ParentNode;
            const amountCell = getRequiredDataCell(root, "amount", 1);
            getRequiredElement(amountCell, "span").dispatchEvent(
                new MouseEvent("dblclick", { bubbles: true, cancelable: true })
            );
            await settleFixture(fixture);
            expect(amountCell.querySelector("mona-grid-editor")).not.toBeNull();

            dispatchEditorKeydown(amountCell, "Tab", true);
            await settleFixture(fixture);

            const destination = getRequiredDataCell(fixture.nativeElement as ParentNode, "active", 1);
            expect(destination.querySelector("mona-grid-editor")).not.toBeNull();
            expect(destination.contains(document.activeElement)).toBe(true);
        });

        it("skips non-editable columns and crosses into the next row on Tab", async () => {
            const amountCell = await startCellEdit("amount");

            dispatchEditorKeydown(amountCell, "Tab");
            await settleFixture(fixture);

            expect(isEditing("id")).toBe(false);
            expect(isEditing("id", 1)).toBe(false);
            expect(isEditing("amount")).toBe(false);
            expect(isEditing("name", 1)).toBe(true);
        });

        it("crosses into the previous row on Shift+Tab", async () => {
            const nameCell = await startCellEdit("name", 1);

            dispatchEditorKeydown(nameCell, "Tab", true);
            await settleFixture(fixture);

            expect(isEditing("name", 1)).toBe(false);
            expect(isEditing("amount")).toBe(true);
        });

        it("leaves the grid on Tab from the last editable cell", async () => {
            const amountCell = await startCellEdit("amount", 1);

            dispatchEditorKeydown(amountCell, "Tab");
            await settleFixture(fixture);

            const root = fixture.nativeElement as ParentNode;
            expect(root.querySelector("mona-grid-editor")).toBeNull();
            expect(getRequiredElement(root, "table").contains(document.activeElement)).toBe(false);
        });

        it("leaves the grid backward on Shift+Tab from the first editable cell", async () => {
            const nameCell = await startCellEdit("name");

            dispatchEditorKeydown(nameCell, "Tab", true);
            await settleFixture(fixture);

            const root = fixture.nativeElement as ParentNode;
            expect(root.querySelector("mona-grid-editor")).toBeNull();
            expect(getRequiredElement(root, "table").contains(document.activeElement)).toBe(false);
        });

        it("keeps the invalid cell in edit mode instead of navigating", async () => {
            fixture.componentInstance.editableOptions.set({
                enabled: true,
                mode: "cell",
                schema: () => row => {
                    validate(row, ({ value }) => {
                        const name = value()["name"];
                        return typeof name === "string" && name.trim() !== ""
                            ? undefined
                            : { kind: "required", message: "Name is required." };
                    });
                }
            });
            await settleFixture(fixture);

            const nameCell = await startCellEdit("name");
            const input = getRequiredInput(nameCell, "mona-text-box input");
            input.value = "";
            input.dispatchEvent(new Event("input", { bubbles: true }));
            await settleFixture(fixture);

            dispatchEditorKeydown(nameCell, "Tab");
            await settleFixture(fixture);

            expect(isEditing("name")).toBe(true);
            expect(isEditing("active")).toBe(false);
        });

        it("does not trap the edit in a valid cell when a sibling field is invalid", async () => {
            fixture.componentInstance.rows.update(rows =>
                rows.map((row, index) => (index === 0 ? { ...row, name: "" } : row))
            );
            fixture.componentInstance.editableOptions.set({
                enabled: true,
                mode: "cell",
                schema: () => row => {
                    validate(row["name"] as SchemaPathTree<unknown>, ({ value }) => {
                        const name = value();
                        return typeof name === "string" && name.trim() !== ""
                            ? undefined
                            : { kind: "required", message: "Name is required." };
                    });
                }
            });
            await settleFixture(fixture);

            const amountCell = await startCellEdit("amount");
            dispatchEditorKeydown(amountCell, "Tab");
            await settleFixture(fixture);

            expect(isEditing("amount")).toBe(false);
            expect(isEditing("name", 1)).toBe(true);
        });

        it("still cancels the edit with Escape", async () => {
            const nameCell = await startCellEdit("name");
            const input = getRequiredInput(nameCell, "mona-text-box input");
            input.value = "Discarded";
            input.dispatchEvent(new Event("input", { bubbles: true }));
            await settleFixture(fixture);

            dispatchEditorKeydown(nameCell, "Escape");
            await settleFixture(fixture);

            const updatedCell = getRequiredDataCell(fixture.nativeElement as ParentNode, "name");
            expect(updatedCell.querySelector("mona-grid-editor")).toBeNull();
            expect(updatedCell.textContent?.trim()).toBe("Jane");
            expect(document.activeElement).toBe(updatedCell);
        });

        it("still commits the edit with Enter and returns focus to the logical cell", async () => {
            const nameCell = await startCellEdit("name");
            const input = getRequiredInput(nameCell, "mona-text-box input");
            input.value = "Janet";
            input.dispatchEvent(new Event("input", { bubbles: true }));
            await settleFixture(fixture);

            dispatchEditorKeydown(nameCell, "Enter");
            await settleFixture(fixture);

            const updatedCell = getRequiredDataCell(fixture.nativeElement as ParentNode, "name");
            expect(updatedCell.querySelector("mona-grid-editor")).toBeNull();
            expect(updatedCell.textContent?.trim()).toBe("Janet");
            expect(document.activeElement).toBe(updatedCell);
            expect(isEditing("active")).toBe(false);
        });

        it("applies the same Tab behavior to custom edit templates", async () => {
            fixture.componentInstance.customEditTemplate.set(true);
            await settleFixture(fixture);

            const nameCell = await startCellEdit("name");
            const customEditor = getRequiredButton(nameCell, ".custom-name-editor");
            expect(document.activeElement).toBe(customEditor);

            const event = dispatchKeydown(customEditor, "Tab");
            await settleFixture(fixture);

            expect(event.defaultPrevented).toBe(true);
            expect(isEditing("name")).toBe(false);
            expect(isEditing("active")).toBe(true);
        });

        it("focuses a custom edit template reached by Shift+Tab", async () => {
            fixture.componentInstance.customEditTemplate.set(true);
            await settleFixture(fixture);

            const activeCell = await startCellEdit("active");
            dispatchEditorKeydown(activeCell, "Tab", true);
            await settleFixture(fixture);

            const nameCell = getRequiredDataCell(fixture.nativeElement as ParentNode, "name");
            expect(document.activeElement).toBe(getRequiredButton(nameCell, ".custom-name-editor"));
        });

        it("does not move between cells on Tab in row edit mode", async () => {
            fixture.componentInstance.editableOptions.set({ enabled: true, mode: "row" });
            await settleFixture(fixture);

            const root = fixture.nativeElement as ParentNode;
            const commandCell = getRequiredTableCell(root, "tbody tr[role='row'] td[monaGridLogicalCell]:last-child");
            const editButton = getRequiredButton(commandCell, 'button[aria-label="Edit row"]');
            editButton.click();
            await settleFixture(fixture);

            const nameCell = getRequiredDataCell(root, "name");
            const event = dispatchEditorKeydown(nameCell, "Tab");
            await settleFixture(fixture);

            expect(event.defaultPrevented).toBe(false);
            expect(isEditing("name")).toBe(true);
            expect(isEditing("amount")).toBe(true);
            expect(isEditing("name", 1)).toBe(false);
        });
    });

    it("keeps focus on the same keyed cell after edit save replaces the row object", async () => {
        const root = fixture.nativeElement as ParentNode;
        const activeCell = getRequiredDataCell(root, "active");
        const initialCellUid = getRequiredElement(activeCell, '[data-field="active"]').dataset["uid"];

        activeCell.focus();
        dispatchKeydown(activeCell, "Enter");
        await settleFixture(fixture);

        const checkbox = getRequiredInput(activeCell, 'input[type="checkbox"]');
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        checkbox.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: null }));
        await settleFixture(fixture);

        const updatedActiveCell = getRequiredDataCell(root, "active");
        const updatedCellUid = getRequiredElement(updatedActiveCell, '[data-field="active"]').dataset["uid"];

        expect(updatedCellUid).toBe(initialCellUid);
        expect(document.activeElement).toBe(updatedActiveCell);
        expect(updatedActiveCell.textContent?.trim()).toBe("false");
    });
});
