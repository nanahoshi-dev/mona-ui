import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    contentChild,
    contentChildren,
    DestroyRef,
    DOCUMENT,
    effect,
    ElementRef,
    inject,
    input,
    output,
    signal,
    TemplateRef,
    untracked,
    viewChildren
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { zip } from "@mirei/ts-collections";
import { injectComponentDirection } from "@nanahoshi/mona-ui/i18n";
import {
    PopupMenuComponent,
    PopupMenuGroupTemplateDirective,
    PopupMenuIconTemplateDirective,
    PopupMenuNavigationEvent,
    PopupMenuShortcutTemplateDirective,
    PopupMenuTextTemplateDirective
} from "@nanahoshi/mona-ui/popup-menu";
import { Subject, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { MenuGroupTemplateDirective } from "../../directives/menu-group-template.directive";
import { MenuIconTemplateDirective } from "../../directives/menu-icon-template.directive";
import { MenuItemIconTemplateDirective } from "../../directives/menu-item-icon-template.directive";
import { MenuItemShortcutTemplateDirective } from "../../directives/menu-item-shortcut-template.directive";
import { MenuItemTextTemplateDirective } from "../../directives/menu-item-text-template.directive";
import { MenuTextTemplateDirective } from "../../directives/menu-text-template.directive";
import { MenuItemClickEvent } from "../../models/MenuItemClickEvent";
import {
    menubarBaseThemeVariants,
    menubarListItemThemeVariants,
    menubarListThemeVariants,
    MenubarVariantInput,
    MenubarVariantProps
} from "../../styles/menu.styles";
import { MenuComponent } from "../menu/menu.component";

@Component({
    selector: "mona-menubar",
    templateUrl: "./menubar.component.html",
    imports: [
        NgTemplateOutlet,
        PopupMenuComponent,
        PopupMenuTextTemplateDirective,
        PopupMenuIconTemplateDirective,
        PopupMenuShortcutTemplateDirective,
        PopupMenuGroupTemplateDirective
    ],
    host: {
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null",
        "[class]": "baseClasses()",
        "[attr.data-disabled]": "disabled()"
    }
})
export class MenubarComponent implements MenubarVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #document = inject(DOCUMENT);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    protected readonly activeIndex = signal(0);
    protected readonly baseClasses = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        const userClasses = this.userClasses();
        const variants = menubarBaseThemeVariants({ rounded, size });
        return twMerge(variants, userClasses);
    });
    protected readonly currentPopupMenu = signal<PopupMenuComponent | null>(null);
    protected readonly groupTemplate = contentChild(MenuGroupTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly iconTemplate = contentChild(MenuIconTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly isRtl = computed(() => this.#direction() === "rtl");
    protected readonly listClasses = computed(() => {
        return menubarListThemeVariants();
    });
    protected readonly listItemClasses = computed(() => {
        const rounded = this.rounded();
        return menubarListItemThemeVariants({ rounded });
    });
    protected readonly menuItemIconTemplate = contentChild(MenuItemIconTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly menuItemShortcutTemplate = contentChild(MenuItemShortcutTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly menuItemTextTemplate = contentChild(MenuItemTextTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly menuList = contentChildren(MenuComponent);
    protected readonly navigate$ = new Subject<PopupMenuNavigationEvent>();
    protected readonly popupMenuComponents = viewChildren(PopupMenuComponent);
    protected readonly textTemplate = contentChild(MenuTextTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });

    /**
     * @description ARIA label for the menubar.
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });

    /**
     * @description ARIA labelledby for the menubar.
     */
    public readonly ariaLabelledBy = input<string>("", { alias: "aria-labelledby" });

    /**
     * @description Sets the disabled state of menubar.
     */
    public readonly disabled = input(false);

    /**
     * @description Emits when a menu item is clicked.
     */
    public readonly menuItemClick = output<MenuItemClickEvent>();

    /**
     * @description Sets the rounded style of the menubar.
     */
    public readonly rounded = input<MenubarVariantProps["rounded"]>("medium");

    /**
     * @description Sets the size of the menubar.
     */
    public readonly size = input<MenubarVariantProps["size"]>("medium");

    /**
     * @description Additional CSS classes to apply to the menubar, merged with the computed theme classes.
     */
    public readonly userClasses = input("", { alias: "class" });

    public constructor() {
        effect(() => {
            const popupMenuComponents = this.popupMenuComponents();
            untracked(() => {
                zip(this.menuList(), popupMenuComponents).forEach(([menu, popupMenu]) => {
                    menu.popupMenu = popupMenu;
                });
            });
        });
        effect(() => {
            this.menuList();
            untracked(() => {
                this.currentPopupMenu()?.closeMenu();
                this.currentPopupMenu.set(null);
            });
        });
        effect(() => {
            const menuList = this.menuList();
            untracked(() => {
                if (this.activeIndex() >= menuList.length) {
                    this.activeIndex.set(0);
                }
            });
        });
        afterNextRender({
            read: () => this.setSubscriptions()
        });
    }

    protected onMenuClick(event: MouseEvent, item: MenuComponent): void {
        if (this.disabled() || item.disabled()) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }

    protected onMenuFocus(index: number): void {
        this.activeIndex.set(index);
    }

    protected onMenuItemClick(event: MenuItemClickEvent): void {
        this.menuItemClick.emit(event);
    }

    protected onMenuKeyDown(event: KeyboardEvent, item: MenuComponent, popupMenu: PopupMenuComponent): void {
        if (this.disabled()) {
            return;
        }

        const isRtl = this.isRtl();
        const nextMenuKey = isRtl ? "ArrowLeft" : "ArrowRight";
        const prevMenuKey = isRtl ? "ArrowRight" : "ArrowLeft";

        const canOpen = !!popupMenu && !item.disabled() && item.menuItems().length > 0;
        switch (event.key) {
            case "Enter":
            case " ":
                event.preventDefault();
                if (canOpen) {
                    popupMenu.openMenuViaKeyboard();
                }
                break;
            case nextMenuKey:
                event.preventDefault();
                this.moveToNextMenu();
                break;
            case prevMenuKey:
                event.preventDefault();
                this.moveToPreviousMenu();
                break;
            case "ArrowDown":
                event.preventDefault();
                if (canOpen && !this.currentPopupMenu()) {
                    popupMenu.openMenuViaKeyboard();
                }
                break;
            case "ArrowUp":
                event.preventDefault();
                if (canOpen && !this.currentPopupMenu()) {
                    popupMenu.openMenuViaKeyboard(false, "last");
                }
                break;
            case "Home":
                event.preventDefault();
                this.moveToFirstMenu();
                break;
            case "End":
                event.preventDefault();
                this.moveToLastMenu();
                break;
            case "Escape":
                event.preventDefault();
                this.closeCurrentMenu();
                break;
            default:
                if (event.key.length === 1 && event.key.trim() && !event.altKey && !event.ctrlKey && !event.metaKey) {
                    this.moveToMenuStartingWith(event.key);
                }
        }
    }

    protected onMenuPointerEnter(item: MenuComponent, popupMenu: PopupMenuComponent): void {
        const current = this.currentPopupMenu();
        if (this.disabled() || current === popupMenu || !current) {
            return;
        }
        current.clearFocusRestoration();
        current.closeMenu();
        this.currentPopupMenu.set(null);
        // A disabled menu, or one without items, has no popup to switch to: the open one just closes.
        if (!item.disabled() && item.menuItems().length > 0) {
            this.currentPopupMenu.set(popupMenu);
            popupMenu.openMenu(false);
        }
    }

    protected onPopupMenuClose(): void {
        this.currentPopupMenu.set(null);
    }

    protected onPopupMenuOpen(popupMenu: PopupMenuComponent): void {
        if (this.currentPopupMenu() === popupMenu) {
            return;
        }
        this.currentPopupMenu.set(popupMenu);
    }

    private closeCurrentMenu(): void {
        if (this.currentPopupMenu()) {
            this.currentPopupMenu()?.closeMenu();
        }
    }

    private findCurrentMenuIndex(): number | null {
        let currentIndex = this.menuList().findIndex(n => n.popupMenu === this.currentPopupMenu());
        if (currentIndex < 0) {
            const focusedElement = this.#document.activeElement as HTMLElement;
            if (focusedElement && focusedElement.hasAttribute("data-mid")) {
                const uid = focusedElement.getAttribute("data-mid");
                currentIndex = this.menuList().findIndex(m => m.uid === uid);
            }
        }
        return currentIndex >= 0 ? currentIndex : null;
    }

    private findMenuElementByUid(uid: string): HTMLLIElement | null {
        const menuList = this.menuList();
        const index = menuList.findIndex(m => m.uid === uid);
        if (index < 0) {
            return null;
        }
        return this.#hostElementRef.nativeElement.querySelector(`li[data-mid="${uid}"]`) as HTMLLIElement | null;
    }

    private findNextMenuIndex(): number {
        const menuList = this.menuList();
        if (menuList.length === 0) {
            return -1;
        }
        const currentIndex = this.findCurrentMenuIndex();
        return currentIndex == null ? 0 : (currentIndex + 1) % menuList.length;
    }

    private findPreviousMenuIndex(): number {
        const menuList = this.menuList();
        if (menuList.length === 0) {
            return -1;
        }
        const currentIndex = this.findCurrentMenuIndex();
        return currentIndex == null ? menuList.length - 1 : (currentIndex - 1 + menuList.length) % menuList.length;
    }

    private focusMenuAt(index: number): void {
        const menu = this.menuList()[index];
        if (menu) {
            this.activeIndex.set(index);
            this.findMenuElementByUid(menu.uid)?.focus();
        }
    }

    private moveToFirstMenu(): void {
        if (this.menuList().length > 0) {
            this.focusMenuAt(0);
        }
    }

    private moveToLastMenu(): void {
        const length = this.menuList().length;
        if (length > 0) {
            this.focusMenuAt(length - 1);
        }
    }

    /**
     * Typeahead on the menubar: moves to the next menu whose text starts with the character, after the current one.
     */
    private moveToMenuStartingWith(character: string): void {
        const menuList = this.menuList();
        const currentIndex = this.findCurrentMenuIndex() ?? -1;
        const key = character.toLocaleLowerCase();
        for (let offset = 1; offset <= menuList.length; offset++) {
            const index = (currentIndex + offset) % menuList.length;
            if (menuList[index].text().trim().toLocaleLowerCase().startsWith(key)) {
                this.focusMenuAt(index);
                return;
            }
        }
    }

    private moveToNextMenu(): void {
        const index = this.findNextMenuIndex();
        if (index >= 0) {
            this.focusMenuAt(index);
        }
    }

    private moveToPreviousMenu(): void {
        const index = this.findPreviousMenuIndex();
        if (index >= 0) {
            this.focusMenuAt(index);
        }
    }

    private setNavigationSubscription(): void {
        this.navigate$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                tap(event => {
                    const isRtl = this.isRtl();
                    const nextDir = isRtl ? "left" : "right";
                    const prevDir = isRtl ? "right" : "left";
                    // Forward from the root menu, or from an item without a submenu, moves to the next menu.
                    if (event.direction === nextDir && (event.level === 0 || !event.item)) {
                        const index = this.findNextMenuIndex();
                        if (index >= 0) {
                            this.updateCurrentMenuData(index);
                        }
                    } else if (event.direction === prevDir && event.level === 0 && !event.item) {
                        // Backward in the root menu itself. Closing a submenu also reports backward at level 0, but
                        // with the parent item, and stays in the same menu.
                        const index = this.findPreviousMenuIndex();
                        if (index >= 0) {
                            this.updateCurrentMenuData(index);
                        }
                    }
                })
            )
            .subscribe();
    }

    private setSubscriptions(): void {
        this.setNavigationSubscription();
    }

    private updateCurrentMenuData(index: number): void {
        const menu = this.menuList()[index];
        this.currentPopupMenu()?.clearFocusRestoration();
        this.currentPopupMenu()?.closeMenu();
        this.currentPopupMenu.set(null);
        this.activeIndex.set(index);
        if (menu.disabled() || menu.menuItems().length === 0 || !menu.popupMenu) {
            // Nothing to open: the menubar item itself takes focus.
            this.findMenuElementByUid(menu.uid)?.focus();
            return;
        }
        this.currentPopupMenu.set(menu.popupMenu);
        menu.popupMenu.openMenuViaKeyboard();
    }
}
