import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    afterRenderEffect,
    Component,
    computed,
    DestroyRef,
    ElementRef,
    inject,
    input,
    model,
    output,
    signal,
    untracked,
    viewChild,
    viewChildren
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LucideChevronDown, LucideChevronLeft, LucideChevronRight, LucideChevronUp, LucideX } from "@lucide/angular";
import { firstOrDefault } from "@mirei/ts-collections";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { type SortableMoveEvent, SortableDirective, SortableItemDirective } from "@nanahoshi/mona-ui/sortable";
import { asapScheduler, EMPTY, interval, Subject, switchMap, tap, timer } from "rxjs";
import { TabListItemDirective } from "../../directives/tab-list-item.directive";
import { TABS_DEFAULT_MESSAGES } from "../../i18n/tabs.default-messages";
import type { ScrollIntent, TabScrollDirection } from "../../models/ScrollIntent";
import { TabCloseEvent } from "../../models/TabCloseEvent";
import type { TabItem } from "../../models/TabItem";
import { ownPanelId } from "../../models/TabItem";
import { getTabOrientation } from "../../models/TabOrientation";
import { TabReorderEvent } from "../../models/TabReorderEvent";
import { TabSelectEvent } from "../../models/TabSelectEvent";
import type { TabListVariantInput, TabListVariantProps } from "../../styles/tabs.styles";
import {
    tabListBaseThemeVariants,
    tabListCloseButtonThemeVariants,
    tabListListThemeVariants,
    tabListListWrapperThemeVariants,
    tabListScrollButtonThemeVariants,
    tabListTabThemeVariants
} from "../../styles/tabs.styles";

@Component({
    selector: "mona-tab-list",
    imports: [
        ButtonDirective,
        NgTemplateOutlet,
        SortableDirective,
        SortableItemDirective,
        TabListItemDirective,
        LucideChevronDown,
        LucideChevronLeft,
        LucideChevronRight,
        LucideChevronUp,
        LucideX
    ],
    templateUrl: "./tab-list.component.html",
    host: {
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null",
        "[class]": "baseClass()",
        "(focusin)": "onFocusIn($event)",
        "(focusout)": "onFocusOut($event)",
        "(keydown)": "onKeydown($event)"
    }
})
export class TabListComponent implements TabListVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #hostElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    readonly #i18n = inject(MonaI18nService);
    readonly #scrollIntent$ = new Subject<ScrollIntent | null>();
    /** The tab that focus is in, kept when the tab is removed, so focus can go to the selected tab instead of being lost. */
    #focusedTabId: string | null = null;
    #resizeObserver: ResizeObserver | null = null;
    protected readonly baseClass = computed(() => {
        return tabListBaseThemeVariants({ look: this.look(), position: this.position() });
    });
    protected readonly closeButtonClass = computed(() => {
        return tabListCloseButtonThemeVariants();
    });
    protected readonly hasClosableTabs = computed(() => {
        return this.closable() || Array.from(this.tabList()).some(tab => tab.closable);
    });
    protected readonly isRtl = computed(() => this.#direction() === "rtl");
    protected readonly listClass = computed(() => {
        return tabListListThemeVariants({ look: this.look(), position: this.position() });
    });
    protected readonly listWrapperClass = computed(() => {
        return tabListListWrapperThemeVariants();
    });
    protected readonly messages = this.#i18n.componentMessages("tabs", TABS_DEFAULT_MESSAGES);
    protected readonly orientation = computed(() => {
        return getTabOrientation(this.position() ?? "top");
    });
    protected readonly overflowControlsVisible = signal(false);
    protected readonly scrollButtonClass = computed(() => {
        return tabListScrollButtonThemeVariants();
    });
    protected readonly sortableTabs = computed(() => Array.from(this.tabList()));
    protected readonly tabClass = computed(() => {
        return tabListTabThemeVariants({ look: this.look(), position: this.position(), size: this.size() });
    });
    protected readonly tabElements = viewChildren<ElementRef<HTMLElement>>("tabElement");
    protected readonly tabListElement = viewChild.required<ElementRef<HTMLUListElement>>("tabListElement");

    public readonly ariaLabel = input("", { alias: "aria-label" });
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });
    public readonly closable = input(false);
    public readonly disabled = input(false);
    public readonly look = input<TabListVariantProps["look"]>("line");

    /**
     * @description Placement of the tab list relative to the tab content.
     * @default "top"
     */
    public readonly position = input.required<TabListVariantProps["position"]>();
    /** Whether the parent renders each tab's panel, as `mona-tabs` does. Tab then goes to the selected one. */
    public readonly rendersPanels = input(false);
    public readonly selectedTabId = model<string | null>(null);

    /**
     * @description Size preset controlling the tabs' dimensions.
     * @default "medium"
     */
    public readonly size = input.required<TabListVariantProps["size"]>();
    public readonly sortable = input(false);
    public readonly tabClose = output<TabCloseEvent>();
    public readonly tabList = input.required<Iterable<TabItem>>();
    public readonly tabReorder = output<TabReorderEvent>();
    public readonly tabSelect = output<TabSelectEvent>();

    public constructor() {
        afterRenderEffect({
            read: () => {
                const tabs = Array.from(this.tabList());
                this.position();
                untracked(() => {
                    this.updateScrollVisibility();
                    this.restoreFocus(tabs);
                });
            }
        });
        afterRenderEffect({
            read: () => {
                const selectedId = this.selectedTabId();
                untracked(() => this.scrollTabIntoStrip(selectedId));
            }
        });
        this.setupScrolling();
        afterNextRender({
            read: () => this.setupResizeObserver()
        });
        this.#destroyRef.onDestroy(() => this.#resizeObserver?.disconnect());
    }

    public focusSelectedTab(): void {
        const selectedTab = firstOrDefault(this.tabList(), t => t.id === this.selectedTabId());
        if (selectedTab) {
            this.focusTab(selectedTab);
        }
    }

    protected onFocusIn(event: FocusEvent): void {
        this.#focusedTabId = (event.target as Element).closest("[data-tab-id]")?.getAttribute("data-tab-id") ?? null;
    }

    protected onFocusOut(event: FocusEvent): void {
        const target = event.target as Element;
        // Some browsers fire this while removing the focused tab, so only a target that's still there can mean focus left.
        // It runs after the focusin of a move within the strip, which has already recorded where focus went.
        queueMicrotask(() => {
            const root = this.#hostElement.getRootNode() as Document | ShadowRoot;
            if (target.isConnected && !this.#hostElement.contains(root.activeElement)) {
                this.#focusedTabId = null;
            }
        });
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }
        const tabs = Array.from(this.tabList());
        const currentTab = this.tabFromEvent(tabs, event);
        if (!currentTab) {
            return;
        }
        if (event.key === "Tab") {
            if (!event.shiftKey) {
                this.handleTabKey(tabs, event);
            }
            return;
        }
        if (!event.shiftKey) {
            this.handleTabStripKey(tabs, currentTab, event);
        }
    }

    /** A middle-click closes a tab that can close, as it does a browser's tab. */
    protected onTabAuxClick(tab: TabItem, event: MouseEvent): void {
        if (event.button === 1 && this.isTabClosable(tab)) {
            event.preventDefault();
            this.emitTabClose(tab, event);
        }
    }

    protected onTabClick(tab: TabItem, event: MouseEvent): void {
        if (tab.disabled || this.disabled() || tab.id === this.selectedTabId()) {
            return;
        }
        if (!this.emitTabSelect(tab, event)) {
            this.selectTab(tab);
        }
    }

    protected onTabClose(tab: TabItem, event: MouseEvent): void {
        event.stopPropagation();
        this.emitTabClose(tab, event);
    }

    /** Keeps the middle button from starting to autoscroll, or to paste on Linux, over a tab it's closing. */
    protected onTabMouseDown(tab: TabItem, event: MouseEvent): void {
        if (event.button === 1 && this.isTabClosable(tab)) {
            event.preventDefault();
        }
    }

    protected onTabMove(event: SortableMoveEvent<TabItem>): void {
        this.tabReorder.emit(new TabReorderEvent(event.previousIndex, event.currentIndex, event.originalEvent));
    }

    /** The panel a tab controls: the one the parent renders, else the one the consumer named, if any. */
    protected panelIdOf(tab: TabItem): string | null {
        return this.rendersPanels() ? ownPanelId(tab) : tab.panelId;
    }

    protected startContinuousScroll(event: PointerEvent, element: HTMLElement, direction: TabScrollDirection): void {
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        this.startScrolling(element, direction, "continuous");
    }

    protected startScrolling(element: HTMLElement, direction: TabScrollDirection, type: "single" | "continuous"): void {
        this.#scrollIntent$.next({ element, direction, type });
    }

    protected stopScrolling(): void {
        this.#scrollIntent$.next(null);
    }

    /** A tab's shortcuts: Delete and Backspace when it can be closed, and the sortable strip's moves. */
    protected tabKeyShortcuts(closable: boolean, moveShortcuts: string | null): string | null {
        const shortcuts = [closable ? "Delete Backspace" : null, moveShortcuts].filter(keys => keys != null);
        return shortcuts.length === 0 ? null : shortcuts.join(" ");
    }

    /**
     * Selects the tab and moves focus to it. A vetoed selection still moves focus, so the keyboard can get past a tab it
     * isn't allowed to select.
     */
    private activateTab(tab: TabItem, event: Event): void {
        if (tab.id !== this.selectedTabId() && !this.emitTabSelect(tab, event)) {
            this.selectTab(tab);
        }
        this.focusTab(tab);
    }

    private adjacentEnabledTab(tabs: readonly TabItem[], from: TabItem, offset: 1 | -1): TabItem | undefined {
        const start = tabs.indexOf(from);
        for (let step = 1; step <= tabs.length; step++) {
            const candidate = tabs[(start + offset * step + tabs.length * step) % tabs.length];
            if (this.isTabEnabled(candidate)) {
                return candidate;
            }
        }
        return undefined;
    }

    private emitTabClose(tabItem: TabItem, event: Event): void {
        this.tabClose.emit(new TabCloseEvent(tabItem.index, tabItem.id === this.selectedTabId(), event));
    }

    private emitTabSelect(tab: TabItem, event: Event): boolean {
        const selectEvent = new TabSelectEvent(tab.index, event);
        this.tabSelect.emit(selectEvent);
        return selectEvent.isDefaultPrevented();
    }

    private focusTab(tab: TabItem): void {
        this.tabElementOf(tab.id)?.focus();
    }

    private getNavigationDirection(event: KeyboardEvent): TabScrollDirection | null {
        if (this.orientation() === "vertical") {
            if (event.key === "ArrowUp") {
                return "previous";
            }
            if (event.key === "ArrowDown") {
                return "next";
            }
            return null;
        }
        const isRtl = this.isRtl();
        if (event.key === "ArrowLeft") {
            return isRtl ? "next" : "previous";
        }
        if (event.key === "ArrowRight") {
            return isRtl ? "previous" : "next";
        }
        return null;
    }

    /** Moves into the selected tab's panel. A panel the consumer renders may be anywhere, so Tab is left alone there. */
    private handleTabKey(tabs: readonly TabItem[], event: KeyboardEvent): void {
        const selectedTab = tabs.find(t => t.id === this.selectedTabId());
        if (!selectedTab || !this.rendersPanels()) {
            return;
        }
        // The root node, because a document lookup finds nothing inside a shadow root.
        const root = this.#hostElement.getRootNode() as Document | ShadowRoot;
        const panel = root.getElementById(ownPanelId(selectedTab));
        if (panel) {
            event.preventDefault();
            panel.focus();
        }
    }

    private handleTabStripKey(tabs: readonly TabItem[], currentTab: TabItem, event: KeyboardEvent): void {
        const enabledTabs = tabs.filter(t => this.isTabEnabled(t));
        if (enabledTabs.length === 0) {
            return;
        }
        const navigationDirection = this.getNavigationDirection(event);
        if (navigationDirection) {
            event.preventDefault();
            const target = this.adjacentEnabledTab(tabs, currentTab, navigationDirection === "next" ? 1 : -1);
            if (target) {
                this.activateTab(target, event);
            }
            return;
        }
        switch (event.key) {
            case "Home":
                event.preventDefault();
                this.activateTab(enabledTabs[0], event);
                break;
            case "End":
                event.preventDefault();
                this.activateTab(enabledTabs[enabledTabs.length - 1], event);
                break;
            case "Delete":
            case "Backspace":
                if (this.isTabClosable(currentTab)) {
                    event.preventDefault();
                    this.emitTabClose(currentTab, event);
                }
                break;
        }
    }

    private isTabClosable(tab: TabItem): boolean {
        return this.isTabEnabled(tab) && (tab.closable || this.closable());
    }

    private isTabEnabled(tab: TabItem): boolean {
        return !tab.disabled && !this.disabled();
    }

    private performScroll(element: HTMLElement, direction: TabScrollDirection): void {
        let offset = direction === "previous" ? -100 : 100;
        const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";
        if (this.orientation() === "vertical") {
            element.scrollBy({ top: offset, behavior });
            return;
        }
        if (this.isRtl()) {
            offset = -offset;
        }
        element.scrollBy({ left: offset, behavior });
    }

    private restoreFocus(tabs: readonly TabItem[]): void {
        const focusedTabId = this.#focusedTabId;
        if (focusedTabId === null || tabs.some(tab => tab.id === focusedTabId)) {
            return;
        }
        this.#focusedTabId = null;
        const root = this.#hostElement.getRootNode() as Document | ShadowRoot;
        const active = root.activeElement;
        if (!active || active === this.#hostElement.ownerDocument.body) {
            this.focusSelectedTab();
        }
    }

    /**
     * Scrolls only the strip. `scrollIntoView` would also scroll the page, which a selection made by code, or the first
     * render, has no business doing.
     */
    private scrollTabIntoStrip(tabId: string | null): void {
        const tabElement = tabId === null ? undefined : this.tabElementOf(tabId);
        if (!tabElement) {
            return;
        }
        const list = this.tabListElement().nativeElement;
        const listRect = list.getBoundingClientRect();
        const tabRect = tabElement.getBoundingClientRect();
        if (this.orientation() === "vertical") {
            const top = Math.min(tabRect.top - listRect.top, 0) || Math.max(tabRect.bottom - listRect.bottom, 0);
            if (top !== 0) {
                list.scrollBy({ top });
            }
            return;
        }
        const left = Math.min(tabRect.left - listRect.left, 0) || Math.max(tabRect.right - listRect.right, 0);
        if (left !== 0) {
            list.scrollBy({ left });
        }
    }

    private selectTab(tab: TabItem): void {
        this.selectedTabId.set(tab.id);
    }

    private setupResizeObserver(): void {
        this.#resizeObserver = new ResizeObserver(entries => {
            window.requestAnimationFrame(() => {
                if (!Array.isArray(entries) || !entries.length) {
                    return;
                }
                this.updateScrollVisibility();
            });
        });
        this.#resizeObserver.observe(this.tabListElement().nativeElement);
    }

    private setupScrolling(): void {
        this.#scrollIntent$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                switchMap(intent => {
                    if (!intent) {
                        return EMPTY;
                    }
                    const { element, direction, type } = intent;
                    const timeFunction = type === "single" ? timer : interval;
                    return timeFunction(60).pipe(tap(() => this.performScroll(element, direction)));
                })
            )
            .subscribe();
    }

    /** The tab element of the tab with this key. Its id is the consumer's to set, so it's found by its list item. */
    private tabElementOf(id: string): HTMLElement | undefined {
        return this.tabElements().find(
            tab => tab.nativeElement.closest("[data-tab-id]")?.getAttribute("data-tab-id") === id
        )?.nativeElement;
    }

    /**
     * The tab a key press applies to: the one focus is in, which may not be the selected one after a vetoed selection.
     * Keys pressed anywhere else in the strip, such as on a close button, belong to no tab.
     */
    private tabFromEvent(tabs: readonly TabItem[], event: KeyboardEvent): TabItem | undefined {
        const target = event.target as Element | undefined;
        if (!target) {
            return tabs.find(tab => tab.id === this.selectedTabId());
        }
        const key = target.closest("[role='tab']")?.closest("[data-tab-id]")?.getAttribute("data-tab-id");
        return key ? tabs.find(tab => tab.id === key) : undefined;
    }

    private updateScrollVisibility(): void {
        asapScheduler.schedule(() => {
            const element = this.tabListElement().nativeElement;
            const isVertical = this.orientation() === "vertical";
            this.overflowControlsVisible.set(
                isVertical ? element.scrollHeight > element.clientHeight : element.scrollWidth > element.clientWidth
            );
        });
    }
}
