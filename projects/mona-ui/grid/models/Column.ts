import type { TemplateRef } from "@angular/core";
import type { DataType } from "@mirei/mona-ui/common";
import type { SortDirection } from "@mirei/mona-ui/query";
import type { AggregateFunction } from "./AggregateFunction";
import type { GridColumnLockedPosition } from "./GridColumnLockedPosition";

export type ColumnKind = "command" | "data";
export type ColumnFormat = string | ((column: Column) => string);

export interface ColumnConfig {
    readonly aggregate: AggregateFunction | null;
    readonly cellTemplate: TemplateRef<unknown> | null;
    readonly commandTemplate: TemplateRef<unknown> | null;
    readonly dataType: DataType;
    readonly editTemplate: TemplateRef<unknown> | null;
    readonly editable: boolean;
    readonly field: string;
    readonly format: ColumnFormat | null;
    readonly footerTemplate: TemplateRef<unknown> | null;
    readonly groupFooterTemplate: TemplateRef<unknown> | null;
    readonly headerTemplate: TemplateRef<unknown> | null;
    readonly hidden: boolean;
    readonly id: string;
    readonly kind: ColumnKind;
    readonly locked: boolean;
    readonly lockedPosition: GridColumnLockedPosition;
    readonly maxWidth: number | null;
    readonly minWidth: number | null;
    readonly removeConfirmation: boolean;
    readonly stateKey: string | null;
    readonly title: string;
    readonly titleTemplate: TemplateRef<unknown> | null;
    readonly width: number | null;
}

export interface Column extends ColumnConfig {
    readonly calculatedWidth: number | null;
    readonly columnSortDirection: SortDirection | null;
    readonly configuredHidden: boolean;
    readonly filtered: boolean;
    readonly groupSortDirection: SortDirection | null;
    readonly hidden: boolean;
    readonly index: number;
    readonly sortIndex: number | null;
}
