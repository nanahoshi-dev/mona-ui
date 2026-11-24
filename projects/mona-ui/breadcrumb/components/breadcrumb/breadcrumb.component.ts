import { NgTemplateOutlet } from "@angular/common";
import type { ElementRef } from "@angular/core";
import {
    afterNextRender,
    afterRenderEffect,
    booleanAttribute,
    Component,
    computed,
    contentChild,
    contentChildren,
    forwardRef,
    inject,
    Injector,
    input,
    linkedSignal,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { LucideChevronRight, LucideEllipsis } from "@lucide/angular";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { twMerge } from "tailwind-merge";
import { BreadcrumbItemDirective } from "../../directives/breadcrumb-item.directive";
import { BreadcrumbSeparatorTemplateDirective } from "../../directives/breadcrumb-separator-template.directive";
import { BREADCRUMB_DEFAULT_MESSAGES } from "../../i18n/breadcrumb.default-messages";
import { BREADCRUMB_CONTEXT } from "../../models/breadcrumb.tokens";
import type { BreadcrumbVariantInput } from "../../styles/breadcrumb.styles";
import {
    breadcrumbCurrentItemThemeVariants,
    breadcrumbItemContentThemeVariants,
    breadcrumbListItemWrapperThemeVariants,
    breadcrumbListThemeVariants
} from "../../styles/breadcrumb.styles";
import { BreadcrumbItemComponent } from "../breadcrumb-item/breadcrumb-item.component";

/**
 * An item, and whether it and the separator after it are folded. Every item and separator stays in the list, folded or
 * not, so the breadcrumb can measure the whole trail.
 */
interface BreadcrumbEntry {
    /** Whether the button that stands for the folded items comes before this item: the second of three or more. */
    readonly foldButtonBefore: boolean;
    readonly folded: boolean;
    /** What the separator after the item reports. */
    readonly index: number;
    readonly item: BreadcrumbItemComponent;
    readonly separatorFolded: boolean;
}

/** The widths of a trail's entries, in CSS pixels, with nothing folded or shrunk, and the width they have to fit. */
interface BreadcrumbWidths {
    readonly available: number;
    readonly foldButton: number;
    readonly gap: number;
    readonly items: readonly number[];
    readonly separators: readonly number[];
}

/** Room for the rounding in a sum of fractional widths. */
const FIT_TOLERANCE = 0.01;

/** What can take focus in an item. */
const FOCUSABLE_ITEM = "a:not([aria-disabled='true']), button:not(:disabled)";

function numberOrNull(value: unknown): number | null {
    if (value == null || value === "") {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
}

function pixels(value: string): number {
    return parseFloat(value) || 0;
}

/**
 * The fewest items to fold, from the second one on, for the rest to fit at their natural width. Folding the first `n`
 * of them puts the button in place of the first, and drops the others along with the separators before them. When
 * nothing fits, it's every item but the first and the last, which then shrink.
 */
function itemsToFold(widths: BreadcrumbWidths): number {
    const { available, foldButton, gap, items, separators } = widths;
    const fits = (width: number): boolean => width <= available + FIT_TOLERANCE;
    const most = items.length - 2;
    // Every item, a separator after each but the last, and a gap between any two of them.
    let width =
        items.reduce((total, item) => total + item, 0) +
        separators.reduce((total, separator) => total + separator, 0) +
        gap * (items.length * 2 - 2);
    if (most < 1 || fits(width)) {
        return 0;
    }
    width += foldButton - items[1];
    for (let folded = 1; folded < most; folded++) {
        if (fits(width)) {
            return folded;
        }
        width -= items[folded + 1] + separators[folded] + gap * 2;
    }
    return most;
}

/**
 * A trail of `mona-breadcrumb-item`s that leads to the current page. When the trail is wider than its box, its middle
 * folds behind a button that shows it again, the items nearest the start first, so the first item and the current page
 * stay readable.
 */
@Component({
    selector: "mona-breadcrumb",
    templateUrl: "./breadcrumb.component.html",
    imports: [NgTemplateOutlet, BreadcrumbItemDirective, LucideChevronRight, LucideEllipsis],
    providers: [{ provide: BREADCRUMB_CONTEXT, useExisting: forwardRef(() => BreadcrumbComponent) }],
    host: {
        "[attr.aria-label]": "hasItems() ? ariaLabel() || messages().breadcrumb : null",
        "[attr.role]": "hasItems() ? 'navigation' : null",
        // In a flex parent the host is the flex item, and it would otherwise never get narrower than the trail's text:
        // min-w-0 for one that shrinks along its row, max-w-full for one sized to fit across a column.
        class: "block max-w-full min-w-0"
    }
})
export class BreadcrumbComponent implements BreadcrumbVariantInput {
    /** How many items fold for the trail to fit its width, from the last time it was measured. */
    readonly #foldedToFit = signal(0);
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    /** Counts the resize observer's notifications, so a change in size measures the trail again. */
    readonly #resized = signal(0);
    protected readonly currentItemClass = computed(() => {
        return breadcrumbCurrentItemThemeVariants();
    });
    protected readonly entries = computed<readonly BreadcrumbEntry[]>(() => {
        const items = this.itemComponents();
        const hidden = this.hiddenCount();
        return items.map((item, index) => ({
            foldButtonBefore: index === 1 && items.length > 2,
            folded: index > 0 && index <= hidden,
            index,
            item,
            separatorFolded: index > 0 && index < hidden
        }));
    });
    protected readonly expanded = linkedSignal({ source: () => this.itemComponents(), computation: () => false });
    protected readonly hasItems = computed(() => this.itemComponents().length > 0);
    protected readonly hiddenCount = computed(() => {
        const count = this.itemComponents().length;
        if (count < 3 || this.expanded()) {
            return 0;
        }
        const maxItems = this.maxItems();
        // The first and last items are always kept, so nothing lower than two means anything.
        const byCount = maxItems === null ? 0 : count - Math.max(Math.trunc(maxItems), 2);
        // The width may have been measured for a trail with more items.
        return Math.min(Math.max(byCount, this.#foldedToFit()), count - 2);
    });
    protected readonly itemComponents = contentChildren(BreadcrumbItemComponent);
    protected readonly itemContentClass = computed(() => {
        return breadcrumbItemContentThemeVariants();
    });
    protected readonly listClass = computed(() => {
        const disabled = this.disabled();
        const userClass = this.userClass();
        const variantClass = breadcrumbListThemeVariants({ disabled });
        return twMerge(variantClass, userClass);
    });
    protected readonly listElement = viewChild<ElementRef<HTMLOListElement>>("list");
    protected readonly messages = this.#i18n.componentMessages("breadcrumb", BREADCRUMB_DEFAULT_MESSAGES);
    protected readonly separatorTemplate = contentChild(BreadcrumbSeparatorTemplateDirective, {
        read: TemplateRef
    });

    /**
     * @description Accessible name for the breadcrumb navigation landmark.
     * Override when multiple breadcrumb components appear on the same page.
     * @default ""
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });

    /**
     * @internal
     */
    public readonly currentItem = computed(() => {
        return this.lastItemCurrent() ? (this.itemComponents().at(-1) ?? null) : null;
    });

    /**
     * @description Renders the entire breadcrumb with reduced visual emphasis and removes pointer interaction from all items.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Treats the last item as the current page: not a button, and marked `aria-current="page"`. Turn it off
     * for a trail that ends before the page you're on.
     * @default true
     */
    public readonly lastItemCurrent = input(true, { transform: booleanAttribute });

    /**
     * @description The most items to show before the middle of the trail collapses behind a button that shows it again.
     * The trail also folds whatever doesn't fit its width, with or without it. The first and last items always stay, so
     * anything below 2 counts as 2. `null` sets no count.
     * @default null
     */
    public readonly maxItems = input<number | null, unknown>(null, { transform: numberOrNull });

    /**
     * @description Additional CSS classes merged onto the breadcrumb list via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        // New items are new entries to watch. Watching one notifies at once, which measures the trail again.
        afterRenderEffect(onCleanup => {
            this.itemComponents();
            const list = this.listElement()?.nativeElement;
            if (list == null || typeof ResizeObserver === "undefined") {
                return;
            }
            const observer = new ResizeObserver(() => this.#resized.update(count => count + 1));
            observer.observe(list);
            for (const entry of Array.from(list.children)) {
                observer.observe(entry);
            }
            onCleanup(() => observer.disconnect());
        });
        // Right after the render that changed the trail, so it's folded before the browser paints it.
        afterRenderEffect(() => {
            this.itemComponents();
            this.lastItemCurrent();
            this.#resized();
            const list = this.listElement()?.nativeElement;
            if (list != null && !this.expanded()) {
                untracked(() => this.#fold(list));
            }
        });
    }

    /**
     * Shows the whole trail. The button that was just activated goes away, so focus moves to the first item it revealed.
     */
    protected expand(): void {
        const lastRevealed = this.hiddenCount();
        this.expanded.set(true);
        this.#focusItemAfterRender(1, lastRevealed);
    }

    protected listItemClass(current: boolean): string {
        return breadcrumbListItemWrapperThemeVariants({ current });
    }

    protected onItemClick(item: BreadcrumbItemComponent, event: MouseEvent): void {
        if (!item.effectiveDisabled()) {
            item.itemClick.emit(event);
        }
    }

    /**
     * Measures the trail and folds what doesn't fit. Focus on an item that folds moves to the button that now stands for
     * it, and focus on that button, once everything fits again, to the first item it gave back.
     */
    #fold(list: HTMLOListElement): void {
        const focused = list.ownerDocument.activeElement;
        const before = this.hiddenCount();
        const widths = this.#measure(list);
        this.#foldedToFit.set(widths == null ? 0 : itemsToFold(widths));
        const after = this.hiddenCount();
        if (after === before || !(focused instanceof HTMLElement) || !list.contains(focused)) {
            return;
        }
        if (after === 0 && focused.closest("[data-breadcrumb-fold]") != null) {
            this.#focusItemAfterRender(1, before);
            return;
        }
        const index = Number(focused.closest("[data-item-index]")?.getAttribute("data-item-index"));
        if (index > 0 && index <= after) {
            afterNextRender(
                { read: () => list.querySelector<HTMLElement>("[data-breadcrumb-expand]")?.focus() },
                { injector: this.#injector }
            );
        }
    }

    /**
     * Once the trail has rendered, moves focus to the first item from `first` to `last` that can take it, or else to the
     * first one in the trail that can.
     */
    #focusItemAfterRender(first: number, last: number): void {
        afterNextRender(
            {
                read: () => {
                    const list = this.listElement()?.nativeElement;
                    for (let index = first; index <= last; index++) {
                        const target = list
                            ?.querySelector(`li[data-item-index="${index}"]`)
                            ?.querySelector<HTMLElement>(FOCUSABLE_ITEM);
                        if (target) {
                            target.focus();
                            return;
                        }
                    }
                    list?.querySelector<HTMLElement>(FOCUSABLE_ITEM)?.focus();
                }
            },
            { injector: this.#injector }
        );
    }

    /**
     * Shows every entry at its natural width, measures it, and puts it back as it was, all before the browser paints. It
     * reads computed widths rather than bounding boxes, which a transform on an ancestor, such as a dialog's opening
     * animation, would scale.
     */
    #measure(list: HTMLOListElement): BreadcrumbWidths | null {
        const view = list.ownerDocument.defaultView;
        if (view == null || this.itemComponents().length < 3) {
            return null;
        }
        const entries = Array.from(list.children).filter(entry => entry instanceof HTMLElement);
        const folded = entries.filter(entry => entry.hidden);
        for (const entry of folded) {
            entry.hidden = false;
            entry.style.display = "";
        }
        for (const entry of entries) {
            entry.style.flexShrink = "0";
        }
        const listStyle = view.getComputedStyle(list);
        // A border-box width counts the padding and border around the entries.
        const insets =
            listStyle.boxSizing === "border-box"
                ? pixels(listStyle.paddingLeft) +
                  pixels(listStyle.paddingRight) +
                  pixels(listStyle.borderLeftWidth) +
                  pixels(listStyle.borderRightWidth)
                : 0;
        const items: number[] = [];
        const separators: number[] = [];
        let foldButton = 0;
        for (const entry of entries) {
            const width = pixels(view.getComputedStyle(entry).width);
            if (entry.hasAttribute("data-item-index")) {
                items.push(width);
            } else if (entry.hasAttribute("data-breadcrumb-fold")) {
                foldButton = width;
            } else {
                separators.push(width);
            }
        }
        const widths: BreadcrumbWidths = {
            available: pixels(listStyle.width) - insets,
            foldButton,
            gap: pixels(listStyle.columnGap),
            items,
            separators
        };
        for (const entry of entries) {
            entry.style.flexShrink = "";
        }
        for (const entry of folded) {
            entry.hidden = true;
            entry.style.display = "none";
        }
        return widths;
    }
}
