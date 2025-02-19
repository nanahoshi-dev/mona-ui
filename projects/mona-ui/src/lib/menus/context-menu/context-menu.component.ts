import { Point } from "@angular/cdk/drag-drop";
import { ConnectedPosition } from "@angular/cdk/overlay";
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
import { any, ImmutableSet, toArray } from "@mirei/ts-collections";
import { filter, fromEvent, mergeWith, Subject, take } from "rxjs";
import { v4 } from "uuid";
import { PopupOffset } from "../../popup/models/PopupOffset";
import { PopupRef } from "../../popup/models/PopupRef";
import { ContextMenuContentComponent } from "../context-menu-content/context-menu-content.component";
import { MenuItemComponent } from "../menu-item/menu-item.component";
import { ContextMenuCloseEvent } from "../models/ContextMenuCloseEvent";
import { ContextMenuInjectorData, InternalMenuItemClickEvent } from "../models/ContextMenuInjectorData";
import { ContextMenuNavigationEvent } from "../models/ContextMenuNavigationEvent";
import { ContextMenuOpenEvent } from "../models/ContextMenuOpenEvent";
import { MenuItem } from "../models/MenuItem";
import { ContextMenuService } from "../services/context-menu.service";

@Component({
    selector: "mona-contextmenu",
    template: "",
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContextMenuComponent<C = any> implements OnInit {
    readonly #contextMenuInjectorData: Partial<ContextMenuInjectorData> = { isRoot: true, userClasses: signal("") };
    readonly #contextMenuService = inject(ContextMenuService);
    readonly #destroyRef = inject(DestroyRef);
    readonly #menuClickNotifier = new Subject<InternalMenuItemClickEvent<C>>();
    #contextMenuRef: PopupRef | null = null;
    #precise: boolean = true;

    protected readonly menuItemComponents = contentChildren(MenuItemComponent);
    protected readonly menuItemList = signal<ImmutableSet<MenuItem>>(ImmutableSet.create());

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
    public readonly menuItems = input<Iterable<MenuItem>>([]);

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

    public readonly positions = input<Iterable<ConnectedPosition> | null>(null);

    /**
     * The target element that the context menu will be anchored to.
     */
    public readonly target = input.required<ElementRef | Element>();

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
        this.#contextMenuInjectorData.menuItems = this.menuItemList();
        this.#contextMenuInjectorData.navigate = this.navigate;
        this.#contextMenuInjectorData.popupClass = this.popupClass();
        this.#contextMenuInjectorData.userClasses = this.userClasses;
        this.#contextMenuInjectorData.userStyles = this.userStyles;

        const target = this.target();
        const anchorElement = target instanceof ElementRef ? target.nativeElement : target;
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

        const positions = this.positions() ? toArray(this.positions() as Iterable<ConnectedPosition>) : undefined;
        this.#contextMenuRef = this.#contextMenuService.open({
            anchor,
            closeOnOutsideClick: true,
            content: ContextMenuContentComponent,
            data: this.#contextMenuInjectorData,
            minWidth: this.minWidth(),
            offset: this.offset(),
            positions,
            width: this.width()
        });
        this.setCloseSubscriptions();
        this.#contextMenuInjectorData.parentMenuRef = this.#contextMenuRef;
        this.open.emit({ uid: this.uid, popupRef: this.#contextMenuRef as PopupRef });
        this.#contextMenuRef.closed
            .pipe(take(1))
            .subscribe(() => this.close.emit({ uid: this.uid, popupRef: this.#contextMenuRef as PopupRef }));
    }

    private initMenuItems(): void {
        const menuItemComponents = this.menuItemComponents();
        if (any(this.menuItems())) {
            this.menuItemList.update(set => set.clear().addAll(this.menuItems()));
            return;
        }
        this.menuItemList.set(ImmutableSet.create(menuItemComponents.map(m => m.getMenuItem())));
    }

    private onOutsideClick(event: MouseEvent): void {
        if (!this.#contextMenuRef) {
            return;
        }
        if (this.#contextMenuRef.overlayRef.overlayElement?.contains(event.target as HTMLElement)) {
            return;
        }
        this.#contextMenuRef.close();
    }

    private setEventListeners(): void {
        const target = this.target();
        const eventTarget = target instanceof ElementRef ? target.nativeElement : target;
        fromEvent<MouseEvent>(eventTarget, this.trigger())
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                event.stopPropagation();
                event.preventDefault();
                this.create(event);
            });
    }

    private setCloseSubscriptions(): void {
        fromEvent<MouseEvent>(window, "click")
            .pipe(
                mergeWith(
                    fromEvent<MouseEvent>(window, "contextmenu"),
                    fromEvent<MouseEvent>(window, "auxclick"),
                    fromEvent<MouseEvent>(window, "keydown")
                ),
                filter(event => !!this.#contextMenuRef && !(event.target as HTMLElement).closest("[data-contextmenu]")),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe(event => {
                if (event instanceof KeyboardEvent && event.key === "Escape") {
                    this.#contextMenuRef?.close();
                }
                if (event instanceof MouseEvent) {
                    this.onOutsideClick(event);
                }
            });

        this.#menuClickNotifier.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.#contextMenuRef?.close();
        });
    }
}
