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
import { LucideChevronLeft, LucideChevronRight, LucideX } from "@lucide/angular";
import { firstOrDefault } from "@mirei/ts-collections";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ScrollDirection } from "@nanahoshi/mona-ui/common";
import { asapScheduler, EMPTY, interval, Subject, switchMap, tap, timer } from "rxjs";
import { TabListItemDirective } from "../../directives/tab-list-item.directive";
import { ScrollIntent } from "../../models/ScrollIntent";
import { TabCloseEvent } from "../../models/TabCloseEvent";
import { TabItem } from "../../models/TabItem";
import { TabSelectEvent } from "../../models/TabSelectEvent";
import {
    tabListBaseThemeVariants,
    tabListListThemeVariants,
    tabListScrollButtonThemeVariants,
    TabListVariantInput,
    TabListVariantProps
} from "../../styles/tabs.styles";

@Component({
    selector: "mona-tab-list",
    imports: [ButtonDirective, NgTemplateOutlet, TabListItemDirective, LucideChevronLeft, LucideChevronRight, LucideX],
    templateUrl: "./tab-list.component.html",
    host: {
        "[class]": "baseClass()",
        "(keydown)": "onKeydown($event)"
    }
})
export class TabListComponent implements TabListVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #keydown$ = new Subject<KeyboardEvent>();
    #resizeObserver: ResizeObserver | null = null;
    readonly #scrollIntent$ = new Subject<ScrollIntent | null>();
    protected readonly baseClass = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        return tabListBaseThemeVariants({ rounded, size });
    });
    protected readonly listClass = computed(() => {
        return tabListListThemeVariants();
    });
    protected readonly scrollButtonClass = computed(() => {
        return tabListScrollButtonThemeVariants();
    });
    protected readonly scrollsVisible = signal(false);
    protected readonly tabListElement = viewChild.required<ElementRef<HTMLUListElement>>("tabListElement");
    protected readonly tabListItems = viewChildren(TabListItemDirective, { read: ElementRef });

    public readonly closable = input(false);
    public readonly disabled = input(false);
    public readonly rounded = input.required<TabListVariantProps["rounded"]>();
    public readonly selectedTabId = model<string | null>(null);
    public readonly size = input.required<TabListVariantProps["size"]>();
    public readonly tabClose = output<TabCloseEvent>();
    public readonly tabSelect = output<TabSelectEvent>();
    public readonly tabList = input.required<Iterable<TabItem>>();

    public constructor() {
        afterRenderEffect({
            read: () => {
                this.tabList();
                untracked(() => {
                    this.updateScrollVisibility();
                });
            }
        });
        afterNextRender({
            write: () => {
                const selectedTab = firstOrDefault(this.tabList(), t => t.id === this.selectedTabId());
                if (selectedTab) {
                    this.selectedTabId.set(selectedTab.id);
                }
            },
            read: () => {
                this.setupKeyboardNavigation();
                this.setupResizeObserver();
                this.setupScrolling();
            }
        });
        inject(DestroyRef).onDestroy(() => this.#resizeObserver?.disconnect());
    }

    public focusSelectedTab(): void {
        const tabList = this.tabList();
        const selectedTab = firstOrDefault(tabList, t => t.id === this.selectedTabId());
        if (selectedTab) {
            this.focusTab(selectedTab);
        }
    }

    protected onKeydown(event: KeyboardEvent): void {
        this.#keydown$.next(event);
    }

    protected onTabClick(tab: TabItem, tabListElement: HTMLUListElement, event: MouseEvent): void {
        if (tab.id === this.selectedTabId()) {
            return;
        }
        const selectEvent = new TabSelectEvent(tab.index, event);
        this.tabSelect.emit(selectEvent);
        if (selectEvent.isDefaultPrevented()) {
            return;
        }
        this.selectTab(tab);
        window.setTimeout(() => {
            const listElement = tabListElement.querySelector("li[data-selected='true']");
            if (listElement) {
                listElement.scrollIntoView({ behavior: "auto", block: "center" });
            }
        });
    }

    protected onTabClose(tab: TabItem, event: MouseEvent): void {
        event.stopPropagation();
        this.emitTabClose(tab, event);
    }

    protected startContinuousScroll(event: PointerEvent, element: HTMLElement, direction: ScrollDirection): void {
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        this.startScrolling(element, direction, "continuous");
    }

    protected startScrolling(element: HTMLElement, direction: ScrollDirection, type: "single" | "continuous"): void {
        this.#scrollIntent$.next({ element, direction, type });
    }

    protected stopScrolling(): void {
        this.#scrollIntent$.next(null);
    }

    private handleKeyboardEvents(event: KeyboardEvent): void {
        const tabList = this.tabList();
        const tabs = Array.from(tabList);
        const selectedTab = tabs.find(t => t.id === this.selectedTabId());
        if (!selectedTab) {
            return;
        }
        if (event.key === "Tab") {
            if (!event.shiftKey) {
                this.handleTabKey(selectedTab, event);
            }
            return;
        }

        const listDisabled = this.disabled();
        const enabledTabs = tabs.filter(t => !t.disabled && !listDisabled);
        if (enabledTabs.length === 0) {
            return;
        }
        const selectedEnabledIndex = enabledTabs.indexOf(selectedTab);
        const selectedIndex = selectedEnabledIndex === -1 ? 0 : selectedEnabledIndex;
        let nextIndex = selectedIndex;

        switch (event.key) {
            case "ArrowLeft":
                nextIndex = selectedIndex === 0 ? enabledTabs.length - 1 : selectedIndex - 1;
                this.activateTab(enabledTabs[nextIndex], event);
                break;
            case "ArrowRight":
                nextIndex = selectedIndex === enabledTabs.length - 1 ? 0 : selectedIndex + 1;
                this.activateTab(enabledTabs[nextIndex], event);
                break;
            case "Home":
                this.activateTab(enabledTabs[0], event);
                break;
            case "End":
                this.activateTab(enabledTabs[enabledTabs.length - 1], event);
                break;
            case "Delete":
            case "Backspace":
                if (!selectedTab.disabled && !listDisabled && (selectedTab.closable || this.closable())) {
                    this.emitTabClose(selectedTab, event);
                }
                break;
        }
    }

    private activateTab(tab: TabItem, event: Event): void {
        const prevented = this.emitTabSelect(tab, event);
        if (!prevented) {
            this.selectTab(tab);
            this.focusSelectedTab();
        }
    }

    private emitTabClose(tabItem: TabItem, event: Event): boolean {
        const selected = tabItem.id === this.selectedTabId();
        const tabCloseEvent = new TabCloseEvent(tabItem.index, selected, event);
        this.tabClose.emit(tabCloseEvent);
        return tabCloseEvent.isDefaultPrevented();
    }

    private emitTabSelect(tab: TabItem, event: Event): boolean {
        const selectEvent = new TabSelectEvent(tab.index, event);
        this.tabSelect.emit(selectEvent);
        return selectEvent.isDefaultPrevented();
    }

    private focusTab(tab: TabItem): void {
        const tabListItems = this.tabListItems();
        const tabListItem = tabListItems.find(t => t.nativeElement.getAttribute("data-tab-id") === tab.id);
        tabListItem?.nativeElement.focus();
    }

    private handleTabKey(tab: TabItem, event: KeyboardEvent): void {
        event.preventDefault();
        const panelId = tab.id + "-panel";
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.focus();
        }
    }

    private performScroll(element: HTMLElement, direction: ScrollDirection): void {
        let left: number = 0;
        switch (direction) {
            case "left":
                left = Math.max(element.scrollLeft - 100, 0);
                element.scrollTo({ left, behavior: "smooth" });
                break;
            case "right":
                left = Math.min(element.scrollLeft + 100, element.scrollWidth);
                element.scrollTo({ left, behavior: "smooth" });
                break;
        }
    }

    private selectTab(tab: TabItem): void {
        this.selectedTabId.set(tab.id);
    }

    private setupKeyboardNavigation(): void {
        this.#keydown$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => this.handleKeyboardEvents(event));
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

    private updateScrollVisibility(): void {
        asapScheduler.schedule(() => {
            this.scrollsVisible.set(
                this.tabListElement().nativeElement.scrollWidth > this.tabListElement().nativeElement.clientWidth
            );
        });
    }
}
