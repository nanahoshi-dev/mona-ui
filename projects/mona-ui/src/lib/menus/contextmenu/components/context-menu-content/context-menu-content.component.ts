import { ActiveDescendantKeyManager } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    computed,
    DestroyRef,
    ElementRef,
    inject,
    signal,
    viewChildren
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { any, Dictionary, ImmutableSet, select, selectMany, toArray } from "@mirei/ts-collections";
import { filter, fromEvent, Subject } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ToArrayPipe } from "../../../../pipes/to-array.pipe";
import { PopupDataInjectionToken } from "../../../../popup/models/PopupInjectionToken";
import { PopupRef } from "../../../../popup/models/PopupRef";
import { ThemeService } from "../../../../theme/services/theme.service";
import {
    contextMenuContentThemeVariants,
    contextMenuDividerThemeVariants,
    menuItemGroupHeaderThemeVariants
} from "../../../styles/menu.styles";
import { ContextMenuItemComponent } from "../context-menu-item/context-menu-item.component";
import { ContextMenuInjectorData } from "../../../models/ContextMenuInjectorData";
import { MenuItem } from "../../../models/MenuItem";
import { InternalMenuItemClickEvent } from "../../../models/MenuItemClickEvent";
import { MenuItemGroupConfig } from "../../../models/MenuItemGroupConfig";
import { ContextMenuService } from "../../../services/context-menu.service";
import { createSubMenuWithParent, hasSubMenuItems, isInteractive } from "../../../utils/menu.utils";

@Component({
    selector: "mona-contextmenu-content",
    templateUrl: "./context-menu-content.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ContextMenuItemComponent, NgTemplateOutlet, ToArrayPipe],
    host: {
        "[attr.data-contextmenu]": "true",
        "[class]": "classes()",
        "[style]": "parentMenuData.userStyles()"
    }
})
export class ContextMenuContentComponent<C> implements AfterViewInit {
    readonly #cdr = inject(ChangeDetectorRef);
    readonly #contextMenuInjectorData: ContextMenuInjectorData<C> = {
        isRoot: false,
        menuItems: signal(ImmutableSet.create()),
        rounded: "medium",
        size: "medium",
        userClasses: signal(""),
        userStyles: signal("")
    };
    readonly #contextMenuService = inject(ContextMenuService);
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #themeService = inject(ThemeService);
    #currentMenuItem: MenuItem | null = null;
    protected readonly classes = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.parentMenuData.rounded;
        const size = this.parentMenuData.size;
        const classes = contextMenuContentThemeVariants(theme)({ rounded, size });
        const userClasses = this.parentMenuData.userClasses();
        return twMerge(classes, userClasses);
    });
    protected readonly contextMenuItemComponents = viewChildren(ContextMenuItemComponent);
    protected readonly dividerClasses = computed(() => {
        const theme = this.#themeService.theme();
        const classes = contextMenuDividerThemeVariants(theme)();
        return twMerge(classes);
    });
    protected readonly groupHeaderClasses = computed(() => {
        const theme = this.#themeService.theme();
        const size = this.parentMenuData.size;
        const classes = menuItemGroupHeaderThemeVariants(theme)({ size });
        const iconAreaVisible = this.iconAreaVisible();
        const sizePadding = size === "small" ? "pl-1" : size === "large" ? "pl-3" : "pl-2";
        const padding = iconAreaVisible ? "pl-8" : sizePadding;
        return twMerge(classes, [padding]);
    });
    protected readonly iconAreaVisible = computed(() => {
        const viewMenuItems = this.viewMenuItems();
        const menuItemIconVisible = select(viewMenuItems, group =>
            any(group.values(), groupConfig => groupConfig.items.any(i => i.iconTemplate != null))
        ).any(f => f);
        const iconTemplate = this.parentMenuData.iconTemplate;
        return menuItemIconVisible || iconTemplate != null;
    });
    protected readonly menuPopupRef = signal<PopupRef | null>(null);
    protected readonly parentMenuData = inject<ContextMenuInjectorData<C>>(PopupDataInjectionToken);
    protected readonly viewMenuItems = computed(() => {
        return select(this.parentMenuData.menuItems(), mi => {
            const groupDict = new Dictionary<string | symbol, MenuItemGroupConfig>();
            mi.forEach(item => {
                const groupTemplate = item.groupTemplate ?? this.parentMenuData.groupTemplate ?? null;
                if (item.group) {
                    const groupConfig = groupDict.get(item.group) ?? {
                        groupTemplate,
                        items: ImmutableSet.create<MenuItem>()
                    };
                    groupDict.put(item.group, {
                        groupTemplate,
                        items: groupConfig.items.add(item)
                    });
                } else {
                    groupDict.put(Symbol(), {
                        groupTemplate: null,
                        items: ImmutableSet.create([item])
                    });
                }
            });
            return groupDict;
        }).toImmutableSet();
    });
    protected keyManager!: ActiveDescendantKeyManager<ContextMenuItemComponent>;

    public ngAfterViewInit(): void {
        this.keyManager = new ActiveDescendantKeyManager<ContextMenuItemComponent>(
            this.contextMenuItemComponents() as ContextMenuItemComponent[]
        )
            .withWrap()
            .skipPredicate(mi => {
                const menuItem = mi.menuItem();
                return menuItem.disabled || menuItem.divider;
            });
        this.setEventListeners();
        this.focus();
        if (!this.parentMenuData.isRoot && this.parentMenuData.viaKeyboard) {
            this.keyManager.setFirstItemActive();
            this.#cdr.detectChanges();
        }
    }

    public onListItemClick(event: MouseEvent, menuItem: MenuItem): void {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!isInteractive(menuItem) || hasSubMenuItems(menuItem)) {
            return;
        }
        const clickEvent: InternalMenuItemClickEvent<C> = {
            context: this.parentMenuData.context,
            menuItem: menuItem.options,
            originalEvent: event
        };
        menuItem.menuClick?.(clickEvent);
        this.parentMenuData.menuClick?.next(clickEvent);
    }

    public onListItemMouseEnter(event: MouseEvent, menuItem: MenuItem): void {
        this.#currentMenuItem = menuItem;
        this.menuPopupRef()?.close();
        const menuItemComponent = this.contextMenuItemComponents().find(component => component.menuItem() === menuItem);
        if (menuItemComponent) {
            this.keyManager.setActiveItem(menuItemComponent);
        }
        if (hasSubMenuItems(this.#currentMenuItem)) {
            this.create(event.target as HTMLElement, this.#currentMenuItem);
        }
    }

    public onListItemMouseLeave(event: MouseEvent, menuItem: MenuItem): void {
        if (!hasSubMenuItems(menuItem) || !this.menuPopupRef()) {
            const relatedTarget = event.relatedTarget as HTMLElement;
            const isMovingToSubmenu = relatedTarget?.closest("[data-contextmenu]");
            if (!isMovingToSubmenu) {
                this.keyManager.setActiveItem(-1);
            }
        }
    }

    private create(anchor: HTMLElement, menuItem: MenuItem, viaKeyboard?: boolean): void {
        this.#contextMenuInjectorData.context = this.parentMenuData.context;
        this.#contextMenuInjectorData.groupTemplate = this.parentMenuData.groupTemplate;
        this.#contextMenuInjectorData.iconTemplate = this.parentMenuData.iconTemplate;
        const subMenuItemsWithParent = createSubMenuWithParent(menuItem);
        this.#contextMenuInjectorData.menuItems?.set(subMenuItemsWithParent);
        this.#contextMenuInjectorData.menuClick = this.parentMenuData.menuClick;
        this.#contextMenuInjectorData.navigate = this.parentMenuData.navigate;
        this.#contextMenuInjectorData.rounded = this.parentMenuData.rounded;
        this.#contextMenuInjectorData.shortcutTemplate = this.parentMenuData.shortcutTemplate;
        this.#contextMenuInjectorData.size = this.parentMenuData.size;
        this.#contextMenuInjectorData.textTemplate = this.parentMenuData.textTemplate;
        this.#contextMenuInjectorData.userClasses = this.parentMenuData.userClasses;
        this.#contextMenuInjectorData.userStyles = this.parentMenuData.userStyles;
        const popupClasses = this.parentMenuData.popupClass
            ? Array.isArray(this.parentMenuData.popupClass)
                ? this.parentMenuData.popupClass
                : [this.parentMenuData.popupClass]
            : [];
        this.#contextMenuInjectorData.popupClass = popupClasses;
        const popupRef = this.#contextMenuService.open({
            anchor,
            closeOnOutsideClick: true,
            content: ContextMenuContentComponent,
            data: this.#contextMenuInjectorData,
            anchorConnectionPoint: "topright",
            popupConnectionPoint: "topleft",
            popupClass: [...popupClasses]
        });
        this.menuPopupRef.set(popupRef);
        this.#contextMenuInjectorData.parentMenuRef = popupRef;
        this.#contextMenuInjectorData.viaKeyboard = viaKeyboard;
        this.#contextMenuInjectorData.subMenuClose = new Subject<void>();
        if (this.parentMenuData.parentMenuRef) {
            const subscription = this.parentMenuData.parentMenuRef.closed.subscribe(() => {
                this.menuPopupRef()?.close();
                subscription.unsubscribe();
            });
        }
        this.#contextMenuInjectorData.subMenuClose.subscribe(() => {
            this.focus();
        });
    }

    private focus(): void {
        const listElement = this.#hostElementRef.nativeElement.querySelector("ul:first-child") as HTMLUListElement;
        listElement?.focus();
    }

    private handleArrowLeftKey(): void {
        if (!this.parentMenuData.isRoot) {
            this.parentMenuData.parentMenuRef?.close();
            this.parentMenuData.subMenuClose?.next();
            this.parentMenuData.navigate?.emit({
                previousItem: this.keyManager.activeItem?.menuItem().options ?? null,
                currentItem: this.keyManager.activeItem?.menuItem().parent?.options ?? null,
                direction: "left"
            });
        } else {
            this.parentMenuData.navigate?.emit({
                previousItem: this.keyManager.activeItem?.menuItem().options ?? null,
                currentItem: null,
                direction: "left"
            });
        }
    }

    private handleArrowRightKey(): void {
        const menuItem = this.keyManager.activeItem?.menuItem();
        if (menuItem && hasSubMenuItems(menuItem)) {
            this.menuPopupRef()?.close();
            const previousItem = this.keyManager.activeItem;
            if (this.keyManager.activeItem) {
                this.create(this.keyManager.activeItem.elementRef.nativeElement!.parentElement!, menuItem, true);
            }
            const submenuItems = selectMany(
                toArray(this.keyManager.activeItem?.menuItem().subMenuItemsSet ?? []),
                i => i
            ).toArray();
            this.parentMenuData.navigate?.emit({
                previousItem: previousItem?.menuItem().options ?? null,
                currentItem: submenuItems.find(mi => isInteractive(mi))?.options ?? null,
                direction: "right"
            });
        } else {
            this.parentMenuData.navigate?.emit({
                previousItem: menuItem?.options ?? null,
                currentItem: null,
                direction: "right"
            });
        }
    }

    private handleInputKeys(event: KeyboardEvent): void {
        const menuItem = this.keyManager.activeItem?.menuItem();
        if (menuItem) {
            if (hasSubMenuItems(menuItem)) {
                return;
            }
            if (this.keyManager.activeItem) {
                const clickEvent: InternalMenuItemClickEvent<C> = {
                    context: this.parentMenuData.context,
                    menuItem: menuItem.options,
                    originalEvent: event
                };
                this.keyManager.activeItem.menuItem().menuClick?.(clickEvent);
                this.parentMenuData.menuClick?.next(clickEvent);
            }
        }
    }

    private handleVerticalArrowKeys(event: KeyboardEvent): void {
        const previousItem = this.keyManager.activeItem;
        this.keyManager.onKeydown(event);
        if (this.keyManager.activeItem !== previousItem) {
            this.parentMenuData.navigate?.emit({
                previousItem: previousItem?.menuItem().options ?? null,
                currentItem: this.keyManager.activeItem?.menuItem().options ?? null,
                direction: event.key === "ArrowDown" ? "down" : "up"
            });
        }
    }

    private setEventListeners(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(
                filter(
                    e =>
                        e.key === "ArrowDown" ||
                        e.key === "ArrowUp" ||
                        e.key === "ArrowRight" ||
                        e.key === "ArrowLeft" ||
                        e.key === "Enter" ||
                        e.key === " "
                ),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe(event => {
                switch (event.key) {
                    case "ArrowDown":
                    case "ArrowUp":
                        this.handleVerticalArrowKeys(event);
                        break;
                    case "Enter":
                    case " ":
                        this.handleInputKeys(event);
                        break;
                    case "ArrowRight":
                        this.handleArrowRightKey();
                        break;
                    case "ArrowLeft":
                        this.handleArrowLeftKey();
                        break;
                }
                this.#cdr.markForCheck();
            });
    }
}
