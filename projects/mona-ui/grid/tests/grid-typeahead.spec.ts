import { Component, signal, viewChild } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import type { CompositeFilterDescriptor, SortDescriptor } from "@nanahoshi/mona-ui/query";
import type { MockInstance } from "vitest";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridCellTemplateDirective } from "../directives/grid-cell-template.directive";
import { GridEditableDirective } from "../directives/grid-editable.directive";
import { GridFilterableDirective } from "../directives/grid-filterable.directive";
import { GridSelectableDirective } from "../directives/grid-selectable.directive";
import { GridSortableDirective } from "../directives/grid-sortable.directive";
import { GridVirtualScrollDirective } from "../directives/grid-virtual-scroll.directive";
import type { GridNavigationMode } from "../models/GridNavigationMode";

interface FileRow {
    id: number;
    name: string;
    size: number;
}

const NAMES = [
    "Apple",
    "Banana",
    "apricot",
    "berry",
    "Cherry",
    ".config",
    "(old)",
    "~$draft.docx",
    "New folder",
    "report.pdf",
    "New text.txt"
];

function createFiles(names: readonly string[]): FileRow[] {
    return names.map((name, i) => ({ id: i + 1, name, size: (i + 1) * 10 }));
}

@Component({
    imports: [
        GridCellTemplateDirective,
        GridColumnComponent,
        GridComponent,
        GridFilterableDirective,
        GridSelectableDirective,
        GridSortableDirective
    ],
    template: `
        <button type="button" class="outside">Address bar</button>
        <mona-grid
            aria-label="Files"
            rowKey="id"
            monaGridFilterable
            monaGridSortable
            [data]="rows()"
            [filter]="filter()"
            [monaGridSelectable]="{ mode: 'multiple', selectOnRowClick: true }"
            [navigation]="navigation()"
            [pageSize]="50"
            [resizeMethod]="120"
            [selectedKeys]="selectedKeys()"
            [sort]="sort()"
            [textField]="textField()"
            (selectedKeysChange)="selectedKeys.set($event)">
            <mona-grid-column field="name" title="Name" [width]="160" />
            <mona-grid-column field="size" title="Size" type="number" [width]="80" />
            <mona-grid-column title="Tag" [width]="120">
                <ng-template monaGridCellTemplate><input type="text" class="tag" aria-label="Tag" /></ng-template>
            </mona-grid-column>
        </mona-grid>
    `
})
class FileGridHostComponent {
    public readonly filter = signal<CompositeFilterDescriptor[]>([]);
    public readonly grid = viewChild.required(GridComponent);
    public readonly navigation = signal<GridNavigationMode>("row");
    public readonly rows = signal(createFiles(NAMES));
    public readonly selectedKeys = signal<unknown[]>([]);
    public readonly sort = signal<SortDescriptor[]>([]);
    public readonly textField = signal<string | ((file: FileRow) => string) | null>("name");
}

@Component({
    imports: [GridColumnComponent, GridComponent, GridEditableDirective],
    template: `
        <mona-grid
            aria-label="Files"
            rowKey="id"
            textField="name"
            [data]="rows"
            [monaGridEditable]="{ mode: 'cell' }"
            [resizeMethod]="120">
            <mona-grid-column field="name" title="Name" [width]="160" />
        </mona-grid>
    `
})
class EditableFileGridHostComponent {
    public readonly rows = createFiles(NAMES);
}

@Component({
    imports: [GridColumnComponent, GridComponent, GridSelectableDirective, GridVirtualScrollDirective],
    template: `
        <mona-grid
            aria-label="Files"
            navigation="row"
            rowKey="id"
            textField="name"
            [data]="rows()"
            [monaGridSelectable]="{ mode: 'multiple', selectOnRowClick: true }"
            [monaGridVirtualScroll]="{ height: 28 }"
            [resizeMethod]="120"
            [selectedKeys]="selectedKeys()"
            (selectedKeysChange)="selectedKeys.set($event)">
            <mona-grid-column field="name" title="Name" [width]="160" />
        </mona-grid>
    `
})
class VirtualFileGridHostComponent {
    public readonly rows = signal(
        createFiles(
            Array.from({ length: 1_000 }, (_, i) =>
                i === 0 ? "Apple" : i === 500 ? "Banana" : i === 600 ? "Berry" : `File ${i + 1}`
            )
        )
    );
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

/** The cell of the row showing a name, in the name column. */
function nameCell(root: ParentNode, name: string): HTMLTableCellElement {
    const content = Array.from(root.querySelectorAll("tbody [data-field='name']")).find(
        candidate => candidate.textContent?.trim() === name
    );
    const element = content?.closest("td");
    if (!(element instanceof HTMLTableCellElement)) {
        throw new Error(`Expected the name cell of ${name}`);
    }
    return element;
}

/** The name of the row that has the focus. */
function focusedName(): string {
    const row = document.activeElement?.closest("tr[monaGridRow]");
    return row?.querySelector("[data-field='name']")?.textContent?.trim() ?? "";
}

/** Presses a key on the focused element, as the keyboard does. */
function press(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    (document.activeElement ?? document.body).dispatchEvent(event);
    return event;
}

/** Types text quickly, a key at a time, on whatever has the focus. */
function type(text: string): void {
    for (const key of Array.from(text)) {
        press(key);
    }
}

describe("grid typeahead", () => {
    let fixture: ComponentFixture<FileGridHostComponent>;
    let host: FileGridHostComponent;
    let root: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [FileGridHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(FileGridHostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle(fixture);
        nameCell(root, "Apple").focus();
    });

    afterEach(() => root.remove());

    it("moves the focus to the next row whose text starts with a letter, and selects it as an arrow key does", async () => {
        host.selectedKeys.set([1, 5]);
        await settle(fixture);

        const event = press("b");
        await settle(fixture);

        expect(event.defaultPrevented).toBe(true);
        expect(focusedName()).toBe("Banana");
        expect(host.selectedKeys()).toEqual([2]);
    });

    it("stays on the row it found while more letters still match, ignoring case", async () => {
        type("ba");
        expect(focusedName()).toBe("Banana");
        type("N");
        await settle(fixture);

        expect(focusedName()).toBe("Banana");
        expect(host.selectedKeys()).toEqual([2]);
    });

    it("goes on to the next row that matches more letters, and wraps around", async () => {
        nameCell(root, "Cherry").focus();
        type("APR");
        await settle(fixture);

        expect(focusedName()).toBe("apricot");
        expect(host.selectedKeys()).toEqual([3]);
    });

    it("steps through the rows that start with a letter typed again", async () => {
        type("b");
        expect(focusedName()).toBe("Banana");
        type("b");
        expect(focusedName()).toBe("berry");
        type("b");
        await settle(fixture);

        expect(focusedName()).toBe("Banana");
        expect(host.selectedKeys()).toEqual([2]);
    });

    it("types a space while a search is under way", async () => {
        type("new t");
        await settle(fixture);

        expect(focusedName()).toBe("New text.txt");
        expect(host.selectedKeys()).toEqual([11]);
    });

    it("types names with punctuation, each search ended by a key that moves", async () => {
        type("~$");
        expect(focusedName()).toBe("~$draft.docx");
        press("ArrowUp");
        expect(focusedName()).toBe("(old)");
        type(".");
        expect(focusedName()).toBe(".config");
        press("ArrowDown");
        type("(");
        await settle(fixture);

        expect(focusedName()).toBe("(old)");
        expect(host.selectedKeys()).toEqual([7]);
    });

    it("keeps Space for selecting when no search is under way", async () => {
        type("b");
        press("ArrowDown", { ctrlKey: true });
        expect(focusedName()).toBe("apricot");

        const event = press(" ");
        await settle(fixture);

        expect(event.defaultPrevented).toBe(true);
        expect(host.selectedKeys()).toEqual([2, 3]);
    });

    it("never types Ctrl+Space, which toggles the row even during a search", async () => {
        type("b");
        press(" ", { ctrlKey: true });
        await settle(fixture);

        expect(focusedName()).toBe("Banana");
        expect(host.selectedKeys()).toEqual([]);
    });

    it("never types keys pressed with Ctrl, Alt or Meta", async () => {
        const events = [press("b", { ctrlKey: true }), press("b", { altKey: true }), press("b", { metaKey: true })];
        await settle(fixture);

        expect(events.map(event => event.defaultPrevented)).toEqual([false, false, false]);
        expect(focusedName()).toBe("Apple");
        expect(host.selectedKeys()).toEqual([]);
    });

    it("changes nothing when no row matches", async () => {
        host.selectedKeys.set([1]);
        await settle(fixture);

        type("q");
        await settle(fixture);

        expect(focusedName()).toBe("Apple");
        expect(host.selectedKeys()).toEqual([1]);
    });

    it("searches the rows in the order shown, sorted and filtered", async () => {
        // Descending, "berry" comes before "Banana"; in the data, after it.
        host.sort.set([{ dir: "desc", field: "name" }]);
        await settle(fixture);
        root.querySelector<HTMLElement>("tbody tr[monaGridRow] [data-field='name']")!.closest("td")!.focus();

        type("b");
        expect(focusedName()).toBe("berry");

        host.filter.set([{ filters: [{ field: "name", operator: "neq", value: "berry" }], logic: "and" }]);
        await settle(fixture);
        root.querySelector<HTMLElement>("tbody tr[monaGridRow] [data-field='name']")!.closest("td")!.focus();
        type("b");
        await settle(fixture);

        expect(focusedName()).toBe("Banana");
        expect(host.selectedKeys()).toEqual([2]);
    });

    it("moves the focus without selecting when the keyboard moves by cell", async () => {
        host.navigation.set("cell");
        await settle(fixture);
        nameCell(root, "Apple").focus();

        type("ch");
        await settle(fixture);

        expect(focusedName()).toBe("Cherry");
        expect(host.selectedKeys()).toEqual([]);
    });

    it("takes a row's text from a function", async () => {
        host.textField.set(file => String(file.size));
        await settle(fixture);

        type("3");
        await settle(fixture);

        expect(focusedName()).toBe("apricot");
    });

    it("has no typeahead without a text field", async () => {
        host.textField.set(null);
        await settle(fixture);

        const event = press("b");
        await settle(fixture);

        expect(event.defaultPrevented).toBe(false);
        expect(focusedName()).toBe("Apple");
    });

    it("leaves keys typed into a control inside a cell to it", async () => {
        const input = nameCell(root, "Apple").closest("tr")!.querySelector<HTMLInputElement>("input.tag")!;
        input.focus();

        const event = press("b");
        await settle(fixture);

        expect(event.defaultPrevented).toBe(false);
        expect(document.activeElement).toBe(input);
        expect(host.selectedKeys()).toEqual([]);
    });

    it("ignores keys on the column headers", async () => {
        root.querySelector<HTMLElement>("thead th[role='columnheader']")!.focus();

        const event = press("b");
        await settle(fixture);

        expect(event.defaultPrevented).toBe(false);
        expect(document.activeElement?.closest("thead")).not.toBeNull();
    });
});

describe("grid typeahead while editing", () => {
    it("leaves keys typed into an editor to it", async () => {
        await TestBed.configureTestingModule({ imports: [EditableFileGridHostComponent] }).compileComponents();
        const fixture = TestBed.createComponent(EditableFileGridHostComponent);
        const root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        try {
            await settle(fixture);
            const apple = nameCell(root, "Apple");
            apple.focus();
            press("Enter");
            await settle(fixture);
            const editor = apple.querySelector<HTMLInputElement>("mona-grid-editor input");
            expect(editor).not.toBeNull();
            editor!.focus();

            const event = press("b");
            await settle(fixture);

            expect(event.defaultPrevented).toBe(false);
            expect(document.activeElement).toBe(editor);
        } finally {
            root.remove();
        }
    });
});

describe("virtual grid typeahead", () => {
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
        nameCell(root, "Apple").focus();
    });

    afterEach(() => {
        root.remove();
        clientHeight.mockRestore();
        scrollTo.mockRestore();
    });

    it("searches every row, scrolls to one that isn't drawn, and selects it", async () => {
        type("file 80");
        await settle(fixture);
        await settle(fixture);

        expect(viewport().scrollTop).toBeGreaterThan(0);
        expect(focusedName()).toBe("File 80");
        expect(host.selectedKeys()).toEqual([80]);
    });

    it("goes on from the row it is scrolling to when the next key comes before the row is drawn", async () => {
        type("b");
        expect(focusedName()).toBe("Apple");
        type("b");
        await settle(fixture);
        await settle(fixture);

        expect(focusedName()).toBe("Berry");
        expect(host.selectedKeys()).toEqual([601]);
    });
});
