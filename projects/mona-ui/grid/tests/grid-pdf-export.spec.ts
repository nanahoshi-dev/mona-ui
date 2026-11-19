import { Component, viewChild } from "@angular/core";
import { type ComponentFixture, DeferBlockState, TestBed } from "@angular/core/testing";
import { GridColumnGroupComponent } from "../components/grid-column-group/grid-column-group.component";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridCommandColumnComponent } from "../components/grid-command-column/grid-command-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridExportDirective } from "../directives/grid-export.directive";
import { GridSortableDirective } from "../directives/grid-sortable.directive";
import { createTestFont } from "../services/testing/create-test-font";
import { readPdf, shownText } from "../services/testing/read-pdf";

interface OrderRow {
    amount: number;
    customer: string;
    id: number;
    secret: string;
    shipped: Date;
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
            <mona-grid-column field="id" title="Id" type="number" [width]="60" />
            <mona-grid-column-group title="Order">
                <mona-grid-column field="customer" title="Customer" [width]="140" />
                <mona-grid-column field="amount" title="Amount" type="number" [width]="100" />
                <mona-grid-column field="secret" title="Secret" hidden />
                <mona-grid-command-column />
            </mona-grid-column-group>
            <mona-grid-column field="shipped" title="Shipped" type="date" [width]="120" />
        </mona-grid>
    `
})
class HostComponent {
    public readonly exporter = viewChild.required(GridExportDirective);
    public readonly rows: OrderRow[] = [
        { amount: 10, customer: "Ann", id: 1, secret: "x", shipped: new Date(2024, 0, 3) },
        { amount: 20, customer: "漢字", id: 2, secret: "y", shipped: new Date(2024, 1, 3) }
    ];
}

describe("grid PDF export", () => {
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

    async function exported(): Promise<Awaited<ReturnType<typeof readPdf>>> {
        return readPdf(new Uint8Array(await blobs[0].arrayBuffer()));
    }

    function firstPage(pdf: Awaited<ReturnType<typeof readPdf>>): string {
        const page = [...pdf.objects.values()].find(body => body.includes("/Type /Page "))!;
        return pdf.streams.get(Number(/\/Contents (\d+) 0 R/.exec(page)![1]))!;
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

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("downloads export.pdf as a PDF, or the name given", async () => {
        await fixture.componentInstance.exporter().exportPdf();
        await fixture.componentInstance.exporter().exportPdf("orders.pdf");
        await fixture.componentInstance.exporter().exportPdf({ filename: "q1.pdf" });

        expect(downloads).toEqual(["export.pdf", "orders.pdf", "q1.pdf"]);
        expect(blobs[0].type).toBe("application/pdf");
    });

    it("prints the column group over its columns, the titles, and every row of the sorted view as shown", async () => {
        await fixture.componentInstance.exporter().exportPdf();

        // No hidden or command column, every page of rows, and the date as the grid shows it. Id and Shipped span both
        // header rows, so they're drawn with the first. Without a font, the Chinese characters print as question marks.
        expect(shownText(firstPage(await exported()))).toEqual([
            "Order",
            "Id",
            "Shipped",
            "Customer",
            "Amount",
            "2",
            "??",
            "20",
            "02/03/2024",
            "1",
            "Ann",
            "10",
            "01/03/2024",
            "1 / 1"
        ]);
    });

    it("prints on landscape pages of the chosen size", async () => {
        await fixture.componentInstance.exporter().exportPdf({ orientation: "landscape", paperSize: "Letter" });

        const pdf = await exported();
        expect([...pdf.objects.values()].find(body => body.includes("/Type /Page "))).toContain(
            "/MediaBox [0 0 792 612]"
        );
    });

    it("embeds a font given as bytes for the text Helvetica can't show", async () => {
        const font = createTestFont({
            glyphs: [
                { codePoint: 0x6f22, width: 1000 },
                { codePoint: 0x5b57, width: 1000 }
            ]
        });

        await fixture.componentInstance.exporter().exportPdf({ font: { regular: font } });

        const pdf = await exported();
        expect(firstPage(pdf)).toContain("<00010002> Tj");
        expect([...pdf.objects.values()].some(body => body.includes("/FontFile2"))).toBe(true);
    });

    it("fetches a font given as a URL", async () => {
        const font = createTestFont({ glyphs: [{ codePoint: 0x6f22, width: 1000 }] });
        const fetch = vi.fn().mockResolvedValue(new Response(font as Uint8Array<ArrayBuffer>));
        vi.stubGlobal("fetch", fetch);

        await fixture.componentInstance.exporter().exportPdf({ font: { regular: "/fonts/test.ttf" } });

        expect(fetch).toHaveBeenCalledWith("/fonts/test.ttf");
        expect(firstPage(await exported())).toContain("<0001");
    });

    it("rejects, without a download, when the font can't be read", async () => {
        const cff = new Uint8Array([0x4f, 0x54, 0x54, 0x4f, 0, 0, 0, 0]);

        await expect(fixture.componentInstance.exporter().exportPdf({ font: { regular: cff } })).rejects.toThrow(
            /CFF outlines/
        );
        expect(downloads).toEqual([]);
    });
});
