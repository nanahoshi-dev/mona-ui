import { Component, DestroyRef, inject, type OnInit, signal } from "@angular/core";
import {
    GridColumnComponent,
    GridComponent,
    type GridDataState,
    GridFilterableDirective,
    GridServerBindingDirective,
    GridSortableDirective
} from "@nanahoshi/mona-ui/grid";
import { type CompositeFilterDescriptor, Query, type SortDescriptor } from "@nanahoshi/mona-ui/query";

interface Customer {
    id: number;
    name: string;
    orders: number;
}

interface CustomerPage {
    data: Customer[];
    total: number;
}

const CUSTOMERS: Customer[] = Array.from({ length: 87 }, (_, index) => ({
    id: index + 1,
    name: `Customer ${String(index + 1).padStart(2, "0")}`,
    orders: (index * 37) % 50
}));

/** Stands in for a server: it filters and sorts every record, then returns one page after a short wait. */
async function fetchCustomers(state: GridDataState): Promise<CustomerPage> {
    await new Promise<void>(resolve => setTimeout(resolve, 400));
    let query = Query.from(CUSTOMERS);
    for (const filter of state.filter) {
        query = query.filter(filter);
    }
    const rows = query.sort(state.sort).run();
    return { data: rows.slice(state.skip, state.skip + state.take), total: rows.length };
}

@Component({
    selector: "app-grid-server-server-example",
    imports: [
        GridColumnComponent,
        GridComponent,
        GridFilterableDirective,
        GridServerBindingDirective,
        GridSortableDirective
    ],
    templateUrl: "./server-example.component.html"
})
export class GridServerExampleComponent implements OnInit {
    readonly #destroyRef = inject(DestroyRef);
    #requestId = 0;
    protected readonly filter = signal<CompositeFilterDescriptor[]>([]);
    protected readonly loading = signal(false);
    protected readonly result = signal<CustomerPage>({ data: [], total: 0 });
    protected readonly sort = signal<SortDescriptor[]>([]);
    protected readonly state = signal<GridDataState>({ skip: 0, take: 10, sort: [], filter: [] });

    public ngOnInit(): void {
        void this.load(this.state());
    }

    /** Loads the requested page, and ignores a response when a newer request has started. */
    protected async load(state: GridDataState): Promise<void> {
        const requestId = ++this.#requestId;
        this.state.set(state);
        this.loading.set(true);
        try {
            const result = await fetchCustomers(state);
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
