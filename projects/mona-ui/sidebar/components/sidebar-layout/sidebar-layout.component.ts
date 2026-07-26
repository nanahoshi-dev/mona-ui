import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, untracked } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { SidebarService } from "../../services/sidebar.service";
import { sidebarLayoutBaseThemeVariants } from "../../styles/sidebar.styles";

/**
 * @description
 * Provides the shared sidebar state and lays its children out in a row. Project a `mona-sidebar`
 * and an element marked with `monaSidebarInset` into it.
 */
@Component({
    selector: "mona-sidebar-layout",
    template: `<ng-content></ng-content>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[class]": "baseClass()"
    },
    providers: [SidebarService]
})
export class SidebarLayoutComponent {
    readonly #sidebarService = inject(SidebarService);
    protected readonly baseClass = computed(() => twMerge(sidebarLayoutBaseThemeVariants(), this.userClass()));

    /**
     * @description Sets whether the sidebar is expanded. Supports two-way binding.
     * @default true
     */
    public readonly expanded = model(true);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });

    public constructor() {
        effect(() => {
            const expanded = this.expanded();
            untracked(() => this.#sidebarService.setExpanded(expanded));
        });
        effect(() => {
            const expanded = this.#sidebarService.expanded();
            untracked(() => this.expanded.set(expanded));
        });
    }
}
