import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    afterRenderEffect,
    ChangeDetectionStrategy,
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
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faChevronLeft, faChevronRight, faXmark } from "@fortawesome/free-solid-svg-icons";
import { firstOrDefault, forEach } from "@mirei/ts-collections";
import { asapScheduler, fromEvent, interval, Subject, takeUntil, timer } from "rxjs";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { ScrollDirection } from "../../../../models/ScrollDirection";
import { ThemeService } from "../../../../theme/services/theme.service";
import { TabListItemDirective } from "../../directives/tab-list-item.directive";
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
    imports: [ButtonDirective, FaIconComponent, NgTemplateOutlet, TabListItemDirective],
    templateUrl: "./tab-list.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[class]": "baseClass()",
        "(keydown)": "onKeydown($event)"
    }
})
export class TabListComponent implements TabListVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef);
    readonly #themeService = inject(ThemeService);
    readonly #keydown$ = new Subject<KeyboardEvent>();
    #resizeObserver: ResizeObserver | null = null;
    #scroll$ = new Subject<void>();
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        return tabListBaseThemeVariants(theme)({ rounded, size });
    });
    protected readonly listClass = computed(() => {
        const theme = this.#themeService.theme();
        return tabListListThemeVariants(theme)();
    });
    protected readonly scrollButtonClass = computed(() => {
        const theme = this.#themeService.theme();
        return tabListScrollButtonThemeVariants(theme)();
    });
    protected readonly scrollLeftIcon = faChevronLeft;
    protected readonly scrollRightIcon = faChevronRight;
    protected readonly scrollsVisible = signal(false);
    protected readonly tabCloseIcon = faXmark;
    protected readonly tabListElement = viewChild.required<ElementRef<HTMLUListElement>>("tabListElement");
    protected readonly tabListItems = viewChildren(TabListItemDirective, { read: ElementRef });

    public readonly closable = input(false);
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
        const tabCloseEvent = new TabCloseEvent(tab.index, tab.selected);
        this.tabClose.emit(tabCloseEvent);
    }

    protected startScrolling(element: HTMLElement, direction: ScrollDirection, type: "single" | "continuous"): void {
        const timeFunction = type === "single" ? timer : interval;
        timeFunction(60)
            .pipe(takeUntil(this.#scroll$))
            .subscribe(() => {
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
            });
    }

    protected stopScrolling(): void {
        this.#scroll$.next();
        this.#scroll$.complete();
        this.#scroll$ = new Subject<void>();
    }

    private handleKeyboardEvents(event: KeyboardEvent): void {
        const tabList = this.tabList();
        const tabs = Array.from(tabList);
        const selectedTab = tabs.find(t => t.id === this.selectedTabId());
        if (!selectedTab) {
            return;
        }
        const selectedIndex = tabs.indexOf(selectedTab);
        let nextIndex = selectedIndex;

        switch (event.key) {
            case "ArrowLeft":
                nextIndex = selectedIndex === 0 ? tabs.length - 1 : selectedIndex - 1;
                this.activateTab(tabs[nextIndex], event);
                break;
            case "ArrowRight":
                nextIndex = selectedIndex === tabs.length - 1 ? 0 : selectedIndex + 1;
                this.activateTab(tabs[nextIndex], event);
                break;
            case "Home":
                this.activateTab(tabs[0], event);
                break;
            case "End":
                this.activateTab(tabs[tabs.length - 1], event);
                break;
            case "Tab":
                if (!event.shiftKey) {
                    this.handleTabKey(selectedTab, event);
                }
                break;
            case "Delete":
            case "Backspace":
                if (selectedTab.closable || (this.closable() && !selectedTab.closable)) {
                    this.tabClose.emit(new TabCloseEvent(selectedTab.index, selectedTab.selected));
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
        const panelId = tab.id;
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.focus();
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

    private updateScrollVisibility(): void {
        asapScheduler.schedule(() => {
            this.scrollsVisible.set(
                this.tabListElement().nativeElement.scrollWidth > this.tabListElement().nativeElement.clientWidth
            );
        });
    }
}
