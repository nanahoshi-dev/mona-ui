import { Component, signal, viewChild } from "@angular/core";
import { type ComponentFixture, DeferBlockState, TestBed } from "@angular/core/testing";
import type { SortDescriptor } from "@nanahoshi/mona-ui/query";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridCommandColumnComponent } from "../components/grid-command-column/grid-command-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridExportDirective } from "../directives/grid-export.directive";
import { GridSortableDirective } from "../directives/grid-sortable.directive";
import { GridStatePersistenceDirective } from "../directives/grid-state-persistence.directive";
import type { GridState, GridStatePersistenceOptions } from "../models/GridState";

interface ExportRow {
    amount: number | null;
    id: number;
    name: string;
    secret: string;
    shipped: Date | null;
}

@Component({
    imports: [
        GridColumnComponent,
        GridCommandColumnComponent,
        GridComponent,
        GridExportDirective,
        GridSortableDirective,
        GridStatePersistenceDirective
    ],
    template: `
        <mona-grid
            aria-label="Orders"
            [data]="rows()"
            [rowKey]="'id'"
            [pageSize]="2"
            [pageSizeValues]="[]"
            [responsivePager]="false"
            monaGridSortable
            [(sort)]="sort"
            monaGridExport
            [monaGridStatePersistence]="persistence()"
            [(state)]="state">
            <mona-grid-column field="id" title="Id" type="number" [width]="80"></mona-grid-column>
            <mona-grid-column field="name" title="Name" [width]="140"></mona-grid-column>
            <mona-grid-column field="amount" title="Amount" type="number" [width]="100"></mona-grid-column>
            <mona-grid-column field="shipped" title="Shipped" type="date" [width]="140"></mona-grid-column>
            <mona-grid-column field="secret" title="Secret" hidden></mona-grid-column>
            <mona-grid-command-column></mona-grid-command-column>
        </mona-grid>
    `
})
class HostComponent {
    public readonly exporter = viewChild.required(GridExportDirective);
    public readonly persistence = signal<GridStatePersistenceOptions>({});
    public readonly persister = viewChild.required(GridStatePersistenceDirective);
    public readonly rows = signal<ExportRow[]>([
        { amount: 10, id: 1, name: "Ann", secret: "x", shipped: new Date(2024, 0, 3, 23, 30) },
        { amount: null, id: 2, name: '=HYPERLINK("x")', secret: "y", shipped: null },
        { amount: 3.5, id: 3, name: 'Bob "B", Jr.', secret: "z", shipped: new Date(2024, 11, 31) }
    ]);
    public readonly sort = signal<SortDescriptor[]>([]);
    public readonly state = signal<GridState | null>(null);
}

describe("grid state persistence and CSV export", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

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

    function create(state: GridState | null = null, persistence: GridStatePersistenceOptions = {}): Promise<void> {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        host.state.set(state);
        host.persistence.set(persistence);
        return settle();
    }

    function bodyNames(): string[] {
        return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("tbody [data-field='name']")).map(
            cell => cell.textContent?.trim() ?? ""
        );
    }

    describe("state persistence", () => {
        it("reports user changes through state", async () => {
            await create();
            host.sort.set([{ dir: "desc", field: "id" }]);
            await settle();

            expect(host.state()?.sort).toEqual([{ dir: "desc", field: "id" }]);
            expect(host.state()?.columns.map(column => column.id)).toContain("name");
        });

        it("applies a saved state on the first render", async () => {
            await create({ columns: [], filter: [], group: [], sort: [{ dir: "desc", field: "id" }], version: 1 });

            expect(host.sort()).toEqual([{ dir: "desc", field: "id" }]);
            expect(bodyNames()[0]).toBe('Bob "B", Jr.');
        });

        it("applies a state set later, and rejects one that isn't well-formed", async () => {
            await create();
            host.state.set({ columns: [], filter: [], group: [], sort: [{ dir: "asc", field: "name" }], version: 1 });
            await settle();
            expect(host.sort()).toEqual([{ dir: "asc", field: "name" }]);

            const result = host.persister().loadState({ version: 1 } as unknown as GridState);
            expect(result.status).toBe("rejected-invalid");
            expect(host.sort()).toEqual([{ dir: "asc", field: "name" }]);
        });

        it("neither loads nor reports state while disabled", async () => {
            await create(
                { columns: [], filter: [], group: [], sort: [{ dir: "desc", field: "id" }], version: 1 },
                {
                    enabled: false
                }
            );
            expect(host.sort()).toEqual([]);

            host.sort.set([{ dir: "asc", field: "name" }]);
            await settle();
            expect(host.state()?.sort).toEqual([{ dir: "desc", field: "id" }]);
        });
    });

    describe("CSV export", () => {
        let blobs: Blob[];
        let downloads: string[];

        beforeEach(() => {
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
        });

        afterEach(() => vi.restoreAllMocks());

        it("writes every row of the sorted view, without hidden or command columns, safely quoted", async () => {
            await create();
            host.sort.set([{ dir: "desc", field: "id" }]);
            await settle();

            host.exporter().exportCsv();
            // Decoding drops the byte order mark, so it is checked in the bytes.
            const bytes = new Uint8Array(await blobs[0].arrayBuffer());
            const lines = (await blobs[0].text()).split("\r\n");

            expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
            expect(downloads).toEqual(["export.csv"]);
            expect(lines).toEqual([
                "Id,Name,Amount,Shipped",
                '3,"Bob ""B"", Jr.",3.5,2024-12-31',
                '2,"\'=HYPERLINK(""x"")",,',
                "1,Ann,10,2024-01-03"
            ]);
        });

        it("uses the given file name", async () => {
            await create();
            host.exporter().exportCsv("orders.csv");
            expect(downloads).toEqual(["orders.csv"]);
        });
    });
});
