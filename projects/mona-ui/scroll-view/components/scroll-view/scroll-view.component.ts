import { isPlatformBrowser, NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    afterRenderEffect,
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

interface RejectedPagerPointer {
    readonly control?: HTMLElement | null;
    phase: "down" | "awaiting-click";
}

interface PagerScrollContext {
    readonly direction: "ltr" | "rtl";
    readonly element: HTMLUListElement;
    readonly maxScroll: number;
    target: number;
}

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
    readonly #pointerCancelHandler = (event: PointerEvent): void => this.#handlePointerEnd(event, false);
    readonly #pointerUpHandler = (event: PointerEvent): void => this.#handlePointerEnd(event, true);
    readonly #prefersReducedMotion = signal(false);
    readonly #rejectedPagerPointers = new Map<number, RejectedPagerPointer>();
    readonly #scroll$ = new Subject<void>();
    readonly #suppressedPagerClickPointerIds = new Set<number>();
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
    #pagerScrollCompletionCleanup: (() => void) | null = null;
    #pagerScrollContext: PagerScrollContext | null = null;
    #resizeObserver: ResizeObserver | null = null;

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
    protected readonly enterAnimation = computed(() => {
        const isRtl = this.isRtl();
        const dir = this.#directionFromIndex();
        const effectiveDir = isRtl ? (dir === "right" ? "left" : "right") : dir;
        return effectiveDir === "right" ? "slide-in-from-right" : "slide-in-from-left";
    });
    protected readonly isRtl = computed(() => this.#direction() === "rtl");
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
    protected readonly pagerArrowVisible = signal(false);
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
        this.#prefersReducedMotion() ? "instant" : "smooth"
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
            this.#resetPagerScrollState();
            this.#scroll$.complete();
            this.#resizeObserver?.disconnect();
        });
        afterRenderEffect({
            read: onCleanup => {
                const pagerListElementRef = this.pagerListElementRef();
                this.itemCount();

                this.#resizeObserver?.disconnect();
                this.#resizeObserver = null;

                onCleanup(() => {
                    this.#resizeObserver?.disconnect();
                    this.#resizeObserver = null;
                });

                if (!pagerListElementRef) {
                    this.pagerArrowVisible.set(false);
                    this.#resetPagerScrollState();
                    return;
                }

                const element = pagerListElementRef.nativeElement;
                if (this.#pagerScrollContext && this.#pagerScrollContext.element !== element) {
                    this.#resetPagerScrollState();
                }

                const scrollWidth = element.scrollWidth;
                const clientWidth = element.clientWidth;
                this.pagerArrowVisible.set(scrollWidth > clientWidth);

                if (typeof ResizeObserver !== "undefined") {
                    this.#resizeObserver = new ResizeObserver(() => {
                        const currentScrollWidth = element.scrollWidth;
                        const currentClientWidth = element.clientWidth;
                        this.pagerArrowVisible.set(currentScrollWidth > currentClientWidth);
                        if (this.#pagerScrollContext && this.#pagerScrollContext.element === element) {
                            const currentMaxScroll = Math.max(0, currentScrollWidth - currentClientWidth);
                            if (this.#pagerScrollContext.maxScroll !== currentMaxScroll) {
                                this.#resetPagerScrollState();
                            }
                        }
                    });
                    this.#resizeObserver.observe(element);
                }
            }
        });
        afterNextRender(() => {
            this.setSubscriptions();
            this.scrollActivePageIntoView();
        });
    }

    protected onArrowClick(direction: ScrollDirection): void {
        this.navigate(direction, this.infinite());
    }

    protected onPageClick(index: number, element: HTMLButtonElement): void {
        this.#resetPagerScrollState();
        this.index.set(index);
        element.scrollIntoView({ behavior: this.scrollBehavior(), block: "nearest", inline: "center" });
    }

    protected onPagerClick(event: MouseEvent | PointerEvent, element: HTMLUListElement, direction: ScrollDirection): void {
        if (event.button !== 0) {
            return;
        }

        const isKeyboardActivation = event.detail === 0;
        if (!isKeyboardActivation) {
            const pointerId =
                "pointerId" in event && typeof (event as PointerEvent).pointerId === "number"
                    ? (event as PointerEvent).pointerId
                    : null;

            if (pointerId !== null && pointerId !== -1) {
                if (this.#rejectedPagerPointers.has(pointerId)) {
                    this.#rejectedPagerPointers.delete(pointerId);
                    this.#cleanupDocumentPointerListenersIfNeeded();
                    return;
                }
                if (this.#suppressedPagerClickPointerIds.delete(pointerId)) {
                    return;
                }
            } else {
                if (this.#rejectedPagerPointers.size === 1) {
                    const firstKey = this.#rejectedPagerPointers.keys().next().value;
                    if (firstKey !== undefined) {
                        this.#rejectedPagerPointers.delete(firstKey);
                        this.#cleanupDocumentPointerListenersIfNeeded();
                        return;
                    }
                }
                if (this.#suppressedPagerClickPointerIds.size === 1) {
                    const firstId = this.#suppressedPagerClickPointerIds.values().next().value;
                    if (firstId !== undefined) {
                        this.#suppressedPagerClickPointerIds.delete(firstId);
                        return;
                    }
                }
            }
        }

        this.#scrollPagerBy(element, direction);
    }

    protected onPagerPointerDown(event: PointerEvent, element: HTMLUListElement, direction: ScrollDirection): void {
        if (!event.isPrimary || event.button !== 0) {
            return;
        }
        const control = (event.currentTarget ?? event.target) as HTMLElement | null;
        if (this.#activePagerPointerId !== null) {
            this.#rejectedPagerPointers.set(event.pointerId, {
                control,
                phase: "down"
            });
            this.#ensureDocumentPointerListeners();
            return;
        }
        this.#rejectedPagerPointers.delete(event.pointerId);
        this.#suppressedPagerClickPointerIds.delete(event.pointerId);
        this.#activePagerPointerId = event.pointerId;
        this.#continuousTicked = false;

        this.#ensureDocumentPointerListeners();

        interval(60)
            .pipe(takeUntil(this.#scroll$), takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                this.#continuousTicked = true;
                this.#scrollPagerBy(element, direction);
            });
    }

    #armPagerScrollCompletion(element: HTMLUListElement): void {
        if (this.#pagerScrollCompletionCleanup) {
            this.#pagerScrollCompletionCleanup();
            this.#pagerScrollCompletionCleanup = null;
        }

        const onScrollEnd = (): void => {
            this.#resetPagerScrollState();
        };

        const supportsScrollEnd =
            isPlatformBrowser(this.#platformId) &&
            typeof window !== "undefined" &&
            "onscrollend" in element &&
            typeof element.addEventListener === "function";

        if (supportsScrollEnd) {
            element.addEventListener("scrollend", onScrollEnd, { once: true });
            this.#pagerScrollCompletionCleanup = () => {
                element.removeEventListener?.("scrollend", onScrollEnd);
            };
        } else {
            let inactivityTimeoutId: number | null = null;
            const scheduleInactivityTimeout = (): void => {
                if (inactivityTimeoutId !== null && typeof window !== "undefined") {
                    window.clearTimeout(inactivityTimeoutId);
                }
                if (isPlatformBrowser(this.#platformId) && typeof window !== "undefined") {
                    inactivityTimeoutId = window.setTimeout(onScrollEnd, 150);
                }
            };

            const onScroll = (): void => {
                scheduleInactivityTimeout();
            };

            if (typeof element.addEventListener === "function") {
                element.addEventListener("scroll", onScroll, { passive: true });
            }
            scheduleInactivityTimeout();

            this.#pagerScrollCompletionCleanup = () => {
                if (typeof element.removeEventListener === "function") {
                    element.removeEventListener("scroll", onScroll);
                }
                if (inactivityTimeoutId !== null && typeof window !== "undefined") {
                    window.clearTimeout(inactivityTimeoutId);
                }
            };
        }
    }

    #cleanupDocumentPointerListenersIfNeeded(): void {
        let hasDownRejected = false;
        for (const p of this.#rejectedPagerPointers.values()) {
            if (p.phase === "down") {
                hasDownRejected = true;
                break;
            }
        }
        if (this.#activePagerPointerId === null && !hasDownRejected) {
            this.#document.removeEventListener("pointerup", this.#pointerUpHandler);
            this.#document.removeEventListener("pointercancel", this.#pointerCancelHandler);
        }
    }

    #ensureDocumentPointerListeners(): void {
        this.#document.addEventListener("pointerup", this.#pointerUpHandler);
        this.#document.addEventListener("pointercancel", this.#pointerCancelHandler);
    }

    #handlePointerEnd(event: PointerEvent, isUp: boolean): void {
        if (event.pointerId !== this.#activePagerPointerId) {
            const rejected = this.#rejectedPagerPointers.get(event.pointerId);
            if (rejected) {
                if (!isUp) {
                    this.#rejectedPagerPointers.delete(event.pointerId);
                } else {
                    const targetNode = event.target as Node | null;
                    const isWithinControl =
                        rejected.control == null ||
                        (targetNode != null && rejected.control.contains(targetNode)) ||
                        (typeof event.composedPath === "function" && event.composedPath().includes(rejected.control));

                    if (isWithinControl) {
                        rejected.phase = "awaiting-click";
                    } else {
                        this.#rejectedPagerPointers.delete(event.pointerId);
                    }
                }
            }
            this.#cleanupDocumentPointerListenersIfNeeded();
            return;
        }
        this.#scroll$.next();
        if (isUp && this.#continuousTicked) {
            this.#suppressedPagerClickPointerIds.add(event.pointerId);
        } else {
            this.#suppressedPagerClickPointerIds.delete(event.pointerId);
        }
        this.#continuousTicked = false;
        this.#activePagerPointerId = null;
        this.#cleanupDocumentPointerListenersIfNeeded();
    }

    #resetPagerScrollState(): void {
        if (this.#pagerScrollCompletionCleanup) {
            this.#pagerScrollCompletionCleanup();
            this.#pagerScrollCompletionCleanup = null;
        }
        this.#pagerScrollContext = null;
    }

    #scrollPagerBy(element: HTMLUListElement, direction: ScrollDirection): void {
        const currentDirection = this.isRtl() ? "rtl" : "ltr";
        const maxScroll = Math.max(0, (element.scrollWidth ?? 0) - (element.clientWidth ?? 0));
        const sameContext =
            this.#pagerScrollContext?.element === element &&
            this.#pagerScrollContext.direction === currentDirection &&
            this.#pagerScrollContext.maxScroll === maxScroll;

        const currentScrollLeft = element.scrollLeft ?? 0;
        const base = sameContext ? this.#pagerScrollContext!.target : currentScrollLeft;

        let offset = direction === "left" ? -100 : 100;
        if (currentDirection === "rtl") {
            offset = -offset;
        }
        const target = base + offset;

        const clampedTarget =
            currentDirection === "ltr"
                ? Math.max(0, Math.min(maxScroll, target))
                : Math.max(-maxScroll, Math.min(0, target));

        if (!sameContext && clampedTarget === currentScrollLeft) {
            this.#resetPagerScrollState();
            return;
        }

        if (sameContext && clampedTarget === this.#pagerScrollContext!.target) {
            return;
        }

        this.#pagerScrollContext = {
            direction: currentDirection,
            element,
            maxScroll,
            target: clampedTarget
        };

        if (typeof element.scrollTo === "function") {
            element.scrollTo({ behavior: this.scrollBehavior(), left: clampedTarget });
        } else if (typeof element.scrollBy === "function") {
            element.scrollBy({ behavior: this.scrollBehavior(), left: offset });
        }

        this.#armPagerScrollCompletion(element);
    }

    #stopContinuousScroll(): void {
        this.#document.removeEventListener("pointerup", this.#pointerUpHandler);
        this.#document.removeEventListener("pointercancel", this.#pointerCancelHandler);
        this.#scroll$.next();
        this.#continuousTicked = false;
        this.#activePagerPointerId = null;
        this.#suppressedPagerClickPointerIds.clear();
        this.#rejectedPagerPointers.clear();
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
        this.#resetPagerScrollState();
        asyncScheduler.schedule(() => {
            const element = this.#hostElementRef.nativeElement.querySelector("button[data-active-page='true']");
            if (element) {
                element.scrollIntoView({ behavior: this.scrollBehavior(), block: "nearest", inline: "center" });
            }
        });
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
