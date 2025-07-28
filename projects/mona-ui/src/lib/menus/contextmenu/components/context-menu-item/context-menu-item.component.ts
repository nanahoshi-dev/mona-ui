import { Highlightable } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    inject,
    input,
    OnDestroy,
    TemplateRef
} from "@angular/core";
import { ChevronRight, LucideAngularModule } from "lucide-angular";
import { twMerge } from "tailwind-merge";
import { PopupRef } from "../../../../popup/models/PopupRef";
import { ThemeService } from "../../../../theme/services/theme.service";
import { MenuItem } from "../../../models/MenuItem";
import { MenuItemTemplateContext } from "../../../models/MenuItemTemplateContext";
import {
    menuItemIconThemeVariants,
    menuItemLinkThemeVariants,
    menuItemShortcutThemeVariants,
    menuItemTextThemeVariants,
    menuItemThemeVariants,
    MenuItemVariantInput,
    MenuItemVariantProps
} from "../../../styles/menu.styles";
import { hasSubMenuItems } from "../../../utils/menu.utils";

@Component({
    selector: "mona-contextmenu-item",
    templateUrl: "./context-menu-item.component.html",
    imports: [NgTemplateOutlet, LucideAngularModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[attr.data-disabled]": "itemDisabled()||undefined",
        "[attr.data-focused]": "itemFocused()||undefined",
        "[class]": "classes()"
    }
})
export class ContextMenuItemComponent implements OnDestroy, Highlightable, MenuItemVariantInput {
    readonly #themeService = inject(ThemeService);
    protected readonly classes = computed(() => {
        const theme = this.#themeService.theme();
        const iconAreaVisible = this.iconVisible();
        const size = this.size();
        const sizePadding = size === "small" ? "pl-1" : size === "large" ? "pl-3" : "pl-2";
        const padding = iconAreaVisible ? "pl-8" : sizePadding;
        const variants = menuItemThemeVariants(theme)({ size });
        return twMerge(variants, padding);
    });
    protected readonly hasAnySubMenuItems = computed(() => {
        const menuItem = this.menuItem();
        return hasSubMenuItems(menuItem);
    });
    protected readonly iconContainerClasses = computed(() => {
        const theme = this.#themeService.theme();
        return menuItemIconThemeVariants(theme)();
    });
    protected readonly linkContainerClasses = computed(() => {
        const theme = this.#themeService.theme();
        return menuItemLinkThemeVariants(theme)();
    });
    protected readonly linkIcon = ChevronRight;
    protected readonly shortcutContainerClasses = computed(() => {
        const theme = this.#themeService.theme();
        return menuItemShortcutThemeVariants(theme)();
    });
    protected readonly textContainerClasses = computed(() => {
        const theme = this.#themeService.theme();
        return menuItemTextThemeVariants(theme)();
    });
    /**
     * Used by ActiveDescendantKeyManager
     */
    public readonly elementRef = inject(ElementRef<HTMLElement>);
    public readonly iconTemplate = input<TemplateRef<MenuItemTemplateContext> | null>(null);
    public readonly iconVisible = input(false);
    public readonly itemDisabled = input(false);
    public readonly itemFocused = input(false);
    public readonly menuItem = input.required<MenuItem>();
    public readonly shortcutTemplate = input<TemplateRef<MenuItemTemplateContext> | null>(null);
    public readonly size = input<MenuItemVariantProps["size"]>("medium");
    public readonly submenuPopupRef = input<PopupRef | null>(null);
    public readonly textTemplate = input<TemplateRef<MenuItemTemplateContext> | null>(null);

    public ngOnDestroy(): void {
        this.submenuPopupRef()?.close();
    }

    public setActiveStyles(): void {}

    public setInactiveStyles(): void {}
}
