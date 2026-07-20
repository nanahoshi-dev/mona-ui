import { computed, Directive, ElementRef, inject, input } from "@angular/core";
import type { Column } from "../models/Column";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "td[monaGridLockedCell], th[monaGridLockedCell]",
    host: {
        "[style.position]": "position()",
        "[style.left.px]": "leftOffset()",
        "[style.right.px]": "rightOffset()",
        "[style.z-index]": "zIndex()",
        "[class.bg-header-background]": "headerLocked() || footerCell",
        "[class.bg-inherit]": "bodyLocked()",
        "[style.border-left]": "borderLeft()",
        "[style.border-right]": "borderRight()"
    }
})
export class GridLockedCellDirective {
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #gridService = inject(GridService);
    protected readonly bodyLocked = computed(() => this.state() != null && !this.lockedCellHeader());
    protected readonly borderLeft = computed(() => {
        if (!this.rightEdge()) {
            return null;
        }
        return `1px solid var(--color-border)`;
    });
    protected readonly borderRight = computed(() => {
        if (!this.leftEdge()) {
            return null;
        }
        return `1px solid var(--color-border)`;
    });
    protected readonly footerCell = this.#hostElementRef.nativeElement.hasAttribute("monaGridFooterTableCell");
    protected readonly headerLocked = computed(() => this.state() != null && this.lockedCellHeader());
    protected readonly leftEdge = computed(() => {
        const state = this.state();
        return state?.side === "left" && state.edge;
    });
    protected readonly leftOffset = computed(() => {
        const state = this.state();
        return state?.side === "left" ? state.offset : null;
    });
    protected readonly position = computed(() => (this.state() == null ? null : "sticky"));
    protected readonly rightEdge = computed(() => {
        const state = this.state();
        return state?.side === "right" && state.edge;
    });
    protected readonly rightOffset = computed(() => {
        const state = this.state();
        return state?.side === "right" ? state.offset : null;
    });
    protected readonly state = computed(() => {
        const column = this.column();
        if (column != null) {
            return this.#gridService.lockedColumnStates().get(column.id) ?? null;
        }

        const structuralOffset = this.lockedStructuralOffset();
        if (structuralOffset == null || !this.#gridService.hasLeftLockedColumns()) {
            return null;
        }
        return {
            edge: false,
            offset: structuralOffset,
            side: "left" as const
        };
    });
    protected readonly zIndex = computed(() => {
        if (this.state() == null) {
            return null;
        }
        return this.lockedCellHeader() ? 4 : 2;
    });

    public readonly column = input<Column>();
    public readonly lockedCellHeader = input(false);
    public readonly lockedStructuralOffset = input<number | null>(null);
}
