import { ActiveDescendantKeyManager } from "@angular/cdk/a11y";
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    computed,
    ElementRef,
    inject,
    signal,
    viewChildren
} from "@angular/core";
import { any, Dictionary, ImmutableSet, select, selectMany, toArray, toImmutableSet } from "@mirei/ts-collections";
import {
    contextMenuContentVariants,
    contextMenuDividerVariants,
    menuItemGroupHeaderVariants
} from "mona-ui/menus/styles/menu.style";
import { filter, fromEvent, Subject } from "rxjs";
import { twMerge } from "tailwind-merge";
import { PopupDataInjectionToken } from "../../popup/models/PopupInjectionToken";
import { PopupRef } from "../../popup/models/PopupRef";
import { ContextMenuItemComponent } from "../context-menu-item/context-menu-item.component";
import { ContextMenuInjectorData, InternalMenuItemClickEvent } from "../models/ContextMenuInjectorData";
import { MenuItem } from "../models/MenuItem";
import { ContextMenuService } from "../services/context-menu.service";

@Component({
    selector: "mona-contextmenu-content",
    templateUrl: "./context-menu-content.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ContextMenuItemComponent],
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
        userClasses: signal(""),
        userStyles: signal("")
    };
    readonly #contextMenuService = inject(ContextMenuService);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    #currentMenuItem: MenuItem | null = null;
    protected readonly classes = computed(() => {
        const classes = contextMenuContentVariants();
        const userClasses = this.parentMenuData.userClasses();
        return twMerge(classes, userClasses);
    });
    protected readonly contextMenuItemComponents = viewChildren(ContextMenuItemComponent);
    protected readonly dividerClasses = computed(() => {
        const classes = contextMenuDividerVariants();
        return twMerge(classes);
    });
    protected readonly groupHeaderClasses = computed(() => {
        const classes = menuItemGroupHeaderVariants();
        return twMerge(classes);
    });
    protected readonly menuPopupRef = signal<PopupRef | null>(null);
    protected readonly parentMenuData = inject<ContextMenuInjectorData<C>>(PopupDataInjectionToken);
    protected readonly viewMenuItems = computed(() => {
        return select(this.parentMenuData.menuItems(), mi => {
            const groupDict = new Dictionary<string, ImmutableSet<MenuItem>>();
            mi.forEach(item => {
                if (item.group) {
                    const groupItems = groupDict.get(item.group) ?? ImmutableSet.create();
                    groupDict.put(item.group, groupItems.add(item));
                } else {
                    const groupItems = groupDict.get("") ?? ImmutableSet.create();
                    groupDict.put("", groupItems.add(item));
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
                return menuItem.disabled || !!menuItem.divider;
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
        if (menuItem.disabled || menuItem.divider || (menuItem.subMenuItemsSet && any(menuItem.subMenuItemsSet))) {
            return;
        }
        const clickEvent: InternalMenuItemClickEvent<C> = {
            context: this.parentMenuData.context,
            originalEvent: event
        };
        menuItem.menuClick?.(clickEvent);
        this.parentMenuData.menuClick?.next(clickEvent);
    }

    public onListItemMouseEnter(event: MouseEvent, menuItem: MenuItem): void {
        this.#currentMenuItem = menuItem;
        this.menuPopupRef()?.close();
        if (this.#currentMenuItem.subMenuItemsSet && any(this.#currentMenuItem.subMenuItemsSet)) {
            this.create(event.target as HTMLElement, this.#currentMenuItem);
        }
    }

    private create(anchor: HTMLElement, menuItem: MenuItem, viaKeyboard?: boolean): void {
        this.#contextMenuInjectorData.context = this.parentMenuData.context;
        this.#contextMenuInjectorData.menuItems?.set(toImmutableSet(menuItem.subMenuItemsSet ?? []));
        this.#contextMenuInjectorData.menuClick = this.parentMenuData.menuClick;
        this.#contextMenuInjectorData.navigate = this.parentMenuData.navigate;
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
        if (menuItem?.subMenuItemsSet && any(menuItem.subMenuItemsSet)) {
            this.menuPopupRef()?.close();
            const previousItem = this.keyManager.activeItem;
            if (this.keyManager.activeItem) {
                console.log(this.keyManager.activeItem.elementRef.nativeElement!.parentElement!);
                this.create(this.keyManager.activeItem.elementRef.nativeElement!.parentElement!, menuItem, true);
            }
            const submenuItems2 = selectMany(
                toArray(this.keyManager.activeItem?.menuItem().subMenuItemsSet ?? []),
                i => i
            ).toArray();
            this.parentMenuData.navigate?.emit({
                previousItem: previousItem?.menuItem().options ?? null,
                currentItem: submenuItems2.find(mi => !mi.disabled && !mi.divider)?.options ?? null,
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
            if (menuItem.subMenuItemsSet && any(menuItem.subMenuItemsSet)) {
                return;
            }
            if (this.keyManager.activeItem) {
                const clickEvent: InternalMenuItemClickEvent<C> = {
                    context: this.parentMenuData.context,
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
                )
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
