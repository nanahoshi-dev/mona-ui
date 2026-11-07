import { Directionality } from "@angular/cdk/bidi";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    afterRenderEffect,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    isDevMode,
    output,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { resolveComponentDirection } from "@nanahoshi/mona-ui/i18n";
import {
    createElementControlId,
    HoverIntent,
    listenForHover,
    overlaySidePositions,
    type PhysicalOverlaySide,
    resolveOverlaySide,
    sideOfPosition
} from "@nanahoshi/mona-ui/internal";
import { fadePopupAnimation, PopupCloseSource, type PopupRef, PopupService } from "@nanahoshi/mona-ui/popup";
import { take, takeUntil } from "rxjs";
import { twMerge } from "tailwind-merge";
import { PopoverFooterTemplateDirective } from "../../directives/popover-footer-template.directive";
import { PopoverTitleTemplateDirective } from "../../directives/popover-title-template.directive";
import { PopoverHideEvent } from "../../models/PopoverHideEvent";
import type { PopoverPosition } from "../../models/PopoverPosition";
import { PopoverShowEvent } from "../../models/PopoverShowEvent";
import { PopoverShownEvent } from "../../models/PopoverShownEvent";
import type { PopoverTrigger } from "../../models/PopoverTrigger";
import {
    popoverArrowThemeVariants,
    popoverBaseThemeVariants,
    popoverContentThemeVariants,
    popoverHeaderThemeVariants,
    type PopoverVariantInputs,
    type PopoverVariantProps
} from "../../styles/popover.styles";

/** Elements that can take focus with Tab, for moving focus into the popover when it opens. */
const TABBABLE = [
    "a[href]",
    "area[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "iframe",
    "[contenteditable]:not([contenteditable='false'])",
    "[tabindex]:not([tabindex='-1'])"
].join(", ");

@Component({
    selector: "mona-popover",
    templateUrl: "./popover.component.html",
    exportAs: "monaPopover",
    imports: [NgTemplateOutlet]
})
export class PopoverComponent implements PopoverVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #directionality = inject(Directionality, { optional: true });
    readonly #injector = inject(Injector);
    readonly #intent = new HoverIntent({
        hide: () => this.close(),
        hideDelay: () => 0,
        show: () => this.#openViaTrigger(),
        showDelay: () => 0
    });
    readonly #popupService = inject(PopupService);
    /** The element that carries the popover's `aria-*` attributes. */
    #ariaTarget: Element | null = null;
    #destroyed = false;
    #popupRef: PopupRef | null = null;
    protected readonly arrowClasses = computed(() => {
        return popoverArrowThemeVariants();
    });
    protected readonly baseClasses = computed(() => {
        const rounded = this.rounded();
        return popoverBaseThemeVariants({ rounded });
    });
    protected readonly contentClasses = computed(() => {
        return popoverContentThemeVariants();
    });
    protected readonly currentArrowPosition = signal<PhysicalOverlaySide>("top");
    protected readonly footerTemplateRef = contentChild(PopoverFooterTemplateDirective, { read: TemplateRef });
    protected readonly hasTitle = computed(() => !!this.title() || !!this.titleTemplateRef());
    protected readonly headerClasses = computed(() => {
        const rounded = this.rounded();
        const hasTemplate = !!this.titleTemplateRef();
        const padding = hasTemplate ? "p-0" : "p-2";
        const variants = popoverHeaderThemeVariants({ rounded });
        return twMerge(variants, padding);
    });
    protected readonly headerId = computed(() => (this.hasTitle() ? `${this.uid}-title` : null));
    protected readonly templateRef = viewChild.required(TemplateRef);
    protected readonly titleTemplateRef = contentChild(PopoverTitleTemplateDirective, { read: TemplateRef });
    protected readonly uid = createElementControlId();

    /**
     * @description Accessible name for the popover when it has no `title` or title template.
     */
    public readonly ariaLabel = input<string>();

    /**
     * @description Whether focus moves into the popover when it opens: to its first focusable element, or to the
     * popover itself. Defaults to `true`, except for the `hover` trigger.
     */
    public readonly autoFocus = input<boolean | undefined>(undefined);

    /**
     * @description Whether pressing Escape closes the popover.
     * @default true
     */
    public readonly closeOnEscape = input(true);

    /**
     * @description Whether a click outside the popover and its target closes it.
     * @default true
     */
    public readonly closeOnOutsideClick = input(true);

    /**
     * @description Display the arrow of the popover.
     */
    public readonly displayArrow = input(false);

    /**
     * @description Emits when the popover is hidden.
     */
    public readonly hidden = output();

    /**
     * @description Emits when the popover is about to be closed.
     * This event is preventable.
     */
    public readonly hide = output<PopoverHideEvent>();

    /**
     * @description The side of the target the popover opens on. `left` and `right` are physical; `start` and `end`
     * follow the text direction. It flips to the opposite side when there isn't room.
     */
    public readonly position = input<PopoverPosition>("top");

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
     * @description Emits once the popover has opened.
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
     * "click" toggles on click, "hover" opens while the pointer is on the target or the popover, or focus is on the
     * target, "none" disables automatic triggering (use `open()`/`close()` instead). Any other DOM event name is
     * also accepted and used as-is.
     */
    public readonly trigger = input<PopoverTrigger>("click");

    public constructor() {
        // The target says it opens a dialog from the start, and forgets it when it changes or the popover goes.
        // After render, so the target's own host bindings (a monaButton's aria-haspopup) have run and don't undo it.
        afterRenderEffect(onCleanup => {
            const element = this.#elementOf(this.target());
            untracked(() => {
                this.#ariaTarget = element;
                element.setAttribute("aria-haspopup", "dialog");
                element.setAttribute("aria-expanded", this.#popupRef ? "true" : "false");
            });
            onCleanup(() => {
                this.close();
                if (this.#ariaTarget === element) {
                    this.#ariaTarget = null;
                }
                element.removeAttribute("aria-haspopup");
                element.removeAttribute("aria-expanded");
                element.removeAttribute("aria-controls");
            });
        });
        effect(onCleanup => {
            const element = this.#elementOf(this.target());
            const trigger = this.trigger();
            const stop = untracked(() => this.#listen(element, trigger));
            onCleanup(() => {
                stop();
                this.#intent.dispose();
            });
        });
        this.#destroyRef.onDestroy(() => {
            // Outputs can't emit once the component is destroyed, so this close is silent and can't be prevented.
            this.#destroyed = true;
            this.close();
        });
    }

    /**
     * Closes the popover if one is currently open. Emits `hide` and respects `preventDefault()` — if canceled, the
     * popup stays open and the component's internal state remains consistent with that.
     */
    public close(): void {
        this.#popupRef?.close();
    }

    /** Opens the popover directly. No-op if it is already open. Does not emit `show`; emits `shown` once open. */
    public open(): void {
        if (this.#popupRef) {
            return;
        }
        this.#createPopover();
    }

    #createPopover(): void {
        const targetElement = this.#elementOf(this.target());
        const direction = resolveComponentDirection(targetElement as HTMLElement, this.#directionality);
        const side = resolveOverlaySide(this.position(), direction);
        const gap = this.displayArrow() ? 12 : 4;
        this.currentArrowPosition.set(side);

        const popupRef = this.#popupService.create({
            anchor: targetElement as HTMLElement,
            animation: fadePopupAnimation,
            closeOnEscape: this.closeOnEscape(),
            closeOnMouseLeave: false,
            closeOnOutsideClick: this.closeOnOutsideClick(),
            content: this.templateRef(),
            hasBackdrop: false,
            positions: overlaySidePositions(side, gap, direction),
            withPush: true
        });
        this.#popupRef = popupRef;
        targetElement.setAttribute("aria-controls", this.uid);
        targetElement.setAttribute("aria-expanded", "true");
        if (this.trigger() === "hover") {
            this.#intent.opened(targetElement as HTMLElement, popupRef.overlayRef.overlayElement);
        }

        popupRef.positionChanges.pipe(takeUntil(popupRef.closeStart)).subscribe(position => {
            this.currentArrowPosition.set(sideOfPosition(position, direction));
        });
        popupRef.beforeClose.pipe(takeUntil(popupRef.closed)).subscribe(event => {
            if (this.#destroyed) {
                return;
            }
            const hideEvent = new PopoverHideEvent(targetElement, popupRef);
            this.hide.emit(hideEvent);
            if (hideEvent.isDefaultPrevented()) {
                event.preventDefault();
            }
        });
        popupRef.opened.pipe(take(1)).subscribe(() => {
            if (!this.#destroyed) {
                this.shown.emit(new PopoverShownEvent(targetElement, popupRef));
            }
        });
        popupRef.closeStart.pipe(take(1)).subscribe(event => {
            this.#intent.closed(targetElement as HTMLElement, event.via === PopupCloseSource.Escape);
        });
        popupRef.closed.pipe(take(1)).subscribe(() => {
            if (this.#popupRef === popupRef) {
                this.#popupRef = null;
            }
            targetElement.removeAttribute("aria-controls");
            if (this.#ariaTarget === targetElement) {
                targetElement.setAttribute("aria-expanded", "false");
            }
            if (!this.#destroyed) {
                this.hidden.emit();
            }
        });

        afterNextRender(
            {
                write: () => {
                    const panel = popupRef.overlayRef.overlayElement.querySelector<HTMLElement>('[role="dialog"]');
                    if (!panel || this.#popupRef !== popupRef) {
                        return;
                    }
                    if (isDevMode() && !this.hasTitle() && !this.ariaLabel()) {
                        console.warn(
                            "[Mona Popover] A popover needs an accessible name. Set title, a title template or ariaLabel.",
                            panel
                        );
                    }
                    if (this.autoFocus() ?? this.trigger() !== "hover") {
                        const first = panel.querySelector<HTMLElement>(TABBABLE);
                        (first ?? panel).focus({ preventScroll: true });
                    }
                }
            },
            { injector: this.#injector }
        );
    }

    #elementOf(target: Element | ElementRef): Element {
        return target instanceof ElementRef ? (target.nativeElement as Element) : target;
    }

    #listen(element: Element, trigger: PopoverTrigger): () => void {
        if (trigger === "none") {
            return () => undefined;
        }
        if (trigger === "hover") {
            return element instanceof HTMLElement
                ? listenForHover(element, node => (element.contains(node) ? element : null), this.#intent)
                : () => undefined;
        }
        const handler = (event: Event) => {
            // The browser's own menu would cover a popover opened from it; other events keep their default action.
            if (trigger === "contextmenu") {
                event.preventDefault();
            }
            if (this.#popupRef) {
                this.close();
            } else {
                this.#openViaTrigger();
            }
        };
        element.addEventListener(trigger, handler);
        return () => element.removeEventListener(trigger, handler);
    }

    #openViaTrigger(): void {
        if (this.#popupRef || this.#destroyed) {
            return;
        }
        const showEvent = new PopoverShowEvent(this.#elementOf(this.target()));
        this.show.emit(showEvent);
        if (showEvent.isDefaultPrevented()) {
            return;
        }
        this.#createPopover();
    }
}
