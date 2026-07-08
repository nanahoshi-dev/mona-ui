import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    output,
    Renderer2,
    TemplateRef,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter, fromEvent, Subscription, take, takeUntil, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { v4 } from "uuid";
import { Position } from "../../../../models/Position";
import { fadePopupAnimation } from "@mirei/mona-ui/popup";
import { PopupRef } from "@mirei/mona-ui/popup";
import { PopupService } from "@mirei/mona-ui/popup";
import { ThemeService } from "@mirei/mona-ui/theme";
import { getOffsetForPosition, getPositionConnectionPoints } from "../../../tooltip/utils/tooltip.utils";
import { PopoverFooterTemplateDirective } from "../../directives/popover-footer-template.directive";
import { PopoverTitleTemplateDirective } from "../../directives/popover-title-template.directive";
import { PopoverHideEvent } from "../../models/PopoverHideEvent";
import { PopoverShowEvent } from "../../models/PopoverShowEvent";
import { PopoverShownEvent } from "../../models/PopoverShownEvent";
import { PopoverTrigger } from "../../models/PopoverTrigger";
import {
    popoverArrowThemeVariants,
    popoverBaseThemeVariants,
    popoverContentThemeVariants,
    popoverHeaderThemeVariants,
    PopoverVariantInputs,
    PopoverVariantProps
} from "../../styles/popover.styles";

@Component({
    selector: "mona-popover",
    templateUrl: "./popover.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: "monaPopover",
    imports: [NgTemplateOutlet]
})
export class PopoverComponent implements PopoverVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #popupService = inject(PopupService);
    readonly #renderer = inject(Renderer2);
    readonly #themeService = inject(ThemeService);
    #subscription: Subscription | null = null;
    protected readonly arrowClasses = computed(() => {
        const theme = this.#themeService.theme();
        return popoverArrowThemeVariants(theme)();
    });
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return popoverBaseThemeVariants(theme)({ rounded });
    });
    protected readonly contentClasses = computed(() => {
        const theme = this.#themeService.theme();
        return popoverContentThemeVariants(theme)();
    });
    protected readonly currentArrowPosition = computed(() => this.position());
    protected readonly footerTemplateRef = contentChild(PopoverFooterTemplateDirective, { read: TemplateRef });
    protected readonly headerClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const hasTemplate = !!this.titleTemplateRef();
        const padding = hasTemplate ? "p-0" : "p-2";
        const variants = popoverHeaderThemeVariants(theme)({ rounded });
        return twMerge(variants, padding);
    });
    protected readonly headerId = computed(() =>
        this.title() || this.titleTemplateRef() ? `${this.uid}-title` : null
    );
    protected readonly titleTemplateRef = contentChild(PopoverTitleTemplateDirective, { read: TemplateRef });
    protected readonly templateRef = viewChild.required(TemplateRef);
    protected readonly uid = v4();
    protected popupRef: PopupRef | null = null;

    /**
     * @description Display the arrow of the popover.
     */
    public readonly displayArrow = input(false);

    /**
     * @description Emits when the popover is about to be closed.
     * This event is preventable.
     */
    public readonly hide = output<PopoverHideEvent>();

    /**
     * @description Emits when the popover is hidden.
     */
    public readonly hidden = output();

    /**
     * @description The position of the popover relative to the target element.
     */
    public readonly position = input<Position>("top");

    /**
     * @description The border radius of the popover.
     */
    public readonly rounded = input<PopoverVariantProps["rounded"]>("medium");

    /**
     * @description Emits when the popover is about to be shown.
     * This event is preventable.
     */
    public readonly show = output<PopoverShowEvent>();

    /**
     * @description Emits when the popover is shown.
     */
    public readonly shown = output<PopoverShownEvent>();

    /**
     * @description The target element or ElementRef to which the popover is attached.
     */
    public readonly target = input.required<Element | ElementRef>();

    /**
     * @description The title of the popover.
     */
    public readonly title = input("");

    /**
     * @description The trigger that opens/closes the popover.
     * "click" toggles on click, "hover" opens on pointer enter and closes on
     * pointer leave, "none" disables automatic triggering (use `open()`/`close()`
     * instead). Any other DOM event name is also accepted and used as-is.
     */
    public readonly trigger = input<PopoverTrigger>("click");

    public constructor() {
        effect(() => {
            if (this.#subscription) {
                this.#subscription.unsubscribe();
                this.#subscription = null;
            }
            this.#setSubscriptions();
        });
    }

    public close(): void {
        if (this.popupRef) {
            this.popupRef.close();
        }
    }

    public open(): void {
        if (this.popupRef) {
            return;
        }
        this.#createPopover();
    }

    #createPopover(): void {
        const position = this.position();
        const connectionPoints = getPositionConnectionPoints(position);
        const offset = getOffsetForPosition(position, this.displayArrow());
        const anchor = this.target();
        const content = this.templateRef();
        const targetElement = this.#popoverTargetElement;

        this.popupRef = this.#popupService.create({
            anchor,
            anchorConnectionPoint: connectionPoints.anchor,
            animation: fadePopupAnimation,
            closeOnMouseLeave: this.trigger() === "hover",
            closeOnOutsideClick: true,
            content,
            hasBackdrop: false,
            offset,
            popupConnectionPoint: connectionPoints.popup,
            withPush: true
        });
        this.#renderer.setAttribute(targetElement, "aria-haspopup", "dialog");
        this.#renderer.setAttribute(targetElement, "aria-controls", this.uid);
        this.#renderer.setAttribute(targetElement, "aria-expanded", "true");
        this.popupRef.beforeClose.pipe(takeUntil(this.popupRef.closed)).subscribe(event => {
            const hideEvent = new PopoverHideEvent(this.#popoverTargetElement, this.popupRef as PopupRef);
            this.hide.emit(hideEvent);
            if (hideEvent.isDefaultPrevented()) {
                event.preventDefault();
                return;
            }
        });
        this.popupRef.closed.pipe(take(1)).subscribe(() => {
            this.popupRef = null;
            this.#renderer.setAttribute(targetElement, "aria-expanded", "false");
            this.hidden.emit();
        });
    }

    #openViaTrigger(): void {
        const showEvent = new PopoverShowEvent(this.#popoverTargetElement);
        this.show.emit(showEvent);
        if (showEvent.isDefaultPrevented()) {
            return;
        }
        this.#createPopover();
        if (this.popupRef) {
            const shownEvent = new PopoverShownEvent(this.#popoverTargetElement, this.popupRef);
            this.shown.emit(shownEvent);
        }
    }

    #setSubscriptions(): void {
        const trigger = this.trigger();
        if (trigger === "none") {
            return;
        }

        if (trigger === "hover") {
            this.#subscription = fromEvent<PointerEvent>(this.#popoverTargetElement, "pointerenter")
                .pipe(
                    filter(() => !this.popupRef),
                    tap(() => this.#openViaTrigger()),
                    takeUntilDestroyed(this.#destroyRef)
                )
                .subscribe();
            return;
        }

        this.#subscription = fromEvent<Event>(this.#popoverTargetElement, trigger)
            .pipe(
                tap(event => event.preventDefault()),
                filter(() => {
                    if (this.popupRef) {
                        this.close();
                        return false;
                    }
                    return true;
                }),
                tap(() => this.#openViaTrigger()),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe();
    }

    get #popoverTargetElement(): HTMLElement {
        const target = this.target();
        return target instanceof ElementRef ? target.nativeElement : (target as HTMLElement);
    }
}
