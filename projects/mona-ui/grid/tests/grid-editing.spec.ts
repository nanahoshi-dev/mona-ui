import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, signal, viewChild } from "@angular/core";
import { type ComponentFixture, DeferBlockState, TestBed } from "@angular/core/testing";
import { type SchemaPathTree, validate } from "@angular/forms/signals";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridCommandColumnComponent } from "../components/grid-command-column/grid-command-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridEditableDirective } from "../directives/grid-editable.directive";
import type { CellEditEvent } from "../models/CellEditEvent";
import type { EditableOptions } from "../models/EditableOptions";
import type { GridCancelEvent } from "../models/GridCancelEvent";
import type { GridRemoveEvent } from "../models/GridRemoveEvent";
import type { GridSaveEvent } from "../models/GridSaveEvent";
import { GridService } from "../services/grid.service";

interface EditRow {
    amount?: number | string | null;
    id: number;
    name: string;
    shipped?: Date | null;
}

@Component({
    imports: [GridColumnComponent, GridCommandColumnComponent, GridComponent, GridEditableDirective],
    template: `
        <mona-grid
            ariaLabel="Orders"
            [data]="rows()"
            [rowKey]="'id'"
            [pageSize]="50"
            [pageSizeValues]="[]"
            [resizeMethod]="120"
            [responsivePager]="false"
            [monaGridEditable]="editable()"
            (cancel)="cancels.push($event)"
            (cellEdit)="cellEdits.push($event)"
            (remove)="removes.push($event)"
            (save)="onSave($event)">
            <mona-grid-column field="id" title="Id" type="number" [width]="80"></mona-grid-column>
            <mona-grid-column field="name" title="Name" [width]="120"></mona-grid-column>
            <mona-grid-column field="amount" title="Amount" type="number" [width]="100"></mona-grid-column>
            <mona-grid-column field="shipped" title="Shipped" type="date" [width]="140"></mona-grid-column>
            <mona-grid-command-column [width]="100"></mona-grid-command-column>
        </mona-grid>
    `
})
class HostComponent {
    public readonly cancels: GridCancelEvent[] = [];
    public readonly cellEdits: CellEditEvent[] = [];
    public readonly editable = signal<EditableOptions>({ mode: "cell" });
    public readonly editableDirective = viewChild.required(GridEditableDirective);
    public readonly removes: GridRemoveEvent[] = [];
    public readonly rows = signal<EditRow[]>([
        { amount: 10, id: 1, name: "Jane", shipped: new Date(2024, 0, 3, 14, 30) },
        { id: 2, name: "John" },
        { amount: 30, id: 3, name: "Mary" }
    ]);
    public readonly saves: GridSaveEvent[] = [];
    public preventSave = false;

    public onSave(event: GridSaveEvent): void {
        this.saves.push(event);
        if (this.preventSave) {
            event.preventDefault();
        }
    }
}

function press(element: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    element.dispatchEvent(event);
    return event;
}

describe("grid editing (batch 7)", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let root: HTMLElement;
    let service: GridService;
    let announce: ReturnType<typeof vi.fn>;

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

    function cell(field: string, rowIndex = 0): HTMLTableCellElement {
        const content = root.querySelectorAll(`tbody [data-field="${field}"]`)[rowIndex];
        const td = content?.closest("td");
        if (td == null) {
            throw new Error(`No cell ${field}[${rowIndex}]`);
        }
        return td;
    }

    function commandCell(rowIndex = 0): HTMLTableCellElement {
        const td = root.querySelectorAll<HTMLTableCellElement>("tbody tr[role='row']")[rowIndex]?.lastElementChild;
        if (!(td instanceof HTMLTableCellElement)) {
            throw new Error(`No command cell in row ${rowIndex}`);
        }
        return td;
    }

    function editorInput(td: Element): HTMLInputElement {
        const input = td.querySelector("mona-grid-editor input");
        if (!(input instanceof HTMLInputElement)) {
            throw new Error("No editor input");
        }
        return input;
    }

    function type(input: HTMLInputElement, value: string): void {
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
    }

    function button(label: string): HTMLButtonElement {
        const element = root.querySelector(`button[aria-label="${label}"]`);
        if (!(element instanceof HTMLButtonElement)) {
            throw new Error(`No button ${label}`);
        }
        return element;
    }

    async function startCellEdit(field: string, rowIndex = 0): Promise<HTMLTableCellElement> {
        const td = cell(field, rowIndex);
        td.focus();
        press(td, "Enter");
        await settle();
        return td;
    }

    beforeEach(async () => {
        announce = vi.fn().mockResolvedValue(undefined);
        await TestBed.configureTestingModule({
            imports: [HostComponent],
            providers: [{ provide: LiveAnnouncer, useValue: { announce } }]
        }).compileComponents();
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle();
        service = fixture.debugElement.children[0].injector.get(GridService);
    });

    afterEach(() => root.remove());

    describe("GE1: rows without a value", () => {
        it("adds a row with the default factory, and saves only what was typed", async () => {
            expect(() => service.startAddRow()).not.toThrow();
            await settle();

            const addRow = root.querySelector("tr[data-grid-add-row]") as HTMLTableRowElement;
            expect(addRow.querySelectorAll("mona-grid-editor").length).toBe(3);
            const nameInput = editorInput(addRow.querySelectorAll("td")[1]);
            type(nameInput, "Ann");
            await settle();
            press(nameInput, "Enter");
            await settle();

            expect(host.saves.length).toBe(1);
            expect(host.saves[0].operation).toBe("create");
            expect(host.saves[0].rowData).toEqual({ name: "Ann" });
            expect(service.addRowVisible()).toBe(false);
        });

        it("edits a row that lacks a column's value without marking it modified", async () => {
            const td = await startCellEdit("amount", 1);
            expect(td.querySelector("mona-grid-editor input")).not.toBeNull();
            expect(td.querySelector("[title='Modified']")).toBeNull();
        });
    });

    describe("GE2: data replaced during an edit", () => {
        it("keeps the edit on the new data for the same key", async () => {
            host.editable.set({ mode: "row" });
            await settle();
            button("Edit row 1").click();
            await settle();
            type(editorInput(cell("name")), "Janet");
            await settle();

            const fresh = host.rows().map(row => ({ ...row }));
            host.rows.set(fresh);
            await settle();

            expect(service.isInEditMode()).toBe(true);
            expect(editorInput(cell("name")).value).toBe("Janet");
            press(editorInput(cell("name")), "Enter");
            await settle();
            expect(host.saves[0].originalRowData).toBe(fresh[0]);
            expect(host.saves[0].rowData["name"]).toBe("Janet");
        });

        it("ends the edit with reason removed when the row leaves the data", async () => {
            await startCellEdit("name", 1);
            host.rows.update(rows => rows.filter(row => row.id !== 2));
            await settle();

            expect(service.isInEditMode()).toBe(false);
            expect(host.cancels.map(event => event.reason)).toEqual(["removed"]);
        });
    });

    describe("GE3: lifecycle", () => {
        it("cancels with reason switch when the add row opens during an edit", async () => {
            await startCellEdit("name");
            service.startAddRow();
            await settle();
            expect(host.cancels.map(event => event.reason)).toEqual(["switch"]);
            expect(service.addRowVisible()).toBe(true);
        });

        it("keeps editing when an Escape cancel is prevented, without saving", async () => {
            const td = await startCellEdit("name");
            const input = editorInput(td);
            type(input, "Changed");
            await settle();
            const subscription = service.cancel$.subscribe(event => event.preventDefault());
            input.focus();
            press(input, "Escape");
            await settle();
            subscription.unsubscribe();

            expect(service.isInEditMode()).toBe(true);
            expect(document.activeElement).toBe(input);
            expect(host.saves.length).toBe(0);
        });

        it("doesn't report a cell commit that changed nothing", async () => {
            const td = await startCellEdit("name");
            press(editorInput(td), "Enter");
            await settle();

            expect(service.isInEditMode()).toBe(false);
            expect(host.cellEdits.length).toBe(0);
            expect(host.saves.length).toBe(0);
        });

        it("closes an edit whose save was prevented with endEdit()", async () => {
            host.preventSave = true;
            const td = await startCellEdit("name");
            type(editorInput(td), "Saved later");
            await settle();
            press(editorInput(td), "Enter");
            await settle();
            expect(service.isInEditMode()).toBe(true);

            host.editableDirective().endEdit();
            await settle();
            expect(service.isInEditMode()).toBe(false);
        });

        it("reports the row's key and index on remove", async () => {
            button("Remove row 2").click();
            await settle();
            expect(host.removes[0].key).toBe(2);
            expect(host.removes[0].index).toBe(1);
        });

        it("leaves the rowKey column read-only by default", async () => {
            const td = await startCellEdit("id");
            expect(td.querySelector("mona-grid-editor")).toBeNull();
            expect(td.getAttribute("aria-readonly")).toBe("true");
            expect(cell("name").getAttribute("aria-readonly")).toBe("false");
        });
    });

    describe("GE4: numbers", () => {
        it("reads number text in the grid's locale", async () => {
            TestBed.inject(MonaI18nService).use({ ...MONA_DEFAULT_LOCALE, id: "de-DE" });
            host.rows.update(rows => rows.map(row => (row.id === 3 ? { ...row, amount: "1.234,5" } : row)));
            await settle();
            await startCellEdit("amount", 2);
            expect(service.editSession()?.model()["amount"]).toBe(1234.5);
            TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        });
    });

    describe("GE5: IME composition", () => {
        it("ignores Enter and Escape while an IME composes", async () => {
            const td = await startCellEdit("name");
            const input = editorInput(td);
            type(input, "かな");
            await settle();
            press(input, "Enter", { isComposing: true });
            press(input, "Escape", { keyCode: 229 } as KeyboardEventInit);
            await settle();

            expect(service.isInEditMode()).toBe(true);
            expect(host.cancels.length).toBe(0);
            expect(host.saves.length).toBe(0);
        });
    });

    describe("GE6: row edit mode from the keyboard", () => {
        beforeEach(async () => {
            host.editable.set({ mode: "row" });
            await settle();
        });

        it("starts the row edit from a cell with Enter and focuses that cell's editor", async () => {
            const td = await startCellEdit("amount");
            expect(service.editContext()?.mode).toBe("row");
            expect(document.activeElement).toBe(editorInput(td));
        });

        it("saves the row with Enter and puts focus back on the cell", async () => {
            const td = await startCellEdit("name");
            type(editorInput(td), "Janet");
            await settle();
            press(editorInput(td), "Enter");
            await settle();

            expect(host.saves.length).toBe(1);
            expect(service.isInEditMode()).toBe(false);
            expect(document.activeElement).toBe(td);
        });

        it("cancels the row with Escape", async () => {
            const td = await startCellEdit("name");
            press(editorInput(td), "Escape");
            await settle();

            expect(host.cancels.map(event => event.reason)).toEqual(["escape"]);
            expect(service.isInEditMode()).toBe(false);
            expect(document.activeElement).toBe(td);
        });

        it("moves back with Shift+Tab between the row's editors", async () => {
            const td = await startCellEdit("amount");
            press(editorInput(td), "Tab", { shiftKey: true });
            expect(document.activeElement).toBe(editorInput(cell("name")));
        });
    });

    describe("GE7: focus after the commands", () => {
        it("focuses the command cell after Save", async () => {
            host.editable.set({ mode: "row" });
            await settle();
            button("Edit row 1").click();
            await settle();
            const save = button("Save row 1");
            save.focus();
            save.click();
            await settle();

            expect(document.activeElement).toBe(commandCell(0));
        });

        it("moves focus to a remaining cell when the removed row leaves", async () => {
            const subscription = service.remove$.subscribe(event =>
                host.rows.update(rows => rows.filter(row => row.id !== event.key))
            );
            const remove = button("Remove row 1");
            remove.focus();
            remove.click();
            await settle();
            subscription.unsubscribe();

            expect(root.querySelector("[role='grid']")?.contains(document.activeElement)).toBe(true);
        });
    });

    describe("GE8: dates", () => {
        it("keeps the time of day when a new day is picked", async () => {
            await startCellEdit("shipped");
            const field = service.editSession()!.form["shipped"]!;
            field().value.set(new Date(2024, 0, 5));
            await settle();

            const value = field().value() as Date;
            expect(value.getDate()).toBe(5);
            expect(value.getHours()).toBe(14);
            expect(value.getMinutes()).toBe(30);
        });
    });

    describe("GE9: names and errors", () => {
        it("names each editor after its column", async () => {
            const td = await startCellEdit("name");
            expect(editorInput(td).getAttribute("aria-label")).toBe("Name");
        });

        it("links a validation error to the editor and announces it", async () => {
            host.editable.set({
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
            await settle();
            const td = await startCellEdit("name");
            type(editorInput(td), "");
            await settle();
            press(editorInput(td), "Enter");
            await settle();

            expect(announce).toHaveBeenCalledWith("Name is required.", "polite");
            expect(service.isInEditMode()).toBe(true);
        });

        it("links a field error to the editor through aria-describedby", async () => {
            host.editable.set({
                mode: "cell",
                schema: () => row => {
                    validate(row["name"] as SchemaPathTree<unknown>, ({ value }) =>
                        typeof value() === "string" && (value() as string).trim() !== ""
                            ? undefined
                            : { kind: "required", message: "Name is required." }
                    );
                }
            });
            await settle();
            const td = await startCellEdit("name");
            type(editorInput(td), "");
            await settle();
            press(editorInput(td), "Enter");
            await settle();

            const describedBy = editorInput(td).getAttribute("aria-describedby");
            expect(describedBy).toBeTruthy();
            expect(document.getElementById(describedBy!)?.textContent?.trim()).toBe("Name is required.");
            expect(announce).toHaveBeenCalledWith("Name is required.", "polite");
        });
    });
});
