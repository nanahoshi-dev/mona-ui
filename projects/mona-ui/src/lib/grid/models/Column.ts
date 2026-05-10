import { signal, TemplateRef } from "@angular/core";
import { DataType } from "../../models/DataType";
import { SortDirection } from "../../query/sort/SortDescriptor";

export interface ColumnConfig {
    cellTemplate: TemplateRef<unknown> | null;
    dataType: DataType;
    editable: boolean;
    field: string;
    maxWidth: number | null;
    minWidth: number;
    title: string;
    titleTemplate: TemplateRef<unknown> | null;
    width: number | null;
}

export class Column {
    readonly #calculatedWidth = signal<number | null>(null);
    readonly #cellTemplate = signal<TemplateRef<unknown> | null>(null);
    readonly #columnSortDirection = signal<SortDirection | null>(null);
    readonly #dataType = signal<DataType>("string");
    readonly #editable = signal(false);
    readonly #field = signal("");
    readonly #filtered = signal(false);
    readonly #groupSortDirection = signal<SortDirection | null>(null);
    readonly #index = signal(0);
    readonly #maxWidth = signal<number | null>(null);
    readonly #minWidth = signal(40);
    readonly #sortIndex = signal<number | null>(null);
    readonly #title = signal("");
    readonly #titleTemplate = signal<TemplateRef<unknown> | null>(null);
    readonly #width = signal<number | null>(null);

    public readonly calculatedWidth = this.#calculatedWidth.asReadonly();
    public readonly cellTemplate = this.#cellTemplate.asReadonly();
    public readonly columnSortDirection = this.#columnSortDirection.asReadonly();
    public readonly dataType = this.#dataType.asReadonly();
    public readonly editable = this.#editable.asReadonly();
    public readonly field = this.#field.asReadonly();
    public readonly filtered = this.#filtered.asReadonly();
    public readonly groupSortDirection = this.#groupSortDirection.asReadonly();
    public readonly index = this.#index.asReadonly();
    public readonly maxWidth = this.#maxWidth.asReadonly();
    public readonly minWidth = this.#minWidth.asReadonly();
    public readonly sortIndex = this.#sortIndex.asReadonly();
    public readonly title = this.#title.asReadonly();
    public readonly titleTemplate = this.#titleTemplate.asReadonly();
    public readonly width = this.#width.asReadonly();

    /** @internal */
    public setCalculatedWidth(value: number | null): void {
        this.#calculatedWidth.set(value);
    }

    /** @internal */
    public setColumnSortDirection(value: SortDirection | null): void {
        this.#columnSortDirection.set(value);
    }

    /** @internal */
    public setConfig(config: ColumnConfig): void {
        this.#cellTemplate.set(config.cellTemplate);
        this.#dataType.set(config.dataType);
        this.#editable.set(config.editable);
        this.#field.set(config.field);
        this.#maxWidth.set(config.maxWidth);
        this.#minWidth.set(config.minWidth);
        this.#title.set(config.title);
        this.#titleTemplate.set(config.titleTemplate);
        this.#width.set(config.width);
    }

    /** @internal */
    public setFiltered(value: boolean): void {
        this.#filtered.set(value);
    }

    /** @internal */
    public setGroupSortDirection(value: SortDirection | null): void {
        this.#groupSortDirection.set(value);
    }

    /** @internal */
    public setIndex(value: number): void {
        this.#index.set(value);
    }

    /** @internal */
    public setSortIndex(value: number | null): void {
        this.#sortIndex.set(value);
    }
}
