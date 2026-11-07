import { Point } from "@angular/cdk/drag-drop";
import {
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
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { rxTimeout, toCssValue } from "@nanahoshi/mona-ui/internal";
import {
    ConnectionPoint,
    PopupAnchor,
    PopupCloseEvent,
    PopupOffset,
    PopupRef,
    PopupService
} from "@nanahoshi/mona-ui/popup";
import { any, select } from "@mirei/ts-collections";
import { fromEvent, Subject, Subscription, take, takeUntil, tap } from "rxjs";
import { PopupMenuCloseEvent } from "../../models/PopupMenuCloseEvent";
import {
    PopupMenuGroupTemplateToken,
    PopupMenuIconTemplateToken,
    PopupMenuShortcutTemplateToken,
    PopupMenuTextTemplateToken,
    PopupMenuToken,
    MenuItem,
    PopupMenuItem,
    PopupMenuItemClickEvent,
    preparePopupMenuItems
} from "@nanahoshi/mona-ui/internal/popup-menu";
import type {
    PopupMenuCloseRequest,
    PopupMenuInitialFocus,
    PopupMenuListConfig
} from "../../models/PopupMenuListConfig";
import { PopupMenuNavigationEvent } from "../../models/PopupMenuNavigationEvent";
import type { PopupMenuTrigger } from "../../models/PopupMenuTrigger";
import { PopupMenuVariantInput, PopupMenuVariantProps } from "../../styles/popup-menu.styles";
import { groupPopupMenuItems, isMenuOwnedCheckState } from "../../utils/popup-menu.utils";
import { PopupMenuListComponent } from "../popup-menu-list/popup-menu-list.component";

/** What the component keeps about the menu it has open. */
interface OpenMenuState {
    readonly close$: Subject<void>;
    ref: PopupRef | null;
    restoreFocus: boolean;
    readonly returnFocusTo: HTMLElement | null;
}

/** Context menu events that a menu opened for, so menus on ancestor targets leave them alone. */
const handledContextMenuEvents = new WeakSet<Event>();

@Component({
    selector: "mona-popup-menu",
    template: "",
    host: {
        // The name goes to the menu when it opens. The host has no role, which may not carry one.
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null"
    }
})
export class PopupMenuComponent implements PopupMenuVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #menuItemClick$ = new Subject<PopupMenuItemClickEvent>();
    readonly #navigate$ = new Subject<PopupMenuNavigationEvent>();
    readonly #popupService = inject(PopupService);
    #destroyed = false;
    #open: OpenMenuState | null = null;
    #pendingInitialFocus: PopupMenuInitialFocus | null = null;
    #suppressNextTrustedContextMenu = false;
    #triggerSubscription: Subscription | null = null;
    private readonly groupTemplateConfig = contentChild(PopupMenuGroupTemplateToken, {
        descendants: false
    });
    private readonly iconTemplateConfig = contentChild(PopupMenuIconTemplateToken, {
        descendants: false
    });
    private readonly nestedComponents = contentChildren(PopupMenuToken, { descendants: false });
    private readonly shortcutTemplateConfig = contentChild(PopupMenuShortcutTemplateToken, {
        descendants: false
    });
    private readonly textTemplateConfig = contentChild(PopupMenuTextTemplateToken, {
        descendants: false
    });
    protected readonly menuItems = computed(() => {
        const inputItems = this.items();
        if (any(inputItems)) {
            const items = select(inputItems, i =>
                Object.hasOwn(i, "uid") ? (i as PopupMenuItem) : preparePopupMenuItems([i as MenuItem])[0]
            );
            return groupPopupMenuItems(items);
        }
        const items = this.nestedComponents().flatMap(i => i.getPopupMenuItem());
        return groupPopupMenuItems(items);
    });

    /**
     * @description The element to position the menu against, when it isn't the `target`.
     * Ignored when `openAtPointer` is set.
     */
    public readonly anchor = input<ElementRef<HTMLElement> | Element>();

    /**
     * @description The point on the anchor that the menu attaches to.
     * Ignored when `openAtPointer` is set.
     */
    public readonly anchorConnectionPoint = input<ConnectionPoint | null>();

    /**
     * @description The accessible name of the root menu. Takes precedence over `aria-labelledby`.
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description The ids of the elements that name the root menu. When neither this nor `aria-label` is set, the
     * menu is named by the target element if it has an id.
     */
    public readonly ariaLabelledby = input("", { alias: "aria-labelledby" });

    /**
     * @description The event that is emitted when the popup menu is closed.
     */
    // eslint-disable-next-line @angular-eslint/no-output-native -- renaming the output would break existing (close) bindings
    public readonly close = output<PopupMenuCloseEvent>();

    /**
     * @description The items to render in the popup menu.
     * If provided, it will override the menu items defined by projected menu item components.
     */
    public readonly items = input<Iterable<PopupMenuItem | MenuItem>>([]);

    /**
     * @description The event that is emitted when a menu item is clicked.
     */
    public readonly menuClick = output<PopupMenuItemClickEvent>();

    /**
     * @description The id of the popup menu's root element.
     */
    public readonly menuId = input<string>("", { alias: "id" });

    /**
     * @description Sets the minimum width of the popup menu.
     * This will be applied to the root menu and all submenus.
     */
    public readonly minWidth = input<string | number>();

    /**
     * @description Emitted when an arrow key moves through the menu, or tries to leave it.
     */
    public readonly navigate = output<PopupMenuNavigationEvent>();

    /**
     * @description The distance between the menu and its anchor.
     */
    public readonly offset = input<PopupOffset>();

    /**
     * @description The event that is emitted when the popup menu is opened.
     */
    public readonly open = output<void>();

    /**
     * @description Opens the menu where the pointer is, instead of against the `anchor` or `target`. Opened from the
     * keyboard, it opens at the center of the target.
     */
    public readonly openAtPointer = input(false);

    /**
     * @description The point on the menu that attaches to the anchor.
     * Ignored when `openAtPointer` is set.
     */
    public readonly popupConnectionPoint = input<ConnectionPoint | null>();

    /**
     * @description Sets the border radius of the popup menu.
     * This will be applied to the root menu and all submenus.
     */
    public readonly rounded = input<PopupMenuVariantProps["rounded"]>("medium");

    /**
     * @description Sets the size of the popup menu.
     * This will be applied to the root menu and all submenus.
     */
    public readonly size = input<PopupMenuVariantProps["size"]>("medium");

    /**
     * @description The element that opens the menu. The menu is positioned against it unless `anchor` is set.
     */
    public readonly target = input.required<ElementRef<HTMLElement> | Element>();

    /**
     * @description What opens the menu: a click on the target, a right-click on it, or `"none"` to open it only
     * through `openMenu()`.
     */
    public readonly trigger = input<PopupMenuTrigger>("click");

    /**
     * @description Extra classes for the menu's popup.
     */
    public readonly userClass = input<string, ClassInputType>(undefined, {
        alias: "class",
        transform: value => classInputToClass(value)
    });

    /**
     * @description Sets the width of the popup menu.
     * This will be applied to the root menu and all submenus.
     */
    public readonly width = input<string | number>();

    public constructor() {
        this.setMenuItemClickSubscription();
        this.setNavigationSubscription();
        // Listen on the current target for the current trigger, and move the listener when either changes.
        effect(() => {
            const target = this.#element(this.target());
            const trigger = this.trigger();
            untracked(() => {
                this.#triggerSubscription?.unsubscribe();
                this.#triggerSubscription = target ? this.setTriggerSubscription(target, trigger) : null;
            });
        });
        this.#destroyRef.onDestroy(() => {
            this.#destroyed = true;
            this.#triggerSubscription?.unsubscribe();
            const open = this.#open;
            if (open) {
                open.restoreFocus = false;
                open.ref?.close();
            }
        });
    }

    /**
     * @description Keeps focus where it is when the open menu closes, instead of returning it to the element that
     * had it before the menu opened. Used when another menu takes over, as in a menubar.
     */
    public clearFocusRestoration(): void {
        if (this.#open) {
            this.#open.restoreFocus = false;
        }
    }

    /**
     * @description Closes the menu. Focus returns to the element that had it before the menu opened, unless focus
     * has already moved elsewhere.
     */
    public closeMenu(): void {
        this.#open?.ref?.close();
    }

    /**
     * @description Opens the menu, as if the target had been clicked.
     * @param viaContextMenuKey Whether the menu opens from the ContextMenu key or Shift+F10.
     */
    public openMenu(viaContextMenuKey: boolean = false): void {
        const targetElement = this.#element(this.target());
        if (!targetElement) {
            return;
        }
        const center = targetElement.getBoundingClientRect();
        // Create a fake event to pass the center of the target element as the mouse position.
        // This is useful when openAtPointer is true, but we want to open the menu via keyboard
        // or some other non-mouse event.
        if (viaContextMenuKey) {
            const contextMenuEvent = new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                clientX: center.left + center.width / 2,
                clientY: center.top + center.height / 2,
                button: -1
            });
            const ownerDocument = targetElement.ownerDocument;
            const suppressNativeContextMenu = (nativeEvent: Event): void => {
                if (nativeEvent.isTrusted) {
                    nativeEvent.preventDefault();
                    ownerDocument.removeEventListener("contextmenu", suppressNativeContextMenu, { capture: true });
                }
            };
            this.#suppressNextTrustedContextMenu = true;
            ownerDocument.addEventListener("contextmenu", suppressNativeContextMenu, { capture: true });
            targetElement.dispatchEvent(contextMenuEvent);
            rxTimeout(
                this.#destroyRef,
                () => {
                    this.#suppressNextTrustedContextMenu = false;
                    ownerDocument.removeEventListener("contextmenu", suppressNativeContextMenu, { capture: true });
                },
                500
            );
            return;
        }
        const event = new MouseEvent(this.trigger(), { bubbles: true, cancelable: true });
        targetElement.dispatchEvent(event);
    }

    /**
     * @description Opens the menu as the keyboard does, with its first (or last) item highlighted.
     * @param viaContextMenuKey Whether the menu opens from the ContextMenu key or Shift+F10.
     * @param focus The item to highlight: "first" (ArrowDown, Enter, Space) or "last" (ArrowUp).
     */
    public openMenuViaKeyboard(viaContextMenuKey: boolean = false, focus: PopupMenuInitialFocus = "first"): void {
        this.#pendingInitialFocus = focus;
        this.openMenu(viaContextMenuKey);
        this.#pendingInitialFocus = null;
    }

    /**
     * @deprecated Focus now returns to the element that had it before the menu opened after every close.
     */
    public setRestoreFocusForKeyboard(): void {
        if (this.#open) {
            this.#open.restoreFocus = true;
        }
    }

    #element(value: ElementRef<HTMLElement> | Element | undefined | null): HTMLElement | null {
        const element = value instanceof ElementRef ? value.nativeElement : value;
        return element instanceof HTMLElement ? element : null;
    }

    private closeFromList(state: OpenMenuState, options: PopupMenuCloseRequest): void {
        if (this.#open !== state || !state.ref) {
            return;
        }
        if (options.focusLeftTo) {
            // Focus moved out of the menus. A move to the trigger is the trigger's own business (it toggles).
            const target = this.#element(this.target());
            const anchor = this.#element(this.anchor());
            if (target?.contains(options.focusLeftTo) || anchor?.contains(options.focusLeftTo)) {
                return;
            }
            state.restoreFocus = false;
        }
        if (options.tab) {
            // Tab leaves the menu as it would leave the trigger: focus the trigger now, before the browser moves
            // focus on from it.
            state.restoreFocus = false;
            state.returnFocusTo?.focus();
        }
        state.ref.close();
    }

    private createMenu(event: MouseEvent, state: OpenMenuState): PopupRef {
        const anchor = this.getPopupAnchor(event);
        const anchorConnectionPoint = this.openAtPointer() ? undefined : this.anchorConnectionPoint();
        const targetId = this.#element(this.target())?.id ?? "";
        const data: PopupMenuListConfig = {
            ariaLabel: this.ariaLabel(),
            closeMenu: options => this.closeFromList(state, options),
            initialFocus: this.#pendingInitialFocus,
            isRoot: true,
            items: this.menuItems,
            labelledBy: this.ariaLabelledby() || targetId || null,
            level: 0,
            menuId: this.menuId(),
            menuItemClick$: this.#menuItemClick$,
            minWidth: computed(() => toCssValue(this.minWidth()) ?? null),
            navigate$: this.#navigate$,
            parentClose$: state.close$,
            popupGroupTemplate: computed(() => this.groupTemplateConfig()?.template ?? null),
            popupIconTemplate: computed(() => this.iconTemplateConfig()?.template ?? null),
            popupShortcutTemplate: computed(() => this.shortcutTemplateConfig()?.template ?? null),
            popupTextTemplate: computed(() => this.textTemplateConfig()?.template ?? null),
            rounded: computed(() => this.rounded()),
            size: computed(() => this.size()),
            width: computed(() => toCssValue(this.width()) ?? null)
        };
        return this.#popupService.create({
            anchor,
            anchorConnectionPoint,
            closeOnScroll: true,
            content: PopupMenuListComponent,
            data,
            minWidth: toCssValue(this.minWidth()),
            offset: this.offset(),
            popupClass: this.userClass(),
            popupConnectionPoint: this.openAtPointer() ? undefined : this.popupConnectionPoint(),
            restoreFocus: false,
            width: toCssValue(this.width())
        });
    }

    private getPopupAnchor(event: MouseEvent): PopupAnchor {
        const anchorElement = this.anchor();
        const targetElement = this.target();
        const targetInput = anchorElement ?? targetElement;
        const atPointer = this.openAtPointer();
        const actualTargetElement = targetInput instanceof ElementRef ? targetInput.nativeElement : targetInput;
        let anchor: Point | Element;
        if (atPointer) {
            if (event.button < 0) {
                const rect = actualTargetElement.getBoundingClientRect();
                anchor = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            } else {
                anchor = { x: event.x, y: event.y };
            }
        } else {
            anchor = actualTargetElement;
        }
        return anchor;
    }

    private openFor(event: MouseEvent, targetElement: HTMLElement): void {
        const opener = this.#document.activeElement as HTMLElement | null;
        const hasOpener = !!opener && opener !== this.#document.body;
        // Focus in another menu (a menubar moving to the next menu) leaves with that menu, so it can't come back there.
        const openerInMenu = hasOpener && !!opener.closest("mona-popup-menu-list");
        const targetFocusable = targetElement.tabIndex >= 0 || (openerInMenu && targetElement.hasAttribute("tabindex"));
        // A menu opened from the keyboard goes back to the element the keys came from (a split button's main button).
        const viaKeyboard = this.#pendingInitialFocus !== null;
        let returnFocusTo: HTMLElement | null = null;
        if (hasOpener && !openerInMenu && (viaKeyboard || targetElement.contains(opener))) {
            returnFocusTo = opener;
        } else if (targetFocusable) {
            returnFocusTo = targetElement;
        } else if (hasOpener && !openerInMenu) {
            returnFocusTo = opener;
        }
        const state: OpenMenuState = { close$: new Subject<void>(), ref: null, restoreFocus: true, returnFocusTo };
        const ref = this.createMenu(event, state);
        state.ref = ref;
        this.#open = state;
        this.open.emit();
        ref.beforeClose.pipe(takeUntil(ref.closed)).subscribe(e => {
            // A menu closed because its component is destroyed has no one left to tell.
            if (this.#destroyed) {
                return;
            }
            const popupCloseEvent = e.result as PopupCloseEvent;
            const closeEvent = new PopupMenuCloseEvent(popupCloseEvent);
            this.close.emit(closeEvent);
            if (closeEvent.isDefaultPrevented()) {
                e.preventDefault();
            }
        });
        ref.closeStart.pipe(take(1)).subscribe(() => {
            state.close$.next();
            // A menu that is closing is closed for the trigger: the next trigger opens a new one.
            if (this.#open === state) {
                this.#open = null;
            }
        });
        ref.closed.pipe(take(1)).subscribe(() => {
            state.close$.complete();
            if (this.#open === state) {
                this.#open = null;
            }
            // Return focus unless another menu opened meanwhile, or focus has moved on.
            if (state.restoreFocus && this.#open === null) {
                this.restoreFocus(state.returnFocusTo);
            }
        });
    }

    private restoreFocus(element: HTMLElement | null): void {
        if (!element || !element.isConnected) {
            return;
        }
        const active = this.#document.activeElement;
        if (active && active !== this.#document.body && !active.closest("mona-popup-menu-list")) {
            return;
        }
        element.focus();
    }

    private setMenuItemClickSubscription(): void {
        this.#menuItemClick$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                tap(event => {
                    this.menuClick.emit(event);
                    if (event.isDefaultPrevented()) {
                        return;
                    }
                    const item = event.item;
                    if (isMenuOwnedCheckState(item)) {
                        item.checked.set(event.checked === true);
                    }
                    this.closeMenu();
                })
            )
            .subscribe();
    }

    private setNavigationSubscription(): void {
        this.#navigate$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                tap(e => this.navigate.emit(e))
            )
            .subscribe();
    }

    private setTriggerSubscription(targetElement: HTMLElement, trigger: PopupMenuTrigger): Subscription {
        return fromEvent<MouseEvent>(targetElement, trigger)
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                tap(e => e.preventDefault())
            )
            .subscribe(e => {
                if (e.isTrusted && this.#suppressNextTrustedContextMenu) {
                    this.#suppressNextTrustedContextMenu = false;
                    return;
                }
                // A context menu on a nested target already opened for this event.
                if (trigger === "contextmenu" && handledContextMenuEvents.has(e)) {
                    return;
                }
                const open = this.#open;
                if (open) {
                    if (trigger !== "contextmenu" && !this.openAtPointer()) {
                        // The trigger toggles the menu.
                        open.ref?.close();
                        return;
                    }
                    // A context menu opens again at the new point; focus stays with the new menu.
                    open.restoreFocus = false;
                    open.ref?.close();
                    this.#open = null;
                }
                if (trigger === "contextmenu") {
                    handledContextMenuEvents.add(e);
                }
                this.openFor(e, targetElement);
            });
    }
}
