import { CdkDrag } from "@angular/cdk/drag-drop";
import { Clipboard } from "@angular/cdk/clipboard";
import { Component, signal } from "@angular/core";
import { type ComponentFixture, DeferBlockState, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridCellTemplateDirective } from "../directives/grid-cell-template.directive";
import { GridFilterableDirective } from "../directives/grid-filterable.directive";
import { GridSelectableDirective } from "../directives/grid-selectable.directive";
import { GridSortableDirective } from "../directives/grid-sortable.directive";
import { GridToolbarTemplateDirective } from "../directives/grid-toolbar-template.directive";
import { GridService } from "../services/grid.service";

@Component({
    imports: [
        GridCellTemplateDirective,
        GridColumnComponent,
        GridComponent,
        GridFilterableDirective,
        GridSelectableDirective,
        GridSortableDirective,
        GridToolbarTemplateDirective
    ],
    template: `
        <mona-grid
            [data]="rows"
            [rowKey]="'id'"
            [pageSize]="pageSize()"
            [pageSizeValues]="[]"
            [resizeMethod]="120"
            [responsivePager]="false"
            [monaGridFilterable]="{ enabled: true, type: 'menu, row' }"
            [monaGridSelectable]="{ enabled: true, mode: 'multiple' }"
            [monaGridSortable]="{ enabled: true, mode: 'single' }"
            (selectedKeysChange)="selected.set($event)">
            <ng-template monaGridToolbarTemplate>
                <input class="toolbar-search" type="search" aria-label="Search" />
                <button class="toolbar-action">Action</button>
                @if (extraButton()) {
                    <button class="toolbar-extra">Extra</button>
                }
            </ng-template>
            <mona-grid-column field="name" title="Name" [width]="160">
                <ng-template monaGridCellTemplate>
                    <a class="details-link" href="#details">Details</a>
                    <button class="cell-button">Open</button>
                </ng-template>
            </mona-grid-column>
            <mona-grid-column field="id" title="Id" type="number" [width]="80"></mona-grid-column>
        </mona-grid>
    `
})
class HostComponent {
    public readonly extraButton = signal(false);
    public readonly pageSize = signal(50);
    public readonly rows = [
        { id: 1, name: "Jane" },
        { id: 2, name: "John" },
        { id: 3, name: "Mary" }
    ];
    public readonly selected = signal<unknown[]>([]);
}

function press(element: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    element.dispatchEvent(event);
    return event;
}

describe("grid keyboard and focus (batch 5)", () => {
    let fixture: ComponentFixture<HostComponent>;
    let root: HTMLElement;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        for (const block of await fixture.getDeferBlocks()) {
            await block.render(DeferBlockState.Complete);
        }
        fixture.detectChanges();
        await fixture.whenStable();
    }

    function bodyCell(field: "id" | "name", rowIndex = 0): HTMLTableCellElement {
        const cells = root.querySelectorAll(`tbody tr[monagridrow] [data-field="${field}"]`);
        const cell = cells[rowIndex]?.closest("td");
        if (!(cell instanceof HTMLTableCellElement)) {
            throw new Error(`No ${field} cell in row ${rowIndex}`);
        }
        return cell;
    }

    function headerCell(title: string): HTMLTableCellElement {
        const cell = Array.from(root.querySelectorAll<HTMLTableCellElement>("th[role='columnheader']")).find(th =>
            th.textContent?.includes(title)
        );
        if (cell == null) {
            throw new Error(`No header ${title}`);
        }
        return cell;
    }

    function required<T extends Element>(selector: string, scope: ParentNode = root): T {
        const element = scope.querySelector<T>(selector);
        if (element == null) {
            throw new Error(`No ${selector}`);
        }
        return element;
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
        fixture = TestBed.createComponent(HostComponent);
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle();
    });

    afterEach(() => root.remove());

    describe("Tab stops (GK1, GK2)", () => {
        it("has no body Tab stop, and the filter row is part of the grid's navigation", () => {
            expect(root.querySelector("tbody[tabindex]")).toBeNull();
            const filterCells = root.querySelectorAll("thead tr:nth-child(2) th[monaGridLogicalCell]");
            expect(filterCells.length).toBe(2);
            for (const input of root.querySelectorAll("thead tr:nth-child(2) input")) {
                expect(input.getAttribute("tabindex")).toBe("-1");
            }

            const nameHeader = headerCell("Name");
            nameHeader.focus();
            press(nameHeader, "ArrowDown");
            expect(document.activeElement).toBe(filterCells[0]);
            press(filterCells[0], "ArrowDown");
            expect(document.activeElement).toBe(bodyCell("name"));
            press(bodyCell("name"), "ArrowUp");
            expect(document.activeElement).toBe(filterCells[0]);
        });

        it("moves into a filter cell's input with Enter and back with Escape", () => {
            const filterCell = required<HTMLTableCellElement>("thead tr:nth-child(2) th[monaGridLogicalCell]");
            filterCell.focus();
            press(filterCell, "Enter");
            const input = document.activeElement as HTMLElement;
            expect(input.tagName).toBe("INPUT");
            expect(filterCell.contains(input)).toBe(true);

            // The caret keys stay with the input.
            expect(press(input, "ArrowLeft").defaultPrevented).toBe(false);
            press(input, "Escape");
            expect(document.activeElement).toBe(filterCell);
        });
    });

    describe("cell content (GK3, GK9)", () => {
        it("moves into a data cell with F2 or Enter, between its controls with Tab, and on with Tab past the last", () => {
            const cell = bodyCell("name");
            cell.focus();
            press(cell, "F2");
            expect(document.activeElement).toBe(required(".details-link", cell));

            const tab = press(required(".details-link", cell), "Tab");
            expect(tab.defaultPrevented).toBe(true);
            expect(document.activeElement).toBe(required(".cell-button", cell));

            press(required(".cell-button", cell), "Tab");
            expect(document.activeElement).toBe(bodyCell("id"));

            cell.focus();
            press(cell, "Enter");
            expect(document.activeElement).toBe(required(".details-link", cell));
            press(required(".details-link", cell), "Escape");
            expect(document.activeElement).toBe(cell);
        });

        it("copies the cell with the physical C key, only from the cell itself", () => {
            const copy = vi.spyOn(TestBed.inject(Clipboard), "copy").mockReturnValue(true);
            const cell = bodyCell("id");
            cell.focus();
            // Caps Lock gives "C"; the key code is the same on every layout.
            press(cell, "C", { code: "KeyC", ctrlKey: true });
            expect(copy).toHaveBeenCalledWith("1");

            copy.mockClear();
            const link = required<HTMLElement>(".details-link", bodyCell("name"));
            link.focus();
            press(link, "c", { code: "KeyC", metaKey: true });
            expect(copy).not.toHaveBeenCalled();
        });

        it("reaches the last cell with Cmd+End", () => {
            const cell = bodyCell("name");
            cell.focus();
            press(cell, "End", { metaKey: true });
            expect(document.activeElement).toBe(bodyCell("id", 2));
        });
    });

    describe("headers (GK4)", () => {
        it("opens the filter menu with Alt+ArrowDown and sorts with Enter", async () => {
            const nameHeader = headerCell("Name");
            expect(nameHeader.getAttribute("aria-keyshortcuts")).toBe("Alt+ArrowDown");

            nameHeader.focus();
            const event = press(nameHeader, "ArrowDown", { altKey: true });
            await settle();
            expect(event.defaultPrevented).toBe(true);
            expect(document.querySelector("mona-filter-menu")).not.toBeNull();
            expect(nameHeader.querySelector("mona-grid-filter-menu button")).toBe(document.activeElement);
            expect(nameHeader.getAttribute("aria-sort")).not.toBe("ascending");

            nameHeader.focus();
            press(nameHeader, "Enter");
            await settle();
            expect(headerCell("Name").getAttribute("aria-sort")).toBe("ascending");
        });
    });

    describe("row selection (GK5)", () => {
        it("selects with Space, extends with Shift+ArrowDown and Shift+Space, and selects all with Ctrl+A", async () => {
            const host = fixture.componentInstance;
            const first = bodyCell("name");
            first.focus();
            expect(press(first, " ").defaultPrevented).toBe(true);
            await settle();
            expect(host.selected()).toEqual([1]);

            press(first, "ArrowDown", { shiftKey: true });
            await settle();
            expect(document.activeElement).toBe(bodyCell("name", 1));
            expect(host.selected()).toEqual([1, 2]);

            press(bodyCell("name", 1), " ", { shiftKey: true });
            await settle();
            expect(host.selected()).toEqual([1, 2]);

            press(bodyCell("name", 1), " ");
            await settle();
            expect(host.selected()).toEqual([1]);

            const event = press(bodyCell("name", 1), "a", { code: "KeyA", ctrlKey: true });
            await settle();
            expect(event.defaultPrevented).toBe(true);
            expect([...host.selected()].sort()).toEqual([1, 2, 3]);
        });
    });

    describe("toolbar (GK8)", () => {
        it("is a named toolbar whose arrows leave text fields alone, with Home, End and RTL", async () => {
            const toolbar = required<HTMLElement>("[role='toolbar']");
            expect(toolbar.getAttribute("aria-label")).toBe("Grid toolbar");
            const search = required<HTMLInputElement>(".toolbar-search");
            const action = required<HTMLButtonElement>(".toolbar-action");

            search.focus();
            expect(press(search, "ArrowRight").defaultPrevented).toBe(false);
            expect(press(search, "End").defaultPrevented).toBe(false);
            expect(document.activeElement).toBe(search);

            action.focus();
            press(action, "End");
            const items = Array.from(toolbar.querySelectorAll<HTMLElement>("[data-grid-toolbar-item]"));
            expect(document.activeElement).toBe(items.at(-1));
            press(items.at(-1) as HTMLElement, "Home");
            expect(document.activeElement).toBe(search);

            toolbar.dir = "rtl";
            action.focus();
            press(action, "ArrowLeft");
            expect(document.activeElement).toBe(items.at(-1));
            toolbar.dir = "";

            fixture.componentInstance.extraButton.set(true);
            await settle();
            expect(required(".toolbar-extra").getAttribute("tabindex")).toBe("-1");
            expect(toolbar.querySelectorAll("[tabindex='0']").length).toBe(1);
        });
    });

    describe("lost focus (GR9)", () => {
        it("gives focus back to a header after it's dragged", async () => {
            const nameHeader = headerCell("Name");
            const drag = fixture.debugElement
                .queryAll(By.directive(CdkDrag))
                .map(debugElement => debugElement.injector.get(CdkDrag))
                .find(instance => instance.element.nativeElement === nameHeader);
            if (drag == null) {
                throw new Error("No header drag");
            }
            nameHeader.focus();
            nameHeader.blur();
            expect(document.activeElement).toBe(document.body);
            drag.ended.emit({
                distance: { x: 0, y: 0 },
                dropPoint: { x: 0, y: 0 },
                event: new MouseEvent("mouseup"),
                source: drag
            });
            await settle();
            expect(document.activeElement).toBe(headerCell("Name"));
        });

        it("shows a new page from its first row", async () => {
            fixture.componentInstance.pageSize.set(2);
            await settle();
            const scrollElement = fixture.debugElement.children[0].injector.get(GridService).bodyScrollElement();
            if (scrollElement == null) {
                throw new Error("No body scroll element");
            }
            const scrollTop = vi.fn();
            Object.defineProperty(scrollElement, "scrollTop", { configurable: true, get: () => 80, set: scrollTop });

            const pageTwo = Array.from(root.querySelectorAll<HTMLButtonElement>("mona-pager button")).find(
                button => button.textContent?.trim() === "2"
            );
            pageTwo?.click();
            await settle();
            expect(scrollTop).toHaveBeenCalledWith(0);
        });
    });
});
