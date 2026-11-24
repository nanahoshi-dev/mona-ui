import { Component, signal, type Type } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridResizableDirective } from "../directives/grid-resizable.directive";
import { GridStatePersistenceDirective } from "../directives/grid-state-persistence.directive";
import type { GridState } from "../models/GridState";
import type { ResizeMethod } from "../models/ResizeMethod";

/** Stands in for the browser's ResizeObserver, which jsdom lacks, so a test can say when sizes change. */
class FakeResizeObserver {
    readonly #callback: ResizeObserverCallback;
    public static readonly instances = new Set<FakeResizeObserver>();
    public readonly observed = new Set<Element>();

    public constructor(callback: ResizeObserverCallback) {
        this.#callback = callback;
        FakeResizeObserver.instances.add(this);
    }

    public static observes(target: Element): boolean {
        return [...FakeResizeObserver.instances].some(observer => observer.observed.has(target));
    }

    public static resize(): void {
        for (const observer of FakeResizeObserver.instances) {
            observer.#callback([], observer as unknown as ResizeObserver);
        }
    }

    public disconnect(): void {
        FakeResizeObserver.instances.delete(this);
        this.observed.clear();
    }

    public observe(target: Element): void {
        this.observed.add(target);
    }

    public unobserve(target: Element): void {
        this.observed.delete(target);
    }
}

interface ColumnSpec {
    readonly field: string;
    readonly width?: number;
}

interface FileRow {
    readonly modified: string;
    readonly name: string;
    readonly size: number;
    readonly type: string;
}

/** Mona Explorer's file list: a Name column that fills the row, and three fixed ones (400px in all). */
const FILE_LIST_COLUMNS: readonly ColumnSpec[] = [
    { field: "name" },
    { field: "modified", width: 160 },
    { field: "type", width: 140 },
    { field: "size", width: 100 }
];

/** Two columns that share the row, beside a fixed one of 100px. */
const SHARED_COLUMNS: readonly ColumnSpec[] = [{ field: "name" }, { field: "type" }, { field: "size", width: 100 }];

const ROWS: readonly FileRow[] = [
    { modified: "2026-11-24", name: "notes.txt", size: 12, type: "Text Document" },
    { modified: "2026-11-23", name: "photo.png", size: 2048, type: "PNG File" }
];

@Component({
    imports: [GridColumnComponent, GridComponent, GridResizableDirective],
    template: `
        <mona-grid aria-label="Files" monaGridResizable [data]="rows" [resizeMethod]="resizeMethod()">
            @for (column of columns(); track column.field) {
                <mona-grid-column [field]="column.field" [title]="column.field" [width]="column.width" />
            }
        </mona-grid>
    `
})
class FitViewHostComponent {
    public readonly columns = signal<readonly ColumnSpec[]>(FILE_LIST_COLUMNS);
    public readonly resizeMethod = signal<ResizeMethod>("fitView");
    public readonly rows = ROWS;
}

@Component({
    imports: [GridColumnComponent, GridComponent, GridStatePersistenceDirective],
    template: `
        <mona-grid aria-label="Files" monaGridStatePersistence [data]="rows" [(state)]="state">
            <mona-grid-column field="name" title="Name" />
            <mona-grid-column field="type" title="Type" />
            <mona-grid-column field="size" title="Size" [width]="100" />
        </mona-grid>
    `
})
class RestoredStateHostComponent {
    public readonly rows = ROWS;
    public readonly state = signal<GridState | null>({
        columns: [
            { hidden: false, id: "name", order: 0, width: 250 },
            { hidden: false, id: "type", order: 1, width: 150 },
            { hidden: false, id: "size", order: 2, width: 100 }
        ],
        filter: [],
        group: [],
        sort: [],
        version: 1
    });
}

describe("grid fitView column widths", () => {
    let clientWidth: MockInstance<() => number>;
    let fixture: ComponentFixture<unknown>;
    let headerWidth = 900;
    let root: HTMLElement;

    /** The grid's header, which the columns are fitted to: the first part of the grid element. */
    function isGridHeader(element: Element): boolean {
        const parent = element.parentElement;
        return parent != null && parent.matches("[role='grid']") && parent.firstElementChild === element;
    }

    function gridHeader(): HTMLElement {
        const header = root.querySelector<HTMLElement>("[role='grid'] > :first-child");
        if (header == null) {
            throw new Error("Expected the grid header");
        }
        return header;
    }

    /** The widths of the header's columns, in order. */
    function columnWidths(): number[] {
        const table = root.querySelector("thead")?.closest("table");
        if (table == null) {
            throw new Error("Expected the header table");
        }
        return Array.from(table.querySelectorAll<HTMLTableColElement>("colgroup > col")).map(col =>
            Number.parseFloat(col.style.width)
        );
    }

    function resizeHandle(title: string): HTMLElement {
        const handle = root.querySelector<HTMLElement>(`[role='separator'][aria-label='Resize ${title}']`);
        if (handle == null) {
            throw new Error(`Expected the resize handle of ${title}`);
        }
        return handle;
    }

    async function settle(): Promise<void> {
        for (let pass = 0; pass < 3; pass++) {
            fixture.detectChanges();
            await fixture.whenStable();
            await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
        }
        fixture.detectChanges();
    }

    async function create<T>(component: Type<T>, configure: (host: T) => void = (): void => undefined): Promise<void> {
        await TestBed.configureTestingModule({ imports: [component] }).compileComponents();
        const created = TestBed.createComponent(component);
        fixture = created;
        root = created.nativeElement as HTMLElement;
        document.body.appendChild(root);
        configure(created.componentInstance);
        await settle();
    }

    async function resizeHeaderTo(width: number): Promise<void> {
        headerWidth = width;
        FakeResizeObserver.resize();
        await settle();
    }

    beforeEach(() => {
        vi.stubGlobal("ResizeObserver", FakeResizeObserver);
        headerWidth = 900;
        // jsdom has no layout: the grid's header is as wide as the test says, and everything else has no width.
        clientWidth = vi.spyOn(Element.prototype, "clientWidth", "get").mockImplementation(function (this: Element) {
            return isGridHeader(this) ? headerWidth : 0;
        });
    });

    afterEach(() => {
        fixture?.destroy();
        root?.remove();
        clientWidth.mockRestore();
        vi.unstubAllGlobals();
        FakeResizeObserver.instances.clear();
    });

    it("gives the columns without a width what the fixed columns leave", async () => {
        await create(FitViewHostComponent);

        expect(columnWidths()).toEqual([500, 160, 140, 100]);
    });

    it("shrinks them when the grid gets narrower", async () => {
        await create(FitViewHostComponent);

        await resizeHeaderTo(600);

        expect(columnWidths()).toEqual([200, 160, 140, 100]);
    });

    it("widens them when the grid gets wider", async () => {
        headerWidth = 440;
        await create(FitViewHostComponent);
        expect(columnWidths()).toEqual([40, 160, 140, 100]);

        await resizeHeaderTo(1280);

        expect(columnWidths()).toEqual([880, 160, 140, 100]);
    });

    it("stops at minWidth when the grid gets too narrow for them", async () => {
        await create(FitViewHostComponent);

        await resizeHeaderTo(420);

        expect(columnWidths()).toEqual([40, 160, 140, 100]);
    });

    it("shares the new width among several columns without a width", async () => {
        await create(FitViewHostComponent, host => host.columns.set(SHARED_COLUMNS));
        expect(columnWidths()).toEqual([400, 400, 100]);

        await resizeHeaderTo(700);

        expect(columnWidths()).toEqual([300, 300, 100]);
    });

    it("keeps the width of a column the user resized, and fits the others around it", async () => {
        headerWidth = 700;
        await create(FitViewHostComponent, host => host.columns.set(SHARED_COLUMNS));
        resizeHandle("name").dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
        await settle();
        expect(columnWidths()).toEqual([310, 300, 100]);

        await resizeHeaderTo(1000);
        expect(columnWidths()).toEqual([310, 590, 100]);

        await resizeHeaderTo(600);
        expect(columnWidths()).toEqual([310, 190, 100]);
    });

    it("fits the width the grid has by the next render, however often it changed before it", async () => {
        await create(FitViewHostComponent);

        headerWidth = 500;
        FakeResizeObserver.resize();
        headerWidth = 700;
        FakeResizeObserver.resize();
        await settle();

        expect(columnWidths()).toEqual([300, 160, 140, 100]);
    });

    it("keeps the widths while the grid is hidden, and fits them when it's shown", async () => {
        await create(FitViewHostComponent);

        await resizeHeaderTo(0);
        expect(columnWidths()).toEqual([500, 160, 140, 100]);

        await resizeHeaderTo(800);
        expect(columnWidths()).toEqual([400, 160, 140, 100]);
    });

    it("leaves the widths alone with another resizeMethod", async () => {
        await create(FitViewHostComponent, host => host.resizeMethod.set(120));
        expect(columnWidths()).toEqual([120, 160, 140, 100]);

        await resizeHeaderTo(600);

        expect(columnWidths()).toEqual([120, 160, 140, 100]);
    });

    it("keeps widths restored from saved state", async () => {
        await create(RestoredStateHostComponent);
        expect(columnWidths()).toEqual([250, 150, 100]);

        await resizeHeaderTo(1200);

        expect(columnWidths()).toEqual([250, 150, 100]);
    });

    it("stops watching the grid's width once the grid is destroyed", async () => {
        await create(FitViewHostComponent);
        const header = gridHeader();
        expect(FakeResizeObserver.observes(header)).toBe(true);

        fixture.destroy();

        expect(FakeResizeObserver.observes(header)).toBe(false);
    });
});
