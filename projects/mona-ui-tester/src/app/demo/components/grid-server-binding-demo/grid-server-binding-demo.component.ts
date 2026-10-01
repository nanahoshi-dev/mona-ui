import { Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { JsonPipe } from "@angular/common";
import { range } from "@mirei/ts-collections";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    GridColumnComponent,
    GridComponent,
    GridExportDirective,
    GridFilterableDirective,
    GridServerBindingDirective,
    GridSortableDirective,
    type GridDataState
} from "@nanahoshi/mona-ui/grid";
import { Query, type CompositeFilterDescriptor, type SortDescriptor } from "@nanahoshi/mona-ui/query";

const users = Array.from(range(0, 137), index => ({
    id: index + 1,
    name: `User ${String(index + 1).padStart(3, "0")}`
}));

/** A mock repository processes the full dataset outside the Grid and returns only a page. */
async function requestPage(state: GridDataState) {
    await new Promise<void>(resolve => setTimeout(resolve, 250));
    let query = Query.from(users);
    for (const filter of state.filter) {
        query = query.filter(filter);
    }
    if (state.sort.length > 0) {
        query = query.sort([...state.sort]);
    }
    const result = query.run();
    return { data: result.slice(state.skip, state.skip + state.take), total: result.length };
}

@Component({
    selector: "app-grid-server-binding-demo",
    imports: [
        JsonPipe,
        ButtonDirective,
        GridExportDirective,
        GridComponent,
        GridColumnComponent,
        GridServerBindingDirective,
        GridSortableDirective,
        GridFilterableDirective
    ],
    template: `<section id="server-binding" class="my-6 space-y-3">
        <h3 class="text-lg font-medium">Server paging, sorting, and filtering</h3>
        <p>The mock server owns all 137 users; the grid receives only the requested page.</p>
        <mona-grid
            class="h-96 w-full"
            [data]="result().data"
            [pageSize]="state().take"
            [pageSizeValues]="[10, 20, 50]"
            [responsivePager]="false"
            [resizeMethod]="'auto'"
            monaGridServerBinding
            monaGridExport
            #export="monaGridExport"
            [total]="result().total"
            [skip]="state().skip"
            [loading]="loading()"
            monaGridSortable
            [(sort)]="sort"
            [monaGridFilterable]="{ enabled: true, type: 'row' }"
            [(filter)]="filter"
            (dataStateChange)="load($event)">
            <mona-grid-column field="id" title="ID" type="number" [width]="100" />
            <mona-grid-column field="name" title="User" [width]="300" />
        </mona-grid>
        <button monaButton (click)="export.exportCsv('server-page.csv')">Export loaded page</button>
        <p data-request-count>Requests: {{ requests() }}</p>
        <pre class="text-xs overflow-auto" data-request-state>{{ state() | json }}</pre>
    </section>`
})
export class GridServerBindingDemoComponent implements OnInit {
    readonly #destroyRef = inject(DestroyRef);
    #requestId = 0;
    protected readonly filter = signal<CompositeFilterDescriptor[]>([]);
    protected readonly loading = signal(false);
    protected readonly requests = signal(0);
    protected readonly result = signal({ data: users.slice(40, 50), total: users.length });
    protected readonly sort = signal<SortDescriptor[]>([]);
    protected readonly state = signal<GridDataState>({ skip: 40, take: 10, sort: [], filter: [] });

    public ngOnInit(): void {
        void this.load(this.state());
    }

    protected async load(state: GridDataState): Promise<void> {
        const requestId = ++this.#requestId;
        this.requests.update(count => count + 1);
        this.state.set(state);
        this.loading.set(true);
        try {
            const result = await requestPage(state);
            if (!this.#destroyRef.destroyed && requestId === this.#requestId) {
                this.result.set(result);
            }
        } finally {
            if (!this.#destroyRef.destroyed && requestId === this.#requestId) {
                this.loading.set(false);
            }
        }
    }
}
