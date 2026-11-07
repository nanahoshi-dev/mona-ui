import { computed, Directive, inject, input } from "@angular/core";
import { injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { SIDEBAR_DEFAULT_MESSAGES } from "../i18n/sidebar.default-messages";
import { resolvePhysicalSide } from "../internal/resolve-physical-side";
import { SidebarService } from "../services/sidebar.service";
import { sidebarRailThemeVariants } from "../styles/sidebar.styles";

/**
 * @description
 * A thin strip along the sidebar's inner edge that toggles it. Place it inside `mona-sidebar`,
 * which positions it. Hidden on narrow viewports, where the edge is too easy to hit by accident.
 *
 * Deliberately outside the tab order: it is a pointer shortcut for what `monaSidebarTrigger` already
 * does, and a second tab stop onto a 4px strip would be noise for keyboard users. Provide a
 * `monaSidebarTrigger` as well — the rail is not a substitute for it.
 */
@Directive({
    selector: "button[monaSidebarRail]",
    host: {
        "[attr.aria-controls]": "sidebarId()",
        "[attr.aria-expanded]": "expanded()",
        "[attr.aria-label]": "ariaLabel() || messages().rail",
        "[attr.tabindex]": "-1",
        // Without this a rail inside a form submits it, because `submit` is a button's default type.
        "[attr.type]": "'button'",
        "[class]": "baseClass()",
        "(click)": "onClick()"
    }
})
export class SidebarRailDirective {
    readonly #direction = injectComponentDirection();
    readonly #i18n = inject(MonaI18nService);
    readonly #sidebarService = inject(SidebarService);

    protected readonly baseClass = computed(() =>
        sidebarRailThemeVariants({
            compact: this.#sidebarService.compact(),
            physicalSide: resolvePhysicalSide(this.#direction(), this.#sidebarService.side())
        })
    );
    protected readonly expanded = this.#sidebarService.expanded;
    protected readonly messages = this.#i18n.componentMessages("sidebar", SIDEBAR_DEFAULT_MESSAGES);
    protected readonly sidebarId = this.#sidebarService.sidebarId;

    /**
     * @description Accessible name of the rail, which otherwise has a localized default.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    protected onClick(): void {
        this.#sidebarService.toggle();
    }
}
