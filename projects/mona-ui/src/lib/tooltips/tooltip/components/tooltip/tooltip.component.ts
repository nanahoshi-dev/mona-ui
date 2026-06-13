import {
    afterRenderEffect,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    inject,
    input,
    linkedSignal,
    Renderer2,
    TemplateRef,
    viewChild
} from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { delay, fromEvent, merge, Subscription, take, takeUntil } from "rxjs";
import { Position } from "../../../../models/Position";
import { fadePopupAnimation } from "../../../../popup/models/PopupAnimationClasses";
import { PopupRef } from "../../../../popup/models/PopupRef";
import { PopupAnchor } from "../../../../popup/models/PopupSettings";
import { PopupService } from "../../../../popup/services/popup.service";
import { ThemeService } from "../../../../theme/services/theme.service";
import { createElementControlId } from "../../../../utils/createElementControlId";
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
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipComponent implements TooltipVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #popupService = inject(PopupService);
    readonly #renderer = inject(Renderer2);
    readonly #themeService = inject(ThemeService);
    #currentAnchor: HTMLElement | null = null;
    #eventSubscription: Subscription | null = null;
    #popupRef: PopupRef | null = null;
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
     * @description The delay in milliseconds before showing the tooltip after the trigger event.
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
     * @description The target element(s) to which the tooltip is attached.
     * Can be an Element, ElementRef, or CSS selector string.
     */
    public readonly target = input.required<PopupAnchor>();

    public constructor() {
        afterRenderEffect({
            read: () => {
                const target = this.target();
                this.position(); // reactive dependency: re-run when position changes

                this.#eventSubscription?.unsubscribe();
                this.#eventSubscription = null;
                this.#currentAnchor = null;
                this.#popupRef?.close();

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

        popupRef.closed.pipe(take(1)).subscribe(() => {
            if (this.#popupRef === popupRef) {
                this.#popupRef = null;
                this.#currentAnchor = null;
            }
            this.#renderer.removeAttribute(anchor, "aria-describedby");
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
            setTimeout(() => {
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
            setTimeout(() => {
                if (!this.#popupRef || this.#currentAnchor !== element) {
                    this.#createTooltip(element);
                }
            }, showDelay);
        } else {
            this.#createTooltip(element);
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
