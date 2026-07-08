import { Directive, inject, input } from "@angular/core";
import { Row } from "../models/Row";
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
    readonly #gridService = inject(GridService);
    public readonly row = input<Row | null>(null, { alias: "monaGridRemoveCommand" });

    protected onClick(event: Event): void {
        const row = this.row();
        if (row != null) {
            this.#gridService.removeRow(row, event);
        }
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
