import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, signal, viewChild } from "@angular/core";
import { type ComponentFixture, DeferBlockState, TestBed } from "@angular/core/testing";
import type { CompositeFilterDescriptor, SortDescriptor } from "@nanahoshi/mona-ui/query";
import axe from "axe-core";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridExportDirective } from "../directives/grid-export.directive";
import { GridFilterableDirective } from "../directives/grid-filterable.directive";
import { GridSortableDirective } from "../directives/grid-sortable.directive";
import { GridTreeDirective } from "../directives/grid-tree.directive";
import { readZip } from "../services/testing/read-zip";

interface Employee {
    id: number;
    name: string;
    reports?: Employee[];
    title: string;
}

interface FlatEmployee {
    id: number;
    managerId: number | null;
    name: string;
}

const STAFF: Employee[] = [
    {
        id: 1,
        name: "Ada",
        reports: [
            { id: 2, name: "Ben", reports: [{ id: 4, name: "Dee", title: "Engineer" }], title: "Lead" },
            { id: 3, name: "Cal", title: "Designer" }
        ],
        title: "CTO"
    },
    { id: 5, name: "Eve", title: "CFO" }
];

const FLAT_STAFF: FlatEmployee[] = [
    { id: 1, managerId: null, name: "Ada" },
    { id: 2, managerId: 1, name: "Ben" },
    { id: 3, managerId: 1, name: "Cal" },
    { id: 4, managerId: 9, name: "Orphan" }
];

@Component({
    imports: [
        GridColumnComponent,
        GridComponent,
        GridExportDirective,
        GridFilterableDirective,
        GridSortableDirective,
        GridTreeDirective
    ],
    template: `
        <mona-grid
            aria-label="Staff"
            [data]="rows()"
            [rowKey]="'id'"
            [pageSize]="pageSize()"
            [pageSizeValues]="[]"
            [responsivePager]="false"
            monaGridTree
            children="reports"
            [treeExpandedKeys]="expandedKeys()"
            (treeExpandedKeysChange)="changes.push($event)"
            monaGridSortable
            [sort]="sort()"
            monaGridFilterable
            [filter]="filter()"
            monaGridExport>
            <mona-grid-column field="id" title="Id" type="number" [width]="60" />
            <mona-grid-column field="name" title="Name" [width]="160" [expandable]="true" />
            <mona-grid-column field="title" title="Title" [width]="140" />
        </mona-grid>
    `
})
class TreeHostComponent {
    public readonly changes: unknown[][] = [];
    public readonly expandedKeys = signal<unknown[]>([]);
    public readonly exporter = viewChild.required(GridExportDirective);
    public readonly filter = signal<CompositeFilterDescriptor[]>([]);
    public readonly pageSize = signal(10);
    public readonly rows = signal<Employee[]>(STAFF);
    public readonly sort = signal<SortDescriptor[]>([]);
    public readonly tree = viewChild.required(GridTreeDirective);
}

@Component({
    imports: [GridColumnComponent, GridComponent, GridTreeDirective],
    template: `
        <mona-grid
            aria-label="Staff"
            [data]="rows"
            [rowKey]="'id'"
            [pageSizeValues]="[]"
            [responsivePager]="false"
            monaGridTree
            parentKey="managerId"
            [treeExpandedKeys]="[1]">
            <mona-grid-column field="name" title="Name" [width]="160" />
            <mona-grid-column field="id" title="Id" type="number" [width]="60" />
        </mona-grid>
    `
})
class FlatTreeHostComponent {
    public readonly rows = FLAT_STAFF;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    for (const block of await fixture.getDeferBlocks()) {
        await block.render(DeferBlockState.Complete);
    }
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function bodyRows(fixture: ComponentFixture<unknown>): HTMLTableRowElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLTableRowElement>("tr[monaGridRow]"));
}

/** Each shown row as its name, indented by two spaces per level below the root. */
function outline(fixture: ComponentFixture<unknown>): string[] {
    return bodyRows(fixture).map(row => {
        const level = Number(row.getAttribute("aria-level"));
        const name = row.querySelector("[data-field='name']")?.textContent?.trim() ?? "";
        return `${"  ".repeat(level - 1)}${name}`;
    });
}

function rowNamed(fixture: ComponentFixture<unknown>, name: string): HTMLTableRowElement {
    const row = bodyRows(fixture).find(row => row.querySelector("[data-field='name']")?.textContent?.trim() === name);
    if (row == null) {
        throw new Error(`No row named ${name}`);
    }
    return row;
}

function nameCell(row: HTMLTableRowElement): HTMLTableCellElement {
    return row.querySelector<HTMLElement>("[data-field='name']")!.closest("td")!;
}

function press(element: HTMLElement, key: string): void {
    element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
}

describe("grid tree", () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: LiveAnnouncer, useValue: { announce: vi.fn().mockResolvedValue(undefined) } }]
        });
    });

    afterEach(() => vi.restoreAllMocks());

    describe("with nested children", () => {
        let fixture: ComponentFixture<TreeHostComponent>;

        beforeEach(async () => {
            fixture = TestBed.createComponent(TreeHostComponent);
            document.body.append(fixture.nativeElement as HTMLElement);
            await settle(fixture);
        });

        afterEach(() => {
            fixture.destroy();
            (fixture.nativeElement as HTMLElement).remove();
        });

        it("shows the root rows collapsed, as a treegrid", () => {
            expect(outline(fixture)).toEqual(["Ada", "Eve"]);
            expect((fixture.nativeElement as HTMLElement).querySelector("[role='treegrid']")).not.toBeNull();
            const ada = rowNamed(fixture, "Ada");
            expect(ada.getAttribute("aria-expanded")).toBe("false");
            expect(ada.getAttribute("aria-posinset")).toBe("1");
            expect(ada.getAttribute("aria-setsize")).toBe("2");
            // Eve has no children, so there's nothing to expand.
            expect(rowNamed(fixture, "Eve").hasAttribute("aria-expanded")).toBe(false);
        });

        it("expands a row from its toggle and reports the expanded keys", async () => {
            nameCell(rowNamed(fixture, "Ada")).querySelector<HTMLElement>("[data-grid-tree-toggle]")!.click();
            await settle(fixture);

            expect(outline(fixture)).toEqual(["Ada", "  Ben", "  Cal", "Eve"]);
            expect(rowNamed(fixture, "Ada").getAttribute("aria-expanded")).toBe("true");
            expect(fixture.componentInstance.changes).toEqual([[1]]);
        });

        it("puts the toggles in the expandable column and indents its cells by level", async () => {
            fixture.componentInstance.expandedKeys.set([1]);
            await settle(fixture);

            const ben = rowNamed(fixture, "Ben");
            expect(ben.querySelector("[data-field='id'] [data-grid-tree-toggle]")).toBeNull();
            expect(nameCell(ben).querySelector("[data-grid-tree-toggle]")).not.toBeNull();
            const indent = nameCell(ben).querySelector<HTMLElement>("[data-field='name'] > span")!;
            expect(indent.style.width).toBe("1.25rem");
        });

        it("starts with the rows of treeExpandedKeys expanded, without reporting a change", async () => {
            fixture.componentInstance.expandedKeys.set([1, 2]);
            await settle(fixture);

            expect(outline(fixture)).toEqual(["Ada", "  Ben", "    Dee", "  Cal", "Eve"]);
            expect(fixture.componentInstance.changes).toEqual([]);
        });

        it("expands with ArrowRight and collapses with ArrowLeft on the tree cell", async () => {
            const cell = nameCell(rowNamed(fixture, "Ada"));
            cell.focus();
            press(cell, "ArrowRight");
            await settle(fixture);
            expect(outline(fixture)).toEqual(["Ada", "  Ben", "  Cal", "Eve"]);

            press(nameCell(rowNamed(fixture, "Ada")), "ArrowLeft");
            await settle(fixture);
            expect(outline(fixture)).toEqual(["Ada", "Eve"]);
        });

        it("moves along the row with ArrowRight on a row without children", async () => {
            fixture.componentInstance.expandedKeys.set([1]);
            await settle(fixture);
            const cell = nameCell(rowNamed(fixture, "Cal"));
            cell.focus();

            press(cell, "ArrowRight");
            await settle(fixture);

            expect(document.activeElement?.querySelector("[data-field='title']")).not.toBeNull();
        });

        it("sorts each parent's children on their own", async () => {
            fixture.componentInstance.expandedKeys.set([1, 2]);
            fixture.componentInstance.sort.set([{ dir: "desc", field: "name" }]);
            await settle(fixture);

            expect(outline(fixture)).toEqual(["Eve", "Ada", "  Cal", "  Ben", "    Dee"]);
        });

        it("keeps the rows above each filter match, and expands them", async () => {
            fixture.componentInstance.filter.set([
                { filters: [{ field: "name", operator: "eq", value: "Dee" }], logic: "and" }
            ]);
            await settle(fixture);

            expect(outline(fixture)).toEqual(["Ada", "  Ben", "    Dee"]);
            expect(fixture.componentInstance.changes.at(-1)?.sort()).toEqual([1, 2]);
        });

        it("pages through the shown rows", async () => {
            fixture.componentInstance.pageSize.set(2);
            fixture.componentInstance.expandedKeys.set([1]);
            await settle(fixture);

            expect(outline(fixture)).toEqual(["Ada", "  Ben"]);
        });

        it("expands and collapses every row from code", async () => {
            fixture.componentInstance.tree().expandAll();
            await settle(fixture);
            expect(outline(fixture)).toEqual(["Ada", "  Ben", "    Dee", "  Cal", "Eve"]);
            expect(fixture.componentInstance.changes.at(-1)?.sort()).toEqual([1, 2]);

            fixture.componentInstance.tree().collapseAll();
            await settle(fixture);
            expect(outline(fixture)).toEqual(["Ada", "Eve"]);
            expect(fixture.componentInstance.changes.at(-1)).toEqual([]);
        });

        it("exports every row, collapsed or not, as an outline with the tree column indented", async () => {
            const blobs: Blob[] = [];
            Object.assign(URL, {
                createObjectURL: (blob: Blob) => {
                    blobs.push(blob);
                    return "blob:export";
                },
                revokeObjectURL: () => undefined
            });
            vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

            await fixture.componentInstance.exporter().exportExcel();
            const files = await readZip(new Uint8Array(await blobs[0].arrayBuffer()));
            const sheet = files.get("xl/worksheets/sheet1.xml") ?? "";

            expect(sheet).toContain(`<sheetPr><outlinePr summaryBelow="0"/></sheetPr>`);
            expect(sheet).toContain(`outlineLevelRow="2"`);
            expect(sheet).toMatch(/<row r="4" outlineLevel="2">.*Dee/);
            expect(files.get("xl/styles.xml")).toContain(`<alignment indent="2"/>`);

            fixture.componentInstance.exporter().exportCsv();
            const csv = await blobs[1].text();
            expect(csv.split("\r\n").map(line => line.split(",")[1])).toEqual([
                "Name",
                "Ada",
                "Ben",
                "Dee",
                "Cal",
                "Eve"
            ]);
        });

        it("passes axe with rows expanded", async () => {
            fixture.componentInstance.expandedKeys.set([1, 2]);
            await settle(fixture);

            const results = await axe.run(fixture.nativeElement as HTMLElement, {
                rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
            });

            expect(results.violations.map(violation => violation.id)).toEqual([]);
        });
    });

    describe("with flat data and parent keys", () => {
        let fixture: ComponentFixture<FlatTreeHostComponent>;

        beforeEach(async () => {
            fixture = TestBed.createComponent(FlatTreeHostComponent);
            document.body.append(fixture.nativeElement as HTMLElement);
            await settle(fixture);
        });

        afterEach(() => {
            fixture.destroy();
            (fixture.nativeElement as HTMLElement).remove();
        });

        it("nests each row under the row its parent key names, and puts rows with no such parent at the root", () => {
            expect(outline(fixture)).toEqual(["Ada", "  Ben", "  Cal", "Orphan"]);
        });

        it("puts the toggles in the first data column when no column is expandable", () => {
            expect(nameCell(rowNamed(fixture, "Ada")).querySelector("[data-grid-tree-toggle]")).not.toBeNull();
        });

        it("moves from a child row to its parent with ArrowLeft at the start of the row", async () => {
            const cell = nameCell(rowNamed(fixture, "Cal"));
            cell.focus();

            press(cell, "ArrowLeft");
            await settle(fixture);

            expect(document.activeElement).toBe(nameCell(rowNamed(fixture, "Ada")));
        });
    });
});
