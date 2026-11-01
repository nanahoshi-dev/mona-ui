import { computed, Directive, ElementRef, inject, input } from "@angular/core";
import { GridService } from "../services/grid.service";

const STICKY_EDGE_BORDER = "1px solid var(--color-border)";

/**
 * Pins a cell while the grid scrolls horizontally, using the sticky state of its layout column.
 * Offsets and separator borders use logical properties so pinning follows the text direction.
 */
@Directive({
    selector: "td[monaGridLockedCell], th[monaGridLockedCell]",
    host: {
        "[style.position]": "state() == null ? null : 'sticky'",
        "[style.inset-inline-start.px]": "startOffset()",
        "[style.inset-inline-end.px]": "endOffset()",
        "[style.z-index]": "zIndex()",
        "[class.bg-header-background]": "headerLocked() || footerCell",
        "[class.bg-inherit]": "bodyLocked()",
        "[style.border-inline-start]": "endEdge() ? stickyEdgeBorder : null",
        "[style.border-inline-end]": "startEdge() ? stickyEdgeBorder : null"
    }
})
export class GridLockedCellDirective {
    readonly #gridService = inject(GridService);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    protected readonly bodyLocked = computed(() => this.state() != null && !this.lockedCellHeader());
    protected readonly endEdge = computed(() => this.state()?.side === "end" && this.state()?.edge === true);
    protected readonly endOffset = computed(() => {
        const state = this.state();
        return state?.side === "end" ? state.offset : null;
    });
    protected readonly footerCell = this.#hostElementRef.nativeElement.hasAttribute("monaGridFooterTableCell");
    protected readonly headerLocked = computed(() => this.state() != null && this.lockedCellHeader());
    protected readonly startEdge = computed(() => this.state()?.side === "start" && this.state()?.edge === true);
    protected readonly startOffset = computed(() => {
        const state = this.state();
        return state?.side === "start" ? state.offset : null;
    });
    protected readonly state = computed(() => {
        const layoutKey = this.layoutKey();
        return layoutKey ? (this.#gridService.layoutColumnByKey().get(layoutKey)?.sticky ?? null) : null;
    });
    protected readonly stickyEdgeBorder = STICKY_EDGE_BORDER;
    protected readonly zIndex = computed(() => {
        if (this.state() == null) {
            return null;
        }
        return this.lockedCellHeader() ? 4 : 2;
    });

    /**
     * The key of the layout column whose sticky state this cell follows, such as `column:<id>`,
     * `structural:selection` or `group:0`.
     */
    public readonly layoutKey = input<string | null>(null, { alias: "monaGridLockedCell" });
    public readonly lockedCellHeader = input(false);
}
