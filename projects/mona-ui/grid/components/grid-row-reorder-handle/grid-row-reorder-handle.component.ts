import { LiveAnnouncer } from "@angular/cdk/a11y";
import { CdkDragHandle } from "@angular/cdk/drag-drop";
import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import type { Row } from "../../models/Row";
import type { RowReorderDisabledReason } from "../../services/grid.service";
import { GridService } from "../../services/grid.service";
import { gridRowReorderHandleThemeVariants } from "../../styles/grid.styles";

const ROW_REORDER_DISABLED_REASON_TEXT: Record<Exclude<RowReorderDisabledReason, null>, string> = {
    disabled: "Row reordering is disabled.",
    editing: "Finish editing to reorder rows.",
    filtered: "Clear filters to reorder rows.",
    grouped: "Clear grouping to reorder rows.",
    "single-row": "At least two rows are needed to reorder.",
    sorted: "Clear sorting to reorder rows.",
    "virtual-scroll": "Row reordering isn't available while virtual scrolling is enabled."
};

@Component({
    selector: "mona-grid-row-reorder-handle",
    templateUrl: "./grid-row-reorder-handle.component.html",
    imports: [CdkDragHandle],
    changeDetection: ChangeDetectionStrategy.OnPush,
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
        const suffix = reasonText == null ? "" : ` ${reasonText}`;
        return `${label}. Use Alt plus Up Arrow or Alt plus Down Arrow to move.${suffix}`;
    });
    protected readonly disabled = computed(() => !this.#gridService.canReorderRow(this.row()));
    protected readonly disabledReasonText = computed(() => {
        const reason = this.#gridService.rowReorderDisabledReason();
        return reason == null ? null : ROW_REORDER_DISABLED_REASON_TEXT[reason];
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
            this.#liveAnnouncer.announce(
                `Moved row ${skip + this.pageIndex() + 1} to position ${skip + targetIndex + 1}.`
            );
        }
    }
}
