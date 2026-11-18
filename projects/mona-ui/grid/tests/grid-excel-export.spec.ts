import { Component, viewChild } from "@angular/core";
import { type ComponentFixture, DeferBlockState, TestBed } from "@angular/core/testing";
import { GridColumnGroupComponent } from "../components/grid-column-group/grid-column-group.component";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridCommandColumnComponent } from "../components/grid-command-column/grid-command-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridExportDirective } from "../directives/grid-export.directive";
import { GridSortableDirective } from "../directives/grid-sortable.directive";
import { GridService } from "../services/grid.service";
import { readZip } from "../services/testing/read-zip";

const SPREADSHEET_NAMESPACE = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";

interface OrderRow {
    amount: number | null;
    customer: string;
    id: number;
    note: string;
    paid: boolean;
    secret: string;
    shipped: Date | null;
}

@Component({
    imports: [
        GridColumnComponent,
        GridColumnGroupComponent,
        GridCommandColumnComponent,
        GridComponent,
        GridExportDirective,
        GridSortableDirective
    ],
    template: `
        <mona-grid
            aria-label="Orders"
            [data]="rows"
            [pageSize]="1"
            [pageSizeValues]="[]"
            [responsivePager]="false"
            monaGridSortable
            [sort]="[{ dir: 'desc', field: 'id' }]"
            monaGridExport>
            <mona-grid-column field="id" title="Id" type="number" [width]="60" [locked]="true" />
            <mona-grid-column-group title="Order">
                <mona-grid-column field="customer" title="Customer" [width]="140" />
                <mona-grid-column-group title="Payment">
                    <mona-grid-column field="amount" title="Amount" type="number" [width]="100" />
                    <mona-grid-column field="paid" title="Paid" type="boolean" [width]="80" />
                </mona-grid-column-group>
                <mona-grid-column field="secret" title="Secret" hidden />
                <mona-grid-command-column />
            </mona-grid-column-group>
            <mona-grid-column field="shipped" title="Shipped" type="date" [width]="120" />
            <mona-grid-column field="note" title="Note" type="number" [width]="120" />
        </mona-grid>
    `
})
class HostComponent {
    public readonly exporter = viewChild.required(GridExportDirective);
    public readonly rows: OrderRow[] = [
        {
            amount: 10,
            customer: "Ann",
            id: 1,
            note: "n/a",
            paid: true,
            secret: "x",
            shipped: new Date(2024, 0, 3, 23, 30)
        },
        { amount: null, customer: '=HYPERLINK("x")', id: 2, note: "", paid: false, secret: "y", shipped: null }
    ];
}

describe("grid Excel export", () => {
    let fixture: ComponentFixture<HostComponent>;
    let blobs: Blob[];
    let downloads: string[];

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

    async function exportedFiles(filename?: string): Promise<Map<string, string>> {
        await fixture.componentInstance.exporter().exportExcel(filename);
        return readZip(new Uint8Array(await blobs[0].arrayBuffer()));
    }

    async function exportedSheet(): Promise<Document> {
        const files = await exportedFiles();
        return new DOMParser().parseFromString(files.get("xl/worksheets/sheet1.xml") ?? "", "application/xml");
    }

    /** Each row's cells as `reference=value`, with `:s` for the cell's style where it has one. */
    function rows(document: Document): string[][] {
        return Array.from(document.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "row")).map(row =>
            Array.from(row.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "c")).map(cell => {
                const style = cell.getAttribute("s");
                return `${cell.getAttribute("r")}=${cell.textContent}${style == null ? "" : `:${style}`}`;
            })
        );
    }

    beforeEach(async () => {
        blobs = [];
        downloads = [];
        Object.assign(URL, {
            createObjectURL: (blob: Blob) => {
                blobs.push(blob);
                return "blob:export";
            },
            revokeObjectURL: () => undefined
        });
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
            downloads.push(this.download);
        });
        fixture = TestBed.createComponent(HostComponent);
        await settle();
    });

    afterEach(() => vi.restoreAllMocks());

    it("downloads a workbook named after the file, with the spreadsheet type", async () => {
        const files = await exportedFiles("orders.xlsx");

        expect(downloads).toEqual(["orders.xlsx"]);
        expect(blobs[0].type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        expect(files.get("xl/workbook.xml")).toContain(`<sheet name="orders"`);
    });

    it("uses export.xlsx when no name is given", async () => {
        await exportedFiles();

        expect(downloads).toEqual(["export.xlsx"]);
    });

    it("writes the column groups as merged cells above the titles, and every row of the sorted view", async () => {
        const document = await exportedSheet();

        // Id, Customer, Amount, Paid, Shipped, Note: no hidden or command column, and every page.
        expect(rows(document)).toEqual([
            ["A1=Id:1", "B1=Order:2", "E1=Shipped:1", "F1=Note:1"],
            ["B2=Customer:1", "C2=Payment:2"],
            ["C3=Amount:1", "D3=Paid:1"],
            ["A4=2", 'B4==HYPERLINK("x")', "D4=0"],
            ["A5=1", "B5=Ann", "C5=10", "D5=1", "E5=45294:3", "F5=n/a"]
        ]);
        const merges = Array.from(document.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "mergeCell")).map(merge =>
            merge.getAttribute("ref")
        );
        expect(merges).toEqual(["B1:D1", "C2:D2", "A1:A3", "B2:B3", "E1:E3", "F1:F3"]);
    });

    it("keeps values typed where the column's type and the value agree", async () => {
        const document = await exportedSheet();
        const cell = (reference: string): Element | undefined =>
            Array.from(document.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "c")).find(
                candidate => candidate.getAttribute("r") === reference
            );

        expect(cell("C5")?.getAttribute("t")).toBeNull();
        expect(cell("D5")?.getAttribute("t")).toBe("b");
        // A text value in a number column stays text; an empty one leaves the cell empty.
        expect(cell("F5")?.getAttribute("t")).toBe("inlineStr");
        expect(cell("F4")).toBeUndefined();
        expect(cell("B4")?.getAttribute("t")).toBe("inlineStr");
    });

    it("freezes the header rows and the locked column, with the grid's widths", async () => {
        const document = await exportedSheet();

        const pane = document.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "pane")[0];
        expect(pane.getAttribute("xSplit")).toBe("1");
        expect(pane.getAttribute("ySplit")).toBe("3");
        const widths = Array.from(document.getElementsByTagNameNS(SPREADSHEET_NAMESPACE, "col")).map(column =>
            column.getAttribute("width")
        );
        expect(widths).toEqual(["7.86", "19.29", "13.57", "10.71", "16.43", "16.43"]);
    });

    it("writes nothing when no column can be exported", async () => {
        const service = fixture.debugElement.children[0].injector.get(GridService);
        for (const column of service.columns()) {
            service.setColumnHidden(column.id, true);
        }

        await fixture.componentInstance.exporter().exportExcel();

        expect(blobs).toEqual([]);
        expect(downloads).toEqual([]);
    });
});
