import { signal, TemplateRef } from "@angular/core";
import { DataType } from "../../models/DataType";
import { SortDirection } from "../../query/sort/SortDescriptor";

export class Column {
    /**
     * Only used internally for column resizing
     */
    public readonly calculatedWidth = signal<number | undefined>(undefined);
    public readonly cellTemplate = signal<TemplateRef<any> | null>(null);
    public readonly columnSortDirection = signal<SortDirection | null>(null);
    public readonly dataType = signal<DataType>("string");
    public readonly editable = signal(false);
    public readonly field = signal("");
    public readonly filtered = signal(false);
    public readonly groupSortDirection = signal<SortDirection | null>(null);
    public readonly index = signal(0); // 0-based
    public readonly maxWidth = signal<number | null>(null);
    public readonly minWidth = signal(40);
    public readonly sortIndex = signal<number | null>(null); // 1-based
    public readonly title = signal("");
    public readonly titleTemplate = signal<TemplateRef<any> | null>(null);
    public readonly width = signal<number | undefined>(undefined);
}
