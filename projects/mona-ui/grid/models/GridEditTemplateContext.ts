import type { FieldTree, ValidationError } from "@angular/forms/signals";
import type { GridEditSession } from "./GridEditSession";

export interface GridEditTemplateContext {
    /** Cancels the current edit. */
    readonly cancel: () => void;
    /** The field name of the column being edited. */
    readonly column: string;
    /** Commits the current edit. */
    readonly commit: () => void;
    /** Same as `column`; the field name being edited. */
    readonly dataField: string;
    /** The row's current edited values. */
    readonly dataItem: Record<PropertyKey, unknown>;
    /** Validation errors for this field. */
    readonly errors: readonly ValidationError.WithFieldTree[];
    /** The Signal Forms field for this column. */
    readonly field: FieldTree<unknown>;
    /** The row's full Signal Forms field tree. */
    readonly form: GridEditSession["form"];
    /** Whether this field currently fails validation. */
    readonly invalid: boolean;
    /** Whether this is a new row being added. */
    readonly isNew: boolean;
    /** The full edit session for this row. */
    readonly session: GridEditSession;
    /** Sets this field's value. */
    readonly setValue: (value: unknown) => void;
    /** Whether this field has been touched. */
    readonly touched: boolean;
    /** This field's current value. */
    readonly value: unknown;
}
