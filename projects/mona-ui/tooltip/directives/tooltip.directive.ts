import { Directionality } from "@angular/cdk/bidi";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    createComponent,
    DestroyRef,
    Directive,
    effect,
    ElementRef,
    EnvironmentInjector,
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
import { fadePopupAnimation, PopupCloseSource, type PopupRef, PopupService } from "@nanahoshi/mona-ui/popup";
import { take, takeUntil } from "rxjs";
import { twMerge } from "tailwind-merge";
import type { TooltipPosition } from "../models/TooltipPosition";
import {
    tooltipArrowThemeVariants,
    tooltipBaseThemeVariants,
    type TooltipVariantInputs,
    type TooltipVariantProps
} from "../styles/tooltip.styles";

/** The gap between a tooltip and its anchor, leaving room for the arrow. */
const TOOLTIP_GAP = 12;

/** Where the directive keeps an element's `title`, so the browser's own tooltip never shows next to it. */
const TITLE_ATTRIBUTE = "data-mona-title";

@Directive({
    selector: "[monaTooltip]"
})
export class TooltipDirective implements TooltipVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #directionality = inject(Directionality, { optional: true });
    readonly #host: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #injector = inject(EnvironmentInjector);
    readonly #intent = new HoverIntent({
        hide: () => this.#popupRef?.close(),
        hideDelay: () => this.hideDelay(),
        show: anchor => this.#open(anchor),
        showDelay: () => this.showDelay()
    });
    /** Elements named by their title, which the directive labels with `aria-label` once the title has moved. */
    readonly #labelled = new Set<HTMLElement>();
    readonly #popupService = inject(PopupService);
    readonly #stripped = new Set<HTMLElement>();
    readonly #suppressed = computed(() => this.disabled() || this.tooltipDisabled());
    readonly #tooltipId = createElementControlId();
    #destroyed = false;
    #popupRef: PopupRef | null = null;

    /**
     * @description Reads the tooltip's text from the matched element, in place of its `title`, which then stays where
     * it is. An empty result shows nothing.
     * @default null
     */
    public readonly contentOf = input<((element: HTMLElement) => string) | null>(null);

    /**
     * @description Whether the tooltip is disabled. When disabled, the tooltip will not be shown, and an open one
     * closes. On a button or another control, `[disabled]` also reaches the control, so use {@link tooltipDisabled}
     * there.
     * @default false
     */
    public readonly disabled = input<boolean>(false);

    /**
     * @description The filter to select elements that will have tooltips.
     * It can be a CSS selector that matches elements within the host element, including ones added later.
     * Only applies when `mode` is set to `content`.
     * @default "[title]"
     */
    public readonly filter = input<string>("[title]");

    /**
     * @description Emitted when the tooltip popup is hidden.
     */
    public readonly hidden = output<void>();

    /**
     * @description The delay in milliseconds before hiding the tooltip after the pointer or focus leaves. A pointer
     * that leaves always gets a short grace, so it can move onto the tooltip.
     * @default 0
     */
    public readonly hideDelay = input<number>(0);

    /**
     * @description The mode of the tooltip.
     * "host" mode shows the host's tooltip content, or its title attribute.
     * "content" mode uses the title attribute of elements matching the filter.
     * @default "host"
     */
    public readonly mode = input<"host" | "content">("host");

    /**
     * @description The tooltip's content in host mode: text, or a template. Without it, the host's `title` is shown.
     */
    public readonly monaTooltip = input<string | TemplateRef<unknown> | null | undefined>("");

    /**
     * @description The side of the target the tooltip opens on. `left` and `right` are physical; `start` and `end`
     * follow the text direction. It flips to the opposite side when there isn't room.
     * @default "top"
     */
    public readonly position = input<TooltipPosition>("top");

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
     * @description Emitted when the tooltip popup is shown.
     */
    public readonly shown = output<void>();

    /**
     * @description Disables only the tooltip, like {@link disabled}, on an element whose own `disabled` would take the
     * same binding, such as a `monaButton` or a native control.
     * @default false
     */
    public readonly tooltipDisabled = input<boolean>(false);

    public constructor() {
        effect(onCleanup => {
            const mode = this.mode();
            const filter = this.filter();
            this.position();
            const stop = untracked(() => this.#listen(mode, filter));
            onCleanup(() => {
                stop();
                this.#intent.hideNow();
            });
        });
        effect(() => {
            if (this.#suppressed()) {
                untracked(() => this.#intent.hideNow());
            }
        });
        // The host's title moves aside at once, so the browser's tooltip never shows for it.
        afterNextRender({
            write: () => {
                if (this.mode() === "host") {
                    this.#textOf(this.#host.nativeElement);
                }
            }
        });
        this.#destroyRef.onDestroy(() => {
            this.#destroyed = true;
            this.#intent.dispose();
            this.#popupRef?.close();
            for (const element of this.#stripped) {
                const title = element.getAttribute(TITLE_ATTRIBUTE);
                element.removeAttribute(TITLE_ATTRIBUTE);
                if (this.#labelled.has(element) && element.getAttribute("aria-label") === title) {
                    element.removeAttribute("aria-label");
                }
                if (title != null && !element.hasAttribute("title")) {
                    element.setAttribute("title", title);
                }
            }
            this.#labelled.clear();
            this.#stripped.clear();
        });
    }

    #contentFor(anchor: HTMLElement): string | TemplateRef<unknown> {
        const contentOf = this.contentOf();
        if (contentOf) {
            return contentOf(anchor);
        }
        return this.mode() === "host" ? this.monaTooltip() || this.#textOf(anchor) : this.#textOf(anchor);
    }

    #listen(mode: "host" | "content", filter: string): () => void {
        const host = this.#host.nativeElement;
        if (mode === "host") {
            return listenForHover(host, node => (host.contains(node) ? host : null), this.#intent);
        }
        // Elements whose title the directive has already moved aside no longer match a `[title]` filter.
        const selector = `${filter}, [${TITLE_ATTRIBUTE}]`;
        return listenForHover(
            host,
            node => {
                const match = node.closest<HTMLElement>(selector);
                return match && match !== host && host.contains(match) ? match : null;
            },
            this.#intent
        );
    }

    #open(anchor: HTMLElement): void {
        if (this.#suppressed() || this.#destroyed) {
            return;
        }
        const content = this.#contentFor(anchor);
        if (!content) {
            return;
        }
        const direction = resolveComponentDirection(anchor, this.#directionality);
        const side = resolveOverlaySide(this.position(), direction);
        const component = createComponent(TooltipTemplateComponent, { environmentInjector: this.#injector });
        component.setInput("content", content);
        component.setInput("rounded", this.rounded());
        component.setInput("tooltipId", this.#tooltipId);
        component.instance.currentArrowPosition.set(side);
        component.changeDetectorRef.detectChanges();

        const popupRef = this.#popupService.create({
            anchor,
            animation: fadePopupAnimation,
            closeOnEscape: true,
            closeOnMouseLeave: false,
            closeOnOutsideClick: true,
            content: component.instance.templateRef(),
            hasBackdrop: false,
            positions: overlaySidePositions(side, TOOLTIP_GAP, direction),
            restoreFocus: false,
            withPush: false
        });
        this.#popupRef = popupRef;
        addAriaReference(anchor, "aria-describedby", this.#tooltipId);
        this.#intent.opened(anchor, popupRef.overlayRef.overlayElement);
        const stopWatching = onDisconnect(anchor, () => popupRef.close());

        popupRef.opened.pipe(take(1)).subscribe(() => {
            if (!this.#destroyed) {
                this.shown.emit();
            }
        });
        popupRef.positionChanges.pipe(takeUntil(popupRef.closeStart)).subscribe(position => {
            component.instance.currentArrowPosition.set(sideOfPosition(position, direction));
        });
        popupRef.closeStart.pipe(take(1)).subscribe(event => {
            stopWatching();
            removeAriaReference(anchor, "aria-describedby", this.#tooltipId);
            this.#intent.closed(anchor, event.via === PopupCloseSource.Escape);
        });
        popupRef.closed.pipe(take(1)).subscribe(() => {
            if (this.#popupRef === popupRef) {
                this.#popupRef = null;
            }
            component.destroy();
            if (!this.#destroyed) {
                this.hidden.emit();
            }
        });
    }

    /**
     * The tooltip text of an element. A `title` set on it (again) moves to `data-mona-title`, where it stays for
     * the directive's lifetime and is put back when the directive is destroyed. An element that has no other name,
     * such as an icon-only button, keeps the title as its name through `aria-label`.
     */
    #textOf(element: HTMLElement): string {
        const title = element.getAttribute("title");
        if (title != null) {
            const namedByTitle = this.#labelled.has(element) || !hasNameOfItsOwn(element);
            element.setAttribute(TITLE_ATTRIBUTE, title);
            element.removeAttribute("title");
            this.#stripped.add(element);
            if (namedByTitle && title.trim()) {
                element.setAttribute("aria-label", title);
                this.#labelled.add(element);
            }
        }
        return element.getAttribute(TITLE_ATTRIBUTE) ?? "";
    }
}

/** Whether an element is named by something other than its `title`: a label attribute, or text or images inside. */
function hasNameOfItsOwn(element: HTMLElement): boolean {
    if (element.hasAttribute("aria-labelledby") || element.getAttribute("aria-label")?.trim()) {
        return true;
    }
    if ((element as Partial<HTMLInputElement>).labels?.length) {
        return true;
    }
    return !!element.textContent?.trim() || element.querySelector('img[alt]:not([alt=""])') != null;
}

@Component({
    imports: [NgTemplateOutlet],
    template: `
        <ng-template>
            <div role="tooltip" [id]="tooltipId()" [class]="baseClasses()">
                <div>
                    @if (contentTemplate(); as template) {
                        <ng-container [ngTemplateOutlet]="template"></ng-container>
                    } @else {
                        {{ content() }}
                    }
                </div>
                <div [class]="arrowClasses()" [attr.data-position]="currentArrowPosition()"></div>
            </div>
        </ng-template>
    `
})
class TooltipTemplateComponent {
    protected readonly arrowClasses = computed(() => {
        return tooltipArrowThemeVariants();
    });
    protected readonly baseClasses = computed(() => {
        const rounded = this.rounded();
        const userClasses = `p-2`;
        const variants = tooltipBaseThemeVariants({ rounded });
        return twMerge(variants, userClasses);
    });
    protected readonly contentTemplate = computed(() => {
        const content = this.content();
        return content instanceof TemplateRef ? content : null;
    });
    /**
     * @description The content displayed in the tooltip: text or a template.
     */
    public readonly content = input.required<string | TemplateRef<unknown>>();

    public readonly currentArrowPosition = signal<PhysicalOverlaySide>("top");

    /**
     * @description The border radius of the tooltip.
     */
    public readonly rounded = input<TooltipVariantProps["rounded"]>("medium");

    public readonly templateRef = viewChild.required(TemplateRef);

    /**
     * @description The unique id for the tooltip element, used for aria-describedby linkage.
     */
    public readonly tooltipId = input<string>("");
}
