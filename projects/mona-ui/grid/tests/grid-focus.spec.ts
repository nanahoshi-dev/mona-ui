import { Component, signal, viewChild } from "@angular/core";
import { type ComponentFixture, DeferBlockBehavior, DeferBlockState, TestBed } from "@angular/core/testing";
import { ContextMenuComponent, ContextMenuItemComponent } from "@nanahoshi/mona-ui/contextmenu";
import type { MockInstance } from "vitest";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridCellTemplateDirective } from "../directives/grid-cell-template.directive";
import { GridSelectableDirective } from "../directives/grid-selectable.directive";
import { GridVirtualScrollDirective } from "../directives/grid-virtual-scroll.directive";

interface FileRow {
    id: number;
    name: string;
    size: number;
}

/** Files with ids from `first` on, named after their ids. */
function createFiles(count: number, first = 1): FileRow[] {
    return Array.from({ length: count }, (_, i) => ({ id: first + i, name: `File ${first + i}`, size: (i + 1) * 10 }));
}

@Component({
    imports: [
        ContextMenuComponent,
        ContextMenuItemComponent,
        GridCellTemplateDirective,
        GridColumnComponent,
        GridComponent,
        GridSelectableDirective
    ],
    template: `
        <button type="button" class="outside">Address bar</button>
        <div #area class="area">
            <mona-grid
                aria-label="Files"
                navigation="row"
                rowKey="id"
                [data]="rows()"
                [monaGridSelectable]="{ mode: 'multiple', selectOnRowClick: true }"
                [resizeMethod]="120"
                [selectedKeys]="selectedKeys()"
                (selectedKeysChange)="selectedKeys.set($event)">
                <mona-grid-column field="name" title="Name" [width]="120" />
                <mona-grid-column field="size" title="Size" type="number" [width]="80" />
                <mona-grid-column title="Share" [width]="80">
                    <ng-template monaGridCellTemplate><button type="button" class="share">Share</button></ng-template>
                </mona-grid-column>
            </mona-grid>
        </div>
        <mona-contextmenu [target]="area">
            <mona-contextmenu-item label="New folder" value="new"></mona-contextmenu-item>
        </mona-contextmenu>
    `
})
class FileGridHostComponent {
    public readonly grid = viewChild.required(GridComponent);
    public readonly rows = signal(createFiles(5));
    public readonly selectedKeys = signal<unknown[]>([]);
}

@Component({
    imports: [GridColumnComponent, GridComponent, GridSelectableDirective, GridVirtualScrollDirective],
    template: `
        <button type="button" class="outside">Address bar</button>
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
class VirtualFileGridHostComponent {
    public readonly grid = viewChild.required(GridComponent);
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

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** The name cell of the row showing the item with an id. */
function cell(root: ParentNode, id: number): HTMLTableCellElement {
    const row = Array.from(root.querySelectorAll<HTMLTableRowElement>("tbody tr[monaGridRow]")).find(
        candidate => candidate.querySelector("[data-field='name']")?.textContent?.trim() === `File ${id}`
    );
    const element = row?.querySelector("[data-field='name']")?.closest("td");
    if (!(element instanceof HTMLTableCellElement)) {
        throw new Error(`Expected the name cell of row ${id}`);
    }
    return element;
}

/** The text of the row that has the focus, or of the focused element. */
function focusedText(): string {
    const active = document.activeElement;
    const row = active?.closest("tr[monaGridRow]");
    return (row?.querySelector("[data-field='name']")?.textContent ?? active?.textContent ?? "").trim();
}

function press(element: Element, button: number): MouseEvent {
    const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true, button });
    element.dispatchEvent(event);
    return event;
}

describe("grid focus", () => {
    let fixture: ComponentFixture<FileGridHostComponent>;
    let host: FileGridHostComponent;
    let root: HTMLElement;
    let outside: HTMLButtonElement;

    const body = (): HTMLElement => root.querySelector<HTMLElement>("mona-grid-list")!;
    const tabStop = (): HTMLElement | null => root.querySelector<HTMLElement>("td[tabindex='0'], th[tabindex='0']");

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [FileGridHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(FileGridHostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle(fixture);
        outside = root.querySelector<HTMLButtonElement>(".outside")!;
    });

    afterEach(() => {
        root.remove();
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    describe("from code", () => {
        it("puts the focus on the first row with focus(), selecting nothing", async () => {
            outside.focus();
            host.grid().focus();
            await settle(fixture);

            expect(document.activeElement).toBe(cell(root, 1));
            expect(host.selectedKeys()).toEqual([]);
        });

        it("puts the focus back on the current row with focus()", async () => {
            cell(root, 3).focus();
            outside.focus();
            host.grid().focus();
            await settle(fixture);

            expect(focusedText()).toBe("File 3");
        });

        it("puts the focus on the first row with focus() when the current cell is a header", async () => {
            root.querySelector<HTMLElement>("thead th[role='columnheader']")!.focus();
            host.grid().focus();
            await settle(fixture);

            expect(focusedText()).toBe("File 1");
        });

        it("focuses a row by its key with focusRow(), selecting nothing", async () => {
            outside.focus();
            host.grid().focusRow(4);
            await settle(fixture);

            expect(document.activeElement).toBe(cell(root, 4));
            expect(host.selectedKeys()).toEqual([]);
        });

        it("focuses a row added to the data just before the call", async () => {
            host.rows.update(rows => [...rows, { id: 99, name: "File 99", size: 1 }]);
            host.grid().focusRow(99);
            await settle(fixture);

            expect(focusedText()).toBe("File 99");
        });

        it("focuses as focus() does for a key no row has", async () => {
            host.grid().focusRow(12_345);
            await settle(fixture);

            expect(focusedText()).toBe("File 1");
        });
    });

    describe("when the data changes", () => {
        beforeEach(async () => {
            cell(root, 3).focus();
            await settle(fixture);
        });

        it("keeps the focus on a row whose item stays", async () => {
            host.rows.set(createFiles(5));
            await settle(fixture);

            expect(focusedText()).toBe("File 3");
        });

        it("keeps the focus in the rows, on a row next to it, when its row goes", async () => {
            host.rows.set(createFiles(5).filter(file => file.id !== 3));
            await settle(fixture);

            expect(["File 2", "File 4"]).toContain(focusedText());
        });

        it("starts again at the first row when the rows are replaced by others", async () => {
            host.rows.set(createFiles(5, 101));
            await settle(fixture);

            expect(document.activeElement).toBe(cell(root, 101));
            expect(tabStop()).toBe(cell(root, 101));
        });

        it("comes back from a header to the first row when the data is emptied while the next loads", async () => {
            host.rows.set([]);
            await settle(fixture);
            expect(root.contains(document.activeElement)).toBe(true);

            host.rows.set(createFiles(2, 101));
            await settle(fixture);
            expect(document.activeElement).toBe(cell(root, 101));

            host.rows.set(createFiles(5, 101));
            await settle(fixture);
            expect(document.activeElement).toBe(cell(root, 101));
        });

        it("leaves the focus where the user took it while the data was empty", async () => {
            host.rows.set([]);
            await settle(fixture);
            outside.focus();
            await settle(fixture);

            host.rows.set(createFiles(5, 101));
            await settle(fixture);

            expect(document.activeElement).toBe(outside);
            expect(tabStop()).toBe(cell(root, 101));
        });

        it("moves only the Tab stop to the first row when the grid doesn't have the focus", async () => {
            outside.focus();
            host.rows.set(createFiles(5, 101));
            await settle(fixture);

            expect(document.activeElement).toBe(outside);
            expect(tabStop()).toBe(cell(root, 101));
        });
    });

    describe("a press on the empty space below the rows", () => {
        it("keeps the focus on the row that has it", async () => {
            cell(root, 2).focus();
            const event = press(body(), 0);
            await settle(fixture);

            expect(event.defaultPrevented).toBe(true);
            expect(focusedText()).toBe("File 2");
        });

        it("brings the focus from outside the grid to its current row", async () => {
            cell(root, 2).focus();
            outside.focus();
            const event = press(body(), 0);
            await settle(fixture);

            expect(event.defaultPrevented).toBe(true);
            expect(focusedText()).toBe("File 2");
        });

        it("gives the focus back to the row when a context menu opened there closes", async () => {
            cell(root, 2).focus();
            press(body(), 2);
            body().dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2 }));
            await settle(fixture);
            const menu = document.querySelector<HTMLElement>("[role='menu']")!;
            expect(menu).not.toBeNull();

            menu.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }));
            await settle(fixture);
            await wait(200);
            await settle(fixture);

            expect(document.querySelector("[role='menu']")).toBeNull();
            expect(focusedText()).toBe("File 2");
        });

        it("lets a control inside a cell that has the focus lose it, as an editor does to end its edit", () => {
            const share = cell(root, 2).closest("tr")!.querySelector<HTMLButtonElement>(".share")!;
            share.focus();

            expect(press(body(), 0).defaultPrevented).toBe(false);
        });

        it("leaves a press on a row, and one with the middle button, to the browser", () => {
            expect(press(cell(root, 2), 0).defaultPrevented).toBe(false);
            expect(press(body(), 1).defaultPrevented).toBe(false);
        });

        it("keeps the focus in the grid on a press on an empty grid", async () => {
            host.rows.set([]);
            await settle(fixture);
            outside.focus();
            const empty = root.querySelector<HTMLElement>("[role='rowgroup'] [role='gridcell']")!.parentElement!;
            const event = press(empty, 0);
            await settle(fixture);

            expect(event.defaultPrevented).toBe(true);
            expect(document.activeElement?.closest("thead")).not.toBeNull();
        });
    });
});

describe("virtual grid focus", () => {
    const VIEWPORT_HEIGHT = 280;
    let fixture: ComponentFixture<VirtualFileGridHostComponent>;
    let host: VirtualFileGridHostComponent;
    let root: HTMLElement;
    let clientHeight: MockInstance<() => number>;
    let scrollTo: MockInstance<Element["scrollTo"]>;

    const viewport = (): HTMLElement => root.querySelector<HTMLElement>("cdk-virtual-scroll-viewport")!;

    beforeEach(async () => {
        // jsdom has no layout: give the viewport a height of ten rows, and let it scroll.
        clientHeight = vi.spyOn(Element.prototype, "clientHeight", "get").mockImplementation(function (this: Element) {
            return this.tagName === "CDK-VIRTUAL-SCROLL-VIEWPORT" ? VIEWPORT_HEIGHT : 0;
        });
        scrollTo = vi.spyOn(Element.prototype, "scrollTo").mockImplementation(function (
            this: Element,
            options?: ScrollToOptions | number
        ) {
            if (typeof options === "object" && options.top != null) {
                this.scrollTop = options.top;
                this.dispatchEvent(new Event("scroll"));
            }
        });
        await TestBed.configureTestingModule({ imports: [VirtualFileGridHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(VirtualFileGridHostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle(fixture);
    });

    afterEach(() => {
        root.remove();
        clientHeight.mockRestore();
        scrollTo.mockRestore();
    });

    it("scrolls to a row that isn't drawn and focuses it with focusRow()", async () => {
        host.grid().focusRow(800);
        await settle(fixture);
        await settle(fixture);

        expect(viewport().scrollTop).toBeGreaterThan(0);
        expect(focusedText()).toBe("File 800");
        expect(host.selectedKeys()).toEqual([]);
    });

    it("starts again at the first row, scrolled into view, when the rows are replaced by others", async () => {
        host.grid().focusRow(800);
        await settle(fixture);
        await settle(fixture);
        expect(focusedText()).toBe("File 800");

        host.rows.set(createFiles(1_000, 5_001));
        await settle(fixture);
        await settle(fixture);

        expect(viewport().scrollTop).toBe(0);
        expect(focusedText()).toBe("File 5001");
    });
});

describe("focus from code on a grid just made", () => {
    let clientHeight: MockInstance<() => number>;
    let root: HTMLElement;

    /**
     * Makes the grid and draws it once, holding its body back: an app's build loads the body a tick after the grid's
     * first layout, and a virtual grid draws its rows later still.
     */
    async function create<T>(component: new () => T, before?: (host: T) => void): Promise<ComponentFixture<T>> {
        await TestBed.configureTestingModule({
            deferBlockBehavior: DeferBlockBehavior.Manual,
            imports: [component]
        }).compileComponents();
        const fixture = TestBed.createComponent(component);
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        before?.(fixture.componentInstance);
        fixture.detectChanges();
        return fixture;
    }

    /** Draws the body the grid held back, then lets it settle. */
    async function drawBody(fixture: ComponentFixture<unknown>): Promise<void> {
        await settle(fixture);
        expect(root.querySelector("tbody td")).toBeNull();
        for (const block of await fixture.getDeferBlocks()) {
            await block.render(DeferBlockState.Complete);
        }
        await settle(fixture);
        await settle(fixture);
    }

    beforeEach(() => {
        // jsdom has no layout: give a virtual grid's viewport a height of ten rows.
        clientHeight = vi.spyOn(Element.prototype, "clientHeight", "get").mockImplementation(function (this: Element) {
            return this.tagName === "CDK-VIRTUAL-SCROLL-VIEWPORT" ? 280 : 0;
        });
    });

    afterEach(() => {
        root.remove();
        clientHeight.mockRestore();
    });

    it("waits for the rows, then focuses the first with focus()", async () => {
        const fixture = await create(FileGridHostComponent);

        fixture.componentInstance.grid().focus();
        await drawBody(fixture);

        expect(focusedText()).toBe("File 1");
        expect(fixture.componentInstance.selectedKeys()).toEqual([]);
    });

    it("waits for the rows, then focuses one by its key with focusRow()", async () => {
        const fixture = await create(FileGridHostComponent);

        fixture.componentInstance.grid().focusRow(3);
        await drawBody(fixture);

        expect(focusedText()).toBe("File 3");
    });

    it("waits for a virtual grid's rows, then focuses the first with focus()", async () => {
        const fixture = await create(VirtualFileGridHostComponent);

        fixture.componentInstance.grid().focus();
        await drawBody(fixture);

        expect(focusedText()).toBe("File 1");
    });

    it("waits for a virtual grid's rows, then focuses one by its key with focusRow()", async () => {
        const fixture = await create(VirtualFileGridHostComponent);

        fixture.componentInstance.grid().focusRow(4);
        await drawBody(fixture);

        expect(focusedText()).toBe("File 4");
    });

    it("focuses only the row asked for last when called again before the rows are drawn", async () => {
        const fixture = await create(VirtualFileGridHostComponent);

        fixture.componentInstance.grid().focusRow(4);
        await settle(fixture);
        fixture.componentInstance.grid().focusRow(6);
        await drawBody(fixture);

        expect(focusedText()).toBe("File 6");
    });

    it("still focuses a column header when the grid has no rows", async () => {
        const fixture = await create(FileGridHostComponent, host => host.rows.set([]));

        fixture.componentInstance.grid().focus();
        await settle(fixture);

        expect(document.activeElement?.closest("thead")).not.toBeNull();
    });
});
