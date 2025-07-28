import { Point } from "@angular/cdk/drag-drop";
import {
    ChangeDetectionStrategy,
    Component,
    contentChild,
    contentChildren,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    OnInit,
    output,
    signal,
    TemplateRef
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { any, first, from, ImmutableSet, toImmutableSet } from "@mirei/ts-collections";
import { delay, fromEvent, Subject, Subscription, take } from "rxjs";
import { v4 } from "uuid";
import { PopupOffset } from "../../../../popup/models/PopupOffset";
import { PopupRef } from "../../../../popup/models/PopupRef";
import { ConnectionPoint } from "../../../../popup/utils/connectionPosition";
import { ThemeService } from "../../../../theme/services/theme.service";
import { ContextMenuContentVariantInput, ContextMenuContentVariantProps } from "../../../styles/menu.styles";
import { ContextMenuContentComponent } from "../context-menu-content/context-menu-content.component";
import { MenuGroupTemplateDirective } from "../../../directives/menu-group-template.directive";
import { MenuItemIconTemplateDirective } from "../../../directives/menu-item-icon-template.directive";
import { MenuItemShortcutTemplateDirective } from "../../../directives/menu-item-shortcut-template.directive";
import { MenuItemTextTemplateDirective } from "../../../directives/menu-item-text-template.directive";
import { MenuItemGroupComponent } from "../../../menu-item-group/menu-item-group.component";
import { MenuItemComponent } from "../../../menu-item/menu-item.component";
import { ContextMenuCloseEvent } from "../../../models/ContextMenuCloseEvent";
import { ContextMenuInjectorData } from "../../../models/ContextMenuInjectorData";
import { ContextMenuNavigationEvent } from "../../../models/ContextMenuNavigationEvent";
import { ContextMenuOpenEvent } from "../../../models/ContextMenuOpenEvent";
import { MenuItem, MenuItemOptions } from "../../../models/MenuItem";
import { InternalMenuItemClickEvent, MenuItemClickEvent } from "../../../models/MenuItemClickEvent";
import { MenuItemInjectionToken } from "../../../models/MenuItemInjectionToken";
import { ContextMenuService } from "../../../services/context-menu.service";
import { convertToMenuItemSet, prepareMenuItems } from "../../../utils/menu.utils";

@Component({
    selector: "mona-contextmenu",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContextMenuComponent<C = any> implements OnInit, ContextMenuContentVariantInput {
    readonly #contextMenuInjectorData: ContextMenuInjectorData = {
        isRoot: true,
        menuItems: signal(ImmutableSet.create()),
        rounded: "medium",
        size: "medium",
        userClasses: signal(""),
        userStyles: signal("")
    };
    readonly #contextMenuService = inject(ContextMenuService);
    readonly #destroyRef = inject(DestroyRef);
    readonly #menuClickNotifier = new Subject<InternalMenuItemClickEvent<C>>();
    #contextMenuRef: PopupRef | null = null;
    #subscription: Subscription | null = null;
    protected readonly groupTemplate = contentChild(MenuGroupTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly iconTemplate = contentChild(MenuItemIconTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly menuItemComponents = contentChildren<MenuItemComponent | MenuItemGroupComponent>(
        MenuItemInjectionToken
    );
    protected readonly menuItemList = signal<ImmutableSet<ImmutableSet<MenuItem>>>(ImmutableSet.create());
    protected readonly shortcutTemplate = contentChild(MenuItemShortcutTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });
    protected readonly textTemplate = contentChild(MenuItemTextTemplateDirective, {
        read: TemplateRef,
        descendants: false
    });

    /**
     * @description The anchor element that the context menu will be anchored to.
     * Only applicable when `precise` is set to `false`.
     */
    public readonly anchor = input<ElementRef | Element>();

    /**
     * @description The anchor connection point of the context menu.
     * Only applicable when `precise` is set to `false`.
     */
    public readonly anchorConnectionPoint = input<ConnectionPoint | null>();

    /**
     * @description Emits when the context menu is closed.
     */
    public readonly close = output<ContextMenuCloseEvent>();

    /**
     * @description The context object to be passed to the menu items.
     */
    public readonly context = input<C>();

    /**
     * @description Emits when any of the menu items are clicked.
     */
    public readonly menuClick = output<MenuItemClickEvent<C>>();

    /**
     * @description The menu items to be displayed in the context menu.
     * If this is set, the menu items from the content children will be ignored.
     */
    public readonly menuItems = input<Iterable<MenuItemOptions | MenuItem>>([]);

    /**
     * @description Minimum width of the context menu. Only applies to the root context menu.
     */
    public readonly minWidth = input(undefined, {
        transform: (value: string | number | undefined) => {
            if (typeof value === "number") {
                return `${value}px`;
            }
            return value;
        }
    });

    /**
     * @description Emits when context menu navigation occurs.
     */
    public readonly navigate = output<ContextMenuNavigationEvent>();

    /**
     * @description The offset of the context menu.
     */
    public readonly offset = input<PopupOffset>();

    /**
     * @description Emits when the context menu is opened.
     */
    public readonly open = output<ContextMenuOpenEvent>();

    /**
     * @description The popup class of the context menu.
     */
    public readonly popupClass = input([], {
        transform: (value: string | string[]) => {
            if (Array.isArray(value)) {
                return value;
            }
            return [value];
        }
    });

    /**
     * @description The connection point of the popup element to which the anchor will be connected.
     * Only applicable when `precise` is set to `false`.
     */
    public readonly popupConnectionPoint = input<ConnectionPoint | null>();

    /**
     * @description Whether the context menu should be opened with precise positioning.
     * If true, the context menu will be positioned at the mouse cursor position.
     * If false, it will be positioned at the target element. If an anchor is provided, it will be anchored to that element.
     */
    public readonly precise = input(true);

    /**
     * @description Sets the border radius of the context menu.
     * This will be applied to the root context menu and all submenus.
     */
    public readonly rounded = input<ContextMenuContentVariantProps["rounded"]>("medium");

    /**
     * @description The size of the context menu.
     * This will be applied to the root context menu and all submenus.
     */
    public readonly size = input<ContextMenuContentVariantProps["size"]>("medium");

    /**
     * @description The target element that will be used to trigger the context menu.
     */
    public readonly target = input.required<ElementRef | Element>();

    /**
     * @description Whether the context menu is toggleable.
     */
    public readonly toggleable = input(false);

    /**
     * @description The event that triggers the context menu.
     */
    public readonly trigger = input("contextmenu");

    public readonly uid = v4();

    /**
     * @description The user classes to be applied to the context menu.
     * These will be applied to the root context menu and all submenus.
     */
    public readonly userClasses = input<string>("", { alias: "class" });

    /**
     * @description The user styles to be applied to the context menu.
     * These will be applied to the root context menu and all submenus.
     */
    public readonly userStyles = input<string>("", { alias: "style" });

    /**
     * @description The width of the context menu. Only applies to the root context menu.
     */
    public readonly width = input(undefined, {
        transform: (value: number | string | undefined) => {
            if (typeof value === "number") {
                return `${value}px`;
            }
            return value;
        }
    });

    public constructor() {
        effect(() => {
            const trigger = this.trigger();
            this.anchor();
            this.target();
            if (this.#subscription) {
                this.#subscription.unsubscribe();
                this.#subscription = null;
            }
            if (trigger) {
                this.setEventListeners();
            }
        });
    }

    public closeMenu(): void {
        this.#contextMenuRef?.close();
        this.#contextMenuRef = null;
    }

    public ngOnInit(): void {
        this.setEventListeners();
    }

    public openMenu(): void {
        this.create(new MouseEvent("click"));
    }

    private create(event: MouseEvent): void {
        this.initMenuItems();

        this.#contextMenuInjectorData.context = this.context();
        this.#contextMenuInjectorData.groupTemplate = this.groupTemplate();
        this.#contextMenuInjectorData.iconTemplate = this.iconTemplate();
        this.#contextMenuInjectorData.menuClick = this.#menuClickNotifier;
        this.#contextMenuInjectorData.menuItems.set(this.menuItemList());
        this.#contextMenuInjectorData.navigate = this.navigate;
        this.#contextMenuInjectorData.popupClass = this.popupClass();
        this.#contextMenuInjectorData.rounded = this.rounded();
        this.#contextMenuInjectorData.shortcutTemplate = this.shortcutTemplate();
        this.#contextMenuInjectorData.size = this.size();
        this.#contextMenuInjectorData.textTemplate = this.textTemplate();
        this.#contextMenuInjectorData.userClasses = this.userClasses;
        this.#contextMenuInjectorData.userStyles = this.userStyles;

        const targetInput = this.anchor() ?? this.target();
        const targetElement = targetInput instanceof ElementRef ? targetInput.nativeElement : targetInput;
        let anchor: Point | Element;
        if (this.precise()) {
            if (event.button < 0) {
                const rect = targetElement.getBoundingClientRect();
                anchor = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            } else {
                anchor = { x: event.x + 1, y: event.y + 1 };
            }
        } else {
            anchor = targetElement;
        }

        const anchorConnectionPoint = this.precise() ? undefined : this.anchorConnectionPoint();
        const popupConnectionPoint = this.precise() ? undefined : this.popupConnectionPoint();

        this.#contextMenuRef = this.#contextMenuService.open({
            anchor,
            anchorConnectionPoint,
            closeOnOutsideClick: true,
            content: ContextMenuContentComponent,
            data: this.#contextMenuInjectorData,
            minWidth: this.minWidth(),
            offset: this.offset(),
            popupClass: this.popupClass(),
            popupConnectionPoint,
            closeOnScroll: true,
            withScrollTracking: false,
            width: this.width()
        });
        this.setCloseSubscriptions();
        this.#contextMenuInjectorData.parentMenuRef = this.#contextMenuRef;
        this.open.emit({ uid: this.uid, popupRef: this.#contextMenuRef as PopupRef });
        this.#contextMenuRef.closed.pipe(take(1), delay(100)).subscribe(() => {
            this.close.emit({ uid: this.uid });
            this.#contextMenuRef = null;
        });
    }

    private initMenuItems(): void {
        const menuItemComponents = this.menuItemComponents();
        if (any(this.menuItems())) {
            const firstItem = first(this.menuItems());
            if (this.isMenuItem(firstItem)) {
                const items = from(this.menuItems())
                    .select(mi => mi as MenuItem)
                    .toImmutableSet();
                this.menuItemList.set(toImmutableSet([items]));
                return;
            }
            const menuSet = convertToMenuItemSet(this.menuItems() as Iterable<MenuItemOptions>);
            this.menuItemList.set(menuSet);
            return;
        }
        const items = prepareMenuItems(menuItemComponents);
        this.menuItemList.update(set => set.clear().addAll(items));
    }

    private isMenuItem(item: any): item is MenuItem {
        return item && typeof item === "object" && "options" in item && "subMenuItemsSet" in item;
    }

    private setCloseSubscriptions(): void {
        this.#menuClickNotifier.pipe(take(1), takeUntilDestroyed(this.#destroyRef)).subscribe(e => {
            this.#contextMenuRef?.close();
            const event = new MenuItemClickEvent<C>(e);
            this.menuClick.emit(event);
        });
    }

    private setEventListeners(): void {
        const target = this.target() || this.anchor();
        const eventTarget = target instanceof ElementRef ? target.nativeElement : target;
        this.#subscription = fromEvent<MouseEvent>(eventTarget, this.trigger())
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                event.stopPropagation();
                event.preventDefault();
                if (this.#contextMenuRef) {
                    this.closeMenu();
                    if (this.toggleable()) {
                        return;
                    }
                }
                this.create(event);
            });
    }
}
