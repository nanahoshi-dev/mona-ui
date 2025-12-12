import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
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
    OnInit,
    output,
    signal,
    TemplateRef,
    untracked,
    viewChildren
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Collections, List, zip } from "@mirei/ts-collections";
import { pairwise, startWith, Subject, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { PopupMenuComponent } from "../../../../common/popup-menu/components/popup-menu/popup-menu.component";
import { PopupMenuGroupTemplateDirective } from "../../../../common/popup-menu/directives/popup-menu-group-template.directive";
import { PopupMenuIconTemplateDirective } from "../../../../common/popup-menu/directives/popup-menu-icon-template.directive";
import { PopupMenuShortcutTemplateDirective } from "../../../../common/popup-menu/directives/popup-menu-shortcut-template.directive";
import { PopupMenuTextTemplateDirective } from "../../../../common/popup-menu/directives/popup-menu-text-template.directive";
import { PopupMenuNavigationEvent } from "../../../../common/popup-menu/models/PopupMenuNavigationEvent";
import { createPopupMenuControlId } from "../../../../common/popup-menu/utils/popup-menu.utils";
import { ThemeService } from "../../../../theme/services/theme.service";
import { MenuGroupTemplateDirective } from "../../../directives/menu-group-template.directive";
import { MenuIconTemplateDirective } from "../../../directives/menu-icon-template.directive";
import { MenuItemIconTemplateDirective } from "../../../directives/menu-item-icon-template.directive";
import { MenuItemShortcutTemplateDirective } from "../../../directives/menu-item-shortcut-template.directive";
import { MenuItemTextTemplateDirective } from "../../../directives/menu-item-text-template.directive";
import { MenuTextTemplateDirective } from "../../../directives/menu-text-template.directive";
import { MenuItemClickEvent } from "../../../models/MenuItemClickEvent";
import {
    menubarBaseThemeVariants,
    menubarListItemThemeVariants,
    menubarListThemeVariants,
    MenubarVariantInput,
    MenubarVariantProps
} from "../../../styles/menu.styles";
import { MenuComponent } from "../menu/menu.component";

@Component({
    selector: "mona-menubar",
    templateUrl: "./menubar.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        NgTemplateOutlet,
        PopupMenuComponent,
        PopupMenuTextTemplateDirective,
        PopupMenuIconTemplateDirective,
        PopupMenuShortcutTemplateDirective,
        PopupMenuGroupTemplateDirective
    ],
    host: {
        "[class]": "baseClasses()",
        "[attr.data-disabled]": "disabled()"
    }
})
export class MenubarComponent implements MenubarVariantInput, OnInit {
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const userClasses = this.userClasses();
        const variants = menubarBaseThemeVariants(theme)({ rounded, size });
        return twMerge(variants, userClasses);
    });
    protected readonly currentPopupElement = signal<HTMLElement | null>(null);
    protected readonly currentPopupMenu = signal<PopupMenuComponent | null>(null);
    protected readonly groupTemplate = contentChild(MenuGroupTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly iconTemplate = contentChild(MenuIconTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly listClasses = computed(() => {
        const theme = this.#themeService.theme();
        return menubarListThemeVariants(theme)();
    });
    protected readonly listItemClasses = computed(() => {
        const theme = this.#themeService.theme();
        return menubarListItemThemeVariants(theme)();
    });
    protected readonly menuIdList = computed(() => {
        return this.menuList().map(() => createPopupMenuControlId());
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
    public readonly ariaLabel = input<string>("");

    /**
     * @description ARIA labelledby for the menubar.
     */
    public readonly ariaLabelledby = input<string>("");

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
                this.currentPopupElement.set(null);
            });
        });
    }

    public ngOnInit(): void {
        this.setSubscriptions();
    }

    protected onMenuBlur(event: FocusEvent): void {
        if (!this.currentPopupMenu()) {
            const relatedTarget = event.relatedTarget as HTMLElement;
            const menubarElement = this.#hostElementRef.nativeElement;
            if (!relatedTarget || !menubarElement.contains(relatedTarget)) {
                this.currentPopupElement.set(null);
            }
        }
    }

    protected onMenuItemClick(event: MenuItemClickEvent): void {
        this.menuItemClick.emit(event);
    }

    protected onMenuKeyDown(event: KeyboardEvent, popupMenu: PopupMenuComponent): void {
        if (this.disabled()) {
            return;
        }

        switch (event.key) {
            case "Enter":
            case " ":
                event.preventDefault();
                if (popupMenu) {
                    popupMenu.openMenuViaKeyboard();
                }
                break;
            case "ArrowRight":
                event.preventDefault();
                this.moveToNextMenu();
                break;
            case "ArrowLeft":
                event.preventDefault();
                this.moveToPreviousMenu();
                break;
            case "ArrowDown":
                event.preventDefault();
                if (popupMenu && !this.currentPopupMenu()) {
                    popupMenu.openMenuViaKeyboard();
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
        }
    }

    protected onPopupMenuClose(): void {
        this.currentPopupMenu.set(null);
        this.currentPopupElement.set(null);
    }

    protected onPopupMenuOpen(popupMenu: PopupMenuComponent, element: HTMLLIElement): void {
        if (this.currentPopupMenu() === popupMenu) {
            return;
        }
        this.currentPopupMenu.set(popupMenu);
        this.currentPopupElement.set(element);
    }

    protected onMenuPointerEnter(element: HTMLLIElement, popupMenu: PopupMenuComponent): void {
        if (this.currentPopupMenu() === popupMenu || !this.currentPopupMenu()) {
            return;
        }
        this.currentPopupMenu()?.closeMenu();
        this.currentPopupMenu.set(popupMenu);
        this.currentPopupElement.set(element);
        this.currentPopupMenu()!.openMenu(false);
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

    private findNextNonDisabledMenuIndex(): number {
        const currentIndex = this.findCurrentMenuIndex();
        if (currentIndex == null || currentIndex < 0) {
            return this.menuList().findIndex(m => !m.disabled());
        }
        const list = new List(this.menuList());
        Collections.rotate(list, -currentIndex);
        const next = list.skip(1).firstOrDefault(m => !m.disabled());
        if (next) {
            return this.menuList().findIndex(m => m === next);
        }
        return -1;
    }

    private findPreviousNonDisabledMenuIndex(): number {
        let currentIndex = this.findCurrentMenuIndex();
        if (currentIndex == null || currentIndex < 0) {
            const menuList = this.menuList();
            const lastEnabledIndex = menuList
                .slice()
                .reverse()
                .findIndex(m => !m.disabled());
            return lastEnabledIndex >= 0 ? menuList.length - 1 - lastEnabledIndex : -1;
        }
        const list = new List(this.menuList());
        Collections.rotate(list, -currentIndex);
        const next = list.reverse().firstOrDefault(m => !m.disabled());
        if (next) {
            return this.menuList().findIndex(m => m === next);
        }
        return -1;
    }

    private focusMenuAt(index: number): void {
        const menu = this.menuList()[index];
        if (menu && !menu.disabled()) {
            const element = this.findMenuElementByUid(menu.uid);
            if (element) {
                element.focus();
            }
        }
    }

    private moveToFirstMenu(): void {
        const firstEnabledIndex = this.menuList().findIndex(m => !m.disabled());
        if (firstEnabledIndex >= 0) {
            this.focusMenuAt(firstEnabledIndex);
        }
    }

    private moveToLastMenu(): void {
        const menuList = this.menuList();
        const lastEnabledIndex = menuList
            .slice()
            .reverse()
            .findIndex(m => !m.disabled());
        if (lastEnabledIndex >= 0) {
            const actualIndex = menuList.length - 1 - lastEnabledIndex;
            this.focusMenuAt(actualIndex);
        }
    }

    private moveToNextMenu(): void {
        const index = this.findNextNonDisabledMenuIndex();
        if (index >= 0) {
            this.focusMenuAt(index);
        }
    }

    private moveToPreviousMenu(): void {
        const index = this.findPreviousNonDisabledMenuIndex();
        if (index >= 0) {
            this.focusMenuAt(index);
        }
    }

    private setNavigationSubscription(): void {
        this.navigate$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                startWith(null),
                pairwise(),
                tap(([prev, next]) => {
                    if (next && next.direction === "right" && (next.level === 0 || (next.level > 0 && !next.item))) {
                        const index = this.findNextNonDisabledMenuIndex();
                        if (index >= 0) {
                            this.updateCurrentMenuData(index);
                        }
                    } else if (next && prev && next.direction === "left" && prev.level === 0 && next.level === 0) {
                        const index = this.findPreviousNonDisabledMenuIndex();
                        if (index >= 0) {
                            this.updateCurrentMenuData(index);
                        }
                    }
                    if (next && this.currentPopupMenu()) {
                        this.currentPopupMenu()?.setRestoreFocusForKeyboard();
                    }
                })
            )
            .subscribe();
    }

    private setSubscriptions(): void {
        this.setNavigationSubscription();
    }

    private updateCurrentMenuData(index: number): void {
        this.currentPopupMenu()?.closeMenu();
        this.currentPopupMenu.set(this.menuList()[index].popupMenu);
        const element = this.findMenuElementByUid(this.menuList()[index].uid);
        this.currentPopupElement.set(element);
        this.currentPopupMenu()?.openMenuViaKeyboard();
    }
}
