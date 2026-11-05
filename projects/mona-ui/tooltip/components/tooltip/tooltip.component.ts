import { Directionality } from "@angular/cdk/bidi";
import { DOCUMENT } from "@angular/common";
import {
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    output,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { resolveComponentDirection } from "@nanahoshi/mona-ui/i18n";
import {
    addAriaReference,
    createElementControlId,
    HoverIntent,
    listenForHover,
    onDisconnect,
    overlaySidePositions,
    type PhysicalOverlaySide,
    removeAriaReference,
    resolveOverlaySide,
    sideOfPosition
} from "@nanahoshi/mona-ui/internal";
import {
    fadePopupAnimation,
    type PopupAnchor,
    PopupCloseSource,
    type PopupRef,
    PopupService
} from "@nanahoshi/mona-ui/popup";
import { take, takeUntil } from "rxjs";
import type { TooltipPosition } from "../../models/TooltipPosition";
import {
    tooltipArrowThemeVariants,
    tooltipBaseThemeVariants,
    type TooltipVariantInputs,
    type TooltipVariantProps
} from "../../styles/tooltip.styles";

/** The gap between a tooltip and its anchor, leaving room for the arrow. */
const TOOLTIP_GAP = 12;

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
    readonly #directionality = inject(Directionality, { optional: true });
    readonly #document = inject(DOCUMENT);
    readonly #intent = new HoverIntent({
        hide: () => this.#popupRef?.close(),
        hideDelay: () => this.hideDelay(),
        show: anchor => this.#open(anchor),
        showDelay: () => this.showDelay()
    });
    readonly #popupService = inject(PopupService);
    #destroyed = false;
    #popupRef: PopupRef | null = null;
    protected readonly arrowClasses = computed(() => {
        return tooltipArrowThemeVariants();
    });
    protected readonly baseClasses = computed(() => {
        const rounded = this.rounded();
        return tooltipBaseThemeVariants({ rounded });
    });
    protected readonly currentArrowPosition = signal<PhysicalOverlaySide>("top");
    protected readonly templateRef = viewChild.required(TemplateRef);
    protected readonly tooltipId = createElementControlId();

    /**
     * @description Whether the tooltip is disabled. When disabled, the tooltip will not be shown, and an open one
     * closes.
     */
    public readonly disabled = input<boolean>(false);

    /**
     * @description Emitted when the tooltip popup is hidden.
     */
    public readonly hidden = output<void>();

    /**
     * @description The delay in milliseconds before hiding the tooltip after the pointer or focus leaves. A pointer
     * that leaves always gets a short grace, so it can move onto the tooltip.
     */
    public readonly hideDelay = input<number>(0);

    /**
     * @description The side of the target the tooltip opens on. `left` and `right` are physical; `start` and `end`
     * follow the text direction. It flips to the opposite side when there isn't room.
     */
    public readonly position = input<TooltipPosition>("top");

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
     * Can be an Element, ElementRef, or CSS selector string. A selector matches elements anywhere in the document,
     * including ones added later.
     */
    public readonly target = input.required<PopupAnchor>();

    public constructor() {
        effect(onCleanup => {
            const target = this.target();
            this.position();
            const stop = untracked(() => this.#listen(target));
            onCleanup(() => {
                stop();
                this.#intent.hideNow();
            });
        });
        effect(() => {
            if (this.disabled()) {
                untracked(() => this.#intent.hideNow());
            }
        });
        this.#destroyRef.onDestroy(() => {
            this.#destroyed = true;
            this.#intent.dispose();
            this.#popupRef?.close();
        });
    }

    #listen(target: PopupAnchor): () => void {
        if (typeof target === "string") {
            return listenForHover(this.#document, node => node.closest<HTMLElement>(target), this.#intent);
        }
        const element = target instanceof ElementRef ? target.nativeElement : target;
        if (!(element instanceof HTMLElement)) {
            return () => undefined;
        }
        return listenForHover(element, node => (element.contains(node) ? element : null), this.#intent);
    }

    #open(anchor: HTMLElement): void {
        if (this.disabled() || this.#destroyed) {
            return;
        }
        const direction = resolveComponentDirection(anchor, this.#directionality);
        const side = resolveOverlaySide(this.position(), direction);
        this.currentArrowPosition.set(side);
        const popupRef = this.#popupService.create({
            anchor,
            animation: fadePopupAnimation,
            closeOnEscape: true,
            closeOnMouseLeave: false,
            closeOnOutsideClick: true,
            content: this.templateRef(),
            hasBackdrop: false,
            positions: overlaySidePositions(side, TOOLTIP_GAP, direction),
            restoreFocus: false,
            withPush: false
        });
        this.#popupRef = popupRef;
        addAriaReference(anchor, "aria-describedby", this.tooltipId);
        this.#intent.opened(anchor, popupRef.overlayRef.overlayElement);
        const stopWatching = onDisconnect(anchor, () => popupRef.close());

        popupRef.opened.pipe(take(1)).subscribe(() => {
            if (!this.#destroyed) {
                this.shown.emit();
            }
        });
        popupRef.positionChanges.pipe(takeUntil(popupRef.closeStart)).subscribe(position => {
            this.currentArrowPosition.set(sideOfPosition(position, direction));
        });
        popupRef.closeStart.pipe(take(1)).subscribe(event => {
            stopWatching();
            removeAriaReference(anchor, "aria-describedby", this.tooltipId);
            this.#intent.closed(anchor, event.via === PopupCloseSource.Escape);
        });
        popupRef.closed.pipe(take(1)).subscribe(() => {
            if (this.#popupRef === popupRef) {
                this.#popupRef = null;
            }
            if (!this.#destroyed) {
                this.hidden.emit();
            }
        });
    }
}
