import { PreventableEvent } from "@nanahoshi/mona-ui/common";

export class RowReorderEvent<
    TData extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>
> extends PreventableEvent {
    readonly #options: RowReorderEventOptions<TData>;

    public constructor(options: RowReorderEventOptions<TData>) {
        super("rowReorder");
        this.#options = options;
    }

    public get currentIndex(): number {
        return this.#options.currentIndex;
    }

    public get currentPageIndex(): number {
        return this.#options.currentPageIndex;
    }

    public get previousIndex(): number {
        return this.#options.previousIndex;
    }

    public get previousPageIndex(): number {
        return this.#options.previousPageIndex;
    }

    public get reorderedData(): readonly TData[] {
        return this.#options.reorderedData;
    }

    public get rowData(): TData {
        return this.#options.rowData;
    }
}

export interface RowReorderEventOptions<
    TData extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>
> {
    currentIndex: number;
    currentPageIndex: number;
    previousIndex: number;
    previousPageIndex: number;
    reorderedData: readonly TData[];
    rowData: TData;
}
