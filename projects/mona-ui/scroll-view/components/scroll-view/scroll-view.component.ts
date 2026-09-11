import { isPlatformBrowser, NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    contentChild,
    DestroyRef,
    DOCUMENT,
    ElementRef,
    inject,
    input,
    model,
    PLATFORM_ID,
    signal,
    Signal,
    TemplateRef,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed, toObservable, toSignal } from "@angular/core/rxjs-interop";
import { ScrollDirection } from "@nanahoshi/mona-ui/common";
import { toCssValue } from "@nanahoshi/mona-ui/internal";
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
    tap
} from "rxjs";
import { twMerge } from "tailwind-merge";
import { injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { ScrollViewActivePageDirective } from "../../directives/scroll-view-active-page.directive";
import { SCROLL_VIEW_DEFAULT_MESSAGES } from "../../i18n/scroll-view.default-messages";
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
        .slide-in-from-right,
        .slide-out-to-left,
        .slide-in-from-left,
        .slide-out-to-right {
            animation-duration: var(--mona-scroll-view-animation-duration, 500ms);
            animation-timing-function: ease-out;
            animation-fill-mode: both;
        }
        .slide-in-from-right {
            animation-name: slideInFromRight;
        }
        .slide-out-to-left {
            animation-name: slideOutToLeft;
        }
        .slide-in-from-left {
            animation-name: slideInFromLeft;
        }
        .slide-out-to-right {
            animation-name: slideOutToRight;
        }
        @media (prefers-reduced-motion: reduce) {
            .slide-in-from-right,
            .slide-out-to-left,
            .slide-in-from-left,
            .slide-out-to-right {
                animation-duration: min(var(--mona-scroll-view-animation-duration, 500ms), 1ms);
            }
        }
    `,
    host: {
        "[class]": "baseClass()",
        "[attr.tabindex]": "0",
        "[style.height]": "scrollViewHeight()",
        "[style.width]": "scrollViewWidth()",
        "[attr.role]": "'region'",
        "[attr.aria-roledescription]": "messages().carousel",
        "[attr.aria-label]": "ariaLabel()"
    }
})
export class ScrollViewComponent implements ScrollViewVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #directionFromIndex: Signal<"left" | "right">;
    readonly #document = inject(DOCUMENT);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #platformId = inject(PLATFORM_ID);
    readonly #prefersReducedMotion = signal(false);
    readonly #viewIndex = computed(() => {
        const infinite = this.infinite();
        const index = this.index();
        const viewData = this.viewData();
        if (viewData.length === 0) {
            return 0;
        }
        return infinite ? index % viewData.length : index;
    });
    #activePagerPointerId: number | null = null;
    #continuousTicked = false;
    #resizeObserver: ResizeObserver | null = null;
    readonly #scroll$ = new Subject<void>();
    #suppressNextPointerClick = false;
    readonly #pointerUpHandler = (event: PointerEvent): void => this.#handlePointerEnd(event, true);
    readonly #pointerCancelHandler = (event: PointerEvent): void => this.#handlePointerEnd(event, false);

    protected readonly animationDuration = computed(() => {
        const animate = this.animate();
        return typeof animate === "boolean" ? (animate ? 500 : 0) : animate;
    });
    protected readonly ariaLabel = computed(() => {
        const index = this.viewIndex();
        const count = this.itemCount();
        return count > 0 ? this.messages().pageOf(index + 1, count) : undefined;
    });
    protected readonly baseClass = computed(() => {
        const rounded = this.rounded();
        const variantClass = scrollViewBaseThemeVariants({ rounded });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly contentClass = computed(() => {
        return scrollViewContentThemeVariants();
    });
    protected readonly contentTemplate = contentChild(TemplateRef);
    protected readonly isRtl = computed(() => this.#direction() === "rtl");
    protected readonly enterAnimation = computed(() => {
        const isRtl = this.isRtl();
        const dir = this.#directionFromIndex();
        const effectiveDir = isRtl ? (dir === "right" ? "left" : "right") : dir;
        return effectiveDir === "right" ? "slide-in-from-right" : "slide-in-from-left";
    });
    protected readonly itemCount = computed(() => this.viewData().length);
    protected readonly leaveAnimation = computed(() => {
        const isRtl = this.isRtl();
        const dir = this.#directionFromIndex();
        const effectiveDir = isRtl ? (dir === "right" ? "left" : "right") : dir;
        return effectiveDir === "right" ? "slide-out-to-left" : "slide-out-to-right";
    });
    protected readonly leftArrowClass = computed(() => {
        const hidden = !this.arrows() || !(this.infinite() || this.index() !== 0);
        const side = this.isRtl() ? "right" : "left";
        return scrollViewArrowThemeVariants({ hidden, side });
    });
    protected readonly listClass = computed(() => {
        return scrollViewListThemeVariants();
    });
    protected readonly messages = this.#i18n.componentMessages("scrollView", SCROLL_VIEW_DEFAULT_MESSAGES);
    protected readonly pagerArrowClass = computed(() => {
        return scrollViewPagerArrowThemeVariants();
    });
    protected readonly pagerArrowVisible = signal(true);
    protected readonly pagerClass = computed(() => {
        const pagerOverlay = this.pagerOverlay();
        return scrollViewPagerThemeVariants({ pagerOverlay });
    });
    protected readonly pagerListClass = computed(() => {
        return scrollViewPagerListThemeVariants();
    });
    protected readonly pagerListContainerClass = computed(() => {
        return scrollViewPagerListContainerThemeVariants();
    });
    protected readonly pagerListElementRef = viewChild<ElementRef<HTMLUListElement>>("pagerListElement");
    protected readonly rightArrowClass = computed(() => {
        const hidden = !this.arrows() || !(this.infinite() || this.index() !== this.itemCount() - 1);
        const side = this.isRtl() ? "left" : "right";
        return scrollViewArrowThemeVariants({ hidden, side });
    });
    protected readonly scrollBehavior = computed<ScrollBehavior>(() =>
        this.#prefersReducedMotion() ? "auto" : "smooth"
    );
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
    protected readonly viewIndex = this.#viewIndex;

    /**
     * @description Sets whether page transitions are animated.
     * Pass a boolean for default duration (500ms) or a number for custom duration in milliseconds.
     * @default true
     */
    public readonly animate = input<boolean | number>(true);

    /**
     * @description Represents the state of arrows' visibility or activity.
     * @default false
     */
    public readonly arrows = input(false);

    /**
     * @description Sets the data of the scroll view.
     */
    public readonly data = input<Iterable<unknown>>([]);

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
     * @description Sets the border radius of the pager items.
     * @default "medium"
     */
    public readonly pagerRounded = input<ScrollViewVariantProps["pagerRounded"]>("medium");

    /**
     * @description Sets the border radius of the scroll view.
     * @default "medium"
     */
    public readonly rounded = input<ScrollViewVariantProps["rounded"]>("medium");

    /**
     * @description Sets custom CSS classes on the component host element. Merged with base classes via tailwind-merge.
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Sets the width of the scroll view.
     */
    public readonly width = input.required<string | number>();

    public constructor() {
        this.#directionFromIndex = toSignal(
            toObservable(this.#viewIndex).pipe(
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
        if (
            isPlatformBrowser(this.#platformId) &&
            typeof window !== "undefined" &&
            typeof window.matchMedia === "function"
        ) {
            const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
            const onPreferenceChange = (event: MediaQueryListEvent): void => this.#prefersReducedMotion.set(event.matches);
            this.#prefersReducedMotion.set(mediaQuery.matches);
            mediaQuery.addEventListener("change", onPreferenceChange);
            this.#destroyRef.onDestroy(() => mediaQuery.removeEventListener("change", onPreferenceChange));
        }
        this.#destroyRef.onDestroy(() => {
            this.#stopContinuousScroll();
            this.#scroll$.complete();
            this.#resizeObserver?.disconnect();
        });
        afterNextRender(() => {
            this.setPagerListResizeObserver();
            this.setSubscriptions();
            this.scrollActivePageIntoView();
        });
    }

    protected onArrowClick(direction: ScrollDirection): void {
        this.navigate(direction, this.infinite());
    }

    protected onPageClick(index: number, element: HTMLButtonElement): void {
        this.index.set(index);
        element.scrollIntoView({ behavior: this.scrollBehavior(), block: "nearest", inline: "center" });
    }

    protected onPagerClick(event: MouseEvent, element: HTMLUListElement, direction: ScrollDirection): void {
        if (event.button !== 0) {
            return;
        }
        const isPointerClick = event.detail > 0;
        if (isPointerClick && this.#suppressNextPointerClick) {
            this.#suppressNextPointerClick = false;
            return;
        }
        this.#suppressNextPointerClick = false;
        this.#scrollPagerBy(element, direction);
    }

    protected onPagerPointerDown(event: PointerEvent, element: HTMLUListElement, direction: ScrollDirection): void {
        if (!event.isPrimary || event.button !== 0) {
            return;
        }
        if (this.#activePagerPointerId !== null) {
            return;
        }
        this.#suppressNextPointerClick = false;
        this.#activePagerPointerId = event.pointerId;
        this.#continuousTicked = false;

        this.#document.addEventListener("pointerup", this.#pointerUpHandler);
        this.#document.addEventListener("pointercancel", this.#pointerCancelHandler);

        interval(60)
            .pipe(takeUntil(this.#scroll$), takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                this.#continuousTicked = true;
                this.#scrollPagerBy(element, direction);
            });
    }

    #scrollPagerBy(element: HTMLUListElement, direction: ScrollDirection): void {
        let offset = direction === "left" ? -100 : 100;
        if (this.isRtl()) {
            offset = -offset;
        }
        element.scrollBy?.({ behavior: this.scrollBehavior(), left: offset });
    }

    #handlePointerEnd(event: PointerEvent, isUp: boolean): void {
        if (event.pointerId !== this.#activePagerPointerId) {
            return;
        }
        this.#document.removeEventListener("pointerup", this.#pointerUpHandler);
        this.#document.removeEventListener("pointercancel", this.#pointerCancelHandler);
        this.#scroll$.next();
        if (isUp && this.#continuousTicked) {
            this.#suppressNextPointerClick = true;
        } else {
            this.#suppressNextPointerClick = false;
        }
        this.#continuousTicked = false;
        this.#activePagerPointerId = null;
    }

    #stopContinuousScroll(): void {
        this.#document.removeEventListener("pointerup", this.#pointerUpHandler);
        this.#document.removeEventListener("pointercancel", this.#pointerCancelHandler);
        this.#scroll$.next();
        this.#continuousTicked = false;
        this.#activePagerPointerId = null;
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
        if (dataLength === 0) {
            return;
        }
        if (infinite) {
            this.index.set((currentIndex - 1 + dataLength) % dataLength);
        } else {
            this.index.set(Math.max(0, currentIndex - 1));
        }
    }

    private navigateRight(infinite: boolean): void {
        const currentIndex = this.index();
        const dataLength = this.viewData().length;
        if (dataLength === 0) {
            return;
        }
        if (infinite) {
            this.index.set((currentIndex + 1) % dataLength);
        } else {
            this.index.set(Math.min(dataLength - 1, currentIndex + 1));
        }
    }

    private scrollActivePageIntoView(): void {
        asyncScheduler.schedule(() => {
            const element = this.#hostElementRef.nativeElement.querySelector("button[data-active-page='true']");
            if (element) {
                element.scrollIntoView({ behavior: this.scrollBehavior(), block: "nearest", inline: "center" });
            }
        });
    }

    private setPagerListResizeObserver(): void {
        const pagerListElementRef = this.pagerListElementRef();
        if (pagerListElementRef) {
            const element = pagerListElementRef.nativeElement;
            this.pagerArrowVisible.set(element.scrollWidth > element.clientWidth);
            this.#resizeObserver = new ResizeObserver(() => {
                const scrollWidth = element.scrollWidth;
                const clientWidth = element.clientWidth;
                this.pagerArrowVisible.set(scrollWidth > clientWidth);
            });
            this.#resizeObserver.observe(element);
        }
    }

    private setSubscriptions(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(event => event.key === "ArrowLeft" || event.key === "ArrowRight"),
                tap(event => {
                    const isRtl = this.isRtl();
                    let direction: ScrollDirection;
                    if (event.key === "ArrowLeft") {
                        direction = isRtl ? "right" : "left";
                    } else {
                        direction = isRtl ? "left" : "right";
                    }
                    this.navigate(direction, this.infinite());
                })
            )
            .subscribe();
    }
}
