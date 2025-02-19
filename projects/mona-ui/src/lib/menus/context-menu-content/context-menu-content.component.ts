import { ActiveDescendantKeyManager } from "@angular/cdk/a11y";
import { NgClass } from "@angular/common";
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
import { contextMenuContentVariants, contextMenuDividerVariants } from "mona-ui/menus/styles/context-menu.style";
import { filter, fromEvent, Subject } from "rxjs";
import { twMerge } from "tailwind-merge";
import { PopupDataInjectionToken } from "../../popup/models/PopupInjectionToken";
import { PopupRef } from "../../popup/models/PopupRef";
import { ContextMenuItemComponent } from "../context-menu-item/context-menu-item.component";
import { ContextMenuInjectorData, InternalMenuItemClickEvent } from "../models/ContextMenuInjectorData";
import { defaultSubMenuPositions } from "../models/ContextMenuSettings";
import { MenuItem } from "../models/MenuItem";
import { ContextMenuService } from "../services/context-menu.service";

@Component({
    selector: "mona-contextmenu-content",
    templateUrl: "./context-menu-content.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass, ContextMenuItemComponent],
    host: {
        "[attr.data-contextmenu]": "true",
        "[class]": "classes()",
        "[style]": "parentMenuData.userStyles()"
    }
})
export class ContextMenuContentComponent<C> implements AfterViewInit {
    readonly #cdr = inject(ChangeDetectorRef);
    readonly #contextMenuInjectorData: Partial<ContextMenuInjectorData<C>> = { isRoot: false };
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
    protected readonly menuPopupRef = signal<PopupRef | null>(null);
    protected readonly parentMenuData = inject<ContextMenuInjectorData<C>>(PopupDataInjectionToken);
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
        if (menuItem.disabled || menuItem.divider || (menuItem.subMenuItems && menuItem.subMenuItems.length > 0)) {
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
        if (this.#currentMenuItem.subMenuItems && this.#currentMenuItem.subMenuItems.length > 0) {
            this.create(event.target as HTMLElement, this.#currentMenuItem);
        }
    }

    private create(anchor: HTMLElement, menuItem: MenuItem, viaKeyboard?: boolean): void {
        this.#contextMenuInjectorData.context = this.parentMenuData.context;
        this.#contextMenuInjectorData.menuItems = menuItem.subMenuItems;
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
            positions: defaultSubMenuPositions,
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
            this.parentMenuData.navigate.emit({
                previousItem: this.keyManager.activeItem?.menuItem() ?? null,
                currentItem: this.keyManager.activeItem?.menuItem().parent ?? null,
                direction: "left"
            });
        } else {
            this.parentMenuData.navigate.emit({
                previousItem: this.keyManager.activeItem?.menuItem() ?? null,
                currentItem: null,
                direction: "left"
            });
        }
    }

    private handleArrowRightKey(): void {
        const menuItem = this.keyManager.activeItem?.menuItem();
        if (menuItem?.subMenuItems && menuItem.subMenuItems.length > 0) {
            this.menuPopupRef()?.close();
            const previousItem = this.keyManager.activeItem;
            if (this.keyManager.activeItem) {
                console.log(this.keyManager.activeItem.elementRef.nativeElement!.parentElement!);
                this.create(this.keyManager.activeItem.elementRef.nativeElement!.parentElement!, menuItem, true);
            }
            this.parentMenuData.navigate.emit({
                previousItem: previousItem?.menuItem() ?? null,
                currentItem:
                    this.keyManager.activeItem?.menuItem().subMenuItems?.find(mi => !mi.disabled && !mi.divider) ??
                    null,
                direction: "right"
            });
        } else {
            this.parentMenuData.navigate.emit({
                previousItem: menuItem ?? null,
                currentItem: null,
                direction: "right"
            });
        }
    }

    private handleInputKeys(event: KeyboardEvent): void {
        const menuItem = this.keyManager.activeItem?.menuItem();
        if (menuItem) {
            if (menuItem.subMenuItems && menuItem.subMenuItems.length > 0) {
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
            this.parentMenuData.navigate.emit({
                previousItem: previousItem?.menuItem() ?? null,
                currentItem: this.keyManager.activeItem?.menuItem() ?? null,
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
