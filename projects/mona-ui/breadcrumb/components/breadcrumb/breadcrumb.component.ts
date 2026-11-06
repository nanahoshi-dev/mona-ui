import { NgTemplateOutlet } from "@angular/common";
import type { ElementRef } from "@angular/core";
import {
    afterNextRender,
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
    TemplateRef,
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

/** An item to render, or with no item, the collapse button. `index` is what the separator after it reports. */
interface BreadcrumbEntry {
    readonly index: number;
    readonly item: BreadcrumbItemComponent | null;
    readonly key: unknown;
}

function numberOrNull(value: unknown): number | null {
    if (value == null || value === "") {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
}

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
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    protected readonly currentItemClass = computed(() => {
        return breadcrumbCurrentItemThemeVariants();
    });
    protected readonly entries = computed<readonly BreadcrumbEntry[]>(() => {
        const items = this.itemComponents();
        const hidden = this.hiddenCount();
        const entries: BreadcrumbEntry[] = [];
        items.forEach((item, index) => {
            if (hidden > 0 && index === 1) {
                entries.push({ index: hidden, item: null, key: "expand" });
            }
            if (hidden === 0 || index === 0 || index > hidden) {
                entries.push({ index, item, key: item });
            }
        });
        return entries;
    });
    protected readonly expanded = linkedSignal({ source: () => this.itemComponents(), computation: () => false });
    protected readonly hasItems = computed(() => this.itemComponents().length > 0);
    protected readonly hiddenCount = computed(() => {
        const maxItems = this.maxItems();
        const count = this.itemComponents().length;
        if (maxItems === null || this.expanded()) {
            return 0;
        }
        // The first and last items are always kept, so nothing lower than two means anything.
        return Math.max(count - Math.max(Math.trunc(maxItems), 2), 0);
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
     * The first and last items always stay, so anything below 2 counts as 2. `null` never collapses.
     * @default null
     */
    public readonly maxItems = input<number | null, unknown>(null, { transform: numberOrNull });

    /**
     * @description Additional CSS classes merged onto the breadcrumb list via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * Shows the whole trail. The button that was just activated goes away, so focus moves to the first item it revealed.
     */
    protected expand(): void {
        const firstRevealed = 1;
        const lastRevealed = this.hiddenCount();
        this.expanded.set(true);
        afterNextRender(
            {
                read: () => {
                    const list = this.listElement()?.nativeElement;
                    for (let index = firstRevealed; index <= lastRevealed; index++) {
                        const target = list
                            ?.querySelector(`li[data-item-index="${index}"]`)
                            ?.querySelector<HTMLElement>("a:not([aria-disabled='true']), button:not(:disabled)");
                        if (target) {
                            target.focus();
                            return;
                        }
                    }
                    list?.querySelector<HTMLElement>("a:not([aria-disabled='true']), button:not(:disabled)")?.focus();
                }
            },
            { injector: this.#injector }
        );
    }

    protected listItemClass(current: boolean): string {
        return breadcrumbListItemWrapperThemeVariants({ current });
    }

    protected onItemClick(item: BreadcrumbItemComponent, event: MouseEvent): void {
        if (!item.effectiveDisabled()) {
            item.itemClick.emit(event);
        }
    }
}
