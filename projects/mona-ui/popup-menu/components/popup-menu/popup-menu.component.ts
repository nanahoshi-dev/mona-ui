import { Point } from "@angular/cdk/drag-drop";
import {
    afterNextRender,
    afterRenderEffect,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    contentChildren,
    DestroyRef,
    ElementRef,
    inject,
    input,
    output
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { any, groupBy, select } from "@mirei/ts-collections";
import { fromEvent, Subject, Subscription, take, takeUntil, tap } from "rxjs";
import { PopupCloseEvent, PopupService } from "@mirei/mona-ui/popup";
import { PopupOffset } from "@mirei/mona-ui/popup";
import { PopupRef } from "@mirei/mona-ui/popup";
import { PopupAnchor } from "@mirei/mona-ui/popup";
import { ConnectionPoint } from "@mirei/mona-ui/popup";
import { toCssValue } from "@mirei/mona-ui/common";
import { rxTimeout } from "@mirei/mona-ui/common";
import { PopupMenuCloseEvent } from "../../models/PopupMenuCloseEvent";
import {
    PopupMenuGroupTemplateToken,
    PopupMenuIconTemplateToken,
    PopupMenuShortcutTemplateToken,
    PopupMenuTextTemplateToken,
    PopupMenuToken
} from "../../models/PopupMenuConfig";
import { MenuItem, PopupMenuItem } from "../../models/PopupMenuItem";
import { PopupMenuItemClickEvent } from "../../models/PopupMenuItemClickEvent";
import { PopupMenuListConfig } from "../../models/PopupMenuListConfig";
import { PopupMenuNavigationEvent } from "../../models/PopupMenuNavigationEvent";
import { PopupMenuVariantInput, PopupMenuVariantProps } from "../../styles/popup-menu.styles";
import { preparePopupMenuItems } from "../../utils/popup-menu.utils";
import { PopupMenuListComponent } from "../popup-menu-list/popup-menu-list.component";

@Component({
    selector: "mona-popup-menu",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopupMenuComponent implements PopupMenuVariantInput {
    readonly #close$ = new Subject<void>();
    readonly #destroyRef = inject(DestroyRef);
    readonly #menuItemClick$ = new Subject<PopupMenuItemClickEvent>();
    readonly #navigate$ = new Subject<PopupMenuNavigationEvent>();
    readonly #popupMenuListConfig = computed(() => {
        const data: PopupMenuListConfig = {
            isRoot: true,
            items: this.menuItems(),
            level: 0,
            menuId: this.menuId(),
            menuItemClick$: this.#menuItemClick$,
            minWidth: computed(() => toCssValue(this.minWidth()) ?? null),
            navigate$: this.#navigate$,
            parentClose$: this.#close$,
            popupGroupTemplate: computed(() => this.groupTemplateConfig()?.template ?? null),
            popupIconTemplate: computed(() => this.iconTemplateConfig()?.template ?? null),
            popupShortcutTemplate: computed(() => this.shortcutTemplateConfig()?.template ?? null),
            popupTextTemplate: computed(() => this.textTemplateConfig()?.template ?? null),
            rounded: computed(() => this.rounded()),
            size: computed(() => this.size()),
            width: computed(() => toCssValue(this.width()) ?? null)
        };
        return data;
    });
    readonly #popupService = inject(PopupService);
    #triggerSubscription: Subscription | null = null;
    #shouldRestoreFocus = false;
    #suppressNextTrustedContextMenu = false;
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
            return groupBy(items, i => i.group).toImmutableSet();
        }
        const items = this.nestedComponents().flatMap(i => i.getPopupMenuItem());
        return groupBy(items, i => i.group).toImmutableSet();
    });
    protected popupRef: PopupRef | null = null;

    /**
     * @description The anchor element that the context menu will be anchored to.
     * Only applicable when `precise` is set to `false`.
     */
    public readonly anchor = input<ElementRef<HTMLElement> | Element>();

    /**
     * @description The anchor connection point of the popup menu.
     * Only applicable when `precise` is set to `false`.
     */
    public readonly anchorConnectionPoint = input<ConnectionPoint | null>();

    /**
     * @description The event that is emitted when the popup menu is closed.
     */
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
     * @description The event that is emitted when the popup menu is navigated.
     * This is used to handle keyboard navigation within the popup menu.
     */
    public readonly navigate = output<PopupMenuNavigationEvent>();

    /**
     * @description The offset of the popup menu from the anchor element.
     */
    public readonly offset = input<PopupOffset>();

    /**
     * @description The event that is emitted when the popup menu is opened.
     */
    public readonly open = output<void>();

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
    public readonly precise = input(false);

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
     * @description The target element that will be used to trigger the popup menu.
     */
    public readonly target = input.required<ElementRef<HTMLElement> | Element>();

    /**
     * @description The event that triggers the popup menu.
     */
    public readonly trigger = input("click");

    /**
     * @description Sets the width of the popup menu.
     * This will be applied to the root menu and all submenus.
     */
    public readonly width = input<string | number>();

    public constructor() {
        afterNextRender({
            read: () => this.setSubscriptions()
        });
        afterRenderEffect({
            read: () => {
                rxTimeout(this.#destroyRef, () => {
                    this.anchor();
                    this.target();
                    this.trigger();
                    if (this.#triggerSubscription) {
                        this.#triggerSubscription.unsubscribe();
                        this.#triggerSubscription = null;
                    }
                    this.setTriggerSubscription();
                });
            }
        });
    }

    public clearFocusRestoration(): void {
        this.#shouldRestoreFocus = false;
    }

    public closeMenu(): void {
        if (this.popupRef) {
            this.popupRef.close();
            this.popupRef = null;
        }
    }

    public openMenu(viaContextMenuKey: boolean): void {
        const target = this.target();
        const targetElement = target instanceof ElementRef ? target.nativeElement : target;
        if (!targetElement) {
            return;
        }
        const center = targetElement.getBoundingClientRect();
        // Create a fake event to pass the center of the target element as the mouse position.
        // This is useful when precise is true, but we want to open the menu via keyboard
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

    public openMenuViaKeyboard(viaContextMenuKey: boolean = false): void {
        this.#shouldRestoreFocus = true;
        this.openMenu(viaContextMenuKey);
    }

    public setRestoreFocusForKeyboard(): void {
        this.#shouldRestoreFocus = true;
    }

    private createMenu(event: MouseEvent): PopupRef {
        const anchor = this.getPopupAnchor(event);
        const anchorConnectionPoint = this.precise() ? undefined : this.anchorConnectionPoint();
        const closeOnScroll = true;
        const content = PopupMenuListComponent;
        const data = this.#popupMenuListConfig();
        const minWidth = toCssValue(this.minWidth());
        const offset = this.offset();
        const popupConnectionPoint = this.precise() ? undefined : this.popupConnectionPoint();
        const width = toCssValue(this.width());
        const popupRef = this.#popupService.create({
            anchor,
            anchorConnectionPoint,
            closeOnScroll,
            content,
            data,
            minWidth,
            offset,
            popupConnectionPoint,
            restoreFocus: false,
            width
        });
        popupRef.closeStart.pipe(take(1)).subscribe(() => this.#close$.next());
        return popupRef;
    }

    private getPopupAnchor(event: MouseEvent): PopupAnchor {
        const anchorElement = this.anchor();
        const targetElement = this.target();
        const targetInput = anchorElement ?? targetElement;
        const precise = this.precise();
        const actualTargetElement = targetInput instanceof ElementRef ? targetInput.nativeElement : targetInput;
        let anchor: Point | Element;
        if (precise) {
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

    private setMenuItemClickSubscription(): void {
        this.#menuItemClick$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                tap(event => {
                    this.menuClick.emit(event);
                    if (event.isDefaultPrevented()) {
                        return;
                    }
                    this.popupRef?.close();
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

    private setSubscriptions(): void {
        this.setMenuItemClickSubscription();
        this.setNavigationSubscription();
        this.setTriggerSubscription();
    }

    private setTriggerSubscription(): void {
        const element = this.target();
        const trigger = this.trigger();
        const targetElement = element instanceof ElementRef ? element.nativeElement : element;
        this.#triggerSubscription = fromEvent<MouseEvent>(targetElement, trigger)
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                tap(e => e.preventDefault())
            )
            .subscribe(e => {
                if (e.isTrusted && this.#suppressNextTrustedContextMenu) {
                    this.#suppressNextTrustedContextMenu = false;
                    return;
                }
                if (this.popupRef) {
                    this.popupRef.close();
                    this.popupRef = null;
                    return;
                }
                this.popupRef = this.createMenu(e);
                this.open.emit();
                this.popupRef.beforeClose.pipe(takeUntil(this.popupRef.closed)).subscribe(e => {
                    const popupCloseEvent = e.result as PopupCloseEvent;
                    const closeEvent = new PopupMenuCloseEvent(popupCloseEvent);
                    this.close.emit(closeEvent);
                    if (closeEvent.isDefaultPrevented()) {
                        e.preventDefault();
                        return;
                    }
                });
                this.popupRef.closed.pipe(take(1)).subscribe(() => {
                    if (this.#shouldRestoreFocus) {
                        const target = this.target();
                        const targetElement = target instanceof ElementRef ? target.nativeElement : target;
                        if (targetElement && "focus" in targetElement) {
                            (targetElement as HTMLElement).focus();
                        }
                    }

                    this.popupRef = null;
                    this.#close$.next();
                    this.#shouldRestoreFocus = false;
                });
            });
    }
}
