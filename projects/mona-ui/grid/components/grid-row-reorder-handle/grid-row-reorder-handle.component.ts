import { LiveAnnouncer } from "@angular/cdk/a11y";
import { CdkDragHandle } from "@angular/cdk/drag-drop";
import { Component, computed, inject, input } from "@angular/core";
import type { Row } from "../../models/Row";
import { GridService } from "../../services/grid.service";
import { gridRowReorderHandleThemeVariants } from "../../styles/grid.styles";

@Component({
    selector: "mona-grid-row-reorder-handle",
    templateUrl: "./grid-row-reorder-handle.component.html",
    imports: [CdkDragHandle],
    host: {
        "(click)": "$event.stopPropagation()",
        "(contextmenu)": "$event.stopPropagation()",
        "(dblclick)": "$event.stopPropagation()"
    }
})
export class GridRowReorderHandleComponent {
    readonly #gridService = inject(GridService);
    readonly #liveAnnouncer = inject(LiveAnnouncer);
    protected readonly ariaLabel = computed(() => {
        const absoluteIndex = this.pageIndex() + this.#gridService.paginationState().skip;
        const label = this.#gridService.getRowReorderAriaLabel(this.row(), absoluteIndex);
        const reasonText = this.disabledReasonText();
        const messages = this.#gridService.messages();
        return messages.rowReorderHandleAriaLabel(label, messages.rowReorderKeyboardHint, reasonText ?? undefined);
    });
    protected readonly disabled = computed(() => !this.#gridService.canReorderRow(this.row()));
    protected readonly disabledReasonText = computed(() => {
        const reason = this.#gridService.rowReorderDisabledReason();
        const messages = this.#gridService.messages();

        switch (reason) {
            case null:
                return null;
            case "disabled":
                return messages.rowReorderDisabled;
            case "editing":
                return messages.rowReorderDisabledEditing;
            case "filtered":
                return messages.rowReorderDisabledFiltered;
            case "grouped":
                return messages.rowReorderDisabledGrouped;
            case "single-row":
                return messages.rowReorderDisabledSingleRow;
            case "sorted":
                return messages.rowReorderDisabledSorted;
            case "virtual-scroll":
                return messages.rowReorderDisabledVirtualScroll;
        }
    });
    protected readonly handleClass = computed(() => gridRowReorderHandleThemeVariants());

    /**
     * @description The row's position within the current page, used to move the row and derive its accessible label.
     */
    public readonly pageIndex = input.required<number>();

    /**
     * @description The grid row whose reorder handle this button controls.
     */
    public readonly row = input.required<Row>();

    protected onKeydown(event: KeyboardEvent): void {
        if ((event.key !== "ArrowUp" && event.key !== "ArrowDown") || !event.altKey) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const direction = event.key === "ArrowUp" ? -1 : 1;
        const targetIndex = this.pageIndex() + direction;
        if (targetIndex < 0 || targetIndex >= this.#gridService.viewPageRows().length) {
            return;
        }
        const moved = this.#gridService.requestRowReorder(this.row(), this.pageIndex(), targetIndex);
        if (moved) {
            const skip = this.#gridService.paginationState().skip;
            const fromRowNumber = skip + this.pageIndex() + 1;
            const toPosition = skip + targetIndex + 1;
            this.#liveAnnouncer.announce(
                this.#gridService.messages().rowReorderMoved(fromRowNumber, toPosition)
            );
        }
    }
}
