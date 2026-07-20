import { NgTemplateOutlet } from "@angular/common";
import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LucideCheck, LucideChevronRight } from "@lucide/angular";
import { createElementControlId, isNavigationKey, isTypeaheadKey, setupTypeahead } from "@nanahoshi/mona-ui/internal";
import { PopupCloseEvent, PopupDataInjectionToken, PopupRef, PopupService } from "@nanahoshi/mona-ui/popup";
import { groupBy, selectMany } from "@mirei/ts-collections";
import { filter, fromEvent, Observable, Subject, switchMap, take, takeUntil, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { PopupMenuItem } from "../../models/PopupMenuItem";
import { PopupMenuItemClickEvent } from "../../models/PopupMenuItemClickEvent";
import { PopupMenuListConfig } from "../../models/PopupMenuListConfig";
import {
    popupMenuBaseThemeVariants,
    popupMenuContainerThemeVariants,
    popupMenuGroupHeaderThemeVariants,
    popupMenuIconContainerThemeVariants,
    popupMenuItemThemeVariants,
    popupMenuLinkThemeVariants
} from "../../styles/popup-menu.styles";

@Component({
    selector: "mona-popup-menu-list",
    imports: [NgTemplateOutlet, LucideChevronRight, LucideCheck],
    templateUrl: "./popup-menu-list.component.html",
    host: {
        "[class]": "baseClasses()"
    }
})
export class PopupMenuListComponent implements OnInit {
    readonly #childCloseRequest$ = new Subject<void>();
    readonly #childMenuItems = computed(() => {
        const activeMenuItem = this.activeMenuItem();
        if (activeMenuItem) {
            return groupBy(activeMenuItem.items, item => item.group).toArray();
        }
        return [];
    });
    readonly #close$ = new Subject<void>();
    readonly #config = computed(() => {
        const data: PopupMenuListConfig = {
            childCloseRequest$: this.#childCloseRequest$,
            isRoot: false,
            items: this.#childMenuItems(),
            level: this.#parentConfig.level + 1,
            menuId: createElementControlId(this.#parentConfig.level + 1),
            menuItemClick$: this.#parentConfig.menuItemClick$,
            minWidth: this.#parentConfig.minWidth,
            navigate$: this.#parentConfig.navigate$,
            parentClose$: this.#close$,
            popupGroupTemplate: this.#parentConfig.popupGroupTemplate,
            popupIconTemplate: this.#parentConfig.popupIconTemplate,
            popupShortcutTemplate: this.#parentConfig.popupShortcutTemplate,
            popupTextTemplate: this.#parentConfig.popupTextTemplate,
            rounded: this.#parentConfig.rounded,
            size: this.#parentConfig.size,
            viaKeyboardNavigation: this.#viaKeyboardNavigation(),
            width: this.#parentConfig.width
        };
        return data;
    });
    readonly #destroyRef = inject(DestroyRef);
    readonly #host = inject(ElementRef<HTMLElement>);
    readonly #navigationItems = computed(() => {
        const items = this.#parentConfig.items;
        return selectMany(items, i => i.source)
            .where(i => !i.separator && !i.disabled)
            .toImmutableSet();
    });
    readonly #parentConfig = inject<PopupMenuListConfig>(PopupDataInjectionToken);
    readonly #popupService = inject(PopupService);
    readonly #typeaheadKey$ = new Subject<string>();
    readonly #viaKeyboardNavigation = signal(false);
    protected readonly activeMenuItem = signal<PopupMenuItem | null>(null);
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
        const hasIcon = this.iconAreaVisible();
        const variantClasses = popupMenuGroupHeaderThemeVariants({ size });
        const iconClasses = hasIcon ? "pl-8" : "pl-2";
        return twMerge(variantClasses, iconClasses);
    });
    protected readonly iconAreaVisible = computed(() => {
        const items = this.#parentConfig.items;
        const hasIconsOrSelectable = selectMany(items, i => i.source).any(
            i => i.iconTemplate?.() != null || i.checkable === true || i.radio === true
        );
        return hasIconsOrSelectable || !!this.#parentConfig.popupIconTemplate?.();
    });
    protected readonly iconContainerClasses = computed(() => {
        return popupMenuIconContainerThemeVariants();
    });
    protected readonly linkContainerClasses = computed(() => {
        return popupMenuLinkThemeVariants();
    });
    protected readonly menuId = computed(() => this.#parentConfig.menuId);
    protected readonly menuItemClasses = computed(() => {
        const rounded = this.#parentConfig.rounded();
        const size = this.#parentConfig.size();
        const hasIcon = this.iconAreaVisible();
        const variantClasses = popupMenuItemThemeVariants({ rounded, size });
        const iconClasses = hasIcon ? "pl-8" : "pl-2";
        return twMerge(variantClasses, iconClasses);
    });
    protected readonly menuItems = computed(() => this.#parentConfig.items);
    protected readonly pointerEnter$ = new Subject<{ event: PointerEvent; item: PopupMenuItem }>();
    protected readonly pointerLeave$ = new Subject<{ event: PointerEvent; item: PopupMenuItem }>();
    protected readonly popupGroupTemplate = computed(() => this.#parentConfig.popupGroupTemplate?.() ?? null);
    protected readonly popupIconTemplate = computed(() => this.#parentConfig.popupIconTemplate?.() ?? null);
    protected readonly popupShortcutTemplate = computed(() => this.#parentConfig.popupShortcutTemplate?.() ?? null);
    protected readonly popupTextTemplate = computed(() => this.#parentConfig.popupTextTemplate?.());
    protected popupRef: PopupRef | null = null;

    public constructor() {
        afterNextRender({
            read: () => {
                this.#host.nativeElement.firstElementChild?.focus();
                if (!this.#parentConfig.isRoot && this.#parentConfig.viaKeyboardNavigation) {
                    const item = this.focusFirstItem();
                    this.notifyNavigation(item, "right");
                }
            }
        });
    }

    public ngOnInit(): void {
        this.setSubscriptions();
    }

    protected onItemClick(event: MouseEvent, item: PopupMenuItem): void {
        const popupMenuItemClickEvent = new PopupMenuItemClickEvent(item, event);
        item.click$?.next(popupMenuItemClickEvent);
        if (popupMenuItemClickEvent.isDefaultPrevented()) {
            return;
        }
        this.#parentConfig.menuItemClick$.next(popupMenuItemClickEvent);
    }

    private closePopup(): void {
        if (this.popupRef) {
            this.popupRef.close();
            this.popupRef = null;
        }
        this.#close$.next();
    }

    private createSubmenu(target: HTMLElement, viaKeyboard: boolean): Observable<PopupCloseEvent> {
        this.#viaKeyboardNavigation.set(viaKeyboard);
        const minWidth = this.#parentConfig.minWidth?.() ?? undefined;
        const width = this.#parentConfig.width?.() ?? undefined;
        this.popupRef = this.#popupService.create({
            anchor: target,
            anchorConnectionPoint: "topright",
            closeOnScroll: true,
            content: PopupMenuListComponent,
            data: this.#config(),
            minWidth,
            popupConnectionPoint: "topleft",
            restoreFocus: false,
            width
        });
        return this.popupRef.closed.pipe(
            take(1),
            tap(() => {
                this.popupRef = null;
                this.#host.nativeElement.firstElementChild?.focus();
                this.#close$.next();
                if (!viaKeyboard) {
                    this.activeMenuItem.set(null);
                }
            })
        );
    }

    private cycleThroughMatchedItems(buffer: string): void {
        const matchedItems = this.#navigationItems()
            .where(i => i.label.toLowerCase().startsWith(buffer))
            .toArray();
        const activeMenuItem = this.activeMenuItem();
        if (matchedItems.length === 0) {
            this.activeMenuItem.set(null);
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

    private handleArrowLeftKey(): void {
        this.#parentConfig.childCloseRequest$?.next();
    }

    private handleArrowRightKey(): { item: PopupMenuItem | null; hasChild: boolean } {
        const activeItem = this.activeMenuItem();
        if (!activeItem) {
            return { item: null, hasChild: false };
        }
        const target = this.#host.nativeElement.querySelector('[data-active="true"]');
        if (target && activeItem.items.length > 0) {
            this.createSubmenu(target as HTMLElement, true).subscribe();
            return { item: activeItem, hasChild: true };
        }
        if (activeItem && activeItem.items.length > 0) {
            return { item: activeItem, hasChild: true };
        }
        return { item: null, hasChild: false };
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
        if (activeItem && activeItem.items.length > 0) {
            const target = this.#host.nativeElement.querySelector('[data-active="true"]');
            if (target) {
                this.createSubmenu(target as HTMLElement, true).subscribe();
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
        let item: PopupMenuItem | null = null;
        if (event.key === "ArrowDown") {
            item = this.handleArrowDownKey();
            this.notifyNavigation(item, "down");
        } else if (event.key === "ArrowLeft") {
            this.handleArrowLeftKey();
            if (this.#parentConfig.level === 0) {
                this.notifyNavigation(null, "left");
            }
        } else if (event.key === "ArrowRight") {
            const result = this.handleArrowRightKey();
            if (!result.hasChild) {
                this.notifyNavigation(item, "right");
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

    private setKeyboardEvents(): void {
        const element = this.#host.nativeElement.firstElementChild as HTMLDivElement;
        fromEvent<KeyboardEvent>(element, "keydown")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                tap(e => {
                    if (isNavigationKey(e.key)) {
                        e.preventDefault();
                        this.#typeaheadKey$.next("");
                        this.handleNavigationKey(e);
                    } else if (isTypeaheadKey(e.key)) {
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
                tap(() => this.closePopup())
            )
            .subscribe();
        this.#childCloseRequest$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                tap(() => {
                    const activeItem = this.activeMenuItem();
                    this.notifyNavigation(activeItem, "left");
                    this.closePopup();
                })
            )
            .subscribe();
    }

    private setPointerSubscriptions(): void {
        this.pointerEnter$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                takeUntil(this.#parentConfig.parentClose$),
                filter(e => e.item !== this.activeMenuItem()),
                tap(e => {
                    this.closePopup();
                    if (e.item.items.length === 0) {
                        this.activeMenuItem.set(null);
                    }
                }),
                filter(e => e.item.items.length > 0),
                switchMap(e => {
                    this.activeMenuItem.set(e.item);
                    return this.createSubmenu(e.event.currentTarget as HTMLElement, false);
                })
            )
            .subscribe();

        this.pointerLeave$
            .pipe(takeUntilDestroyed(this.#destroyRef), takeUntil(this.pointerEnter$))
            .subscribe(() => this.popupRef?.close());
    }

    private setSubscriptions(): void {
        this.setKeyboardEvents();
        this.setPointerSubscriptions();
        this.setPopupCloseSubscription();
        this.setTypeaheadSubscription();
    }

    private setTypeaheadSubscription(): void {
        setupTypeahead(this.#typeaheadKey$)
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(buffer => this.cycleThroughMatchedItems(buffer));
    }
}
