import type { DialogService } from "@nanahoshi/mona-ui/dialog";
import { take } from "rxjs";
import type { Row } from "../models/Row";
import type { GridNavigationService } from "./grid-navigation.service";
import type { GridService } from "./grid.service";

/** The delete dialog's confirming action, told apart by this id rather than by its (translated) text. */
const DELETE_ACTION = "delete";

export interface GridRowRemoval {
    readonly confirm: boolean;
    /** An element inside the row's cell. The cell takes focus first, so focus moves on to the nearest row's. */
    readonly element: HTMLElement;
    readonly event?: Event;
    readonly row: Row;
}

/**
 * Removes a row the way the built-in remove command does: after the user confirms, when `confirm` is set, and with
 * focus kept in the grid when the row leaves it. The command cell and `monaGridRemoveCommand` share it.
 */
export function removeGridRow(
    services: {
        readonly dialogService: DialogService;
        readonly gridNavigationService: GridNavigationService;
        readonly gridService: GridService;
    },
    removal: GridRowRemoval
): void {
    const { dialogService, gridNavigationService, gridService } = services;
    const remove = (): void => {
        (removal.element.closest("td") as HTMLElement | null)?.focus();
        if (gridService.removeRow(removal.row, removal.event)) {
            gridNavigationService.refocusAfterRender();
        }
    };
    if (!removal.confirm) {
        remove();
        return;
    }
    const messages = gridService.messages();
    const dialogRef = dialogService.show({
        actions: [
            { data: DELETE_ACTION, look: "error", text: messages.delete },
            { look: "default", text: messages.cancel }
        ],
        closeOnEscape: true,
        text: messages.deleteRowConfirmation(gridService.getRowNumber(removal.row)),
        title: messages.deleteRowTitle,
        type: "warning",
        modal: true,
        width: 360
    });
    dialogRef.result.pipe(take(1)).subscribe(result => {
        if (!result.viaClose && result.action.data === DELETE_ACTION) {
            remove();
        }
    });
}
