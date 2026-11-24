import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import type { MockInstance } from "vitest";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridSelectableDirective } from "../directives/grid-selectable.directive";
import { GridVirtualScrollDirective } from "../directives/grid-virtual-scroll.directive";
import type { GridNavigationMode } from "../models/GridNavigationMode";

interface FileRow {
    id: number;
    name: string;
    size: number;
}

function createFiles(count: number): FileRow[] {
    return Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `File ${i + 1}`, size: (i + 1) * 10 }));
}

@Component({
    imports: [GridColumnComponent, GridComponent, GridSelectableDirective],
    template: `
        <mona-grid
            aria-label="Files"
            rowKey="id"
            [data]="rows()"
            [navigation]="navigation()"
            [monaGridSelectable]="{ mode: 'multiple', selectOnRowClick: selectOnRowClick() }"
            [resizeMethod]="120"
            [selectedKeys]="selectedKeys()"
            (selectedKeysChange)="selectedKeys.set($event)">
            <mona-grid-column field="name" title="Name" [width]="120" />
            <mona-grid-column field="size" title="Size" type="number" [width]="80" />
        </mona-grid>
    `
})
class RowNavigationHostComponent {
    public readonly navigation = signal<GridNavigationMode>("row");
    public readonly rows = signal(createFiles(5));
    public readonly selectOnRowClick = signal(true);
    public readonly selectedKeys = signal<unknown[]>([]);
}

@Component({
    imports: [GridColumnComponent, GridComponent, GridSelectableDirective, GridVirtualScrollDirective],
    template: `
        <mona-grid
            aria-label="Files"
            navigation="row"
            rowKey="id"
            [data]="rows()"
            [monaGridSelectable]="{ mode: 'multiple', selectOnRowClick: true }"
            [monaGridVirtualScroll]="{ height: 28 }"
            [resizeMethod]="120"
            [selectedKeys]="selectedKeys()"
            (selectedKeysChange)="selectedKeys.set($event)">
            <mona-grid-column field="name" title="Name" [width]="120" />
            <mona-grid-column field="size" title="Size" type="number" [width]="80" />
        </mona-grid>
    `
})
class VirtualRowNavigationHostComponent {
    public readonly rows = signal(createFiles(1_000));
    public readonly selectedKeys = signal<unknown[]>([]);
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    for (let pass = 0; pass < 3; pass++) {
        fixture.detectChanges();
        await fixture.whenStable();
        await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
    }
    fixture.detectChanges();
}

function press(element: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    element.dispatchEvent(event);
    return event;
}

/** The cell of a field in the row showing the item with an id. */
function cell(root: ParentNode, field: string, id: number): HTMLTableCellElement {
    const row = Array.from(root.querySelectorAll<HTMLTableRowElement>("tbody tr[monaGridRow]")).find(
        candidate => candidate.querySelector("[data-field='name']")?.textContent?.trim() === `File ${id}`
    );
    const content = row?.querySelector(`[data-field='${field}']`);
    const element = content?.closest("td");
    if (!(element instanceof HTMLTableCellElement)) {
        throw new Error(`Expected the ${field} cell of row ${id}`);
    }
    return element;
}

function focusedText(): string {
    return (document.activeElement?.textContent ?? "").trim();
}

describe("grid row navigation", () => {
    let fixture: ComponentFixture<RowNavigationHostComponent>;
    let host: RowNavigationHostComponent;
    let root: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [RowNavigationHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(RowNavigationHostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle(fixture);
        cell(root, "name", 1).focus();
        await settle(fixture);
    });

    afterEach(() => root.remove());

    it("moves to the next and previous row with the arrows, and selects the row it moves to", async () => {
        const down = press(document.activeElement!, "ArrowDown");
        await settle(fixture);

        expect(down.defaultPrevented).toBe(true);
        expect(focusedText()).toBe("File 2");
        expect(host.selectedKeys()).toEqual([2]);

        press(document.activeElement!, "ArrowUp");
        await settle(fixture);

        expect(focusedText()).toBe("File 1");
        expect(host.selectedKeys()).toEqual([1]);
    });

    it("leaves ArrowLeft and ArrowRight to the browser, which scrolls, rather than moving between cells", async () => {
        const right = press(document.activeElement!, "ArrowRight");
        await settle(fixture);

        expect(right.defaultPrevented).toBe(false);
        expect(focusedText()).toBe("File 1");
    });

    it("goes to the first and last row with Home and End", async () => {
        press(document.activeElement!, "End");
        await settle(fixture);

        expect(focusedText()).toBe("File 5");
        expect(host.selectedKeys()).toEqual([5]);

        press(document.activeElement!, "Home");
        await settle(fixture);

        expect(focusedText()).toBe("File 1");
        expect(host.selectedKeys()).toEqual([1]);
    });

    it("extends the selection from the anchor with Shift, and adds the range with Ctrl and Shift", async () => {
        press(document.activeElement!, "ArrowDown");
        await settle(fixture);
        press(document.activeElement!, "ArrowDown", { shiftKey: true });
        press(document.activeElement!, "ArrowDown", { shiftKey: true });
        await settle(fixture);

        expect(focusedText()).toBe("File 4");
        expect([...host.selectedKeys()].sort()).toEqual([2, 3, 4]);
    });

    it("moves without selecting with Ctrl, and Ctrl+Space toggles the row while Space adds it", async () => {
        press(document.activeElement!, "ArrowDown");
        await settle(fixture);
        press(document.activeElement!, "ArrowDown", { ctrlKey: true });
        press(document.activeElement!, "ArrowDown", { ctrlKey: true });
        await settle(fixture);

        expect(focusedText()).toBe("File 4");
        expect(host.selectedKeys()).toEqual([2]);

        press(document.activeElement!, " ");
        await settle(fixture);
        expect([...host.selectedKeys()].sort()).toEqual([2, 4]);

        press(document.activeElement!, " ");
        await settle(fixture);
        expect([...host.selectedKeys()].sort()).toEqual([2, 4]);

        press(document.activeElement!, " ", { ctrlKey: true });
        await settle(fixture);
        expect(host.selectedKeys()).toEqual([2]);
    });

    it("hands the focus of another cell of a row, such as one clicked, to the row's first cell", async () => {
        cell(root, "size", 3).focus();
        await settle(fixture);

        expect(document.activeElement).toBe(cell(root, "name", 3));
        expect(cell(root, "name", 3).getAttribute("tabindex")).toBe("0");
        expect(cell(root, "size", 3).getAttribute("tabindex")).toBe("-1");
    });

    it("draws the focus on the row rather than on the cell", () => {
        const name = cell(root, "name", 1);

        expect(name.closest("tr")?.className).toContain("has-[>td:focus-visible]:after:ring-2");
        expect(name.className).not.toContain("focus-visible:after:ring-2");
    });

    it("keeps moving from cell to cell with cell navigation", async () => {
        host.navigation.set("cell");
        await settle(fixture);
        cell(root, "name", 1).focus();
        await settle(fixture);

        press(document.activeElement!, "ArrowRight");
        await settle(fixture);

        expect(document.activeElement).toBe(cell(root, "size", 1));
        expect(host.selectedKeys()).toEqual([]);
        expect(cell(root, "name", 1).className).toContain("focus-visible:after:ring-2");
    });

    it("moves without selecting when rows don't select on click", async () => {
        host.selectOnRowClick.set(false);
        await settle(fixture);

        press(document.activeElement!, "ArrowDown");
        await settle(fixture);

        expect(focusedText()).toBe("File 2");
        expect(host.selectedKeys()).toEqual([]);
    });
});

describe("grid right-click and empty space", () => {
    let fixture: ComponentFixture<RowNavigationHostComponent>;
    let host: RowNavigationHostComponent;
    let root: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [RowNavigationHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(RowNavigationHostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle(fixture);
    });

    afterEach(() => root.remove());

    function rightClick(element: Element): void {
        element.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2 }));
    }

    it("selects a row that isn't selected when it's right-clicked, in place of the selection", async () => {
        host.selectedKeys.set([1, 2]);
        await settle(fixture);

        rightClick(cell(root, "size", 4));
        await settle(fixture);

        expect(host.selectedKeys()).toEqual([4]);
    });

    it("keeps the selection when a selected row is right-clicked", async () => {
        host.selectedKeys.set([1, 2]);
        await settle(fixture);

        rightClick(cell(root, "name", 2));
        await settle(fixture);

        expect([...host.selectedKeys()].sort()).toEqual([1, 2]);
    });

    it("clears the selection on a click or right-click on the empty space below the rows", async () => {
        const body = root.querySelector("mona-grid-list");
        if (body == null) {
            throw new Error("Expected the grid body");
        }
        host.selectedKeys.set([1, 2]);
        await settle(fixture);

        rightClick(body);
        await settle(fixture);
        expect(host.selectedKeys()).toEqual([]);

        host.selectedKeys.set([3]);
        await settle(fixture);
        body.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true }));
        await settle(fixture);
        expect(host.selectedKeys()).toEqual([3]);

        body.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await settle(fixture);
        expect(host.selectedKeys()).toEqual([]);
    });

    it("leaves the selection alone on a right-click when rows don't select on click", async () => {
        host.selectOnRowClick.set(false);
        host.selectedKeys.set([1]);
        await settle(fixture);

        rightClick(cell(root, "name", 3));
        await settle(fixture);

        expect(host.selectedKeys()).toEqual([1]);
    });
});

describe("virtual grid row navigation", () => {
    const VIEWPORT_HEIGHT = 280;
    let fixture: ComponentFixture<VirtualRowNavigationHostComponent>;
    let host: VirtualRowNavigationHostComponent;
    let root: HTMLElement;
    let clientHeight: MockInstance<() => number>;

    beforeEach(async () => {
        // jsdom has no layout: give the viewport a height of ten rows.
        clientHeight = vi.spyOn(Element.prototype, "clientHeight", "get").mockImplementation(function (this: Element) {
            return this.tagName === "CDK-VIRTUAL-SCROLL-VIEWPORT" ? VIEWPORT_HEIGHT : 0;
        });
        await TestBed.configureTestingModule({ imports: [VirtualRowNavigationHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(VirtualRowNavigationHostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle(fixture);
        cell(root, "name", 1).focus();
        await settle(fixture);
    });

    afterEach(() => {
        root.remove();
        clientHeight.mockRestore();
    });

    it("selects the last row once End has scrolled to it and it's drawn", async () => {
        press(document.activeElement!, "End");
        await settle(fixture);
        // The row isn't drawn yet, so nothing is selected until it is. jsdom doesn't scroll: scroll as the list would.
        expect(host.selectedKeys()).toEqual([]);
        const viewport = root.querySelector<HTMLElement>("cdk-virtual-scroll-viewport");
        if (viewport == null) {
            throw new Error("Expected the virtual scroll viewport");
        }
        viewport.scrollTop = 1_000 * 28 - VIEWPORT_HEIGHT;
        viewport.dispatchEvent(new Event("scroll"));
        await settle(fixture);
        await settle(fixture);

        expect(focusedText()).toBe("File 1000");
        expect(host.selectedKeys()).toEqual([1000]);
    });
});
