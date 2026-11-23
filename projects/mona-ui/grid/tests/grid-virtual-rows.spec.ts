import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import type { MockInstance } from "vitest";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridVirtualScrollDirective } from "../directives/grid-virtual-scroll.directive";

interface FileRow {
    id: number;
    name: string;
}

const ROW_HEIGHT = 28;
const VIEWPORT_HEIGHT = 280;
const VISIBLE_ROWS = VIEWPORT_HEIGHT / ROW_HEIGHT;

function createFiles(count: number, firstId = 1): FileRow[] {
    return Array.from({ length: count }, (_, i) => ({ id: firstId + i, name: `File ${firstId + i}` }));
}

@Component({
    imports: [GridColumnComponent, GridComponent, GridVirtualScrollDirective],
    template: `
        <mona-grid
            aria-label="Files"
            rowKey="id"
            [data]="rows()"
            [monaGridVirtualScroll]="{ height: 28 }"
            [resizeMethod]="120"
            (scrollEnd)="scrollEnds = scrollEnds + 1">
            <mona-grid-column field="id" title="Id" type="number" [width]="80" />
            <mona-grid-column field="name" title="Name" [width]="120" />
        </mona-grid>
    `
})
class VirtualRowsHostComponent {
    public readonly rows = signal(createFiles(1_000));
    public scrollEnds = 0;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    for (let pass = 0; pass < 3; pass++) {
        fixture.detectChanges();
        await fixture.whenStable();
        // The viewport reacts to scrolling on the next animation frame.
        await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
    }
    fixture.detectChanges();
}

function viewport(root: ParentNode): HTMLElement {
    const element = root.querySelector<HTMLElement>("cdk-virtual-scroll-viewport");
    if (element == null) {
        throw new Error("Expected the virtual scroll viewport");
    }
    return element;
}

function dataRows(root: ParentNode): HTMLTableRowElement[] {
    return Array.from(root.querySelectorAll<HTMLTableRowElement>("tbody tr[monaGridRow]"));
}

/** The ids the drawn rows show, in order. */
function drawnIds(root: ParentNode): number[] {
    return dataRows(root).map(row => Number(row.querySelector("[data-field='id']")?.textContent?.trim()));
}

async function scrollToRow(fixture: ComponentFixture<unknown>, rowIndex: number): Promise<void> {
    const element = viewport(fixture.nativeElement as ParentNode);
    element.scrollTop = rowIndex * ROW_HEIGHT;
    element.dispatchEvent(new Event("scroll"));
    await settle(fixture);
}

describe("virtual grid rows", () => {
    let fixture: ComponentFixture<VirtualRowsHostComponent>;
    let host: VirtualRowsHostComponent;
    let root: HTMLElement;
    let clientHeight: MockInstance<() => number>;

    beforeEach(async () => {
        // jsdom has no layout: give the viewport a height of ten rows.
        clientHeight = vi.spyOn(Element.prototype, "clientHeight", "get").mockImplementation(function (this: Element) {
            return this.tagName === "CDK-VIRTUAL-SCROLL-VIEWPORT" ? VIEWPORT_HEIGHT : 0;
        });
        await TestBed.configureTestingModule({ imports: [VirtualRowsHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(VirtualRowsHostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle(fixture);
    });

    afterEach(() => {
        root.remove();
        clientHeight.mockRestore();
    });

    it("draws the rows that fit the viewport and a few more, not another viewport's worth", () => {
        const ids = drawnIds(root);

        expect(ids[0]).toBe(1);
        expect(ids.length).toBeGreaterThan(VISIBLE_ROWS);
        expect(ids.length).toBeLessThan(VISIBLE_ROWS * 2);
    });

    it("shows the rows scrolled to in the row elements it already drew", async () => {
        // Away from the top, so there are rows drawn above the viewport as well as below it.
        await scrollToRow(fixture, 100);
        const before = new Set(dataRows(root));

        await scrollToRow(fixture, 500);

        const ids = drawnIds(root);
        expect(ids).toContain(501);
        expect(ids).not.toContain(101);
        expect(dataRows(root).every(row => before.has(row))).toBe(true);
    });

    it("emits scrollEnd once the last rows come within the threshold", async () => {
        await scrollToRow(fixture, 900);
        expect(host.scrollEnds).toBe(0);

        // Rows 986 to 995 are visible, five rows above the end: the default threshold.
        await scrollToRow(fixture, 985);
        expect(host.scrollEnds).toBe(1);
    });

    it("keeps the drawn rows when items are added at the end", async () => {
        const rowsBefore = dataRows(root);
        const uidsBefore = rowsBefore.map(row => row.getAttribute("data-ruid"));

        host.rows.set([...host.rows(), ...createFiles(100, 1_001)]);
        await settle(fixture);

        expect(dataRows(root).slice(0, rowsBefore.length)).toEqual(rowsBefore);
        expect(dataRows(root).map(row => row.getAttribute("data-ruid"))).toEqual(uidsBefore);
        await scrollToRow(fixture, 1_090);
        expect(drawnIds(root)).toContain(1_100);
    });

    it("shows a field changed in place when the same items are given again", async () => {
        const rows = host.rows();
        rows[0].name = "Renamed file";

        host.rows.set([...rows]);
        await settle(fixture);

        expect(dataRows(root)[0].textContent).toContain("Renamed file");
    });

    it("gives an added item that repeats a key a row of its own", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        try {
            host.rows.set([...host.rows(), { id: 1, name: "Copy of File 1" }]);
            await settle(fixture);
            await scrollToRow(fixture, 991);

            const last = dataRows(root).at(-1);
            const first = host.rows()[0];
            expect(last?.textContent).toContain("Copy of File 1");
            expect(last?.getAttribute("data-ruid")).not.toBe(`key:number:${first.id}`);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining("same rowKey value"));
        } finally {
            warn.mockRestore();
        }
    });

    it("gives an item whose key changed a new row identity, even when items are only added", async () => {
        const firstUid = dataRows(root)[0].getAttribute("data-ruid");
        const rows = host.rows();
        rows[0].id = 5_000;

        host.rows.set([...rows, ...createFiles(1, 1_001)]);
        await settle(fixture);

        expect(drawnIds(root)[0]).toBe(5_000);
        expect(dataRows(root)[0].getAttribute("data-ruid")).not.toBe(firstUid);
    });
});
