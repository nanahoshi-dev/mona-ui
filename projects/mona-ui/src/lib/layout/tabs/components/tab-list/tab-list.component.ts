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
    output,
    signal,
    untracked,
    viewChild
} from "@angular/core";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faChevronLeft, faChevronRight, faXmark } from "@fortawesome/free-solid-svg-icons";
import { asapScheduler, interval, Subject, takeUntil, timer } from "rxjs";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { ScrollDirection } from "../../../../models/ScrollDirection";
import { ThemeService } from "../../../../theme/services/theme.service";
import { TabListItemDirective } from "../../directives/tab-list-item.directive";
import { TabCloseEvent } from "../../models/TabCloseEvent";
import { TabItem } from "../../models/TabItem";
import { TabsService } from "../../services/tabs.service";
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
        "[class]": "baseClass()"
    }
})
export class TabListComponent implements TabListVariantInput {
    readonly #tabsService = inject(TabsService);
    readonly #themeService = inject(ThemeService);
    #resizeObserver: ResizeObserver | null = null;
    #scroll$ = new Subject<void>();
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return tabListBaseThemeVariants(theme)({ rounded });
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
    protected readonly tabList = this.#tabsService.tabList;
    protected readonly tabListElement = viewChild.required<ElementRef<HTMLUListElement>>("tabListElement");

    public readonly closable = input(false);
    public readonly rounded = input.required<TabListVariantProps["rounded"]>();
    public readonly tabClose = output<TabCloseEvent>();

    public constructor() {
        afterRenderEffect({
            read: () => {
                this.#tabsService.tabDict();
                untracked(() => {
                    this.updateScrollVisibility();
                });
            }
        });
        afterNextRender({
            read: () => this.setupResizeObserver()
        });
        inject(DestroyRef).onDestroy(() => this.#resizeObserver?.disconnect());
    }

    public onTabClick(tab: TabItem, tabListElement: HTMLUListElement): void {
        if (tab.selected) {
            return;
        }
        this.#tabsService.updateSelectedTab(tab.uid);
        window.setTimeout(() => {
            const listElement = tabListElement.querySelector("li.mona-tab-active");
            if (listElement) {
                listElement.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        });
    }

    public onTabClose(tab: TabItem, event: MouseEvent): void {
        event.stopPropagation();
        const tabCloseEvent = new TabCloseEvent(tab.index, tab);
        this.tabClose.emit(tabCloseEvent);
    }

    public startScrolling(element: HTMLElement, direction: ScrollDirection, type: "single" | "continuous"): void {
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

    public stopScrolling(): void {
        this.#scroll$.next();
        this.#scroll$.complete();
        this.#scroll$ = new Subject<void>();
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
