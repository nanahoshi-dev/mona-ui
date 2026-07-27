import { computed, Directive, effect, inject, input, untracked } from "@angular/core";
import { CollapsibleToken } from "@nanahoshi/mona-ui/collapsible";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { SidebarService } from "../services/sidebar.service";
import { sidebarMenuItemThemeVariants } from "../styles/sidebar.styles";

@Directive({
    selector: "li[monaSidebarMenuItem]",
    host: {
        "[attr.data-active]": "active() ? 'true' : null",
        "[class]": "baseClass()"
    }
})
export class SidebarMenuItemDirective {
    // Applying `monaCollapsible` to the same element turns the item into a disclosure row, so it has to
    // stack its trigger and submenu instead of laying them out side by side.
    readonly #collapsible = inject(CollapsibleToken, { optional: true, self: true });
    readonly #sidebarService = inject(SidebarService, { optional: true });
    #expandedBeforeRail = false;
    protected readonly baseClass = computed(() => {
        const variantClass = sidebarMenuItemThemeVariants({
            collapsible: this.#collapsible !== null,
            iconOnly: this.#sidebarService?.iconOnly() ?? false
        });
        return twMerge(variantClass, this.userClass());
    });

    /**
     * @description Marks this row as the current sidebar destination. The row owns the selected
     * surface so trailing badges and actions remain inside one continuous highlight.
     * @default false
     */
    public readonly active = input(false);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });

    public constructor() {
        this.#keepSubmenuClosedOnRail();
    }

    /**
     * A submenu cannot render in a rail one icon wide, and the previous answer — hiding it with
     * `display: none` — left the trigger still reporting `aria-expanded="true"` for something that was
     * not there. A screen reader user could open a submenu and be told it was open while nothing
     * appeared, and tab straight into its items.
     *
     * Closing the disclosure for real keeps the trigger's own state truthful and lets the collapsible
     * content directive apply the `inert` it already applies when closed. The prior state is restored
     * on the way back out, so collapsing and expanding the sidebar does not quietly discard it.
     */
    #keepSubmenuClosedOnRail(): void {
        const collapsible = this.#collapsible;
        if (!collapsible) {
            return;
        }
        // Tracked separately from the signal so the two cases can be told apart: arriving on the rail
        // with the submenu already open, which is worth restoring, and trying to open it while on the
        // rail, which is not.
        let onRail = false;

        effect(() => {
            const iconOnly = this.#sidebarService?.iconOnly() ?? false;
            const expanded = collapsible.expanded();
            untracked(() => {
                if (iconOnly) {
                    if (expanded) {
                        this.#expandedBeforeRail ||= !onRail;
                        collapsible.collapse();
                    }
                    onRail = true;
                    return;
                }
                if (!onRail) {
                    return;
                }
                onRail = false;
                if (this.#expandedBeforeRail) {
                    this.#expandedBeforeRail = false;
                    collapsible.expand();
                }
            });
        });
    }
}
