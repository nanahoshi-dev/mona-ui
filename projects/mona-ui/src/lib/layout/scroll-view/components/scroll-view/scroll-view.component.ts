import { NgTemplateOutlet } from "@angular/common";
import {
    afterRenderEffect,
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    DestroyRef,
    ElementRef,
    inject,
    input,
    linkedSignal,
    model,
    signal,
    TemplateRef,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed, toObservable, toSignal } from "@angular/core/rxjs-interop";
import { select } from "@mirei/ts-collections";
import {
    asyncScheduler,
    filter,
    fromEvent,
    interval,
    map,
    pairwise,
    startWith,
    Subject,
    takeUntil,
    tap,
    timer
} from "rxjs";
import { twMerge } from "tailwind-merge";
import { ScrollDirection } from "../../../../models/ScrollDirection";
import { ThemeService } from "../../../../theme/services/theme.service";
import { toCssValue } from "../../../../utils/toCssValue";
import { ScrollViewActivePageDirective } from "../../directives/scroll-view-active-page.directive";
import { PagerOverlay } from "../../models/PagerOverlay";
import { ScrollViewListItem } from "../../models/ScrollViewListItem";
import {
    scrollViewArrowThemeVariants,
    scrollViewBaseThemeVariants,
    scrollViewContentThemeVariants,
    scrollViewListThemeVariants,
    scrollViewPagerArrowThemeVariants,
    scrollViewPagerListContainerThemeVariants,
    scrollViewPagerListThemeVariants,
    scrollViewPagerThemeVariants,
    ScrollViewVariantInput,
    ScrollViewVariantProps
} from "../../styles/scroll-view.styles";

@Component({
    selector: "mona-scroll-view",
    templateUrl: "./scroll-view.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet, ScrollViewActivePageDirective],
    styles: `
        @keyframes slideInFromRight {
            from {
                transform: translateX(100%);
            }
            to {
                transform: translateX(0);
            }
        }
        @keyframes slideOutToLeft {
            from {
                transform: translateX(0);
            }
            to {
                transform: translateX(-100%);
            }
        }
        @keyframes slideInFromLeft {
            from {
                transform: translateX(-100%);
            }
            to {
                transform: translateX(0);
            }
        }
        @keyframes slideOutToRight {
            from {
                transform: translateX(0);
            }
            to {
                transform: translateX(100%);
            }
        }
        .slide-in-from-right {
            animation: slideInFromRight 0.3s ease-out both;
        }
        .slide-out-to-left {
            animation: slideOutToLeft 0.3s ease-out both;
        }
        .slide-in-from-left {
            animation: slideInFromLeft 0.3s ease-out both;
        }
        .slide-out-to-right {
            animation: slideOutToRight 0.3s ease-out both;
        }
    `,
    host: {
        "[class]": "baseClass()",
        "[attr.tabindex]": "0",
        "[style.height]": "scrollViewHeight()",
        "[style.width]": "scrollViewWidth()"
    }
})
export class ScrollViewComponent implements AfterViewInit, ScrollViewVariantInput {
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #index = computed(() => this.viewIndex());
    readonly #directionFromIndex = toSignal(
        toObservable(this.#index).pipe(
            startWith(0),
            pairwise(),
            map(([prevIndex, index]) => {
                const infinite = this.infinite();
                const totalItems = this.itemCount();
                if (infinite && totalItems > 1) {
                    const lastIndex = totalItems - 1;
                    if (prevIndex === lastIndex && index === 0) {
                        return "right";
                    }
                    if (prevIndex === 0 && index === lastIndex) {
                        return "left";
                    }
                }
                return index < prevIndex ? "left" : "right";
            })
        ),
        {
            initialValue: "right"
        }
    );
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #themeService = inject(ThemeService);
    #resizeObserver: ResizeObserver | null = null;
    #scroll$ = new Subject<void>();

    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const variantClass = scrollViewBaseThemeVariants(theme)({ rounded });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly contentClass = computed(() => {
        const theme = this.#themeService.theme();
        return scrollViewContentThemeVariants(theme)();
    });
    protected readonly contentTemplate = contentChild(TemplateRef);
    protected readonly enterAnimation = computed(() => {
        return this.#directionFromIndex() === "right" ? "slide-in-from-right" : "slide-in-from-left";
    });
    protected readonly itemCount = computed(() => this.viewData().length);
    protected readonly leaveAnimation = computed(() => {
        return this.#directionFromIndex() === "right" ? "slide-out-to-left" : "slide-out-to-right";
    });
    protected readonly leftArrowClass = computed(() => {
        const theme = this.#themeService.theme();
        const hidden = !this.arrows() || !(this.infinite() || this.index() !== 0);
        return scrollViewArrowThemeVariants(theme)({ left: true, hidden });
    });
    protected readonly listClass = computed(() => {
        const theme = this.#themeService.theme();
        return scrollViewListThemeVariants(theme)();
    });
    protected readonly pagerArrowClass = computed(() => {
        const theme = this.#themeService.theme();
        return scrollViewPagerArrowThemeVariants(theme)();
    });
    protected readonly pagerArrowVisible = signal(true);
    protected readonly pagerClass = computed(() => {
        const theme = this.#themeService.theme();
        const pagerOverlay = this.pagerOverlay();
        return scrollViewPagerThemeVariants(theme)({ pagerOverlay });
    });
    protected readonly pagerListClass = computed(() => {
        const theme = this.#themeService.theme();
        return scrollViewPagerListThemeVariants(theme)();
    });
    protected readonly pagerListContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        return scrollViewPagerListContainerThemeVariants(theme)();
    });
    protected readonly pagerListElementRef = viewChild<ElementRef<HTMLUListElement>>("pagerListElement");
    protected readonly pagerPosition = signal("0");
    protected readonly rightArrowClass = computed(() => {
        const theme = this.#themeService.theme();
        const hidden = !this.arrows() || !(this.infinite() || this.index() !== this.itemCount() - 1);
        return scrollViewArrowThemeVariants(theme)({ right: true, hidden });
    });
    protected readonly scrollViewHeight = computed(() => {
        const height = this.height();
        return toCssValue(height);
    });
    protected readonly scrollViewWidth = computed(() => {
        const width = this.width();
        return toCssValue(width);
    });
    protected readonly viewData = computed(() => {
        const data = this.data();
        return select(data, d => ({ data: d }) as ScrollViewListItem).toImmutableSet();
    });
    protected readonly viewIndex = computed(() => {
        const infinite = this.infinite();
        const index = this.index();
        const viewData = this.viewData();
        return infinite ? index % viewData.length : index;
    });

    /**
     * @description Represents the state of arrows' visibility or activity.
     * @default false
     */
    public readonly arrows = input(false);

    /**
     * @description Represents an iterable data input.
     *
     * This variable is initialized as an iterable with no elements.
     * It accepts any iterable containing elements of any type.
     */
    public readonly data = input<Iterable<any>>([]);

    /**
     * @description Sets the height of the scroll view.
     * This property is required.
     */
    public readonly height = input.required<string | number>();

    /**
     * @description Sets the active page of the scroll view.
     * @default 0
     */
    public readonly index = model(0);

    /**
     * @description Sets whether the scroll view is infinite.
     * @default false
     */
    public readonly infinite = input(false);

    /**
     * @description Sets whether the pager is visible.
     */
    public readonly pageable = input(false);

    /**
     * @description Sets the background blur of the pager in pixels.
     * @default 3
     */
    public readonly pagerBlur = input(3);

    /**
     * @description Sets the color of the pager.
     * @default "dark"
     */
    public readonly pagerOverlay = input<PagerOverlay>("dark");

    /**
     * @description Represents the rounded property for a ScrollView component.
     *
     * The variable `rounded` determines the border radius style to be applied
     * to the ScrollView. The value "medium" is used as the default rounding level.
     *
     */
    public readonly rounded = input<ScrollViewVariantProps["rounded"]>("medium");
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Represents the width of an element or component. The value can be specified
     * either as a string (e.g., to include units like "px", "%", "em") or as a number
     * (e.g., for unitless numerical values).
     *
     * This variable is required and must be provided when initializing
     * or configuring the input.
     */
    public readonly width = input.required<string | number>();

    public constructor() {
        this.#destroyRef.onDestroy(() => this.#resizeObserver?.disconnect());
        afterRenderEffect({
            earlyRead: () => console.log(this.index())
        });
    }

    public ngAfterViewInit(): void {
        this.setPagerListResizeObserver();
        this.setSubscriptions();
        this.scrollActivePageIntoView();
    }

    public onArrowClick(direction: ScrollDirection): void {
        this.navigate(direction, this.infinite());
        this.scrollActivePageIntoView();
    }

    public onPageClick(index: number, element: HTMLLIElement): void {
        this.index.set(index);
        element.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }

    public onPagerScroll(element: HTMLUListElement, direction: ScrollDirection, type: "single" | "continuous"): void {
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

    public onPagerScrollEnd(): void {
        this.#scroll$.next();
        this.#scroll$.complete();
        this.#scroll$ = new Subject<void>();
    }

    private navigate(direction: ScrollDirection, infinite: boolean): void {
        if (direction === "left") {
            this.navigateLeft(infinite);
        } else {
            this.navigateRight(infinite);
        }
        this.scrollActivePageIntoView();
    }

    private navigateLeft(infinite: boolean): void {
        const currentIndex = this.index();
        const dataLength = this.viewData().length;
        if (infinite) {
            this.index.set((currentIndex - 1 + dataLength) % dataLength);
        } else {
            this.index.set(Math.max(0, currentIndex - 1));
        }
    }
    private navigateRight(infinite: boolean): void {
        const currentIndex = this.index();
        const dataLength = this.viewData().length;
        if (infinite) {
            this.index.set((currentIndex + 1) % dataLength);
        } else {
            this.index.set(Math.min(dataLength - 1, currentIndex + 1));
        }
    }

    private scrollActivePageIntoView(): void {
        asyncScheduler.schedule(() => {
            const element = this.#hostElementRef.nativeElement.querySelector("li[data-active-page='true']");
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            }
        });
    }

    private setPagerListResizeObserver(): void {
        asyncScheduler.schedule(() => {
            const pagerListElementRef = this.pagerListElementRef();
            if (pagerListElementRef) {
                const element = pagerListElementRef.nativeElement;
                this.pagerArrowVisible.set(element.scrollWidth > element.clientWidth);
                this.#resizeObserver = new ResizeObserver(() => {
                    const scrollWidth = element.scrollWidth;
                    const clientWidth = element.clientWidth;
                    this.pagerArrowVisible.set(scrollWidth > clientWidth);
                });
            }
        });
    }

    private setSubscriptions(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(event => event.key === "ArrowLeft" || event.key === "ArrowRight"),
                tap(event => {
                    const direction = event.key === "ArrowLeft" ? "left" : "right";
                    this.navigate(direction, this.infinite());
                })
            )
            .subscribe();
    }
}
