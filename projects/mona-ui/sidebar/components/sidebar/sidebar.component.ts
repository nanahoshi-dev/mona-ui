import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import type { SidebarCollapsibleMode } from "../../models/SidebarCollapsibleMode";
import type { SidebarSide } from "../../models/SidebarSide";
import type { SidebarVariant } from "../../models/SidebarVariant";
import { SidebarService } from "../../services/sidebar.service";
import { sidebarBorderAllowance, sidebarThemeVariants } from "../../styles/sidebar.styles";

/**
 * @description
 * The sidebar region itself. Content is projected in author order, so header, content and footer
 * parts appear exactly where they are written.
 */
@Component({
    selector: "mona-sidebar",
    template: `<ng-content></ng-content>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[attr.data-collapsible]": "collapsible()",
        "[attr.data-state]": "state()",
        "[attr.data-variant]": "variant()",
        "[attr.id]": "sidebarId",
        "[class]": "baseClass()",
        "[style.width]": "widthString()"
    }
})
export class SidebarComponent {
    readonly #sidebarService = inject(SidebarService);
    protected readonly baseClass = computed(() => {
        const variantClass = sidebarThemeVariants({
            side: this.side(),
            variant: this.variant(),
            flush: !this.#sidebarService.expanded() && this.collapsible() === "offcanvas"
        });
        return twMerge(variantClass, this.userClass());
    });
    protected readonly sidebarId = this.#sidebarService.sidebarId;
    protected readonly state = this.#sidebarService.state;
    /**
     * `width` and `iconWidth` are the width the sidebar's *contents* get, because that is what the
     * parts inside are measured against — an icon rail less a region's padding is meant to leave
     * exactly one icon square. The variant's border is painted inside the box under the global
     * `border-box`, so it is added back on here rather than being taken out of that measurement.
     * A fully collapsed sidebar is the exception: it has no contents to make room for.
     */
    protected readonly widthString = computed(() => {
        const toCss = (value: string | number): string => (typeof value === "number" ? `${value}px` : value);
        if (this.#sidebarService.expanded()) {
            return this.#withBorderAllowance(toCss(this.width()));
        }
        return this.collapsible() === "icon" ? this.#withBorderAllowance(toCss(this.iconWidth())) : "0px";
    });

    /**
     * @description How the sidebar behaves when collapsed. `"icon"` keeps a narrow rail of icons visible,
     * `"offcanvas"` removes it from the layout entirely, and `"none"` disables collapsing altogether.
     * @default "offcanvas"
     */
    public readonly collapsible = input<SidebarCollapsibleMode>("offcanvas");

    /**
     * @description Width of the icon rail while collapsed. Only applies when `collapsible` is `"icon"`.
     * Numbers are treated as pixels.
     * @default "3rem"
     */
    public readonly iconWidth = input<string | number>("3rem");

    /**
     * @description Which edge the sidebar sits on. Also controls its order within the layout.
     * @default "left"
     */
    public readonly side = input<SidebarSide>("left");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });

    /**
     * @description The visual treatment of the sidebar. `"floating"` detaches it from the edge on its own
     * surface, and `"inset"` moves that raised surface onto the region beside it instead.
     * @default "sidebar"
     */
    public readonly variant = input<SidebarVariant>("sidebar");

    /**
     * @description Width of the sidebar while expanded. Numbers are treated as pixels.
     * @default "16rem"
     */
    public readonly width = input<string | number>("16rem");

    public constructor() {
        // These are authored here but read by descendants, so they have to reach the shared service.
        effect(() => {
            const collapsible = this.collapsible();
            const side = this.side();
            const variant = this.variant();
            untracked(() => {
                this.#sidebarService.setCollapsible(collapsible);
                this.#sidebarService.setSide(side);
                this.#sidebarService.setVariant(variant);
            });
        });
    }

    #withBorderAllowance(width: string): string {
        const allowance = sidebarBorderAllowance[this.variant()];
        // The `inset` variant draws no border, so it is left as an ordinary length.
        return allowance === "0px" ? width : `calc(${width} + ${allowance})`;
    }
}
