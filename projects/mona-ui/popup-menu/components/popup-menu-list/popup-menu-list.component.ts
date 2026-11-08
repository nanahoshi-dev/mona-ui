import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    DestroyRef,
    DOCUMENT,
    effect,
    ElementRef,
    inject,
    OnInit,
    signal,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LucideCheck, LucideChevronRight } from "@lucide/angular";
import { createElementControlId, isNavigationKey, isTypeaheadKey, setupTypeahead } from "@nanahoshi/mona-ui/internal";
import { injectComponentDirection } from "@nanahoshi/mona-ui/i18n";
import { PopupDataInjectionToken, PopupRef, PopupService } from "@nanahoshi/mona-ui/popup";
import { selectMany } from "@mirei/ts-collections";
import { fromEvent, Subject, take, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { PopupMenuItem, PopupMenuItemClickEvent } from "@nanahoshi/mona-ui/internal/popup-menu";
import { PopupMenuListConfig } from "../../models/PopupMenuListConfig";
import { groupPopupMenuItems } from "../../utils/popup-menu.utils";
import {
    popupMenuBaseThemeVariants,
    popupMenuContainerThemeVariants,
    popupMenuGroupHeaderThemeVariants,
    popupMenuIconContainerThemeVariants,
    popupMenuItemThemeVariants,
    popupMenuLinkThemeVariants
} from "../../styles/popup-menu.styles";

/**
 * How long the pointer can cross other items, while a submenu is open, before that submenu closes. It gives the
 * pointer time to travel diagonally from a parent item to its submenu.
 */
const SUBMENU_SWITCH_DELAY = 250;

@Component({
    selector: "mona-popup-menu-list",
    imports: [NgTemplateOutlet, LucideChevronRight, LucideCheck],
    templateUrl: "./popup-menu-list.component.html",
    host: {
        "[class]": "baseClasses()",
        "(focusout)": "onFocusOut($event)",
        "(pointerenter)": "onHostPointerEnter()"
    }
})
export class PopupMenuListComponent implements OnInit {
    readonly #childCloseRequest$ = new Subject<void>();
    readonly #destroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #document = inject(DOCUMENT);
    readonly #host = inject(ElementRef<HTMLElement>);
    // Disabled items stay in the arrow-key order (they can't be activated), as the APG menu pattern asks.
    readonly #navigationItems = computed(() => {
        const items = this.#parentConfig.items();
        return selectMany(items, i => i.items)
            .where(i => !i.separator)
            .toImmutableSet();
    });
    readonly #openSubmenuItem = signal<PopupMenuItem | null>(null);
    readonly #parentConfig = inject<PopupMenuListConfig>(PopupDataInjectionToken);
    readonly #popupService = inject(PopupService);
    readonly #submenuId = signal<string | null>(null);
    readonly #typeaheadKey$ = new Subject<string>();
    #childClose$: Subject<void> | null = null;
    #closing = false;
    #hoverTimer: ReturnType<typeof setTimeout> | undefined;
    protected readonly activeMenuItem = signal<PopupMenuItem | null>(null);
    protected readonly ariaLabel = this.#parentConfig.ariaLabel || null;
    protected readonly baseClasses = computed(() => {
        const rounded = this.#parentConfig.rounded();
        return popupMenuBaseThemeVariants({ rounded });
    });
    protected readonly containerClasses = computed(() => {
        const rounded = this.#parentConfig.rounded();
        return popupMenuContainerThemeVariants({ rounded });
    });
    protected readonly groupHeaderClasses = computed(() => {
        const size = this.#parentConfig.size();
        return popupMenuGroupHeaderThemeVariants({ size });
    });
    protected readonly iconAreaVisible = computed(() => {
        const items = this.#parentConfig.items();
        const hasIconsOrSelectable = selectMany(items, i => i.items).any(
            i => i.iconTemplate?.() != null || i.checkable === true || i.radio === true
        );
        return hasIconsOrSelectable || !!this.#parentConfig.popupIconTemplate?.();
    });
    protected readonly iconContainerClasses = computed(() => {
        return popupMenuIconContainerThemeVariants();
    });
    protected readonly isRtl = computed(() => this.#direction() === "rtl");
    protected readonly labelledBy = this.ariaLabel ? null : this.#parentConfig.labelledBy;
    protected readonly linkContainerClasses = computed(() => {
        return popupMenuLinkThemeVariants();
    });
    protected readonly menuId = computed(() => this.#parentConfig.menuId);
    protected readonly menuItemClasses = computed(() => {
        const rounded = this.#parentConfig.rounded();
        const size = this.#parentConfig.size();
        const hasIcon = this.iconAreaVisible();
        const variantClasses = popupMenuItemThemeVariants({ rounded, size });
        const iconClasses = hasIcon ? "ps-8" : "ps-2";
        return twMerge(variantClasses, iconClasses);
    });
    protected readonly menuItems = computed(() => this.#parentConfig.items());
    protected readonly openSubmenuItem = this.#openSubmenuItem.asReadonly();
    protected readonly popupGroupTemplate = computed(() => this.#parentConfig.popupGroupTemplate?.() ?? null);
    protected readonly popupIconTemplate = computed(() => this.#parentConfig.popupIconTemplate?.() ?? null);
    protected readonly popupShortcutTemplate = computed(() => this.#parentConfig.popupShortcutTemplate?.() ?? null);
    protected readonly popupTextTemplate = computed(() => this.#parentConfig.popupTextTemplate?.());
    protected readonly submenuId = this.#submenuId.asReadonly();
    protected popupRef: PopupRef | null = null;

    public constructor() {
        afterNextRender({
            // Moving focus and the highlight writes to the page, so this is the write phase.
            write: () => {
                const config = this.#parentConfig;
                // A submenu opened by the pointer leaves focus in its parent menu.
                if (config.isRoot || config.viaKeyboardNavigation) {
                    this.#menuElement()?.focus();
                }
                if (config.isRoot && config.initialFocus) {
                    if (config.initialFocus === "last") {
                        this.handleEndKey();
                    } else {
                        this.focusFirstItem();
                    }
                } else if (!config.isRoot && config.viaKeyboardNavigation) {
                    const item = this.focusFirstItem();
                    const isRtl = this.isRtl();
                    this.notifyNavigation(item, isRtl ? "left" : "right");
                }
            }
        });
        // Items can change while the menu is open: keep the highlight and the open submenu on the same items.
        effect(() => {
            const items = this.#navigationItems();
            untracked(() => {
                const active = this.activeMenuItem();
                if (active && !items.any(i => i === active)) {
                    this.activeMenuItem.set(items.firstOrDefault(i => i.uid === active.uid) ?? null);
                }
                const open = this.#openSubmenuItem();
                if (open && !items.any(i => i === open)) {
                    const current = items.firstOrDefault(i => i.uid === open.uid);
                    if (current && current.items.length > 0) {
                        this.#openSubmenuItem.set(current);
                    } else {
                        this.closePopup();
                    }
                }
            });
        });
        this.#destroyRef.onDestroy(() => {
            clearTimeout(this.#hoverTimer);
            this.#closing = true;
            this.closePopup();
        });
    }

    public ngOnInit(): void {
        this.setSubscriptions();
    }

    #menuElement(): HTMLElement | null {
        return this.#host.nativeElement.firstElementChild as HTMLElement | null;
    }

    protected asItems(items: unknown): readonly PopupMenuItem[] {
        return items as readonly PopupMenuItem[];
    }

    protected onFocusOut(event: FocusEvent): void {
        const next = event.relatedTarget;
        // Focus that leaves every menu of the chain closes it. Focus moving between the menus doesn't, and nor does
        // focus going nowhere (the window losing focus).
        if (next instanceof Element && !next.closest("mona-popup-menu-list")) {
            this.#parentConfig.closeMenu({ focusLeftTo: next });
        }
    }

    protected onHostPointerEnter(): void {
        this.#parentConfig.submenuPointerEnter?.();
    }

    protected onItemClick(event: MouseEvent, item: PopupMenuItem): void {
        if (item.disabled) {
            return;
        }
        if (item.items.length > 0) {
            // An item with a submenu opens it; only leaf items are activated. A click with no pointer behind it
            // (assistive technology) opens the submenu as the keyboard does.
            this.openSubmenuFromClick(item, event.currentTarget as HTMLElement | null, event.detail === 0);
            return;
        }
        const popupMenuItemClickEvent = new PopupMenuItemClickEvent(item, event);
        item.click$?.next(popupMenuItemClickEvent);
        if (popupMenuItemClickEvent.isDefaultPrevented()) {
            return;
        }
        this.#parentConfig.menuItemClick$.next(popupMenuItemClickEvent);
    }

    protected onItemPointerEnter(event: PointerEvent, item: PopupMenuItem): void {
        clearTimeout(this.#hoverTimer);
        const open = this.#openSubmenuItem();
        if (open === item) {
            this.activeMenuItem.set(item);
            return;
        }
        const target = event.currentTarget as HTMLElement;
        const hover = (): void => {
            this.closePopup();
            if (item.items.length > 0 && !item.disabled) {
                this.activeMenuItem.set(item);
                this.createSubmenu(target, false, item);
            } else {
                this.activeMenuItem.set(null);
            }
        };
        if (open) {
            // Wait before switching, so the pointer can cross other items on its way into the open submenu.
            this.#hoverTimer = setTimeout(hover, SUBMENU_SWITCH_DELAY);
        } else {
            hover();
        }
    }

    private closePopup(): void {
        const ref = this.popupRef;
        this.popupRef = null;
        this.#openSubmenuItem.set(null);
        this.#submenuId.set(null);
        const childClose$ = this.#childClose$;
        this.#childClose$ = null;
        childClose$?.next();
        if (ref) {
            this.reclaimFocus();
            ref.close();
        }
    }

    private closeSubmenu(): void {
        this.#parentConfig.childCloseRequest$?.next();
    }

    private createSubmenu(target: HTMLElement, viaKeyboard: boolean, item: PopupMenuItem): void {
        // One submenu at a time: a submenu that is open (for this item or another) closes first.
        this.closePopup();
        const uid = item.uid;
        const close$ = new Subject<void>();
        const menuId = createElementControlId(this.#parentConfig.level + 1);
        const data: PopupMenuListConfig = {
            childCloseRequest$: this.#childCloseRequest$,
            closeMenu: this.#parentConfig.closeMenu,
            isRoot: false,
            items: computed(() => groupPopupMenuItems(this.findItem(uid)?.items ?? [])),
            labelledBy: uid,
            level: this.#parentConfig.level + 1,
            menuId,
            menuItemClick$: this.#parentConfig.menuItemClick$,
            minWidth: this.#parentConfig.minWidth,
            navigate$: this.#parentConfig.navigate$,
            parentClose$: close$,
            popupGroupTemplate: this.#parentConfig.popupGroupTemplate,
            popupIconTemplate: this.#parentConfig.popupIconTemplate,
            popupShortcutTemplate: this.#parentConfig.popupShortcutTemplate,
            popupTextTemplate: this.#parentConfig.popupTextTemplate,
            rounded: this.#parentConfig.rounded,
            size: this.#parentConfig.size,
            submenuPointerEnter: () => this.onSubmenuPointerEnter(),
            viaKeyboardNavigation: viaKeyboard,
            width: this.#parentConfig.width
        };
        const ref = this.#popupService.create({
            anchor: target,
            anchorConnectionPoint: "topright",
            closeOnScroll: true,
            content: PopupMenuListComponent,
            data,
            minWidth: this.#parentConfig.minWidth?.() ?? undefined,
            popupConnectionPoint: "topleft",
            restoreFocus: false,
            width: this.#parentConfig.width?.() ?? undefined
        });
        this.popupRef = ref;
        this.#childClose$ = close$;
        this.#openSubmenuItem.set(item);
        this.#submenuId.set(menuId);
        ref.closed.pipe(take(1)).subscribe(() => {
            close$.complete();
            // Closed by the popup itself (Escape, scroll); a submenu closed or replaced from here is done already.
            if (this.popupRef !== ref) {
                return;
            }
            this.popupRef = null;
            this.#childClose$ = null;
            this.#openSubmenuItem.set(null);
            this.#submenuId.set(null);
            if (!this.#closing) {
                this.#menuElement()?.focus();
            }
            if (!viaKeyboard) {
                this.activeMenuItem.set(null);
            }
        });
    }

    private cycleThroughMatchedItems(buffer: string): void {
        const matchedItems = this.#navigationItems()
            .where(i => i.label.toLowerCase().startsWith(buffer))
            .toArray();
        const activeMenuItem = this.activeMenuItem();
        if (matchedItems.length === 0) {
            return;
        }
        if (matchedItems.length === 1) {
            this.activeMenuItem.set(matchedItems[0]);
            return;
        }
        if (matchedItems.length > 1) {
            const currentIndex = activeMenuItem ? matchedItems.indexOf(activeMenuItem) : -1;
            const nextIndex = (currentIndex + 1) % matchedItems.length;
            this.activeMenuItem.set(matchedItems[nextIndex]);
        }
    }

    private findItem(uid: string): PopupMenuItem | null {
        return this.#navigationItems().firstOrDefault(i => i.uid === uid) ?? null;
    }

    private focusFirstItem(): PopupMenuItem | null {
        const firstItem = this.#navigationItems().firstOrDefault();
        if (firstItem) {
            this.activeMenuItem.set(firstItem);
        }
        return firstItem;
    }

    private handleArrowDownKey(): PopupMenuItem | null {
        if (!this.activeMenuItem()) {
            const firstItem = this.#navigationItems().firstOrDefault();
            if (firstItem) {
                this.activeMenuItem.set(firstItem);
            }
            return firstItem;
        }
        const nextItems = this.#navigationItems().skipWhile(i => i !== this.activeMenuItem());
        const nextItem = nextItems.skip(1).firstOrDefault();
        if (nextItem) {
            this.activeMenuItem.set(nextItem);
            return nextItem;
        }
        const firstItem = this.#navigationItems().firstOrDefault();
        if (firstItem) {
            this.activeMenuItem.set(firstItem);
        }
        return firstItem;
    }

    private handleArrowUpKey(): PopupMenuItem | null {
        if (!this.activeMenuItem()) {
            const lastItem = this.#navigationItems().lastOrDefault();
            if (lastItem) {
                this.activeMenuItem.set(lastItem);
            }
            return lastItem;
        }
        const items = this.#navigationItems().takeWhile(i => i !== this.activeMenuItem());
        const previousItem = items.lastOrDefault();
        if (previousItem) {
            this.activeMenuItem.set(previousItem);
            return previousItem;
        }
        const lastItem = this.#navigationItems().lastOrDefault();
        if (lastItem) {
            this.activeMenuItem.set(lastItem);
        }
        return lastItem;
    }

    private handleEndKey(): void {
        const lastItem = this.#navigationItems().lastOrDefault();
        if (lastItem) {
            this.activeMenuItem.set(lastItem);
        }
    }

    private handleEnterKey(): void {
        const activeItem = this.activeMenuItem();
        if (activeItem?.disabled) {
            return;
        }
        if (activeItem && activeItem.items.length > 0) {
            const target = this.#host.nativeElement.querySelector('[data-active="true"]');
            if (target) {
                this.createSubmenu(target as HTMLElement, true, activeItem);
            }
        } else if (activeItem) {
            const syntheticEvent = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                composed: true
            });
            this.onItemClick(syntheticEvent, activeItem);
        }
    }

    private handleEscapeKey(): void {
        this.closePopup();
    }

    private handleHomeKey(): void {
        const firstItem = this.#navigationItems().firstOrDefault();
        if (firstItem) {
            this.activeMenuItem.set(firstItem);
        }
    }

    private handleNavigationKey(event: KeyboardEvent): void {
        const isRtl = this.isRtl();
        const openKey = isRtl ? "ArrowLeft" : "ArrowRight";
        const closeKey = isRtl ? "ArrowRight" : "ArrowLeft";
        const forwardDir = isRtl ? "left" : "right";
        const backwardDir = isRtl ? "right" : "left";

        let item: PopupMenuItem | null = null;
        if (event.key === "ArrowDown") {
            item = this.handleArrowDownKey();
            this.notifyNavigation(item, "down");
        } else if (event.key === closeKey) {
            this.closeSubmenu();
            if (this.#parentConfig.level === 0) {
                this.notifyNavigation(null, backwardDir);
            }
        } else if (event.key === openKey) {
            const result = this.openSubmenu();
            if (!result.hasChild) {
                this.notifyNavigation(item, forwardDir);
            }
        } else if (event.key === "ArrowUp") {
            item = this.handleArrowUpKey();
            this.notifyNavigation(item, "up");
        } else if (event.key === "End") {
            this.handleEndKey();
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            this.handleEnterKey();
        } else if (event.key === "Escape") {
            this.handleEscapeKey();
        } else if (event.key === "Home") {
            this.handleHomeKey();
        }
    }

    private handleTypeaheadKey(event: KeyboardEvent): void {
        this.#typeaheadKey$.next(event.key);
    }

    private notifyNavigation(item: PopupMenuItem | null, direction: "up" | "down" | "left" | "right"): void {
        this.#parentConfig.navigate$.next({
            direction,
            item,
            level: this.#parentConfig.level
        });
    }

    private onSubmenuPointerEnter(): void {
        // The pointer reached the open submenu: keep it, and its parent item highlighted.
        clearTimeout(this.#hoverTimer);
        const open = this.#openSubmenuItem();
        if (open) {
            this.activeMenuItem.set(open);
        }
    }

    private openSubmenu(): { item: PopupMenuItem | null; hasChild: boolean } {
        const activeItem = this.activeMenuItem();
        if (!activeItem || activeItem.disabled) {
            return { item: null, hasChild: false };
        }
        const target = this.#host.nativeElement.querySelector('[data-active="true"]');
        if (target && activeItem.items.length > 0) {
            this.createSubmenu(target as HTMLElement, true, activeItem);
            return { item: activeItem, hasChild: true };
        }
        if (activeItem && activeItem.items.length > 0) {
            return { item: activeItem, hasChild: true };
        }
        return { item: null, hasChild: false };
    }

    private openSubmenuFromClick(item: PopupMenuItem, target: HTMLElement | null, viaKeyboard: boolean): void {
        if (!target || (this.popupRef && this.#openSubmenuItem() === item)) {
            return;
        }
        this.activeMenuItem.set(item);
        this.createSubmenu(target, viaKeyboard, item);
    }

    private reclaimFocus(): void {
        // Focus inside the closing submenu (or deeper) comes back to this menu.
        if (this.#closing) {
            return;
        }
        const active = this.#document.activeElement;
        if (active && !this.#host.nativeElement.contains(active) && active.closest("mona-popup-menu-list")) {
            this.#menuElement()?.focus();
        }
    }

    private setKeyboardEvents(): void {
        const element = this.#menuElement();
        if (!element) {
            return;
        }
        fromEvent<KeyboardEvent>(element, "keydown")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                tap(e => {
                    if (e.key === "Tab") {
                        // Tab closes every menu and moves on from the trigger, as the APG menu button asks.
                        this.#parentConfig.closeMenu({ tab: true });
                    } else if (isNavigationKey(e.key)) {
                        e.preventDefault();
                        this.#typeaheadKey$.next("");
                        this.handleNavigationKey(e);
                    } else if (isTypeaheadKey(e.key, e)) {
                        e.preventDefault();
                        this.handleTypeaheadKey(e);
                    }
                })
            )
            .subscribe();
    }

    private setPopupCloseSubscription(): void {
        this.#parentConfig.parentClose$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                tap(() => {
                    this.#closing = true;
                    this.closePopup();
                })
            )
            .subscribe();
        this.#childCloseRequest$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                tap(() => {
                    const activeItem = this.activeMenuItem();
                    const isRtl = this.isRtl();
                    this.notifyNavigation(activeItem, isRtl ? "right" : "left");
                    this.closePopup();
                })
            )
            .subscribe();
    }

    private setSubscriptions(): void {
        this.setKeyboardEvents();
        this.setPopupCloseSubscription();
        this.setTypeaheadSubscription();
    }

    private setTypeaheadSubscription(): void {
        setupTypeahead(this.#typeaheadKey$)
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(buffer => this.cycleThroughMatchedItems(buffer));
    }
}
