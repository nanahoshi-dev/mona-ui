import { isPlatformBrowser, NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    afterRenderEffect,
    Component,
    computed,
    contentChild,
    DestroyRef,
    DOCUMENT,
    effect,
    ElementRef,
    inject,
    input,
    isDevMode,
    model,
    PLATFORM_ID,
    signal,
    Signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed, toObservable, toSignal } from "@angular/core/rxjs-interop";
import { ScrollDirection } from "@nanahoshi/mona-ui/common";
import { toCssValue } from "@nanahoshi/mona-ui/internal";
import { select } from "@mirei/ts-collections";
import { interval, map, pairwise, startWith, Subject, takeUntil } from "rxjs";
import { twMerge } from "tailwind-merge";
import { injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { ScrollViewActivePageDirective } from "../../directives/scroll-view-active-page.directive";
import { ScrollViewSlideDirective } from "../../directives/scroll-view-slide.directive";
import { SCROLL_VIEW_DEFAULT_MESSAGES } from "../../i18n/scroll-view.default-messages";
import { PagerOverlay } from "../../models/PagerOverlay";
import { ScrollViewListItem } from "../../models/ScrollViewListItem";
import {
    scrollViewArrowThemeVariants,
    scrollViewBaseThemeVariants,
    scrollViewContentThemeVariants,
    scrollViewPagerArrowThemeVariants,
    scrollViewPagerListContainerThemeVariants,
    scrollViewPagerListThemeVariants,
    scrollViewPagerThemeVariants,
    scrollViewSlideThemeVariants,
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

interface ActiveSwipe {
    readonly pointerId: number;
    readonly startX: number;
    readonly startY: number;
}

/** How far a touch has to travel, in pixels, to count as a swipe. */
const SWIPE_DISTANCE = 40;

/** Where a horizontal drag belongs to the control under it and not to the carousel. */
const SWIPE_EXEMPT_SELECTOR = "input, select, textarea, [contenteditable], [role='slider'], [role='scrollbar']";

function normalizeScrollViewIndex(rawIndex: number, itemCount: number, infinite: boolean): number {
    if (itemCount <= 0) {
        return 0;
    }

    const finiteIndex = Number.isFinite(rawIndex) ? Math.trunc(rawIndex) : 0;

    if (infinite) {
        return ((finiteIndex % itemCount) + itemCount) % itemCount;
    }

    return Math.max(0, Math.min(itemCount - 1, finiteIndex));
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
        "[attr.tabindex]": "itemCount() > 0 ? 0 : null",
        "[style.height]": "scrollViewHeight()",
        "[style.width]": "scrollViewWidth()",
        "[attr.role]": "hostRole()",
        "[attr.aria-roledescription]": "itemCount() > 0 ? messages().carousel : null",
        "[attr.aria-label]": "ariaLabel() || null",
        "[attr.aria-labelledby]": "ariaLabelledBy() || null",
        "(keydown)": "onKeydown($event)"
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
    readonly #swipeCancelHandler = (event: PointerEvent): void => this.#endSwipe(event, false);
    readonly #swipeEndHandler = (event: PointerEvent): void => this.#endSwipe(event, true);
    readonly #suppressedPagerClickPointerIds = new Set<number>();
    readonly #viewIndex = computed(() => {
        return normalizeScrollViewIndex(this.index(), this.itemCount(), this.infinite());
    });
    #activePagerPointerControl: HTMLElement | null = null;
    #activePagerPointerId: number | null = null;
    #activeSwipe: ActiveSwipe | null = null;
    #continuousTicked = false;
    #navigationIntent: ScrollDirection | null = null;
    #pagerCentered = false;
    #pagerScrollCompletionCleanup: (() => void) | null = null;
    #pagerScrollContext: PagerScrollContext | null = null;
    #resizeObserver: ResizeObserver | null = null;

    protected readonly animationDuration = computed(() => {
        const animate = this.animate();
        return typeof animate === "boolean" ? (animate ? 500 : 0) : animate;
    });
    protected readonly bareTemplate = contentChild(TemplateRef);
    protected readonly baseClass = computed(() => {
        const rounded = this.rounded();
        const variantClass = scrollViewBaseThemeVariants({ rounded });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly contentClass = computed(() => {
        return scrollViewContentThemeVariants();
    });
    protected readonly contentElementRef = viewChild<ElementRef<HTMLDivElement>>("contentElement");
    protected readonly contentTemplate = computed(() => this.slideDirective()?.templateRef ?? this.bareTemplate());
    protected readonly enterAnimation = computed(() => {
        const isRtl = this.isRtl();
        const dir = this.#directionFromIndex();
        const effectiveDir = isRtl ? (dir === "right" ? "left" : "right") : dir;
        return effectiveDir === "right" ? "slide-in-from-right" : "slide-in-from-left";
    });
    protected readonly hostRole = computed(() => (this.ariaLabel() || this.ariaLabelledBy() ? "region" : "group"));
    protected readonly isRtl = computed(() => this.#direction() === "rtl");
    protected readonly itemCount = computed(() => this.viewData().length);
    protected readonly leaveAnimation = computed(() => {
        const isRtl = this.isRtl();
        const dir = this.#directionFromIndex();
        const effectiveDir = isRtl ? (dir === "right" ? "left" : "right") : dir;
        return effectiveDir === "right" ? "slide-out-to-left" : "slide-out-to-right";
    });
    protected readonly leftArrowClass = computed(() => {
        const side = this.isRtl() ? "right" : "left";
        return scrollViewArrowThemeVariants({ hidden: this.previousArrowHidden(), side });
    });
    protected readonly messages = this.#i18n.componentMessages("scrollView", SCROLL_VIEW_DEFAULT_MESSAGES);
    protected readonly nextArrowHidden = computed(() => {
        const count = this.itemCount();
        return !this.arrows() || count <= 1 || !(this.infinite() || this.viewIndex() !== count - 1);
    });
    protected readonly nextArrowRef = viewChild<ElementRef<HTMLButtonElement>>("nextArrow");
    protected readonly pagerArrowClass = computed(() => {
        return scrollViewPagerArrowThemeVariants();
    });
    protected readonly pagerArrowVisible = signal(false);
    protected readonly pagerClass = computed(() => {
        const pagerOverlay = this.pagerOverlay();
        return scrollViewPagerThemeVariants({ pagerOverlay });
    });
    protected readonly pagerElementRef = viewChild<ElementRef<HTMLDivElement>>("pagerElement");
    protected readonly pagerListClass = computed(() => {
        return scrollViewPagerListThemeVariants();
    });
    protected readonly pagerListContainerClass = computed(() => {
        return scrollViewPagerListContainerThemeVariants();
    });
    protected readonly pagerListElementRef = viewChild<ElementRef<HTMLUListElement>>("pagerListElement");
    protected readonly previousArrowHidden = computed(() => {
        return !this.arrows() || this.itemCount() <= 1 || !(this.infinite() || this.viewIndex() !== 0);
    });
    protected readonly previousArrowRef = viewChild<ElementRef<HTMLButtonElement>>("previousArrow");
    protected readonly rightArrowClass = computed(() => {
        const side = this.isRtl() ? "left" : "right";
        return scrollViewArrowThemeVariants({ hidden: this.nextArrowHidden(), side });
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
    protected readonly slideClass = computed(() => {
        return scrollViewSlideThemeVariants();
    });
    protected readonly slideDirective = contentChild(ScrollViewSlideDirective);
    protected readonly slideSize = signal({ height: 0, width: 0 });
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
     * @description Accessible name of the carousel, saying what it shows. Use this or `aria-labelledby`; with neither,
     * the host is a plain group and a warning is logged in development.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description The id of the element that names the carousel.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Shows the previous and next arrows. A swipe is a gesture, so give pointer users arrows or a pager too.
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
     * @description Shows the pager. A swipe is a gesture, so give pointer users arrows or a pager too.
     * @default false
     */
    public readonly pageable = input(false);

    /**
     * @description Sets the background blur of the pager in pixels. It doesn't apply with `pagerOverlay` set to `"none"`.
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
        effect(() => {
            const rawIndex = this.index();
            const count = this.itemCount();
            if (count === 0) {
                return;
            }
            const normalizedIndex = this.#viewIndex();
            if (rawIndex !== normalizedIndex) {
                this.index.set(normalizedIndex);
            }
        });
        this.#directionFromIndex = toSignal(
            toObservable(this.#viewIndex).pipe(
                startWith(0),
                pairwise(),
                map(([prevIndex, index]) => {
                    const intent = this.#navigationIntent;
                    this.#navigationIntent = null;
                    if (intent) {
                        return intent;
                    }
                    const infinite = this.infinite();
                    const totalItems = this.itemCount();
                    // With two slides a wrap and a plain step are the same move, so only an intent can tell them apart.
                    if (infinite && totalItems > 2) {
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
        // A slide is rendered one at a time, so focus inside the one that's leaving would otherwise fall to the body.
        effect(() => {
            this.#viewIndex();
            untracked(() => {
                const content = this.contentElementRef()?.nativeElement;
                if (content?.contains(this.#document.activeElement)) {
                    this.#hostElementRef.nativeElement.focus({ preventScroll: true });
                }
            });
        });
        this.#destroyRef.onDestroy(() => {
            this.#removeSwipeListeners();
            this.#stopContinuousScroll();
            this.#resetPagerScrollState();
            this.#scroll$.complete();
            this.#resizeObserver?.disconnect();
        });
        afterRenderEffect({
            read: onCleanup => {
                const pagerListElementRef = this.pagerListElementRef();
                const pagerElementRef = this.pagerElementRef();
                this.itemCount();

                this.#resizeObserver?.disconnect();
                this.#resizeObserver = null;

                onCleanup(() => {
                    this.#resizeObserver?.disconnect();
                    this.#resizeObserver = null;
                });

                if (!pagerListElementRef || !pagerElementRef) {
                    this.pagerArrowVisible.set(false);
                    this.#resetPagerScrollState();
                    return;
                }

                const element = pagerListElementRef.nativeElement;
                const pagerElement = pagerElementRef.nativeElement;
                if (this.#pagerScrollContext && this.#pagerScrollContext.element !== element) {
                    this.#resetPagerScrollState();
                }

                this.#updatePagerArrowVisibility(element, pagerElement);

                if (typeof ResizeObserver !== "undefined") {
                    this.#resizeObserver = new ResizeObserver(() => {
                        this.#updatePagerArrowVisibility(element, pagerElement);
                        if (this.#pagerScrollContext && this.#pagerScrollContext.element === element) {
                            const currentMaxScroll = Math.max(0, element.scrollWidth - element.clientWidth);
                            if (this.#pagerScrollContext.maxScroll !== currentMaxScroll) {
                                this.#resetPagerScrollState();
                            }
                        }
                    });
                    this.#resizeObserver.observe(element);
                    this.#resizeObserver.observe(pagerElement);
                }
            }
        });
        afterRenderEffect(() => {
            const index = this.#viewIndex();
            const list = this.pagerListElementRef()?.nativeElement;
            this.itemCount();
            untracked(() => {
                if (!list) {
                    this.#pagerCentered = false;
                    return;
                }
                const firstRun = !this.#pagerCentered;
                this.#pagerCentered = true;
                if (!firstRun || index !== 0) {
                    this.#centerActivePage(list, firstRun ? "instant" : this.scrollBehavior());
                }
            });
        });
        afterRenderEffect(() => {
            const previousHidden = this.previousArrowHidden();
            const nextHidden = this.nextArrowHidden();
            untracked(() => {
                const previous = this.previousArrowRef()?.nativeElement;
                const next = this.nextArrowRef()?.nativeElement;
                const active = this.#document.activeElement;
                if (active === previous && previousHidden) {
                    (nextHidden ? this.#hostElementRef.nativeElement : next)?.focus({ preventScroll: true });
                } else if (active === next && nextHidden) {
                    (previousHidden ? this.#hostElementRef.nativeElement : previous)?.focus({ preventScroll: true });
                }
            });
        });
        afterNextRender(() => {
            const content = this.contentElementRef()?.nativeElement;
            if (!content) {
                return;
            }
            const measure = (): void => {
                const { clientHeight: height, clientWidth: width } = content;
                const current = this.slideSize();
                if (current.height !== height || current.width !== width) {
                    this.slideSize.set({ height, width });
                }
            };
            measure();
            if (typeof ResizeObserver !== "undefined") {
                const observer = new ResizeObserver(measure);
                observer.observe(content);
                this.#destroyRef.onDestroy(() => observer.disconnect());
            }
            if (
                isDevMode() &&
                this.itemCount() > 0 &&
                !this.#hostElementRef.nativeElement.hasAttribute("aria-label") &&
                !this.#hostElementRef.nativeElement.hasAttribute("aria-labelledby")
            ) {
                console.warn("mona-scroll-view: a carousel needs a name. Set aria-label or aria-labelledby.");
            }
        });
    }

    protected onArrowClick(direction: ScrollDirection): void {
        this.#navigate(direction);
    }

    protected onKeydown(event: KeyboardEvent): void {
        const count = this.itemCount();
        if (
            count === 0 ||
            event.defaultPrevented ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            this.contentElementRef()?.nativeElement.contains(event.target as Node)
        ) {
            return;
        }
        const isRtl = this.isRtl();
        switch (event.key) {
            case "ArrowLeft":
                this.#navigate(isRtl ? "right" : "left");
                break;
            case "ArrowRight":
                this.#navigate(isRtl ? "left" : "right");
                break;
            case "Home":
                this.index.set(0);
                break;
            case "End":
                this.index.set(count - 1);
                break;
            default:
                return;
        }
        event.preventDefault();
    }

    protected onPageClick(index: number): void {
        this.index.set(index);
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
        const currentTarget = event.currentTarget as HTMLElement | null;
        const target = event.target as HTMLElement | null;
        this.#releasePagerPointerCapture(currentTarget, event.pointerId);
        if (target !== currentTarget) {
            this.#releasePagerPointerCapture(target, event.pointerId);
        }
        const control = (currentTarget ?? target) as HTMLElement | null;
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
        this.#activePagerPointerControl = control;
        this.#continuousTicked = false;

        this.#ensureDocumentPointerListeners();

        interval(60)
            .pipe(takeUntil(this.#scroll$), takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                this.#continuousTicked = true;
                this.#scrollPagerBy(element, direction);
            });
    }

    protected onSwipeStart(event: PointerEvent): void {
        this.#removeSwipeListeners();
        if (
            !event.isPrimary ||
            event.pointerType === "mouse" ||
            event.button !== 0 ||
            this.itemCount() <= 1 ||
            (event.target as Element).closest(SWIPE_EXEMPT_SELECTOR)
        ) {
            return;
        }
        this.#activeSwipe = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
        this.#document.addEventListener("pointerup", this.#swipeEndHandler);
        this.#document.addEventListener("pointercancel", this.#swipeCancelHandler);
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

    #centerActivePage(list: HTMLUListElement, behavior: ScrollBehavior): void {
        this.#resetPagerScrollState();
        const active = list.querySelector("button[data-active-page='true']");
        if (!active || typeof list.scrollTo !== "function") {
            return;
        }
        const listRect = list.getBoundingClientRect();
        const activeRect = active.getBoundingClientRect();
        const offset = activeRect.left + activeRect.width / 2 - (listRect.left + listRect.width / 2);
        // Only the pager list moves, unlike scrollIntoView, which would also scroll the page to the carousel.
        list.scrollTo({ behavior, left: list.scrollLeft + offset });
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

    #endSwipe(event: PointerEvent, completed: boolean): void {
        const swipe = this.#activeSwipe;
        if (swipe?.pointerId !== event.pointerId) {
            return;
        }
        this.#removeSwipeListeners();
        if (!completed) {
            return;
        }
        const deltaX = event.clientX - swipe.startX;
        const deltaY = event.clientY - swipe.startY;
        if (Math.abs(deltaX) < SWIPE_DISTANCE || Math.abs(deltaX) <= Math.abs(deltaY)) {
            return;
        }
        const towardsNext = this.isRtl() ? deltaX > 0 : deltaX < 0;
        this.#navigate(towardsNext ? "right" : "left");
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
                    const isWithinControl = this.#isPointerReleaseWithinControl(event, rejected.control ?? null);

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
        const shouldSuppressTrailingClick =
            isUp &&
            this.#continuousTicked &&
            this.#isPointerReleaseWithinControl(event, this.#activePagerPointerControl);

        if (shouldSuppressTrailingClick) {
            this.#suppressedPagerClickPointerIds.add(event.pointerId);
        } else {
            this.#suppressedPagerClickPointerIds.delete(event.pointerId);
        }
        this.#continuousTicked = false;
        this.#activePagerPointerId = null;
        this.#activePagerPointerControl = null;
        this.#cleanupDocumentPointerListenersIfNeeded();
    }

    #isPointerReleaseWithinControl(event: PointerEvent, control: HTMLElement | null): boolean {
        if (control == null) {
            return true;
        }

        const targetNode = event.target as Node | null;
        return (
            (targetNode != null && control.contains(targetNode)) ||
            (typeof event.composedPath === "function" && event.composedPath().includes(control))
        );
    }

    #navigate(direction: ScrollDirection): void {
        const count = this.itemCount();
        if (count === 0) {
            return;
        }
        const current = this.#viewIndex();
        const step = direction === "left" ? -1 : 1;
        const next = this.infinite() ? (current + step + count) % count : Math.max(0, Math.min(count - 1, current + step));
        if (next !== current) {
            this.#navigationIntent = direction;
            this.index.set(next);
        }
    }

    #releasePagerPointerCapture(control: HTMLElement | null, pointerId: number): void {
        if (
            control == null ||
            typeof control.hasPointerCapture !== "function" ||
            typeof control.releasePointerCapture !== "function"
        ) {
            return;
        }

        try {
            if (control.hasPointerCapture(pointerId)) {
                control.releasePointerCapture(pointerId);
            }
        } catch {
            // Do not let an implementation-specific capture race break pager interaction.
        }
    }

    #removeSwipeListeners(): void {
        this.#activeSwipe = null;
        this.#document.removeEventListener("pointerup", this.#swipeEndHandler);
        this.#document.removeEventListener("pointercancel", this.#swipeCancelHandler);
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
        this.#activePagerPointerControl = null;
        this.#suppressedPagerClickPointerIds.clear();
        this.#rejectedPagerPointers.clear();
    }

    #updatePagerArrowVisibility(list: HTMLUListElement, pager: HTMLElement): void {
        const requiredWidth = list.scrollWidth;
        const arrowFreeAvailableWidth = pager.clientWidth;

        this.pagerArrowVisible.set(requiredWidth > arrowFreeAvailableWidth);
    }
}
