import { computed, Directive, inject } from "@angular/core";
import { injectComponentDirection } from "@nanahoshi/mona-ui/i18n";
import { SidebarService } from "../services/sidebar.service";
import { sidebarRailThemeVariants } from "../styles/sidebar.styles";

/**
 * @description
 * A thin strip along the sidebar's inner edge that toggles it. Place it inside `mona-sidebar`,
 * which positions it. Hidden on narrow viewports, where the edge is too easy to hit by accident.
 *
 * Deliberately outside the tab order: it is a pointer shortcut for what `monaSidebarTrigger` already
 * does, and a second tab stop onto an unlabelled 4px strip would be noise for keyboard users. Provide
 * a `monaSidebarTrigger` as well — the rail is not a substitute for it — and give the rail an
 * `aria-label` so pointer users of assistive technology can still identify it.
 */
@Directive({
    selector: "button[monaSidebarRail]",
    host: {
        "[attr.aria-controls]": "sidebarId()",
        "[attr.aria-expanded]": "expanded()",
        "[attr.tabindex]": "-1",
        // Without this a rail inside a form submits it, because `submit` is a button's default type.
        "[attr.type]": "'button'",
        "[class]": "baseClass()",
        "(click)": "onClick()"
    }
})
export class SidebarRailDirective {
    readonly #direction = injectComponentDirection();
    readonly #sidebarService = inject(SidebarService);

    protected readonly physicalSide = computed<"left" | "right">(() => {
        const isRtl = this.#direction() === "rtl";
        const side = this.#sidebarService.side();
        if (side === "start") {
            return isRtl ? "right" : "left";
        }
        return isRtl ? "left" : "right";
    });

    protected readonly baseClass = computed(() =>
        sidebarRailThemeVariants({ physicalSide: this.physicalSide() })
    );
    protected readonly expanded = this.#sidebarService.expanded;
    protected readonly sidebarId = this.#sidebarService.sidebarId;

    protected onClick(): void {
        this.#sidebarService.toggle();
    }
}
