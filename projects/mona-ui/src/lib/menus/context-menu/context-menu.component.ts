import { Point } from "@angular/cdk/drag-drop";
import {
    ChangeDetectionStrategy,
    Component,
    contentChildren,
    DestroyRef,
    ElementRef,
    inject,
    input,
    OnInit,
    output,
    signal
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { any, first, from, ImmutableSet, toImmutableSet } from "@mirei/ts-collections";
import { delay, fromEvent, Subject, take } from "rxjs";
import { v4 } from "uuid";
import { PopupOffset } from "../../popup/models/PopupOffset";
import { PopupRef } from "../../popup/models/PopupRef";
import { ConnectionPoint } from "../../popup/utils/connectionPosition";
import { ContextMenuContentComponent } from "../context-menu-content/context-menu-content.component";
import { MenuItemGroupComponent } from "../menu-item-group/menu-item-group.component";
import { MenuItemComponent } from "../menu-item/menu-item.component";
import { ContextMenuCloseEvent } from "../models/ContextMenuCloseEvent";
import { ContextMenuInjectorData } from "../models/ContextMenuInjectorData";
import { ContextMenuNavigationEvent } from "../models/ContextMenuNavigationEvent";
import { ContextMenuOpenEvent } from "../models/ContextMenuOpenEvent";
import { MenuItem, MenuItemOptions } from "../models/MenuItem";
import { InternalMenuItemClickEvent } from "../models/MenuItemClickEvent";
import { MenuItemInjectionToken } from "../models/MenuItemInjectionToken";
import { ContextMenuService } from "../services/context-menu.service";
import { convertToMenuItemSet, prepareMenuItems } from "../utils/menu.utils";

@Component({
    selector: "mona-contextmenu",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContextMenuComponent<C = any> implements OnInit {
    readonly #contextMenuInjectorData: ContextMenuInjectorData = {
        isRoot: true,
        menuItems: signal(ImmutableSet.create()),
        userClasses: signal(""),
        userStyles: signal("")
    };
    readonly #contextMenuService = inject(ContextMenuService);
    readonly #destroyRef = inject(DestroyRef);
    readonly #menuClickNotifier = new Subject<InternalMenuItemClickEvent<C>>();
    #contextMenuRef: PopupRef | null = null;
    #precise: boolean = true;
    protected readonly menuItemComponents = contentChildren<MenuItemComponent | MenuItemGroupComponent>(
        MenuItemInjectionToken
    );
    protected readonly menuItemList = signal<ImmutableSet<ImmutableSet<MenuItem>>>(ImmutableSet.create());

    /**
     * The anchor element that the context menu will be anchored to.
     */
    public readonly anchor = input.required<ElementRef | Element>();

    /**
     * The anchor connection point of the context menu.
     */
    public readonly anchorConnectionPoint = input<ConnectionPoint | null | undefined>(null);

    /**
     * Emits when the context menu is closed.
     */
    public readonly close = output<ContextMenuCloseEvent>();

    /**
     * The context object to be passed to the menu items.
     */
    public readonly context = input<C>();

    /**
     * The menu items to be displayed in the context menu.
     * If this is set, the menu items from the content children will be ignored.
     */
    public readonly menuItems = input<Iterable<MenuItemOptions | MenuItem>>([]);

    /**
     * Minimum width of the context menu. Only applies to the root context menu.
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
     * Emits when context menu navigation occurs.
     */
    public readonly navigate = output<ContextMenuNavigationEvent>();

    /**
     * The offset of the context menu.
     */
    public readonly offset = input<PopupOffset | undefined>(undefined);

    /**
     * Emits when the context menu is opened.
     */
    public readonly open = output<ContextMenuOpenEvent>();

    /**
     * The popup class of the context menu.
     */
    public readonly popupClass = input([], {
        transform: (value: string | string[]) => {
            if (Array.isArray(value)) {
                return value;
            }
            return [value];
        }
    });

    public readonly popupConnectionPoint = input<ConnectionPoint | null | undefined>("topleft");

    /**
     * @description The target element that will be used to trigger the context menu.
     */
    public readonly target = input<ElementRef | Element | null>(null);

    /**
     * The event that triggers the context menu.
     */
    public readonly trigger = input("contextmenu");

    public readonly uid = v4();

    /**
     * The user classes to be applied to the context menu.
     * These will be applied to the root context menu and all submenus.
     */
    public readonly userClasses = input<string>("", { alias: "class" });

    /**
     * The user styles to be applied to the context menu.
     * These will be applied to the root context menu and all submenus.
     */
    public readonly userStyles = input<string>("", { alias: "style" });

    /**
     * The width of the context menu. Only applies to the root context menu.
     */
    public readonly width = input(undefined, {
        transform: (value: number | string | undefined) => {
            if (typeof value === "number") {
                return `${value}px`;
            }
            return value;
        }
    });

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

    public setPrecise(precise: boolean): void {
        this.#precise = precise;
    }

    private create(event: MouseEvent): void {
        this.initMenuItems();

        this.#contextMenuInjectorData.context = this.context();
        this.#contextMenuInjectorData.menuClick = this.#menuClickNotifier;
        this.#contextMenuInjectorData.menuItems.set(this.menuItemList());
        this.#contextMenuInjectorData.navigate = this.navigate;
        this.#contextMenuInjectorData.popupClass = this.popupClass();
        this.#contextMenuInjectorData.userClasses = this.userClasses;
        this.#contextMenuInjectorData.userStyles = this.userStyles;

        const anchorInput = this.anchor();
        const anchorElement = anchorInput instanceof ElementRef ? anchorInput.nativeElement : anchorInput;
        let anchor: Point | Element;
        if (this.#precise) {
            if (event.button < 0) {
                const rect = anchorElement.getBoundingClientRect();
                anchor = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            } else {
                anchor = { x: event.x + 1, y: event.y + 1 };
            }
        } else {
            anchor = anchorElement;
        }

        this.#contextMenuRef = this.#contextMenuService.open({
            anchor,
            closeOnOutsideClick: true,
            content: ContextMenuContentComponent,
            data: this.#contextMenuInjectorData,
            minWidth: this.minWidth(),
            offset: this.offset(),
            anchorConnectionPoint: this.anchorConnectionPoint() ?? undefined,
            popupConnectionPoint: this.popupConnectionPoint() ?? undefined,
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

    private setEventListeners(): void {
        const target = this.target() || this.anchor();
        const eventTarget = target instanceof ElementRef ? target.nativeElement : target;
        fromEvent<MouseEvent>(eventTarget, this.trigger())
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                event.stopPropagation();
                event.preventDefault();
                if (this.#contextMenuRef) {
                    this.closeMenu();
                    return;
                }
                this.create(event);
            });
    }

    private setCloseSubscriptions(): void {
        this.#menuClickNotifier.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.#contextMenuRef?.close();
        });
    }
}
