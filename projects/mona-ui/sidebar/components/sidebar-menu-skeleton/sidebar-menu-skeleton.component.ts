import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { SkeletonComponent } from "@nanahoshi/mona-ui/skeleton";
import { SidebarService } from "../../services/sidebar.service";

/**
 * @description
 * A loading placeholder shaped like a menu item. Drops its label bar on the icon rail, where the
 * real labels are not visible either.
 */
@Component({
    selector: "mona-sidebar-menu-skeleton",
    template: `
        @if (showIcon()) {
            <mona-skeleton width="1rem" height="1rem" rounded="small"></mona-skeleton>
        }
        <mona-skeleton [width]="labelWidth()" height="1rem" rounded="small"></mona-skeleton>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SkeletonComponent],
    host: {
        "[class]": "baseClass()"
    }
})
export class SidebarMenuSkeletonComponent {
    readonly #sidebarService = inject(SidebarService, { optional: true });
    // Laid out exactly like a real menu button so the two animate as one: the same inset centres the
    // icon square on the rail, and the same widened gap carries the label bar out of the clipped box.
    protected readonly baseClass = computed(() => {
        const shared =
            "flex h-8 w-full items-center overflow-hidden " +
            "transition-[gap,padding] duration-(--mona-motion-standard) ease-out motion-reduce:transition-none";
        return this.iconOnly() ? `${shared} gap-8 px-2` : `${shared} gap-2 px-1`;
    });
    protected readonly iconOnly = computed(() => this.#sidebarService?.iconOnly() ?? false);

    /**
     * @description Width of the label bar. Varying it across a list keeps the placeholder from looking
     * like a rigid grid. Numbers are treated as pixels.
     * @default "60%"
     */
    public readonly labelWidth = input<string | number>("60%");

    /**
     * @description Renders a square standing in for the item's icon.
     * @default true
     */
    public readonly showIcon = input(true);
}
