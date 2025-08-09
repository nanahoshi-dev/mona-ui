import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    contentChildren,
    effect,
    inject,
    input,
    output,
    signal,
    TemplateRef,
    untracked,
    viewChildren
} from "@angular/core";
import { Collections, List, zip } from "@mirei/ts-collections";
import { twMerge } from "tailwind-merge";
import { ThemeService } from "../../theme/services/theme.service";
import { ContextMenuComponent } from "../contextmenu/components/context-menu/context-menu.component";
import { MenuGroupTemplateDirective } from "../directives/menu-group-template.directive";
import { MenuItemIconTemplateDirective } from "../directives/menu-item-icon-template.directive";
import { MenuItemShortcutTemplateDirective } from "../directives/menu-item-shortcut-template.directive";
import { MenuItemTextTemplateDirective } from "../directives/menu-item-text-template.directive";
import { MenuComponent } from "../menu/menu.component";
import { ContextMenuCloseEvent } from "../models/ContextMenuCloseEvent";
import { ContextMenuNavigationEvent } from "../models/ContextMenuNavigationEvent";
import { ContextMenuOpenEvent } from "../models/ContextMenuOpenEvent";
import { MenuItemClickEvent } from "../models/MenuItemClickEvent";
import {
    menubarBaseThemeVariants,
    menubarListItemThemeVariants,
    menubarListThemeVariants,
    MenubarVariantInput,
    MenubarVariantProps
} from "../styles/menu.styles";

@Component({
    selector: "mona-menubar",
    templateUrl: "./menubar.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        NgTemplateOutlet,
        ContextMenuComponent,
        MenuItemIconTemplateDirective,
        MenuGroupTemplateDirective,
        MenuItemShortcutTemplateDirective,
        MenuItemTextTemplateDirective
    ],
    host: {
        "[class]": "baseClasses()",
        "[attr.data-disabled]": "disabled()"
    }
})
export class MenubarComponent implements MenubarVariantInput {
    readonly #themeService = inject(ThemeService);
    protected readonly contextMenuComponents = viewChildren(ContextMenuComponent);
    protected readonly currentContextMenu = signal<ContextMenuComponent | null>(null);
    protected readonly groupTemplate = contentChild(MenuGroupTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly iconTemplate = contentChild(MenuItemIconTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly menuList = contentChildren(MenuComponent);
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const userClasses = this.userClasses();
        const variants = menubarBaseThemeVariants(theme)({ rounded, size });
        return twMerge(variants, userClasses);
    });
    protected readonly listClasses = computed(() => {
        const theme = this.#themeService.theme();
        return menubarListThemeVariants(theme)();
    });
    protected readonly listItemClasses = computed(() => {
        const theme = this.#themeService.theme();
        return menubarListItemThemeVariants(theme)();
    });
    protected readonly shortcutTemplate = contentChild(MenuItemShortcutTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });

    /**
     * @description Sets the disabled state of menubar.
     */
    public readonly disabled = input(false);

    /**
     * @description Emits when a menu item is clicked.
     */
    public readonly menuItemClick = output<MenuItemClickEvent>();

    /**
     * @description Sets the size of the menubar.
     */
    public readonly size = input<MenubarVariantProps["size"]>("medium");

    /**
     * @description Sets the rounded style of the menubar.
     */
    public readonly rounded = input<MenubarVariantProps["rounded"]>("medium");
    protected readonly textTemplate = contentChild(MenuItemTextTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    public readonly userClasses = input("", { alias: "class" });

    public constructor() {
        effect(() => {
            const contextMenuComponents = this.contextMenuComponents();
            untracked(() => {
                zip(this.menuList(), contextMenuComponents).forEach(([menu, context]) => {
                    menu.contextMenu = context;
                });
            });
        });
        effect(() => {
            this.menuList();
            untracked(() => {
                this.currentContextMenu()?.closeMenu();
                this.currentContextMenu.set(null);
            });
        });
    }

    public onContextMenuClose(event: ContextMenuCloseEvent): void {
        if (event.uid === this.currentContextMenu()?.uid) {
            this.currentContextMenu.set(null);
        }
    }

    public onContextMenuNavigate(event: ContextMenuNavigationEvent): void {
        if (event.direction === "right") {
            if (event.currentItem == null) {
                const index = this.findNextNonDisabledMenuIndex();
                if (index >= 0) {
                    this.currentContextMenu()?.closeMenu();
                    this.currentContextMenu.set(this.menuList()[index].contextMenu);
                    this.currentContextMenu()?.openMenu();
                }
            }
        } else if (event.direction === "left") {
            if (event.currentItem == null) {
                const index = this.findPreviousNonDisabledMenuIndex();
                if (index >= 0) {
                    this.currentContextMenu()?.closeMenu();
                    this.currentContextMenu.set(this.menuList()[index].contextMenu);
                    this.currentContextMenu()?.openMenu();
                }
            }
        }
    }

    public onContextMenuOpen(event: ContextMenuOpenEvent): void {
        if (this.currentContextMenu()?.uid === event.uid) {
            return;
        }
        this.contextMenuComponents().forEach(c => {
            if (c.uid !== event.uid) {
                c.closeMenu();
            }
        });
        const contextMenu = this.contextMenuComponents().find(c => c.uid === event.uid) ?? null;
        this.currentContextMenu.set(contextMenu);
    }

    public onMenuClick(ctx: ContextMenuComponent): void {
        if (this.currentContextMenu()?.uid === ctx.uid) {
            this.currentContextMenu()?.closeMenu();
            this.currentContextMenu.set(null);
            return;
        }
        this.contextMenuComponents().forEach(c => {
            if (c !== ctx) {
                c.closeMenu();
            }
        });
        this.currentContextMenu.set(ctx);
    }

    public onMenuItemClick(event: MenuItemClickEvent): void {
        this.menuItemClick.emit(event);
    }

    public onMenuMouseEnter(ctx: ContextMenuComponent): void {
        if (!this.currentContextMenu()) {
            return;
        }
        if (this.currentContextMenu() !== ctx) {
            this.currentContextMenu()?.closeMenu();
            this.currentContextMenu.set(ctx);
            this.currentContextMenu()?.openMenu();
        }
    }

    private findNextNonDisabledMenuIndex(): number {
        const index = this.menuList().findIndex(n => n.contextMenu === this.currentContextMenu());
        if (index < 0) {
            return -1;
        }
        const list = new List(this.menuList());
        Collections.rotate(list, -index);
        const next = list.skip(1).firstOrDefault(m => !m.disabled());
        if (next) {
            return this.menuList().findIndex(m => m === next);
        }
        return -1;
    }

    private findPreviousNonDisabledMenuIndex(): number {
        const index = this.menuList().findIndex(n => n.contextMenu === this.currentContextMenu());
        if (index < 0) {
            return -1;
        }
        const list = new List(this.menuList());
        Collections.rotate(list, -index);
        const next = list.reverse().firstOrDefault(m => !m.disabled());
        if (next) {
            return this.menuList().findIndex(m => m === next);
        }
        return -1;
    }
}
