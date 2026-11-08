import { Directive, ElementRef, inject, input } from "@angular/core";
import { DialogService } from "@nanahoshi/mona-ui/dialog";
import { GridCommandColumnComponent } from "../components/grid-command-column/grid-command-column.component";
import { Row } from "../models/Row";
import { GridNavigationService } from "../services/grid-navigation.service";
import { removeGridRow } from "../services/grid-row-removal";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "button[monaGridAddCommand]",
    host: {
        "(click)": "onClick($event)"
    }
})
export class GridAddCommandDirective {
    readonly #gridService = inject(GridService);

    protected onClick(event: Event): void {
        this.#gridService.startAddRow(event);
    }
}

@Directive({
    selector: "button[monaGridEditCommand]",
    host: {
        "(click)": "onClick($event)"
    }
})
export class GridEditCommandDirective {
    readonly #gridService = inject(GridService);
    /**
     * @description The row the button puts into row edit mode when clicked, usually the command template's `row`.
     * Does nothing while `null` or when the grid isn't in row edit mode.
     */
    public readonly row = input<Row | null>(null, { alias: "monaGridEditCommand" });

    protected onClick(event: Event): void {
        const row = this.row();
        if (row != null) {
            this.#gridService.startRowEdit(row, event);
        }
    }
}

@Directive({
    selector: "button[monaGridRemoveCommand]",
    host: {
        "(click)": "onClick($event)"
    }
})
export class GridRemoveCommandDirective {
    readonly #column = inject(GridCommandColumnComponent, { optional: true });
    readonly #dialogService = inject(DialogService);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #gridService = inject(GridService);
    /**
     * @description The row the button removes when clicked, usually the command template's `row`. The click emits the
     * grid's `remove` event for that row. Inside a command column with `removeConfirmation`, it asks first, as the
     * built-in remove command does. Does nothing while `null`.
     */
    public readonly row = input<Row | null>(null, { alias: "monaGridRemoveCommand" });

    protected onClick(event: Event): void {
        const row = this.row();
        if (row == null) {
            return;
        }
        removeGridRow(
            {
                dialogService: this.#dialogService,
                gridNavigationService: this.#gridNavigationService,
                gridService: this.#gridService
            },
            {
                confirm: this.#column?.removeConfirmation() ?? false,
                element: this.#elementRef.nativeElement,
                event,
                row
            }
        );
    }
}

@Directive({
    selector: "button[monaGridSaveCommand]",
    host: {
        "(click)": "onClick($event)"
    }
})
export class GridSaveCommandDirective {
    readonly #gridService = inject(GridService);

    protected onClick(event: Event): void {
        if (this.#gridService.addRowVisible()) {
            this.#gridService.saveAddRow(event);
            return;
        }
        this.#gridService.commitRowEdit(event);
    }
}

@Directive({
    selector: "button[monaGridCancelCommand]",
    host: {
        "(click)": "onClick($event)"
    }
})
export class GridCancelCommandDirective {
    readonly #gridService = inject(GridService);

    protected onClick(event: Event): void {
        if (this.#gridService.addRowVisible()) {
            this.#gridService.cancelAddRow(event);
            return;
        }
        this.#gridService.cancelEdit(event);
    }
}
