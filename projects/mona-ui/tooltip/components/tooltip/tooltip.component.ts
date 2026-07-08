import { DOCUMENT } from "@angular/common";
import {
    afterRenderEffect,
    Component,
    computed,
    DestroyRef,
    inject,
    input,
    linkedSignal,
    output,
    Renderer2,
    TemplateRef,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { createElementControlId, Position } from "@mirei/mona-ui/common";
import { fadePopupAnimation, PopupAnchor, PopupRef, PopupService } from "@mirei/mona-ui/popup";
import { ThemeService } from "@mirei/mona-ui/theme";
import { fromEvent, Subscription, take, takeUntil } from "rxjs";
import {
    tooltipArrowThemeVariants,
    tooltipBaseThemeVariants,
    TooltipVariantInputs,
    TooltipVariantProps
} from "../../styles/tooltip.styles";
import {
    getArrowPositionFromConnectionPair,
    getOffsetForPosition,
    getPositionConnectionPoints
} from "../../utils/tooltip.utils";

@Component({
    selector: "mona-tooltip",
    templateUrl: "./tooltip.component.html",
    styles: [
        `
            :host {
                display: contents;
            }
        `
    ]
})
export class TooltipComponent implements TooltipVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #popupService = inject(PopupService);
    readonly #renderer = inject(Renderer2);
    readonly #themeService = inject(ThemeService);
    #currentAnchor: HTMLElement | null = null;
    #eventSubscription: Subscription | null = null;
    #hideTimeoutId: ReturnType<typeof setTimeout> | null = null;
    #mutationObserver: MutationObserver | null = null;
    #popupRef: PopupRef | null = null;
    #showTimeoutId: ReturnType<typeof setTimeout> | null = null;
    protected readonly arrowClasses = computed(() => {
        const theme = this.#themeService.theme();
        return tooltipArrowThemeVariants(theme)();
    });
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return tooltipBaseThemeVariants(theme)({ rounded });
    });
    protected readonly currentArrowPosition = linkedSignal(() => this.position());
    protected readonly templateRef = viewChild.required(TemplateRef);
    protected readonly tooltipId = createElementControlId();

    /**
     * @description Whether the tooltip is disabled. When disabled, the tooltip will not be shown.
     */
    public readonly disabled = input<boolean>(false);

    /**
     * @description Emitted when the tooltip popup is hidden.
     */
    public readonly hidden = output<void>();

    /**
     * @description The delay in milliseconds before hiding the tooltip after the trigger event ends.
     */
    public readonly hideDelay = input<number>(0);

    /**
     * @description The position of the tooltip relative to the target element.
     */
    public readonly position = input<Position>("top");

    /**
     * @description The border radius of the tooltip.
     */
    public readonly rounded = input<TooltipVariantProps["rounded"]>("medium");

    /**
     * @description The delay in milliseconds before showing the tooltip after the trigger event.
     */
    public readonly showDelay = input<number>(0);

    /**
     * @description Emitted when the tooltip popup is shown.
     */
    public readonly shown = output<void>();

    /**
     * @description The target element(s) to which the tooltip is attached.
     * Can be an Element, ElementRef, or CSS selector string.
     */
    public readonly target = input.required<PopupAnchor>();

    public constructor() {
        afterRenderEffect({
            read: () => {
                this.target();
                this.position(); // reactive dependency: re-run when position changes

                this.#currentAnchor = null;
                this.#popupRef?.close();
                this.#refreshSubscription();

                this.#mutationObserver?.disconnect();
                this.#mutationObserver = null;
                if (typeof this.target() === "string") {
                    this.#mutationObserver = new MutationObserver(() => this.#refreshSubscription());
                    this.#mutationObserver.observe(this.#document.body, { childList: true, subtree: true });
                }
            }
        });
        this.#destroyRef.onDestroy(() => {
            if (this.#showTimeoutId != null) {
                clearTimeout(this.#showTimeoutId);
                this.#showTimeoutId = null;
            }
            if (this.#hideTimeoutId != null) {
                clearTimeout(this.#hideTimeoutId);
                this.#hideTimeoutId = null;
            }
            this.#mutationObserver?.disconnect();
            this.#mutationObserver = null;
            this.#popupRef?.close();
        });
    }

    #createTooltip(anchor: HTMLElement): void {
        this.#currentAnchor = anchor;
        this.currentArrowPosition.set(this.position());
        const connectionPoints = getPositionConnectionPoints(this.position());
        const offset = getOffsetForPosition(this.position(), true);

        const popupRef = this.#popupService.create({
            anchor,
            anchorConnectionPoint: connectionPoints.anchor,
            animation: fadePopupAnimation,
            closeOnEscape: true,
            closeOnMouseLeave: false,
            closeOnOutsideClick: true,
            content: this.templateRef(),
            hasBackdrop: false,
            offset,
            popupConnectionPoint: connectionPoints.popup,
            restoreFocus: false,
            withPush: false
        });
        this.#popupRef = popupRef;

        this.#renderer.setAttribute(anchor, "aria-describedby", this.tooltipId);

        popupRef.opened.pipe(take(1)).subscribe(() => this.shown.emit());

        popupRef.closed.pipe(take(1)).subscribe(() => {
            if (this.#popupRef === popupRef) {
                this.#popupRef = null;
                this.#currentAnchor = null;
            }
            this.#renderer.removeAttribute(anchor, "aria-describedby");
            this.hidden.emit();
        });

        popupRef.positionChanges
            .pipe(takeUntil(popupRef.closed), takeUntilDestroyed(this.#destroyRef))
            .subscribe(connectionPair => {
                const newArrowPosition = getArrowPositionFromConnectionPair(connectionPair);
                this.currentArrowPosition.set(newArrowPosition);
            });
    }

    #getAnchorElement(anchor: PopupAnchor): HTMLElement | null {
        if (anchor instanceof HTMLElement) {
            return anchor;
        }
        if (typeof anchor === "object" && "nativeElement" in anchor && anchor.nativeElement instanceof HTMLElement) {
            return anchor.nativeElement;
        }
        return null;
    }

    #handleHide(): void {
        if (!this.#popupRef) {
            return;
        }
        const hideDelay = this.hideDelay();
        if (hideDelay > 0) {
            const popupRef = this.#popupRef;
            this.#hideTimeoutId = setTimeout(() => {
                this.#hideTimeoutId = null;
                if (this.#popupRef === popupRef) {
                    popupRef.close();
                }
            }, hideDelay);
        } else {
            this.#popupRef.close();
        }
    }

    #handleShow(element: HTMLElement): void {
        if (this.disabled()) {
            return;
        }
        if (this.#popupRef && this.#currentAnchor === element) {
            return;
        }
        this.#popupRef?.close();
        const showDelay = this.showDelay();
        if (showDelay > 0) {
            this.#showTimeoutId = setTimeout(() => {
                this.#showTimeoutId = null;
                if (!this.#popupRef || this.#currentAnchor !== element) {
                    this.#createTooltip(element);
                }
            }, showDelay);
        } else {
            this.#createTooltip(element);
        }
    }

    #refreshSubscription(): void {
        this.#eventSubscription?.unsubscribe();
        this.#eventSubscription = null;

        const target = this.target();
        if (typeof target === "string") {
            const elements = Array.from(this.#document.querySelectorAll<HTMLElement>(target));
            const composite = new Subscription();
            for (const element of elements) {
                composite.add(this.#subscribeToElement(element));
            }
            this.#eventSubscription = composite;
        } else {
            const element = this.#getAnchorElement(target);
            if (element) {
                this.#eventSubscription = this.#subscribeToElement(element);
            }
        }
    }

    #subscribeToElement(element: HTMLElement): Subscription {
        const composite = new Subscription();

        composite.add(
            fromEvent<PointerEvent>(element, "pointerenter")
                .pipe(takeUntilDestroyed(this.#destroyRef))
                .subscribe(() => this.#handleShow(element))
        );

        composite.add(
            fromEvent<PointerEvent>(element, "pointerleave")
                .pipe(takeUntilDestroyed(this.#destroyRef))
                .subscribe(() => this.#handleHide())
        );

        composite.add(
            fromEvent<FocusEvent>(element, "focusin")
                .pipe(takeUntilDestroyed(this.#destroyRef))
                .subscribe(() => this.#handleShow(element))
        );

        composite.add(
            fromEvent<FocusEvent>(element, "focusout")
                .pipe(takeUntilDestroyed(this.#destroyRef))
                .subscribe(() => this.#handleHide())
        );

        return composite;
    }
}
