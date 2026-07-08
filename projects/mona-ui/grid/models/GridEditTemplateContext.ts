import type { FieldTree, ValidationError } from "@angular/forms/signals";
import type { GridEditSession } from "./GridEditSession";

export interface GridEditTemplateContext {
    readonly cancel: () => void;
    readonly column: string;
    readonly commit: () => void;
    readonly dataField: string;
    readonly dataItem: Record<PropertyKey, unknown>;
    readonly errors: readonly ValidationError.WithFieldTree[];
    readonly field: FieldTree<unknown>;
    readonly form: GridEditSession["form"];
    readonly invalid: boolean;
    readonly isNew: boolean;
    readonly session: GridEditSession;
    readonly setValue: (value: unknown) => void;
    readonly touched: boolean;
    readonly value: unknown;
}
