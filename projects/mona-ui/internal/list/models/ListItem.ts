import { v4 } from "uuid";

export interface ListItemOptions<T> {
    data: T;
    header?: string;
    /**
     * Marks the item as a group header. Defaults to `true` when a non-empty `header` is given.
     * Set it explicitly for groups whose key is empty, which still need a header row.
     */
    isHeader?: boolean;
}

export class ListItem<TData> {
    public readonly data: TData;
    public readonly header: string = "";
    public readonly isHeader: boolean;
    public readonly uid: string = v4();

    public constructor(options: ListItemOptions<TData>) {
        this.data = options.data;
        this.header = options.header ?? this.header;
        this.isHeader = options.isHeader ?? this.header !== "";
    }
}
