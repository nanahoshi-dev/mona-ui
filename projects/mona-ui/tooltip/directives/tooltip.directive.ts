import {
    afterRenderEffect,
    ChangeDetectionStrategy,
    Component,
    ComponentRef,
    computed,
    createComponent,
    DestroyRef,
    Directive,
    ElementRef,
    EnvironmentInjector,
    inject,
    input,
    linkedSignal,
    output,
    Renderer2,
    signal,
    TemplateRef,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { createElementControlId, Position } from "@mirei/mona-ui/common";
import { fadePopupAnimation, PopupRef, PopupService } from "@mirei/mona-ui/popup";
import { ThemeService } from "@mirei/mona-ui/theme";
import { fromEvent, Subscription, take, takeUntil, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import {
    tooltipArrowThemeVariants,
    tooltipBaseThemeVariants,
    TooltipVariantInputs,
    TooltipVariantProps
} from "../styles/tooltip.styles";
import {
    getArrowPositionFromConnectionPair,
    getOffsetForPosition,
    getPositionConnectionPoints
} from "../utils/tooltip.utils";

@Directive({
    selector: "[monaTooltip]",
    host: {
        "[attr.data-mona-title]": "originalTitle()"
    }
})
export class TooltipDirective implements TooltipVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #host = inject(ElementRef<HTMLElement>);
    readonly #injector = inject(EnvironmentInjector);
    readonly #popupService = inject(PopupService);
    readonly #renderer = inject(Renderer2);
    #currentAnchor: HTMLElement | null = null;
    #hideTimeoutId: ReturnType<typeof setTimeout> | null = null;
    #mutationObserver: MutationObserver | null = null;
    #popupRef: PopupRef | null = null;
    #showTimeoutId: ReturnType<typeof setTimeout> | null = null;
    #subscription: Subscription | null = null;
    #tooltipId = createElementControlId();
    protected readonly originalTitle = signal("");

    /**
     * @description Whether the tooltip is disabled. When disabled, the tooltip will not be shown.
     * @default false
     */
    public readonly disabled = input<boolean>(false);

    /**
     * @description The filter to select elements that will have tooltips.
     * It can be a CSS selector that matches elements within the host element.
     * Only applies when `mode` is set to `content`.
     * @default "[title]"
     */
    public readonly filter = input<string>("[title]");

    /**
     * @description The delay in milliseconds before hiding the tooltip.
     * @default 0
     */
    public readonly hideDelay = input<number>(0);

    /**
     * @description The mode of the tooltip.
     * "host" mode receives the tooltip from the host element's title attribute.
     * "content" mode uses the title attribute of elements matching the filter.
     * @default "host"
     */
    public readonly mode = input<"host" | "content">("host");

    /**
     * @description The position of the tooltip relative to the target element.
     * @default "top"
     */
    public readonly position = input<Position>("top");

    /**
     * @description The border radius of the tooltip.
     * @default "medium"
     */
    public readonly rounded = input<TooltipVariantProps["rounded"]>("medium", {
        alias: "tooltipRounded"
    });

    /**
     * @description The delay in milliseconds before showing the tooltip after the trigger event.
     * @default 0
     */
    public readonly showDelay = input<number>(0);

    /**
     * @description Emitted when the tooltip popup is hidden.
     */
    public readonly hidden = output<void>();

    /**
     * @description Emitted when the tooltip popup is shown.
     */
    public readonly shown = output<void>();

    public constructor() {
        afterRenderEffect({
            read: () => {
                this.mode();
                this.position();
                this.#currentAnchor = null;
                this.#popupRef?.close();
                this.#refreshSubscription();
                this.#mutationObserver?.disconnect();
                this.#mutationObserver = null;
                if (this.mode() === "content") {
                    this.#mutationObserver = new MutationObserver(() => this.#refreshSubscription());
                    this.#mutationObserver.observe(this.#host.nativeElement, { childList: true, subtree: true });
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

    #createTooltip(text: string, anchor: HTMLElement): void {
        this.#currentAnchor = anchor;
        const component = this.#createTooltipTemplate(text);
        if (!component) {
            return;
        }

        const connectionPoints = getPositionConnectionPoints(this.position());
        const offset = getOffsetForPosition(this.position(), true);
        const popupRef = this.#popupService.create({
            anchor,
            anchorConnectionPoint: connectionPoints.anchor,
            animation: fadePopupAnimation,
            closeOnEscape: true,
            closeOnMouseLeave: false,
            closeOnOutsideClick: true,
            content: component.instance.templateRef(),
            hasBackdrop: false,
            popupConnectionPoint: connectionPoints.popup,
            offset,
            restoreFocus: false,
            withPush: false
        });
        this.#popupRef = popupRef;

        this.#renderer.setAttribute(anchor, "aria-describedby", this.#tooltipId);

        popupRef.opened.pipe(take(1)).subscribe(() => this.shown.emit());

        popupRef.positionChanges
            .pipe(takeUntil(popupRef.closed), takeUntilDestroyed(this.#destroyRef))
            .subscribe(connectionPair => {
                const newArrowPosition = getArrowPositionFromConnectionPair(connectionPair);
                component.instance.currentArrowPosition.set(newArrowPosition);
            });
        popupRef.closed.pipe(take(1)).subscribe(() => {
            if (this.#popupRef === popupRef) {
                this.#popupRef = null;
                this.#currentAnchor = null;
            }
            this.#renderer.removeAttribute(anchor, "aria-describedby");
            this.#renderer.setAttribute(anchor, "title", text);
            component.destroy();
            this.hidden.emit();
        });
    }

    #createTooltipTemplate(text: string): ComponentRef<TooltipTemplateComponent> | null {
        if (!text) {
            return null;
        }
        const component = createComponent(TooltipTemplateComponent, {
            environmentInjector: this.#injector
        });
        component.setInput("content", text);
        component.setInput("position", this.position());
        component.setInput("rounded", this.rounded());
        component.setInput("tooltipId", this.#tooltipId);
        return component;
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

    #handleShow(targetElement: HTMLElement): void {
        if (this.disabled()) {
            return;
        }
        if (this.#popupRef && this.#currentAnchor === targetElement) {
            return;
        }
        this.#popupRef?.close();
        const title = targetElement.getAttribute("title") || "";
        this.#renderer.removeAttribute(targetElement, "title");
        if (this.mode() === "host") {
            this.originalTitle.set(title);
        }
        if (title) {
            const showDelay = this.showDelay();
            if (showDelay > 0) {
                this.#showTimeoutId = setTimeout(() => {
                    this.#showTimeoutId = null;
                    if (!this.#popupRef || this.#currentAnchor !== targetElement) {
                        this.#createTooltip(title, targetElement);
                    }
                }, showDelay);
            } else {
                this.#createTooltip(title, targetElement);
            }
        }
    }

    #refreshSubscription(): void {
        if (this.#subscription) {
            this.#subscription.unsubscribe();
            this.#subscription = null;
        }
        this.#setSubscription();
    }

    #setSubscription(): void {
        const composite = new Subscription();
        let elements: HTMLElement[];
        if (this.mode() === "host") {
            elements = [this.#host.nativeElement];
        } else {
            elements = Array.from(this.#host.nativeElement.querySelectorAll(this.filter()) as NodeListOf<HTMLElement>);
        }

        composite.add(
            fromEvent<PointerEvent>(elements, "pointerenter")
                .pipe(
                    tap(event => {
                        const targetElement = event.currentTarget as HTMLElement;
                        this.#handleShow(targetElement);
                    }),
                    takeUntilDestroyed(this.#destroyRef)
                )
                .subscribe()
        );

        composite.add(
            fromEvent<PointerEvent>(elements, "pointerleave")
                .pipe(
                    tap(() => this.#handleHide()),
                    takeUntilDestroyed(this.#destroyRef)
                )
                .subscribe()
        );

        composite.add(
            fromEvent<FocusEvent>(elements, "focusin")
                .pipe(
                    tap(event => {
                        const targetElement = event.currentTarget as HTMLElement;
                        this.#handleShow(targetElement);
                    }),
                    takeUntilDestroyed(this.#destroyRef)
                )
                .subscribe()
        );

        composite.add(
            fromEvent<FocusEvent>(elements, "focusout")
                .pipe(
                    tap(() => this.#handleHide()),
                    takeUntilDestroyed(this.#destroyRef)
                )
                .subscribe()
        );

        this.#subscription = composite;
    }
}

@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <ng-template>
            <div role="tooltip" [id]="tooltipId()" [class]="baseClasses()">
                <div>
                    {{ content() }}
                </div>
                <div [class]="arrowClasses()" [attr.data-position]="currentArrowPosition()"></div>
            </div>
        </ng-template>
    `
})
class TooltipTemplateComponent {
    readonly #themeService = inject(ThemeService);
    protected readonly arrowClasses = computed(() => {
        const theme = this.#themeService.theme();
        return tooltipArrowThemeVariants(theme)();
    });
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const userClasses = `p-2`;
        const variants = tooltipBaseThemeVariants(theme)({ rounded });
        return twMerge(variants, userClasses);
    });
    public readonly currentArrowPosition = linkedSignal(() => this.position());

    /**
     * @description The text content displayed in the tooltip.
     */
    public readonly content = input.required<string>();

    /**
     * @description The position of the tooltip relative to the target element.
     */
    public readonly position = input<Position>("top");

    /**
     * @description The border radius of the tooltip.
     */
    public readonly rounded = input<TooltipVariantProps["rounded"]>("medium");

    /**
     * @description The unique id for the tooltip element, used for aria-describedby linkage.
     */
    public readonly tooltipId = input<string>("");

    public readonly templateRef = viewChild.required(TemplateRef);
}
